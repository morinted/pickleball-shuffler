// @ts-expect-error
function stringify(o) {
  const r = {};
  for (let k in o) {
    // @ts-expect-error
    r[k] = o[k].map((i) => i.toString());
  }
  return r;
}
// @ts-expect-error
function head(arr) {
  return arr[0];
}

export function stableRoommateProblem(preferences: string[][]) {
  // @ts-expect-error
  preferences = stringify(preferences); // @ts-expect-error
  function phase1And2(preferences) {
    const people = Object.keys(preferences);
    const accepted = {};

    // Phase 1: Create preference list. Each person (p) in the list propose to
    // the first person (q) on the list. If the person (q) already has a
    // proposal (o), check whether (o) prefers (p) or (q).
    while (people.length) {
      const currProposer = people.shift(); // @ts-expect-error
      const proposed = preferences[currProposer][0]; // @ts-expect-error
      const prevProposer = accepted[proposed];

      if (prevProposer) {
        const prevRank = preferences[proposed].indexOf(prevProposer);
        const currRank = preferences[proposed].indexOf(currProposer);

        // Lower the index, the higher the preference.
        const idx = prevRank < currRank ? currRank : prevRank;
        const rejects = prevRank < currRank ? currProposer : prevProposer;
        const accepts = prevRank < currRank ? prevProposer : currProposer;
        people.unshift(rejects);
        preferences[rejects].shift();
        const rejected = preferences[proposed].slice(idx);
        for (const r of rejected) {
          preferences[r] = preferences[r].filter(
            // @ts-expect-error
            (person) => person !== proposed
          );
        }
        preferences[proposed] = preferences[proposed].slice(0, idx); // @ts-expect-error
        accepted[proposed] = accepts;
      } else {
        // @ts-expect-error
        accepted[proposed] = currProposer;
      }
    }

    // Phase 2: Reject those lower than the preferences
    for (let proposer in preferences) {
      // @ts-expect-error
      const idx = preferences[proposer].indexOf(accepted[proposer]);
      if (idx === -1) continue;
      const kept = preferences[proposer].slice(0, idx + 1);
      const reject = preferences[proposer].slice(idx + 1);
      for (const rejected of reject) {
        preferences[rejected] = preferences[rejected].filter(
          // @ts-expect-error
          (person) => person !== proposer
        );
      }
      preferences[proposer] = kept;
    }
  }

  phase1And2(preferences);

  // Phase 3: Eliminate rotation.
  // As long as there is a preference list with at least 2 items.
  while (Object.values(preferences).some((prefs) => prefs.length > 1)) {
    // Find the first list with at least 2 items.
    // @ts-expect-error
    const [person] = Object.entries(preferences).find(
      ([person, prefs]) => prefs.length > 1
    );
    if (!person) break;

    // Find all rotations in the table. See the diagrams for clarification.
    const rotations = getRotation(preferences, person);
    for (const [x, y] of rotations) {
      // Remove all items in the rotation list.
      preferences[x].shift();
      preferences[y].pop();
    }
    // Repeat the proposal.
    phase1And2(preferences);
  }
  const result = [];
  for (let person in preferences) {
    if (preferences[person].length === 0) {
      throw new Error("no stable matching: empty list");
    }
    const match = preferences[person][0]; // @ts-expect-error
    if (preferences[match][0] === person) {
      result.push([person, preferences[person][0]]);
      delete preferences[person]; // @ts-expect-error
      delete preferences[match];
    }
  }
  return result;
}
// @ts-expect-error
function getRotation( // @ts-expect-error
  preferences, // @ts-expect-error
  person,
  secondOrLast = true,
  p = [person],
  q = []
) {
  const prefs = preferences[person];
  if (!prefs)
    throw new Error("getRotationError: no stable matching: list is empty");

  // Find the second item on the list and push to p.
  // Else find the last item on the list and push to q.
  // This step repeats until the entry in p is not unique.
  const target = prefs[secondOrLast ? 1 : prefs.length - 1];
  const rotationExists = !secondOrLast && p.includes(target); // @ts-expect-error
  secondOrLast ? q.push(target) : p.push(target);
  if (rotationExists) {
    // The rotation might not start at the first index. So remove all the items
    // before the rotation starts.
    while (head(p) !== target) {
      p.shift();
      q.shift();
    }
    p.shift();
    const rotation = [];
    while (p.length) {
      const k = p.shift();
      const v = q.shift();
      rotation.push([k, v]);
    }
    // Push the last item as the first.
    rotation.unshift(rotation.pop());
    return rotation;
  }
  return getRotation(preferences, target, !secondOrLast, p, q);
}
