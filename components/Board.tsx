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
  board, onCellClick, disabled, winnerCells, isFlipping, isBoardFlipped, isCelebrating,
  activeSkill, skillState, hoveredCell, setHoveredCell 
}) => {
  const isWinningCell = (row: number, col: number) => {
    return winnerCells.some(cell => cell.row === row && cell.col === col);
  };

  const lineGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${BOARD_SIZE - 1}, 1fr)`,
    gridTemplateRows: `repeat(${BOARD_SIZE - 1}, 1fr)`,
    width: '100%',
    height: '100%',
    gap: 0,
  };

  const pieceGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)`,
    gridTemplateRows: `repeat(${BOARD_SIZE}, 1fr)`,
    width: '100%',
    height: '100%',
  };

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

  return (
    <div className={`flipper aspect-square w-full max-w-xl ${isBoardFlipped ? 'is-flipped' : ''} ${isFlipping ? 'is-animating' : ''}`}>
      {/* Front Face - Classic Style */}
      <div className="flipper-front">
        <div className="relative p-4 md:p-6 rounded-xl w-full h-full" style={{
          background: '#E8D4B8',
          border: '8px solid #8B6F47',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
          position: 'relative'
        }}>
          
          {/* Board Background */}
          <div className="absolute inset-4 md:inset-6 rounded overflow-hidden" style={{
            background: '#F5E6D3',
            border: '3px solid #A0826D',
            boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.1)'
          }}></div>
          
          {/* Grid Lines - Classic brown */}
          <div className="relative z-10" style={lineGridStyle}>
            {[...Array((BOARD_SIZE - 1) * (BOARD_SIZE - 1))].map((_, i) => (
              <div key={i} style={{
                border: '1.5px solid #8B6F47',
                backgroundColor: 'transparent'
              }}></div>
            ))}
          </div>

          {/* Pieces & Click Handlers */}
          <div className="absolute top-3 left-3 z-20 w-[calc(100%-1.5rem)] h-[calc(100%-1.5rem)] md:top-5 md:left-5 md:w-[calc(100%-2.5rem)] md:h-[calc(100%-2.5rem)]">
            <div style={{
                position: 'relative',
                width: `${(BOARD_SIZE / (BOARD_SIZE - 1)) * 100}%`,
                height: `${(BOARD_SIZE / (BOARD_SIZE - 1)) * 100}%`,
                top: `-${(0.5 / (BOARD_SIZE - 1)) * 100}%`,
                left: `-${(0.5 / (BOARD_SIZE - 1)) * 100}%`,
              }}
            >
              <div style={pieceGridStyle}>
                {board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const isHovered = hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex;
                    let showPreview = isHovered && !disabled && cell === Player.None;
                    let previewPlayer = Player.Human;

                    if (skillState?.skill === 'qinNa') {
                        if (skillState.phase === 'placeOpponent') {
                            previewPlayer = Player.AI;
                        } else { // placeOwn1 or placeOwn2
                            previewPlayer = Player.Human;
                        }
                    } else if (skillState?.phase === 'placePiece' || activeSkill === null) {
                      previewPlayer = Player.Human;
                    } else {
                      showPreview = false;
                    }

                    return (
                      <div
                        key={`${rowIndex}-${colIndex}`}
                        data-cell={`${rowIndex}-${colIndex}`}
                        className={`relative flex items-center justify-center ${getCursorForCell(cell, rowIndex, colIndex)}`}
                        onClick={() => !disabled && onCellClick(rowIndex, colIndex)}
                        onMouseEnter={() => !disabled && setHoveredCell({row: rowIndex, col: colIndex})}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                      {cell !== Player.None && (
                        <div
                          className={`absolute rounded-full transition-all duration-200 anime-piece
                            ${cell === Player.Human ? 'bg-black' : 'bg-white'}
                            ${isWinningCell(rowIndex, colIndex) ? 'ring-4 ring-yellow-300 scale-110 animate-pulse' : ''}
                            ${isCelebrating ? 'victory-piece-highlight' : ''}
                          `}
                          style={{
                            width: '88%',
                            height: '88%',
                            boxShadow: cell === Player.Human
                              ? '0 4px 8px rgba(0,0,0,0.5), inset 2px 2px 4px rgba(255,255,255,0.2), inset -2px -2px 4px rgba(0,0,0,0.8)'
                              : '0 4px 8px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.8), inset -2px -2px 4px rgba(0,0,0,0.15)'
                          }}
                        >
                          {/* Cute highlight */}
                          <div className="absolute top-2 left-2 w-3 h-3 rounded-full" style={{
                            background: cell === Player.Human ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
                            filter: 'blur(2px)'
                          }}></div>
                        </div>
                      )}
                        {showPreview && (
                          <div className={`w-full h-full rounded-full group opacity-50
                            ${previewPlayer === Player.Human ? 'bg-black' : 'bg-white'}
                          `}>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Back Face - Zhang Cheng Background */}
      <div className="flipper-back" style={{ transform: 'rotateY(180deg) scaleX(-1)' }}>
        <div className="relative p-4 md:p-6 rounded-xl w-full h-full" style={{
          background: '#E8D4B8',
          border: '8px solid #8B6F47',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
          position: 'relative'
        }}>
          
          {/* Board Background with Zhang Cheng */}
          <div className="absolute inset-4 md:inset-6 rounded overflow-hidden" style={{
            border: '3px solid #A0826D',
            boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.1)'
          }}>
            {/* Background Image */}
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: 'url(/assets/张呈.png)',
                backgroundPosition: 'center 20%',
                opacity: 0.6,
                backgroundColor: '#F5E6D3'
              }}
            ></div>
            
            {/* Overlay for contrast */}
            <div className="absolute inset-0" style={{
              background: 'rgba(245, 230, 211, 0.3)'
            }}></div>
          </div>
          
          {/* Grid Lines - Same as front */}
          <div className="relative z-10" style={lineGridStyle}>
            {[...Array((BOARD_SIZE - 1) * (BOARD_SIZE - 1))].map((_, i) => (
              <div key={i} style={{
                border: '1.5px solid #8B6F47',
                backgroundColor: 'transparent'
              }}></div>
            ))}
          </div>

          {/* Pieces & Click Handlers */}
          <div className="absolute top-3 left-3 z-20 w-[calc(100%-1.5rem)] h-[calc(100%-1.5rem)] md:top-5 md:left-5 md:w-[calc(100%-2.5rem)] md:h-[calc(100%-2.5rem)]">
          <div style={{
              position: 'relative',
              width: `${(BOARD_SIZE / (BOARD_SIZE - 1)) * 100}%`,
              height: `${(BOARD_SIZE / (BOARD_SIZE - 1)) * 100}%`,
              top: `-${(0.5 / (BOARD_SIZE - 1)) * 100}%`,
              left: `-${(0.5 / (BOARD_SIZE - 1)) * 100}%`,
            }}
          >
            <div style={pieceGridStyle}>
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
                      key={`back-${rowIndex}-${colIndex}`}
                      data-cell={`${rowIndex}-${colIndex}`}
                      className={`relative flex items-center justify-center ${getCursorForCell(cell, rowIndex, colIndex)}`}
                      onClick={() => !disabled && onCellClick(rowIndex, colIndex)}
                      onMouseEnter={() => !disabled && setHoveredCell({row: rowIndex, col: colIndex})}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {cell !== Player.None && (
                        <div
                          className={`absolute rounded-full transition-all duration-200 anime-piece
                            ${cell === Player.Human ? 'bg-black' : 'bg-white'}
                            ${isWinningCell(rowIndex, colIndex) ? 'ring-4 ring-yellow-300 scale-110 animate-pulse' : ''}
                            ${isCelebrating ? 'victory-piece-highlight' : ''}
                          `}
                          style={{
                            width: '88%',
                            height: '88%',
                            boxShadow: cell === Player.Human
                              ? '0 4px 8px rgba(0,0,0,0.6), inset 2px 2px 4px rgba(255,255,255,0.2), inset -2px -2px 4px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.4)'
                              : '0 4px 8px rgba(0,0,0,0.3), inset 2px 2px 4px rgba(255,255,255,0.8), inset -2px -2px 4px rgba(0,0,0,0.15), 0 0 8px rgba(255,255,255,0.6)'
                          }}
                        >
                          {/* Cute highlight */}
                          <div className="absolute top-2 left-2 w-3 h-3 rounded-full" style={{
                            background: cell === Player.Human ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)',
                            filter: 'blur(2px)'
                          }}></div>
                        </div>
                      )}
                      {showPreview && (
                        <div className={`w-full h-full rounded-full opacity-50
                          ${previewPlayer === Player.Human ? 'bg-black' : 'bg-white'}
                        `}
                        style={{
                          boxShadow: previewPlayer === Player.Human 
                            ? '0 0 8px rgba(0,0,0,0.8)' 
                            : '0 0 8px rgba(255,255,255,0.9)'
                        }}
                        >
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Board;