import { PlayerId } from "./heuristics";

type Roommate = {
  id: PlayerId;
  preferences: PlayerId[];
}

export function matchRoommates(roommates: Roommate[], numGenerations: number): Roommate[][] {
  // Initialize an empty array for the roommate pairs
  const pairs: Roommate[][] = [];

  for (let i = 0; i < numGenerations; i++) {
    // Create a copy of the list of roommates and randomly shuffle the copy
    const shuffledRoommates = shuffle(roommates.slice());

    // Assign roommates to pairs until all roommates have been matched
    while (shuffledRoommates.length > 0) {
      const roommate1 = shuffledRoommates.shift()!;
      if (shuffledRoommates.length > 0) {
        let preferredMatch: Roommate | null = null;
        for (const preferredRoommate of roommate1.preferences) {
          const index = shuffledRoommates.findIndex(roommate => roommate.id === preferredRoommate);
          if (index >= 0) {
            preferredMatch = shuffledRoommates[index];
            shuffledRoommates.splice(index, 1);
            break;
          }
        }
        if (preferredMatch) {
          pairs.push([roommate1, preferredMatch]);
        } else {
          pairs.push([roommate1]);
        }
      } else {
        // If there is an odd number of roommates, assign the remaining roommate to a solo pair
        pairs.push([roommate1]);
      }
    }
  }

  return pairs;
}

export function shuffle<X>(array: readonly X[]): X[] {
  const result = array.slice()
  // Fisher-Yates shuffle algorithm
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
