// Based on https://github.com/AnjayGoel/Stable-Roommate-Generalised/blob/main/algorithm.py

import { shuffle } from "./roommates";

export type Preferences = {
  [key: string]: {
    [key: string]: number;
  };
};

class PairMaker {
  preferences: Preferences;
  members: string[];
  groupCount: number;

  iterationCount: number;
  finalIterationCount: number;

  ungrouped: string[];
  unfilled: Pair[];
  filled: Pair[];

  constructor(
    preferences: Preferences,
    iterationCount = 2,
    finalIterationCount = 4
  ) {
    this.preferences = preferences;
    this.members = Object.keys(preferences);
    this.groupCount = Math.floor(this.members.length / 2);

    this.iterationCount = iterationCount;
    this.finalIterationCount = finalIterationCount;

    this.ungrouped = [];
    this.unfilled = [];
    this.filled = [];

    this.setupRandomGroups();
  }

  setupRandomGroups() {
    const randomMembers = shuffle(this.members);
    for (let i = 0; i < this.groupCount; i++) {
      this.unfilled.push(new Pair(this, [randomMembers[i]]));
    }

    for (let i = this.groupCount; i < this.members.length; i++) {
      this.ungrouped.push(randomMembers[i]);
    }
  }

  getMemberPreferenceForPair(member: string, pair: string[]): number {
    let score = 0;
    pair.forEach(
      (otherMember) => (score = score + this.preferences[member][otherMember])
    );
    return score / pair.length;
  }

  getPairPreferenceForMember(member: string, pair: string[]): number {
    let score = 0;
    pair.forEach(
      (otherMember) => (score = score + this.preferences[otherMember][member])
    );
    return score / pair.length;
  }

  getPairScore(pair: string[]): number {
    if (pair.length !== 2) return 0; // TODO invert?
    const [first, second] = pair;
    return (
      (this.preferences[first][second] + this.preferences[second][first]) / 2
    );
  }

  get netScore() {
    let score = 0;
    this.filled.forEach((pair) => (score += this.getPairScore(pair.members)));
    return score / this.filled.length;
  }

  addOneMember() {
    const hasProposedByPairIndex: Record<string, boolean[]> =
      this.ungrouped.reduce((result: Record<string, boolean[]>, member) => {
        result[member] = this.unfilled.map(() => false);
        return result;
      }, {});
    const isMemberTempGrouped = this.ungrouped.reduce(
      (result: Record<string, boolean>, member) => {
        result[member] = false;
        return result;
      },
      {}
    );

    const pairPreferencesByIndex: Record<
      string,
      { score: number; index: number }[]
    > = {};
    const pairPreferenceOrder: Record<string, number[]> = {};

    this.ungrouped.forEach((member) => {
      this.unfilled.forEach((pair, pairIndex) => {
        const scores = pairPreferencesByIndex[member] || [];
        scores[pairIndex] = {
          score: this.getMemberPreferenceForPair(member, pair.members),
          index: pairIndex,
        };
        pairPreferencesByIndex[member] = scores;
      });
    });

    this.ungrouped.forEach((member) => {
      pairPreferenceOrder[member] = [...pairPreferencesByIndex[member]]
        .sort((a, b) => {
          return b.score - a.score;
        })
        .map((x) => x.index);
    });

    while (Object.values(isMemberTempGrouped).some((x) => !x)) {
      this.ungrouped.forEach((member) => {
        if (isMemberTempGrouped[member]) return;

        // If we have proposed to all groups, just mark member as grouped.
        if (hasProposedByPairIndex[member].every((x) => x)) {
          isMemberTempGrouped[member] = true;
          return;
        }

        for (let pairIndex of pairPreferenceOrder[member]) {
          if (hasProposedByPairIndex[member][pairIndex]) continue;

          const pair = this.unfilled[pairIndex];
          hasProposedByPairIndex[member][pairIndex] = true;
          const pairPreferenceForMember = this.getPairPreferenceForMember(
            member,
            pair.members // Sometimes undefined?
          );
          if (
            pair.tempScore === null ||
            pairPreferenceForMember > pair.tempScore
          ) {
            if (pair.tempMember) {
              isMemberTempGrouped[pair.tempMember] = false;
            }
            pair.addTemp(member, pairPreferenceForMember);
            isMemberTempGrouped[member] = true;
            break;
          }
        }
      });
    }

    this.unfilled.forEach((pair) => {
      if (!pair.tempMember) return;
      this.ungrouped.splice(this.ungrouped.indexOf(pair.tempMember), 1);
      pair.commitTemp();
    });

    this.optimize(false);

    // Move newly filled groups over.
    this.unfilled = this.unfilled.filter((pair) => {
      const newlyFilled = pair.members.length === 2 || !this.ungrouped.length;
      if (newlyFilled) this.filled.push(pair);
      return !newlyFilled;
    });
  }

  optimize(useFilled: boolean = true) {
    const pairs = useFilled ? this.filled : this.unfilled;
    const iterationCount = useFilled
      ? this.finalIterationCount
      : this.iterationCount;

    for (let iteration = 0; iteration < iterationCount; iteration++) {
      for (let pair of pairs) {
        for (let member of pair.members) {
          let exit = false;
          for (let otherPair of pairs) {
            if (exit) break;
            if (pair === otherPair) continue;

            for (let otherMember of otherPair.members) {
              if (exit) break;
              if (member === otherMember) continue;

              const newPair = [
                ...pair.members.filter((m) => m !== member),
                otherMember,
              ];
              const newOtherPair = [
                ...otherPair.members.filter((m) => m !== otherMember),
                member,
              ];

              // TODO: cache some of these scores.
              const oldScore =
                this.getPairScore(pair.members) +
                this.getPairScore(otherPair.members);
              const newScore =
                this.getPairScore(newPair) + this.getPairScore(newOtherPair);

              if (newScore > oldScore) {
                pair.members = newPair;
                otherPair.members = newOtherPair;
                exit = true;
              }
            }
          }
        }
      }
    }
  }

  solve() {
    while (this.ungrouped.length) {
      this.addOneMember();
    }

    // Allow incomplete groups.
    this.filled.push(...this.unfilled);
    this.unfilled = [];

    this.optimize();
  }

  get solvedGroups(): string[][] {
    return this.filled.map((pair) => pair.members.sort());
  }
}

class Pair {
  constructor(game: PairMaker, members: string[] = []) {
    this.game = game;
    this.members = members;
    this.tempMember = null;
    this.tempScore = null;
  }

  game: PairMaker;
  members: string[];
  tempMember: string | null;
  tempScore: number | null;

  addTemp(member: string, score: number) {
    this.tempMember = member;
    this.tempScore = score;
  }
  commitTemp() {
    if (!this.tempMember) return;
    this.members.push(this.tempMember);
    this.tempMember = null;
    this.tempScore = null;
  }
}

export { PairMaker };
