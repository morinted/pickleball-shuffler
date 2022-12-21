type Match = [[string, string], [string, string]]
type Round = {
  matches: Array<Match>,
  sitOuts: Array<Player>
}
type Player = {
  name: string,
  id: number
}
type PlayerHeuristics = {
  playedWithCount: { [name: string]: number | undefined }
  roundsSincePlayedWith: { [name: string]: number | undefined }
  playedAgainstCount: { [name: string]: number | undefined }
  roundsSincePlayedAgainst: { [name: string]: number | undefined }
  roundsSinceSitOut: number
}