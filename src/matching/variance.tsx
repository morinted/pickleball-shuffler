/**
 * Given a set of values, calculate the similarity.
 */
export function getVariance(numbers: number[]) {
  let mean = 0;
  let M2 = 0;

  numbers.forEach((x, index) => {
    const delta = x - mean;
    mean = mean + delta / (index + 1);
    M2 = M2 + delta * (x - mean);
  });

  return M2 / numbers.length;
}
