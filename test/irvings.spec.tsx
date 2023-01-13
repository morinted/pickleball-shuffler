import { computeMatches, stableRoommateProblem } from "../src/matching/irvings"

describe('Irvings', () => {
  test('happy case', () => {
    expect(stableRoommateProblem([
      ['1','3','5','2','4'],
      ['3','4','5','0','2'],
      ['3','4','5','0','1'],
      ['5','2','0','4','1'],
      ['5','2','3','1','0'],
      ['0','1','3','2','4']
    ])).toEqual([['0', '5'], ['1', '4'], ['2', '3']])

  })
  test('impossible example', () => {
    expect(() => stableRoommateProblem([
      ['1', '2', '3'],
      ['2', '0', '3'],
      ['0', '1', '3'],
      ['0', '1', '2']
    ])).toThrow()
  })
})