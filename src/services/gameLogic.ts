import { BoardState, Player, Move } from '../types';
import { BOARD_SIZE } from '../constants';

const directions = [
  { dr: 0, dc: 1 }, // Horizontal
  { dr: 1, dc: 0 }, // Vertical
  { dr: 1, dc: 1 }, // Diagonal \
  { dr: 1, dc: -1 }, // Diagonal /
];

export const checkWin = (board: BoardState, row: number, col: number): Move[] | null => {
  const player = board[row][col];
  if (player === Player.None) return null;

  for (const { dr, dc } of directions) {
    let count = 1;
    const line: Move[] = [{ row, col }];

    // Check in one direction
    for (let i = 1; i < 5; i++) {
      const r = row + i * dr;
      const c = col + i * dc;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
        count++;
        line.push({ row: r, col: c });
      } else {
        break;
      }
    }

    // Check in the opposite direction
    for (let i = 1; i < 5; i++) {
      const r = row - i * dr;
      const c = col - i * dc;
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
        count++;
        line.push({ row: r, col: c });
      } else {
        break;
      }
    }

    if (count >= 5) {
      return line;
    }
  }

  return null;
};

export const checkDraw = (board: BoardState): boolean => {
  return board.every(row => row.every(cell => cell !== Player.None));
};

export const findBestMove = (board: BoardState): Move | null => {
  const emptyCells: Move[] = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (board[r][c] === Player.None) {
        emptyCells.push({ row: r, col: c });
      }
    }
  }
    
  if (emptyCells.length === 0) return null;
  if (emptyCells.length === BOARD_SIZE * BOARD_SIZE) {
      // First move, play near the center
      const center = Math.floor(BOARD_SIZE / 2);
      return { row: center, col: center };
  }


  let bestScore = -Infinity;
  let move: Move = emptyCells[0];

  for (const { row, col } of emptyCells) {
    // Check if AI can win
    board[row][col] = Player.AI;
    if (checkWin(board, row, col)) {
      board[row][col] = Player.None;
      return { row, col };
    }
    board[row][col] = Player.None;
  }

  for (const { row, col } of emptyCells) {
    // Check if Human can win, and block
    board[row][col] = Player.Human;
    if (checkWin(board, row, col)) {
      board[row][col] = Player.None;
      return { row, col };
    }
    board[row][col] = Player.None;
  }
    
  // Simple heuristic: find a move that creates the longest chain for AI or blocks Human
  for (const { row, col } of emptyCells) {
    let score = 0;
    
    // AI's potential
    board[row][col] = Player.AI;
    score += evaluatePosition(board, row, col, Player.AI);
    
    // Human's potential (defensive)
    board[row][col] = Player.Human;
    score += evaluatePosition(board, row, col, Player.Human);

    board[row][col] = Player.None;
    
    if (score > bestScore) {
      bestScore = score;
      move = { row, col };
    }
  }

  return move;
};


function evaluatePosition(board: BoardState, row: number, col: number, player: Player): number {
    let score = 0;
    const scores = {
        '5': 100000,
        '4_open': 10000,
        '4_closed': 1000,
        '3_open': 1000,
        '3_closed': 100,
        '2_open': 10,
        '2_closed': 1
    };

    for (const {dr, dc} of directions) {
        let consecutive = 1;
        let openEnds = 0;

        // Forward
        for (let i = 1; i < 5; i++) {
            const r = row + i * dr;
            const c = col + i * dc;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
                consecutive++;
            } else if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === Player.None) {
                openEnds++;
                break;
            } else {
                break;
            }
        }

        // Backward
        for (let i = 1; i < 5; i++) {
            const r = row - i * dr;
            const c = col - i * dc;
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === player) {
                consecutive++;
            } else if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE && board[r][c] === Player.None) {
                openEnds++;
                break;
            } else {
                break;
            }
        }
        
        if (consecutive >= 5) score += scores['5'];
        else if (consecutive === 4) {
            score += openEnds === 2 ? scores['4_open'] : scores['4_closed'];
        } else if (consecutive === 3) {
            score += openEnds === 2 ? scores['3_open'] : scores['3_closed'];
        } else if (consecutive === 2) {
            score += openEnds === 2 ? scores['2_open'] : scores['2_closed'];
        }
    }
    return score;
}