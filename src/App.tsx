import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BoardState, Player, GameStatus, Move, SkillState, SkillId, Skill } from './types';
import { BOARD_SIZE } from './constants';
import Board from './components/Board';
import SkillAnimation from './components/SkillAnimation';
import { checkWin, checkDraw, findBestMove } from './services/gameLogic';
import * as dialogue from './services/dialogue';
import { ZHANG_CHENG_BG } from './assets';

type Commentary = { id: number; speaker: string; message: string; isNew: boolean };
type Danmaku = Commentary & { top: number; duration: number };
type Particle = { id: number; left: number; duration: number; delay: number };
type VictoryCelebration =
  | { type: 'player' }
  | { type: 'ai'; src: string };

const skills: Skill[] = [
  { id: 'remove', name: '飞沙走石', cost: 3, description: "移除棋盘上对手的一枚棋子。" },
  { id: 'skip', name: '静如止水', cost: 4, description: '让对手的回合停滞，跳过其下一回合。' },
  { id: 'swap', name: '两极反转', cost: 8, description: '交换棋盘上所有的黑白棋子。' },
  { id: 'tiaoChengLiShan', name: '调呈离山', cost: 5, description: '移动对手一枚棋子到任意空位。' },
  { id: 'qinNa', name: '擒拿', cost: 7, description: '替对手下一轮棋子' },
  { id: 'cleaning', name: '保洁上门', cost: 6, description: '随机清除对手1-3枚棋子，棋盘焕然一新！' },
  { id: 'overwhelm', name: '力拔山兮', cost: 12, description: '发动此最终奥义，无视规则，直接获得此战的胜利。'},
];

let audioCtx: AudioContext | null = null;
const getAudioContext = () => {
  if (!audioCtx && typeof window !== 'undefined') {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
};

const withBasePath = (relativePath: string) => {
  const base = import.meta.env.BASE_URL ?? '/';
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  return `${normalizedBase}${relativePath.replace(/^\//, '')}`;
};

const getSkillVideoPath = (skillId: SkillId): string | null => {
    const videoMap: Record<SkillId, string> = {
      'remove': withBasePath('skill/飞沙走石.mp4'),
      'skip': withBasePath('skill/静如止水.mp4'),
      'swap': withBasePath('skill/两极反转 1.mp4'),
      'overwhelm': withBasePath('skill/力拔山兮.mp4'),
      'tiaoChengLiShan': withBasePath('skill/调呈离山.mp4'),
      'qinNa': withBasePath('skill/擒拿 2.mp4'),
      'cleaning': withBasePath('skill/我是保洁.mp4'),
    };
    return videoMap[skillId] || null;
};

const playHeiSound = () => {
    const heiSounds = [
      withBasePath('hei/嘿 1.mp3'),
      withBasePath('hei/嘿 2.mp3'),
      withBasePath('hei/嘿 3.mp3'),
      withBasePath('hei/嘿 4.mp3'),
      withBasePath('hei/嘿 5.mp3'),
      withBasePath('hei/嘿 6.mp3'),
      withBasePath('hei/嘿 7.mp3'),
    ];
    
    const randomSound = heiSounds[Math.floor(Math.random() * heiSounds.length)];
    const audio = new Audio(randomSound);
    audio.volume = 0.5;
    audio.play().catch(err => console.log('Failed to play hei sound:', err));
};

const playSfx = (type: SkillId) => {
    const ctx = getAudioContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);

    switch (type) {
        case 'swap':
            // 两极反转 - 扭曲空间音效
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(300, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.5);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
            break;
        case 'remove':
        case 'tiaoChengLiShan':
            // 飞沙走石 / 调呈离山 - 锐利破空音
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.15);
            break;
        case 'cleaning':
            // 保洁上门 - 清扫音效
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(600, ctx.currentTime);
            oscillator.frequency.linearRampToValueAtTime(1400, ctx.currentTime + 0.15);
            oscillator.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
            break;
        case 'skip':
        case 'qinNa':
            // 静如止水 / 擒拿 - 神秘音效
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(800, ctx.currentTime);
            oscillator.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
            break;
        case 'overwhelm':
            // 力拔山兮 - 震撼低音炮
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(80, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.8);
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);
            break;
        case 'ultimate':
            // 终极奥义 - 多层次爆炸音效
            const osc2 = ctx.createOscillator();
            const gain2 = ctx.createGain();
            osc2.connect(gain2);
            gain2.connect(ctx.destination);
            
            // 主音效 - 上升音
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(100, ctx.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.4);
            oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.8);
            gainNode.gain.setValueAtTime(0, ctx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.0);
            
            // 副音效 - 震动低音
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(60, ctx.currentTime);
            osc2.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.6);
            gain2.gain.setValueAtTime(0, ctx.currentTime);
            gain2.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.1);
            gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
            
            osc2.start(ctx.currentTime);
            osc2.stop(ctx.currentTime + 1.0);
            break;
    }

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 1.3);
};


