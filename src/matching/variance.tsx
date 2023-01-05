/**
 * Given a set of values, calculate the similarity.
 */
export function getVariance(numbers: number[]) {
  let n = 0;
  let mean = 0;
  let M2 = 0;

  numbers.forEach((x) => {
    n = n + 1;
    const delta = x - mean;
    mean = mean + delta / n;
    M2 = M2 + delta * (x - mean);
  });

  return M2 / n;
}
