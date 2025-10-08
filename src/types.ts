export type SkillId = 'remove' | 'skip' | 'swap' | 'overwhelm' | 'tiaoChengLiShan' | 'qinNa' | 'cleaning' | 'ultimate';

export type Skill = { id: SkillId; name: string; cost: number; description: string; disabled?: boolean; };

export enum Player {
  None = 0,
  Human = 1,
  AI = 2,
}

export type CellState = Player;

export type BoardState = CellState[][];

export enum GameStatus {
  Playing,
  HumanWin,
  AIWin,
  Draw,
}

export type Move = {
  row: number;
  col: number;
};

export type SkillState =
  | { skill: 'tiaoChengLiShan', phase: 'selectPiece' | 'placePiece', pieceToMove?: Move | null }
  | { skill: 'qinNa', phase: 'placeOwn1' | 'placeOpponent' | 'placeOwn2' }
  | null;