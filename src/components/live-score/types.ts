// Type definitions for Live Score
export interface Match {
  title: string;
  venue: {
    name: string;
    city: string;
  };
  tournament: {
    name: string;
  };
  startTime: {
    epoch: number;
  };
}

export interface Score {
  runs: number;
  wickets: number;
  overs: string;
  runRate: number;
  extras: number;
}

export interface Batsman {
  name: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  dismissal?: string;
}

export interface Bowler {
  name: string;
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
}

export interface Innings {
  id: string;
  innings_number: number;
  teamName: string;
  teamCode?: string;
  score: Score;
  batting: Batsman[];
  bowling: Bowler[];
  partnerships: Partnership[];
}

export interface Partnership {
  player1: {
    name: string;
    runs: number;
    balls: number;
  };
  player2: {
    name: string;
    runs: number;
    balls: number;
  };
  runs: number;
  balls: number;
  runRate: number;
  completed: boolean;
}

export interface BallDetail {
  repr: string;
  runs: number;
  isWicket: boolean;
  isBoundary: boolean;
  isExtra: boolean;
}

export interface OverDetail {
  overNumber: number;
  ballDetails: BallDetail[];
}

export interface CurrentBatsman {
  name: string;
  runs: number;
  balls: number;
  strikeRate: number;
}

export interface CurrentBowler {
  name: string;
  overs: string;
  wickets: number;
  economy: number;
}

export interface CommentaryItem {
  over: string;
  bowler?: string;
  batsman?: string;
  text: string;
  repr?: string;
}

export interface LiveData {
  battingTeam: string;
  striker: CurrentBatsman;
  nonStriker: CurrentBatsman;
  bowler: CurrentBowler;
  recentOvers?: OverDetail[];
  commentary?: CommentaryItem[];
}

export interface FallOfWicket {
  wicketNumber: number;
  playerOut: string;
  runs: number;
  overs: string;
  dismissal: string;
}

export interface Extras {
  [inningsId: string]: {
    byes: number;
    legByes: number;
    wides: number;
    noBalls: number;
  };
}

export interface MatchData {
  match: Match;
  innings: Innings[];
  live: LiveData | null;
  fallOfWickets: FallOfWicket[];
  extras: Extras;
}
