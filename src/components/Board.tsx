import React from 'react';
import { BoardState, Player, Move, SkillState, SkillId } from '../types';
import { BOARD_SIZE } from '../constants';

interface BoardProps {
  board: BoardState;
  onCellClick: (row: number, col: number) => void;
  disabled: boolean;
  winnerCells: Move[];
  isFlipping: boolean;
  isBoardFlipped: boolean;
  isCelebrating: boolean;
  activeSkill: SkillId | null;
  skillState: SkillState;
  hoveredCell: Move | null;
  setHoveredCell: (move: Move | null) => void;
}

const Board: React.FC<BoardProps> = ({
  board,
  onCellClick,
  disabled,
  winnerCells,
  isFlipping,
  isBoardFlipped,
  isCelebrating,
  activeSkill,
  skillState,
  hoveredCell,
  setHoveredCell,
}) => {
  const isWinningCell = (row: number, col: number) =>
    winnerCells.some(cell => cell.row === row && cell.col === col);

  const boardSurfaceInset = 'clamp(0.75rem, 4vw, 1.5rem)';
  const gridInsetPercent = 9;
  const gridInset = `${gridInsetPercent}%`;
  const cellSizePercent = 100 / (BOARD_SIZE - 1);
  const hitBoxPercent = cellSizePercent * 0.95;
  const pieceSizePercent = cellSizePercent * 0.72;
  const starPointSizePercent = Math.min(cellSizePercent * 0.36, 2.2);
  const starPointCoords: Move[] = [];

  if (BOARD_SIZE >= 11) {
    const anchors = [3, Math.floor(BOARD_SIZE / 2), BOARD_SIZE - 4];
    anchors.forEach(row => {
      anchors.forEach(col => {
        starPointCoords.push({ row, col });
      });
    });
  }

  const frameStyle: React.CSSProperties = {
    background: '#E8D4B8',
    border: '8px solid #8B6F47',
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
    position: 'relative',
    borderRadius: '0.75rem',
    width: '100%',
    height: '100%',
  };

  const boardSurfaceStyle: React.CSSProperties = {
    position: 'absolute',
    inset: boardSurfaceInset,
    borderRadius: '1rem',
    background: '#F5E6D3',
    border: '3px solid #A0826D',
    boxShadow: 'inset 0 0 14px rgba(0, 0, 0, 0.18)',
    overflow: 'visible',
  };

  const gridStyle: React.CSSProperties = {
    position: 'absolute',
    inset: gridInset,
    borderRadius: '0.75rem',
    backgroundColor: '#F8E7C5',
    backgroundImage: `
      linear-gradient(
        to right,
        transparent calc(${cellSizePercent}% - 1.5px),
        #8B6F47 calc(${cellSizePercent}% - 1.5px),
        #8B6F47 calc(${cellSizePercent}% + 1.5px),
        transparent calc(${cellSizePercent}% + 1.5px)
      ),
      linear-gradient(
        to bottom,
        transparent calc(${cellSizePercent}% - 1.5px),
        #8B6F47 calc(${cellSizePercent}% - 1.5px),
        #8B6F47 calc(${cellSizePercent}% + 1.5px),
        transparent calc(${cellSizePercent}% + 1.5px)
      )
    `,
    backgroundSize: `${cellSizePercent}% ${cellSizePercent}%`,
    backgroundPosition: 'center',
    boxShadow: 'inset 0 0 8px rgba(0, 0, 0, 0.1)',
    pointerEvents: 'none',
  };

  const piecesLayerStyle: React.CSSProperties = {
    position: 'absolute',
    inset: gridInset,
    zIndex: 10,
  };

  const starPointStyle = (row: number, col: number): React.CSSProperties => ({
    position: 'absolute',
    top: `${row * cellSizePercent}%`,
    left: `${col * cellSizePercent}%`,
    width: `${starPointSizePercent}%`,
    height: `${starPointSizePercent}%`,
    transform: 'translate(-50%, -50%)',
    borderRadius: '9999px',
    backgroundColor: '#8B6F47',
    opacity: 0.8,
  });

  const getCellPositionStyle = (row: number, col: number): React.CSSProperties => ({
    position: 'absolute',
    top: `${row * cellSizePercent}%`,
    left: `${col * cellSizePercent}%`,
    width: `${hitBoxPercent}%`,
    height: `${hitBoxPercent}%`,
    transform: 'translate(-50%, -50%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  });

  const getCursorForCell = (cell: Player, row: number, col: number): string => {
    if (disabled) return '';

    if (activeSkill === 'remove') {
      return cell === Player.AI ? 'cursor-crosshair' : 'cursor-not-allowed';
    }
    if (skillState?.skill === 'tiaoChengLiShan') {
      if (skillState.phase === 'selectPiece') {
        return cell === Player.AI ? 'cursor-pointer' : 'cursor-not-allowed';
      }
      if (skillState.phase === 'placePiece') {
        return cell === Player.None ? 'cursor-pointer' : 'cursor-not-allowed';
      }
    }
    if (skillState?.skill === 'qinNa') {
      return cell === Player.None ? 'cursor-pointer' : 'cursor-not-allowed';
    }

    return cell === Player.None ? 'cursor-pointer' : '';
  };

  const renderPieces = (keyPrefix: string) => (
    <div style={piecesLayerStyle}>
      {board.map((row, rowIndex) =>
        row.map((cell, colIndex) => {
          const isHovered = hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex;
          let showPreview = isHovered && !disabled && cell === Player.None;
          let previewPlayer = Player.Human;

          if (skillState?.skill === 'qinNa') {
            if (skillState.phase === 'placeOpponent') {
              previewPlayer = Player.AI;
            } else {
              previewPlayer = Player.Human;
            }
          } else if (skillState?.phase === 'placePiece' || activeSkill === null) {
            previewPlayer = Player.Human;
          } else {
            showPreview = false;
          }

          return (
            <div
              key={`${keyPrefix}-${rowIndex}-${colIndex}`}
              data-cell={`${rowIndex}-${colIndex}`}
              className={getCursorForCell(cell, rowIndex, colIndex)}
              style={getCellPositionStyle(rowIndex, colIndex)}
              onClick={() => {
                if (!disabled) {
                  onCellClick(rowIndex, colIndex);
                }
              }}
              onMouseEnter={() => {
                if (!disabled) {
                  setHoveredCell({ row: rowIndex, col: colIndex });
                }
              }}
              onMouseLeave={() => setHoveredCell(null)}
            >
              {cell !== Player.None && (
                <div
                  className={`board-piece absolute rounded-full transition-all duration-200 anime-piece
                    ${cell === Player.Human ? 'bg-black' : 'bg-white'}
                    ${isWinningCell(rowIndex, colIndex) ? 'ring-4 ring-yellow-300 scale-110 animate-pulse' : ''}
                    ${isCelebrating ? 'victory-piece-highlight' : ''}
                  `}
                  style={{
                    width: `${pieceSizePercent}%`,
                    height: `${pieceSizePercent}%`,
                    boxShadow:
                      cell === Player.Human
                        ? '0 4px 8px rgba(0,0,0,0.6), inset 2px 2px 4px rgba(255,255,255,0.2), inset -2px -2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4)'
                        : '0 4px 8px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.8), inset -2px -2px 4px rgba(0,0,0,0.15), 0 0 8px rgba(255,255,255,0.6)',
                  }}
                >
                  <div
                    className="absolute top-2 left-2 w-3 h-3 rounded-full"
                    style={{
                      background: cell === Player.Human ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
                      filter: 'blur(2px)',
                    }}
                  ></div>
                </div>
              )}
              {showPreview && (
                <div
                  className={`board-preview rounded-full opacity-50 ${
                    previewPlayer === Player.Human ? 'bg-black' : 'bg-white'
                  }`}
                  style={{
                    width: `${pieceSizePercent}%`,
                    height: `${pieceSizePercent}%`,
                    boxShadow:
                      previewPlayer === Player.Human
                        ? '0 0 8px rgba(0,0,0,0.75)'
                        : '0 0 8px rgba(255,255,255,0.85)',
                  }}
                ></div>
              )}
            </div>
          );
        })
      )}
    </div>
  );

  const renderFace = (face: 'front' | 'back') => (
    <div
      className={face === 'front' ? 'flipper-front' : 'flipper-back'}
      style={face === 'back' ? { transform: 'rotateY(180deg) scaleX(-1)' } : undefined}
    >
      <div className="relative p-4 md:p-6 w-full h-full" style={frameStyle}>
        <div style={boardSurfaceStyle}>
          {face === 'back' && (
            <>
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: 'url(/assets/player-avatar.svg)',
                  backgroundPosition: 'center 25%',
                  opacity: 0.85,
                  filter: 'drop-shadow(0 12px 24px rgba(15,23,42,0.45)) saturate(1.1)',
                  mixBlendMode: 'multiply',
                }}
              ></div>
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'radial-gradient(circle at 50% 30%, rgba(255,255,255,0.55), rgba(245,230,211,0.3) 55%, rgba(148,116,84,0.45) 100%)',
                }}
              ></div>
            </>
          )}
          <div style={gridStyle}>
            {starPointCoords.map(point => (
              <div key={`${point.row}-${point.col}`} style={starPointStyle(point.row, point.col)}></div>
            ))}
          </div>
          {renderPieces(face)}
        </div>
      </div>
    </div>
  );

  return (
    <div
      className={`flipper board-container aspect-square ${isBoardFlipped ? 'is-flipped' : ''} ${
        isFlipping ? 'is-animating' : ''
      }`}
    >
      {renderFace('front')}
      {renderFace('back')}
    </div>
  );
};

export default Board;