const App: React.FC = () => {
  const createEmptyBoard = (): BoardState =>
    Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill(Player.None)
    );

  const [board, setBoard] = useState<BoardState>(createEmptyBoard());
  const [currentPlayer, setCurrentPlayer] = useState<Player>(Player.Human);
  const [gameStatus, setGameStatus] = useState<GameStatus>(GameStatus.Playing);
  const [winnerCells, setWinnerCells] = useState<Move[]>([]);
  const [humanScore, setHumanScore] = useState(0);
  const [aiScore, setAiScore] = useState(0);
  const [activeSkill, setActiveSkill] = useState<SkillId | null>(null);
  const [skillState, setSkillState] = useState<SkillState>(null);
  const [skillToAnimate, setSkillToAnimate] = useState<Skill | null>(null);
  const [aiSkillToAnimate, setAiSkillToAnimate] = useState<Skill | null>(null);
  const [hoveredCell, setHoveredCell] = useState<Move | null>(null);
  const [skipAiTurn, setSkipAiTurn] = useState(false);
  const [useSpecialBg, setUseSpecialBg] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isFlipping, setIsFlipping] = useState(false);
  const [isBoardFlipped, setIsBoardFlipped] = useState(false);
  const [isShaking, setIsShaking] = useState<SkillId | null>(null);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(true);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [skillVideo, setSkillVideo] = useState<string | null>(null);
  const [processVideo, setProcessVideo] = useState<string | null>(null);
  const [victoryCelebration, setVictoryCelebration] = useState<VictoryCelebration | null>(null);
  const pendingProcessVideo = useRef<string | null>(null);
  
  const commentIdCounter = useRef(0);
  const commentaryLock = useRef(false);
  const [danmakuList, setDanmakuList] = useState<Danmaku[]>([]);
  const aiMoveAfterAnimation = useRef<(() => void) | null>(null);
  const swapResetTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const addNewCommentary = useCallback((speaker: string, message: string) => {
    const newComment: Commentary = {
        id: commentIdCounter.current++,
        speaker,
        message,
        isNew: true,
    };

    const newDanmaku: Danmaku = {
      ...newComment,
      top: Math.floor(Math.random() * 80) + 5, // 5% to 85%
      duration: Math.random() * 5 + 10, // 10s to 15s
    };
    setDanmakuList(prev => [...prev, newDanmaku]);
    
    setTimeout(() => {
      setDanmakuList(prev => prev.filter(d => d.id !== newComment.id));
    }, newDanmaku.duration * 1000 + 500);
    
    commentaryLock.current = true;
    setTimeout(() => {
        commentaryLock.current = false;
    }, 2000); // 2 second cooldown
  }, []);
  
  const runOpeningDialogue = useCallback(() => {
    setDanmakuList([]);
    const openingLines = dialogue.getOpeningLines();
    let delay = 500;
    openingLines.forEach((line) => {
        setTimeout(() => {
            addNewCommentary('张技能五', line);
        }, delay);
        delay += 3500; // Increased delay
    });
  }, [addNewCommentary]);

  // Initialize background music
  useEffect(() => {
    audioRef.current = new Audio(withBasePath('assets/技能五子棋.mp3'));
    audioRef.current.loop = true;
    audioRef.current.volume = 0.3;

    // Auto play on mount
    audioRef.current.play().then(() => {
      // Successfully started playing
      setIsMusicPlaying(true);
    }).catch(err => {
      console.log('Auto-play prevented by browser, user interaction needed:', err);
      setIsMusicPlaying(false);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (victoryCelebration?.type === 'player') {
      const timeout = setTimeout(() => setVictoryCelebration(null), 12000);
      return () => clearTimeout(timeout);
    }
  }, [victoryCelebration]);

  // Toggle background music
  const toggleMusic = useCallback(() => {
    if (!audioRef.current) return;
    
    if (isMusicPlaying) {
      audioRef.current.pause();
      setIsMusicPlaying(false);
    } else {
      audioRef.current.play().catch(err => console.log('Audio play failed:', err));
      setIsMusicPlaying(true);
    }
  }, [isMusicPlaying]);

  // Generate floating particles
  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 15; i++) {
        newParticles.push({
          id: i,
          left: Math.random() * 100,
          duration: 15 + Math.random() * 15,
          delay: Math.random() * 5,
        });
      }
      setParticles(newParticles);
    };
    generateParticles();
  }, []);

  const hasRunOpening = useRef(false);
  
  useEffect(() => {
    if (!hasRunOpening.current) {
      hasRunOpening.current = true;
      runOpeningDialogue();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);
  
  useEffect(() => {
    if (gameStatus === GameStatus.HumanWin || gameStatus === GameStatus.AIWin) {
      setIsCelebrating(true);
      const timer = setTimeout(() => setIsCelebrating(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [gameStatus]);
  
  useEffect(() => {
    return () => {
      if (swapResetTimeout.current) {
        clearTimeout(swapResetTimeout.current);
      }
    };
  }, []);

  const scheduleSwapReset = useCallback(() => {
    if (swapResetTimeout.current) {
      clearTimeout(swapResetTimeout.current);
    }

    swapResetTimeout.current = setTimeout(() => {
      setIsBoardFlipped(false);
      setUseSpecialBg(false);
      swapResetTimeout.current = null;
    }, 400);
  }, []);

  const handleRestart = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPlayer(Player.Human);
    setGameStatus(GameStatus.Playing);
    setWinnerCells([]);
    setHumanScore(0);
    setAiScore(0);
    setActiveSkill(null);
    setSkillState(null);
    setSkillToAnimate(null);
    setAiSkillToAnimate(null);
    setSkipAiTurn(false);
    setUseSpecialBg(false);
    setIsFlipping(false);
    setIsBoardFlipped(false);
    setToastMessage('');
    setIsCelebrating(false);
    if (swapResetTimeout.current) {
      clearTimeout(swapResetTimeout.current);
      swapResetTimeout.current = null;
    }
    commentaryLock.current = false;
    aiMoveAfterAnimation.current = null;
    runOpeningDialogue();
  }, [runOpeningDialogue]);
  
  const triggerSkillEffects = (skillId: SkillId) => {
      playSfx(skillId);
      setIsShaking(skillId);
      setTimeout(() => setIsShaking(null), skillId === 'overwhelm' ? 1200 : 820);
  };

  const addSkillCommentary = useCallback((skillId: SkillId, player: Player) => {
    const speaker = player === Player.Human ? '你' : '张技能五';
    const message = dialogue.getSkillExplanation(skillId);
    let explanationDelay = player === Player.AI ? 100 : 100;

    if (player === Player.Human) {
        if (!commentaryLock.current && Math.random() < 0.75) {
            let reactionLine = '';
            if (skillId === 'remove') {
                reactionLine = dialogue.playerSkillReaction_FeiShaZouShi.getLine();
            } else {
                reactionLine = dialogue.playerSkillReaction_General.getLine();
            }
            if (reactionLine) {
                addNewCommentary('张技能五', reactionLine);
                explanationDelay = 1500;
            }
        }
    }
    
    if (player === Player.AI) {
        if (!commentaryLock.current) {
          addNewCommentary(speaker, dialogue.preSkillDialogue.getLine());
          explanationDelay = 1200;
        }
    }

    setTimeout(() => {
        addNewCommentary(speaker, message);
    }, explanationDelay);
  }, [addNewCommentary]);

  
  const resetSkillStates = () => {
      setActiveSkill(null);
      setSkillState(null);
  }

    const executeSkill = useCallback((skill: Skill) => {
        setHumanScore(s => s - skill.cost);
        triggerSkillEffects(skill.id);
        addSkillCommentary(skill.id, Player.Human);

        if (skill.id === 'overwhelm') {
            setToastMessage("最终奥义：力拔山兮！");

            setTimeout(() => {
                setGameStatus(GameStatus.HumanWin);
                const message = "不可阻挡的力量！你获得了绝对的胜利！";
                addNewCommentary('你', message);
                setTimeout(() => addNewCommentary('张技能五', dialogue.playerWinDialogue.getLine()), 1000);
                setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 2500);
                // Queue victory video to play after skill video
                pendingProcessVideo.current = 'VICTORY_ANIMATION';
            }, 1200);
            return;
        }

        if (skill.id === 'skip') {
          setSkipAiTurn(true);
          setToastMessage("技能发动：静如止水！请下子。");
          return;
        }

        if (skill.id === 'swap') {
          if (isFlipping) return;

          setIsFlipping(true);
          setIsBoardFlipped(true);
          setUseSpecialBg(true);
          setToastMessage("技能发动：两极反转！乾坤已变！");

          setTimeout(() => {
            const newBoard = board.map(row =>
              row.map(cell => {
                if (cell === Player.Human) return Player.AI;
                if (cell === Player.AI) return Player.Human;
                return Player.None;
              })
            );
            setBoard(newBoard);
            // Animation complete, allow interaction but keep board flipped
            setIsFlipping(false);
            scheduleSwapReset();

            let humanWinLine: Move[] | null = null, aiWinLine: Move[] | null = null;
            for (let r = 0; r < BOARD_SIZE; r++) { for (let c = 0; c < BOARD_SIZE; c++) {
                if (newBoard[r][c] !== Player.None) {
                  const winLine = checkWin(newBoard, r, c);
                  if (winLine) { if (newBoard[r][c] === Player.Human) humanWinLine = winLine; else aiWinLine = winLine; break; }
                }
            } if (humanWinLine || aiWinLine) break; }
            if (humanWinLine) { 
                setGameStatus(GameStatus.HumanWin); setWinnerCells(humanWinLine);
                addNewCommentary('你', '我赢了!');
                setTimeout(() => addNewCommentary('张技能五', dialogue.playerWinDialogue.getLine()), 1000);
                setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 2500);
                // Play player victory animation
                setTimeout(() => {
                  setVictoryCelebration({ type: 'player' });
                }, 800);
            } else if (aiWinLine) { 
                setGameStatus(GameStatus.AIWin); setWinnerCells(aiWinLine); 
                addNewCommentary('张技能五', dialogue.aiWinDialogue.getLine());
                setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 1500);
                // Play AI victory animation
                setTimeout(() => {
                  setVictoryCelebration({
                    type: 'ai',
                    src: withBasePath('guocheng/ai 胜利结算动画.mp4'),
                  });
                }, 800);
            } else if (checkDraw(newBoard)) { 
                setGameStatus(GameStatus.Draw); 
                addNewCommentary('张呈', dialogue.drawDialogue.getLine());
                setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 1500);
            } else {
                setToastMessage("两极反转完成！请下子。");
            }
          }, 1200);
          return;
        }
        
        if (skill.id === 'remove') {
          setActiveSkill('remove');
          setToastMessage("飞沙走石: 请选择要移除的张技能五的棋子");
        }
        if (skill.id === 'qinNa') {
          setSkillState({ skill: 'qinNa', phase: 'placeOwn1' });
          setToastMessage("擒拿 第一式：请为您自己下一颗棋子");
        }
        if (skill.id === 'tiaoChengLiShan') {
            setSkillState({ skill: 'tiaoChengLiShan', phase: 'selectPiece' });
            setToastMessage("请选择要移动的张技能五的棋子");
        }
        
        if (skill.id === 'cleaning') {
          // Find all AI pieces
          const aiPieces: Move[] = [];
          for (let r = 0; r < BOARD_SIZE; r++) {
            for (let c = 0; c < BOARD_SIZE; c++) {
              if (board[r][c] === Player.AI) {
                aiPieces.push({ row: r, col: c });
              }
            }
          }
          
          if (aiPieces.length === 0) {
            setToastMessage("没有可清除的棋子！");
            setHumanScore(s => s + skill.cost); // Refund
            return;
          }
          
          // Randomly remove 1-3 pieces
          const numToRemove = Math.min(
            Math.floor(Math.random() * 3) + 1,
            aiPieces.length
          );
          
          // Shuffle and select pieces to remove
          const shuffled = [...aiPieces].sort(() => Math.random() - 0.5);
          const piecesToRemove = shuffled.slice(0, numToRemove);
          
          setToastMessage(`保洁开始！正在清除${numToRemove}枚棋子...`);
          
          // Delay before starting cleaning animation (after full-screen effect)
          setTimeout(() => {
            // Animate removal with dramatic delay
            piecesToRemove.forEach((piece, index) => {
              setTimeout(() => {
                // Trigger cleaning animation effect BEFORE removing piece
                const cell = document.querySelector(`[data-cell="${piece.row}-${piece.col}"]`);
                if (cell) {
                  cell.classList.add('cleaning-effect');
                  setTimeout(() => cell.classList.remove('cleaning-effect'), 1200);
                }
                
                // Remove piece after animation starts
                setTimeout(() => {
                  setBoard(prevBoard => {
                    const newBoard = prevBoard.map(r => [...r]);
                    newBoard[piece.row][piece.col] = Player.None;
                    return newBoard;
                  });
                }, 500); // Remove halfway through animation
                
                // Play cleaning sound for each piece
                playSfx('cleaning');
              }, index * 600); // Longer delay between pieces
            });
            
            setTimeout(() => {
              setToastMessage("✨ 保洁完成！棋盘焕然一新！");
              setTimeout(() => setToastMessage(""), 2000);
            }, piecesToRemove.length * 600 + 1200);
          }, 200); // Small delay after full-screen effect
        }
    }, [addSkillCommentary, addNewCommentary, board, isFlipping, scheduleSwapReset]);

  const handleActivateSkill = (skillId: SkillId) => {
    const skill = skills.find(s => s.id === skillId);
    if (!skill || humanScore < skill.cost || isFlipping || skillToAnimate || aiSkillToAnimate) return;

    if (activeSkill === skillId || skillState?.skill === skillId) {
        resetSkillStates();
        return;
    }

    resetSkillStates();
    // 播放技能音效
    playSfx(skillId);
    setSkillToAnimate(skill);
  };

  const handleUltimateSkill = () => {
    if (skillToAnimate || aiSkillToAnimate) return;
    
    // Create ultimate skill object - separate from 'overwhelm'
    const ultimateSkill: Skill = {
      id: 'ultimate', // Independent skill ID
      name: '终极奥义',
      cost: 0,
      description: '超越极限！积分暴涨999！'
    };
    
    resetSkillStates();
    // 播放终极奥义音效
    playSfx('ultimate');
    setSkillToAnimate(ultimateSkill);
    
    // Override the skill animation completion to add score and play video
    setTimeout(() => {
      setHumanScore(s => s + 999);
      addNewCommentary('你', dialogue.ultimateSkillDialogue.getLine());
      addNewCommentary('张呈', '这......这是什么力量！');
      
      // Play ultimate skill video (center screen for ultimate)
      setTimeout(() => {
        setSkillVideo(withBasePath('guocheng/终极奥义：积分+999 .mp4'));
      }, 500);
      
      setSkillToAnimate(null);
    }, 1875); // Match ANIMATION_DURATION in SkillAnimation (reduced by 1/4)
  };

  const onSkillAnimationComplete = useCallback(() => {
    if (!skillToAnimate) return;
    executeSkill(skillToAnimate);
    
    // Play skill video after animation
    const videoPath = getSkillVideoPath(skillToAnimate.id);
    if (videoPath) {
      setSkillVideo(videoPath);
      
      // 1/3 probability to queue process animation after skill video ends
      if (Math.random() < 1/3) {
        pendingProcessVideo.current = withBasePath('guocheng/玩家使用技能后随机出现，三分之一概率.mp4');
      }
    }
    
    setSkillToAnimate(null);
  }, [executeSkill, skillToAnimate]);


  const tryAddMidGameCommentary = useCallback(() => {
    if (commentaryLock.current || gameStatus !== GameStatus.Playing) {
      return;
    }
  
    const dialoguePool = [
      { speaker: '张技能五', manager: dialogue.midGameDialogue },
      { speaker: '张技能五', manager: dialogue.tauntDialogue },
      { speaker: '张技能五', manager: dialogue.concernDialogue },
      { speaker: '张呈', manager: dialogue.systemMessageDialogue },
    ];
  
    const selected = dialoguePool[Math.floor(Math.random() * dialoguePool.length)];
    const line = selected.manager.getLine();
  
    if (line) {
      addNewCommentary(selected.speaker, line);
    }
  }, [addNewCommentary, gameStatus]);
  
  const handlePlacePiece = (row: number, col: number) => {
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = Player.Human;
    setBoard(newBoard);
    setHumanScore(score => score + 1);

    const winningLine = checkWin(newBoard, row, col);
    if (winningLine) { 
        setGameStatus(GameStatus.HumanWin); 
        setWinnerCells(winningLine); 
        addNewCommentary('你', '我赢了！');
        setTimeout(() => addNewCommentary('张技能五', dialogue.playerWinDialogue.getLine()), 1000);
        setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 2500);
        // Play player victory animation
        setTimeout(() => {
          setVictoryCelebration({ type: 'player' });
        }, 800);
        return; 
    }
    if (checkDraw(newBoard)) { 
        setGameStatus(GameStatus.Draw); 
        addNewCommentary('张呈', dialogue.drawDialogue.getLine());
        setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 1500);
        return; 
    }
    
    if (Math.random() < 0.6) {
       setTimeout(tryAddMidGameCommentary, 700);
    }
    
    // 1/10 probability to play good move animation
    if (Math.random() < 0.1) {
      setProcessVideo(withBasePath('guocheng/玩家下出好棋随机出现，十分之一概率.mp4'));
    }
    
    if (skipAiTurn) {
      setSkipAiTurn(false);
      setCurrentPlayer(Player.Human);
      setToastMessage("张技能五的回合已跳过！轮到你了！");
    } else {
      setCurrentPlayer(Player.AI);
    }
  };
  
  const handleRemovePiece = (row: number, col: number) => {
    const skill = skills.find(s => s.id === 'remove');
    if (!skill) return;
    if (board[row][col] !== Player.AI) { setToastMessage("只能移除张技能五的棋子。"); return; }
    
    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = Player.None;
    setBoard(newBoard);
    resetSkillStates();
    setToastMessage('张技能五的棋子已被移除！请下子。');
  };

  const handleQinNa = (row: number, col: number) => {
    const skill = skills.find(s => s.id === 'qinNa');
    if (!skill || !skillState || skillState.skill !== 'qinNa') return;
    if (board[row][col] !== Player.None) { setToastMessage("此处已有棋子。"); return; }

    const newBoard = board.map(r => [...r]);

    if (skillState.phase === 'placeOwn1') {
        newBoard[row][col] = Player.Human;
        setBoard(newBoard);
        setHumanScore(score => score + 1);

        const winningLine = checkWin(newBoard, row, col);
        if (winningLine) {
            resetSkillStates();
            setGameStatus(GameStatus.HumanWin); 
            setWinnerCells(winningLine); 
            addNewCommentary('你', '我赢了！');
            setTimeout(() => addNewCommentary('张技能五', dialogue.playerWinDialogue.getLine()), 1000);
            setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 2500);
            return;
        }
        if (checkDraw(newBoard)) {
            resetSkillStates();
            setGameStatus(GameStatus.Draw);
            addNewCommentary('张呈', dialogue.drawDialogue.getLine());
            setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 1500);
            return;
        }

        setSkillState({ skill: 'qinNa', phase: 'placeOpponent' });
        setToastMessage("擒拿 第二式：请帮张技能五下一颗棋子");

    } else if (skillState.phase === 'placeOpponent') {
        newBoard[row][col] = Player.AI;
        setBoard(newBoard);

        const winningLine = checkWin(newBoard, row, col);
        if (winningLine) {
            resetSkillStates();
            setGameStatus(GameStatus.AIWin); 
            setWinnerCells(winningLine);
            addNewCommentary('张技能五', dialogue.aiWinDialogue.getLine());
            setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 1500);
            // Play AI victory animation
            setTimeout(() => {
              setVictoryCelebration({
                type: 'ai',
                src: withBasePath('guocheng/ai 胜利结算动画.mp4'),
              });
            }, 800);
            return;
        }
        if (checkDraw(newBoard)) {
            resetSkillStates();
            setGameStatus(GameStatus.Draw);
            addNewCommentary('张呈', dialogue.drawDialogue.getLine());
            setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 1500);
            return;
        }

        setSkillState({ skill: 'qinNa', phase: 'placeOwn2' });
        setToastMessage("擒拿 第三式：请再为您自己下一颗棋子");

    } else if (skillState.phase === 'placeOwn2') {
        newBoard[row][col] = Player.Human;
        setBoard(newBoard);
        setHumanScore(score => score + 1);
        resetSkillStates();
        setToastMessage("擒拿成功！");

        const winningLine = checkWin(newBoard, row, col);
        if (winningLine) {
            setGameStatus(GameStatus.HumanWin); 
            setWinnerCells(winningLine); 
            addNewCommentary('你', '我赢了！');
            setTimeout(() => addNewCommentary('张技能五', dialogue.playerWinDialogue.getLine()), 1000);
            setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 2500);
            return;
        }
        if (checkDraw(newBoard)) {
            setGameStatus(GameStatus.Draw);
            addNewCommentary('张呈', dialogue.drawDialogue.getLine());
            setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 1500);
            return;
        }

        setCurrentPlayer(Player.AI);
    }
  };

  const handleTiaoChengLiShan = (row: number, col: number) => {
    const skill = skills.find(s => s.id === 'tiaoChengLiShan');
    if (!skill || !skillState || skillState.skill !== 'tiaoChengLiShan') return;

    if (skillState.phase === 'selectPiece') {
        if (board[row][col] !== Player.AI) {
            setToastMessage("请选择一枚张技能五的棋子。");
            return;
        }
        setSkillState({ ...skillState, phase: 'placePiece', pieceToMove: { row, col } });
        setToastMessage("请选择要放置的位置");

    } else if (skillState.phase === 'placePiece') {
        if (board[row][col] !== Player.None) {
            setToastMessage("请选择一个空位。");
            return;
        }
        const pieceToMove = skillState.pieceToMove;
        if (!pieceToMove) return;

        const newBoard = board.map(r => [...r]);
        newBoard[pieceToMove.row][pieceToMove.col] = Player.None;
        newBoard[row][col] = Player.AI;
        setBoard(newBoard);

        resetSkillStates();
        setToastMessage("调呈离山成功！请下子。");

        const winningLine = checkWin(newBoard, row, col);
        if (winningLine) { 
            setGameStatus(GameStatus.AIWin); 
            setWinnerCells(winningLine); 
            addNewCommentary('张技能五', dialogue.aiWinDialogue.getLine());
            setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 1500);
            // Play AI victory animation
            setTimeout(() => {
              setVictoryCelebration({
                type: 'ai',
                src: withBasePath('guocheng/ai 胜利结算动画.mp4'),
              });
            }, 800);
        } else if (checkDraw(newBoard)) {
            setGameStatus(GameStatus.Draw); 
            addNewCommentary('张呈', dialogue.drawDialogue.getLine());
            setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 1500);
        }
    }
  };

  const handleBoardClick = (row: number, col: number) => {
    if (gameStatus !== GameStatus.Playing || currentPlayer !== Player.Human || isFlipping || skillToAnimate || aiSkillToAnimate) return;

    if (skillState?.skill === 'qinNa') {
        handleQinNa(row, col);
    } else if (skillState?.skill === 'tiaoChengLiShan') {
        handleTiaoChengLiShan(row, col);
    } else if (activeSkill === 'remove') {
        handleRemovePiece(row, col);
    } else if (board[row][col] === Player.None) {
        handlePlacePiece(row, col);
    }
  };
  
  const handleAIMove = useCallback(() => {
    if (gameStatus !== GameStatus.Playing) return;

    // 1. Decide if a skill will be used
    let skillToUse: Skill | null = null;
    const skillChance = Math.min(0.8, (aiScore / 20) * 0.6); // Becomes more likely to use skill with more score
    const availableAiSkills = skills
      .filter(s => s.cost <= aiScore && s.id !== 'overwhelm' && !s.disabled)
      .sort((a, b) => b.cost - a.cost); // Prioritize more expensive skills

    if (availableAiSkills.length > 0 && Math.random() < skillChance) {
      skillToUse = availableAiSkills[0]; // Use the most powerful affordable skill
    }

    const executeMove = (initialBoard: BoardState, usedSkill: Skill | null) => {
      let boardAfterSkill = initialBoard.map(r => [...r]);
      let playAgain = false;

      if (usedSkill) {
        setAiScore(s => s - usedSkill!.cost);
        triggerSkillEffects(usedSkill.id);
        addSkillCommentary(usedSkill.id, Player.AI);

        switch (usedSkill.id) {
          case 'swap':
            setIsFlipping(true);
            setIsBoardFlipped(true);
            setUseSpecialBg(true);
            boardAfterSkill = boardAfterSkill.map(row => row.map(cell =>
              cell === Player.Human ? Player.AI : cell === Player.AI ? Player.Human : Player.None
            ));
            // Animation will complete after 1.2s
            setTimeout(() => {
              setIsFlipping(false);
              scheduleSwapReset();
            }, 1200);
            break;

          case 'skip':
          case 'qinNa':
            playAgain = true;
            break;

          case 'remove': {
            const opponentPieces: Move[] = [];
            initialBoard.forEach((row, r) => row.forEach((cell, c) => { if (cell === Player.Human) opponentPieces.push({ row: r, col: c }); }));
            if (opponentPieces.length > 0) {
              const pieceToRemove = opponentPieces[Math.floor(Math.random() * opponentPieces.length)];
              boardAfterSkill[pieceToRemove.row][pieceToRemove.col] = Player.None;
            }
            break;
          }

          case 'tiaoChengLiShan': {
            const opponentPieces: Move[] = [];
            initialBoard.forEach((row, r) => row.forEach((cell, c) => { if (cell === Player.Human) opponentPieces.push({ row: r, col: c }); }));
            const emptyCells: Move[] = [];
            initialBoard.forEach((row, r) => row.forEach((cell, c) => { if (cell === Player.None) emptyCells.push({ row: r, col: c }); }));

            if (opponentPieces.length > 0 && emptyCells.length > 0) {
              const pieceToMove = opponentPieces[Math.floor(Math.random() * opponentPieces.length)];
              const newPosition = emptyCells[Math.floor(Math.random() * emptyCells.length)];
              boardAfterSkill[pieceToMove.row][pieceToMove.col] = Player.None;
              boardAfterSkill[newPosition.row][newPosition.col] = Player.Human;
            }
            break;
          }
        }
      }
      
      let humanWinLine: Move[] | null = null, aiWinLine: Move[] | null = null;
      for (let r = 0; r < BOARD_SIZE; r++) { for (let c = 0; c < BOARD_SIZE; c++) {
        if (boardAfterSkill[r][c] !== Player.None) {
          const winLine = checkWin(boardAfterSkill, r, c);
          if (winLine) {
            if (boardAfterSkill[r][c] === Player.Human) humanWinLine = winLine; else aiWinLine = winLine;
            break;
          }
        }
      } if (humanWinLine || aiWinLine) break; }

      if (humanWinLine) { 
        setBoard(boardAfterSkill); setGameStatus(GameStatus.HumanWin); setWinnerCells(humanWinLine);
        addNewCommentary('你', '我赢了！');
        setTimeout(() => addNewCommentary('张技能五', dialogue.playerWinDialogue.getLine()), 1000);
        setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 2500);
        // Play player victory animation
        setTimeout(() => {
          setVictoryCelebration({ type: 'player' });
        }, 800);
        return;
      } else if (aiWinLine) { 
        setBoard(boardAfterSkill); setGameStatus(GameStatus.AIWin); setWinnerCells(aiWinLine);
        addNewCommentary('张技能五', dialogue.aiWinDialogue.getLine());
        setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 1500);
        // Play AI victory animation
        setTimeout(() => {
          setProcessVideo(withBasePath('guocheng/ai 胜利结算动画.mp4'));
        }, 800);
        return;
      } else if (checkDraw(boardAfterSkill)) {
        setBoard(boardAfterSkill); setGameStatus(GameStatus.Draw);
        addNewCommentary('张呈', dialogue.drawDialogue.getLine());
        setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 1500);
        return;
      }
      
      const bestMove = findBestMove(boardAfterSkill);
      if (bestMove) {
        const { row, col } = bestMove;
        if(boardAfterSkill[row][col] === Player.None) { 
          boardAfterSkill[row][col] = Player.AI; 
          setAiScore(score => score + 1);
          // Play "嘿" sound when AI places a piece
          playHeiSound();
        }
        
        if (Math.random() < 0.6) {
            setTimeout(tryAddMidGameCommentary, 500);
        }

        const winningLine = checkWin(boardAfterSkill, row, col);
        if (winningLine) { 
            setBoard(boardAfterSkill); setGameStatus(GameStatus.AIWin); setWinnerCells(winningLine);
            addNewCommentary('张技能五', dialogue.aiWinDialogue.getLine());
            setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 1500);
            // Play AI victory animation
            setTimeout(() => {
              setVictoryCelebration({
                type: 'ai',
                src: withBasePath('guocheng/ai 胜利结算动画.mp4'),
              });
            }, 800);
            return; 
        }
        if (checkDraw(boardAfterSkill)) { 
            setBoard(boardAfterSkill); setGameStatus(GameStatus.Draw);
            addNewCommentary('张呈', dialogue.drawDialogue.getLine());
            setTimeout(() => addNewCommentary('张技能五', dialogue.postGameDialogue.getLine()), 1500);
            return;
        }
      }
      
      setBoard(boardAfterSkill);

      if (playAgain) {
        setCurrentPlayer(Player.AI);
        setTimeout(handleAIMove, 1000);
      } else {
        setCurrentPlayer(Player.Human);
      }
    };

    if (skillToUse) {
      aiMoveAfterAnimation.current = () => executeMove(board, skillToUse);
      // 播放 AI 技能音效
      playSfx(skillToUse.id);
      setAiSkillToAnimate(skillToUse);
    } else {
      setTimeout(() => executeMove(board, null), 1000);
    }
  }, [board, gameStatus, aiScore, addNewCommentary, tryAddMidGameCommentary, addSkillCommentary, scheduleSwapReset]);

  const onAISkillAnimationComplete = useCallback(() => {
    if (aiMoveAfterAnimation.current) {
        aiMoveAfterAnimation.current();
        aiMoveAfterAnimation.current = null;
    }
    
    // Play skill video after AI animation
    if (aiSkillToAnimate) {
      const videoPath = getSkillVideoPath(aiSkillToAnimate.id);
      if (videoPath) {
        setSkillVideo(videoPath);
      }
    }
    
    setAiSkillToAnimate(null);
  }, [aiSkillToAnimate]);
  
  useEffect(() => {
    if (currentPlayer === Player.AI && gameStatus === GameStatus.Playing && !isFlipping && !aiSkillToAnimate && !skillToAnimate) {
      handleAIMove();
    }
  }, [currentPlayer, gameStatus, isFlipping, handleAIMove, aiSkillToAnimate, skillToAnimate]);
  
  const getGameStatusText = () => {
    switch (gameStatus) {
      case GameStatus.HumanWin: return "恭喜你，你赢了！";
      case GameStatus.AIWin: return "张技能五 获胜！";
      case GameStatus.Draw: return "平局！";
      default:
        return currentPlayer === Player.Human ? '轮到你了' : '张技能五 正在思考...';
    }
  };
  
  const getSkillButtonClass = (skill: Skill) => {
    const baseClass = "w-full text-left p-2.5 rounded-lg transition-all duration-200 shadow-md border-b-4 relative overflow-hidden skill-button group";
    const disabledClass = "skill-button-disabled";
    const activeClass = "skill-button-active";
    const affordableClass = "skill-button-affordable skill-ready";

    if (humanScore < skill.cost) return `${baseClass} ${disabledClass}`;
    if (activeSkill === skill.id || skillState?.skill === skill.id) return `${baseClass} ${activeClass}`;
    return `${baseClass} ${affordableClass}`;
  };

  const getDanmakuColorClass = (speaker: string) => {
    if (speaker === '你') return 'danmaku-player';
    if (speaker === '张技能五') return 'danmaku-ai';
    return 'danmaku-narrator'; // For '张呈'
  };

  return (
    <div className={`min-h-screen flex flex-col p-4 relative bg-transparent ${isCelebrating ? 'celebration-active' : ''}`}>
      {/* Epic Particle Background */}
      <div className="particle-background">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="particle"
            style={{
              left: `${particle.left}%`,
              animationDuration: `${particle.duration}s`,
              animationDelay: `${particle.delay}s`,
            }}
          />
        ))}
      </div>

      {(skillToAnimate || aiSkillToAnimate) && (
        <SkillAnimation 
          skill={skillToAnimate || aiSkillToAnimate!} 
          onAnimationEnd={skillToAnimate ? onSkillAnimationComplete : onAISkillAnimationComplete}
          isAI={!!aiSkillToAnimate}
        />
      )}

      {toastMessage && (
        <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-lg text-lg z-50 animate-bounce shadow-[0_0_20px_rgba(251,191,36,0.6)]">
          ⚡ {toastMessage} ⚡
        </div>
      )}

      {/* Skill Video Player */}
      {skillVideo && (
        <div className={`fixed z-40 skill-video-container ${skillVideo.includes('终极奥义') ? 'skill-video-ultimate' : 'skill-video-normal'}`}>
          <div className="relative rounded-xl overflow-hidden shadow-2xl border-4 border-amber-500 bg-black">
            <video
              src={skillVideo}
              autoPlay
              onEnded={() => {
                setSkillVideo(null);
                // Play pending process video or victory video after skill video ends
                if (pendingProcessVideo.current === 'VICTORY_ANIMATION') {
                  pendingProcessVideo.current = null;
                  setVictoryCelebration({ type: 'player' });
                } else if (pendingProcessVideo.current) {
                  setProcessVideo(pendingProcessVideo.current);
                  pendingProcessVideo.current = null;
                }
              }}
              className="h-auto skill-video-player"
            />
            <button
              onClick={() => {
                setSkillVideo(null);
                pendingProcessVideo.current = null; // Clear pending video if manually closed
              }}
              className="absolute top-4 right-4 w-12 h-12 bg-red-600/90 hover:bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-2xl transition-all duration-200 hover:scale-110 shadow-lg"
              title="关闭视频"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Process Video Player - Top Right Corner (1/4 size) */}
      {processVideo && (
        <div className="fixed top-20 right-8 z-40 process-video-container">
          <div className="relative rounded-lg overflow-hidden shadow-2xl border-3 border-cyan-400 bg-black">
            <video
              src={processVideo}
              autoPlay
              onEnded={() => setProcessVideo(null)}
              className="h-auto"
              style={{ width: '25vw', maxWidth: '400px', minWidth: '300px' }}
            />
            <button
              onClick={() => setProcessVideo(null)}
              className="absolute top-2 right-2 w-8 h-8 bg-red-600/90 hover:bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-lg transition-all duration-200 hover:scale-110 shadow-lg"
              title="关闭视频"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Victory Celebration Overlay */}
      {victoryCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm victory-video-overlay">
          <div className="relative flex flex-col items-center gap-6">
            {victoryCelebration.type === 'ai' ? (
              <video
                src={victoryCelebration.src}
                autoPlay
                onEnded={() => setVictoryCelebration(null)}
                className="rounded-xl shadow-2xl victory-video-player"
              />
            ) : (
              <div className="victory-celebration">
                <div className="victory-celebration-glow" />
                <div className="victory-celebration-rings" />
                <div className="victory-celebration-title">玩家大获全胜！</div>
                <div className="victory-celebration-subtitle">
                  张技能五震惊之余，表示要加倍练习！
                </div>
                <div className="victory-celebration-badge">棋盘主宰</div>
              </div>
            )}
            <button
              onClick={() => setVictoryCelebration(null)}
              className="absolute top-4 right-4 w-12 h-12 bg-red-600/90 hover:bg-red-500 rounded-full flex items-center justify-center text-white font-bold text-2xl transition-all duration-200 hover:scale-110 shadow-lg z-10"
              title="关闭视频"
            >
              ✕
            </button>

            {/* Victory Scroll Text - Only for Player Victory */}
            {victoryCelebration.type === 'player' && (
              <div className="victory-scroll-container">
                <div className="victory-scroll-text">
                  外练筋骨皮，练的是体魄。内练五子棋，练的是快乐！　　　　　外练筋骨皮，练的是体魄。内练五子棋，练的是快乐！　　　　　外练筋骨皮，练的是体魄。内练五子棋，练的是快乐！
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Music Control Button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleMusic}
          className="p-3 rounded-full bg-slate-800/80 backdrop-blur-sm border-2 border-amber-500 hover:bg-slate-700 transition-all duration-200 shadow-lg hover:scale-110"
          title={isMusicPlaying ? "关闭背景音乐" : "开启背景音乐"}
        >
          {isMusicPlaying ? (
            <div className="music-wave flex items-center gap-0.5">
              <span className="bg-amber-400"></span>
              <span className="bg-amber-400"></span>
              <span className="bg-amber-400"></span>
              <span className="bg-amber-400"></span>
            </div>
          ) : (
            <div className="w-6 h-6 flex items-center justify-center text-amber-400 text-xl">🔇</div>
          )}
        </button>
        
        {/* Music Tip - Show when music is not playing */}
        {!isMusicPlaying && (
          <div className="absolute top-full right-0 mt-2 music-tip">
            <div className="bg-amber-500 text-white px-4 py-2 rounded-lg shadow-xl font-bold text-sm whitespace-nowrap">
              🎵 打开音乐
            </div>
          </div>
        )}
      </div>

      {/* Header */}
      <header className="w-full max-w-7xl mx-auto mb-2 md:mb-4 z-20 chuunibyou-header mobile-header">
        <div className="header-corner top-left"></div>
        <div className="header-corner top-right"></div>
        <div className="header-corner bottom-left"></div>
        <div className="header-corner bottom-right"></div>
        <div className="header-content flex flex-col items-center justify-center gap-2 md:gap-3">
          <h1 className="epic-title mobile-title text-center" style={{ 
            background: 'linear-gradient(90deg, #4FC3F7, #9C27B0, #4FC3F7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>技能五子棋</h1>
          <div className="flex items-center justify-center gap-3 md:gap-6 text-xs md:text-sm mobile-scores">
            <div className={`p-1 md:p-2 rounded-md transition-all duration-300 ${currentPlayer === Player.Human && gameStatus === GameStatus.Playing ? 'bg-blue-500/30 ring-1 md:ring-2 ring-blue-400' : ''}`}>
                <p className="font-semibold text-sky-300 text-glow-sky">你: <span className="font-bold text-base md:text-lg text-white">{humanScore}</span> 分</p>
              </div>
              <div className={`p-1 md:p-2 rounded-md transition-all duration-300 ${currentPlayer === Player.AI && gameStatus === GameStatus.Playing ? 'bg-red-500/30 ring-1 md:ring-2 ring-red-400' : ''}`}>
                <p className="font-semibold text-red-400 text-glow-red">张技能五: <span className="font-bold text-base md:text-lg text-white">{aiScore}</span> 分</p>
              </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 w-full max-w-7xl mx-auto mobile-landscape-grid px-2 md:px-0">
        
        {/* Left Side: Skills & Controls */}
        <div className="md:col-span-1 bg-slate-800/50 backdrop-blur-sm p-2 md:p-4 rounded-lg shadow-lg flex flex-col border-2 border-amber-500/30 mobile-skills-panel">
           <h2 className="text-base md:text-xl font-bold mb-1 md:mb-2 text-amber-200 text-glow-amber text-center tracking-wider">✨ 奥义列表 ✨</h2>
           
           {/* Energy Bar */}
           <div className="mb-2 md:mb-4 flex-shrink-0">
             <div className="flex justify-between items-center mb-1">
               <span className="text-xs font-bold text-amber-300">能量值</span>
               <span className="text-xs font-bold text-white">{humanScore} / ∞</span>
             </div>
             <div className="energy-bar h-4 rounded-full overflow-hidden">
               <div 
                 className="energy-fill h-full"
                 style={{ width: `${Math.min(100, (humanScore / 30) * 100)}%` }}
               ></div>
             </div>
           </div>

           <div className="space-y-1 md:space-y-2 flex-grow overflow-y-auto mobile-skills-list">
              {skills.map((skill) => (
                  <button 
                      key={skill.id} 
                      onClick={() => handleActivateSkill(skill.id)}
                      disabled={humanScore < skill.cost || !!skillToAnimate || !!aiSkillToAnimate}
                      className={getSkillButtonClass(skill) + ' mobile-skill-btn'}
                  >
                      <div className="skill-button-glow" aria-hidden="true"></div>
                      <div className="skill-button-inner">
                        <div className="skill-button-header">
                          <span className="skill-button-title">
                            <span className="skill-button-icon" aria-hidden="true">⚡</span>
                            {skill.name}
                          </span>
                          <span className="skill-button-cost">消耗 {skill.cost}</span>
                        </div>
                        <p className="skill-button-description">{skill.description}</p>
                      </div>
                  </button>
              ))}
           </div>
           <div className="mt-2 md:mt-4 flex flex-col gap-1.5 md:gap-2 flex-shrink-0">
              <button 
                  onClick={handleRestart}
                  className="w-full px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs md:text-sm rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-amber-400"
                >
                  🔄 东山再起
                </button>
              <button
                  onClick={handleUltimateSkill}
                  className="w-full px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-500 hover:via-pink-500 hover:to-red-500 text-white font-bold text-xs md:text-sm rounded-lg shadow-lg transform hover:scale-105 transition-all duration-200 border-2 border-yellow-400 animate-pulse"
              >
                  ⚡💥 终极奥义 💥⚡
              </button>
           </div>
        </div>

        {/* Right Side: Board & Status */}
        <div className="md:col-span-2 flex flex-col items-center justify-center space-y-2 md:space-y-4 relative mobile-board-section">
            <div className="danmaku-container">
              {danmakuList.map(danmaku => (
                <div
                  key={danmaku.id}
                  className={`danmaku-item ${getDanmakuColorClass(danmaku.speaker)}`}
                  style={{ top: `${danmaku.top}%`, animationDuration: `${danmaku.duration}s` }}
                >
                 {danmaku.speaker}: {danmaku.message}
                </div>
              ))}
            </div>
            <div className={`w-full text-center p-2 md:p-3 rounded-lg shadow-lg text-base md:text-xl font-bold transition-colors duration-500 z-5
              ${gameStatus === GameStatus.HumanWin ? 'bg-green-600 victory-animation' : ''}
              ${gameStatus === GameStatus.AIWin ? 'bg-red-600 victory-animation' : ''}
              ${gameStatus === GameStatus.Draw ? 'bg-gray-600' : ''}
              ${gameStatus === GameStatus.Playing ? 'bg-slate-800/70 backdrop-blur-sm' : ''}
            `}>
              {getGameStatusText()}
            </div>
            <div className={`w-full max-w-xl mx-auto relative flex justify-center items-center ${isShaking === 'overwhelm' ? 'board-shake-intense' : isShaking ? 'board-shake' : ''}`}>
                 <Board 
                    board={board}
                    onCellClick={handleBoardClick}
                    disabled={(currentPlayer !== Player.Human || gameStatus !== GameStatus.Playing || isFlipping || !!skillToAnimate || !!aiSkillToAnimate) && !activeSkill && !skillState}
                    winnerCells={winnerCells}
                    isFlipping={isFlipping}
                    isBoardFlipped={isBoardFlipped}
                    isCelebrating={isCelebrating}
                    activeSkill={activeSkill}
                    skillState={skillState}
                    hoveredCell={hoveredCell}
                    setHoveredCell={setHoveredCell}
                 />
            </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full py-3 text-center text-slate-400 text-xs md:text-sm mt-auto">
        <p className="opacity-70">
          create by 小红书：<span className="font-semibold text-amber-400">ABDC</span>
        </p>
      </footer>
    </div>
  );
};

export default App;