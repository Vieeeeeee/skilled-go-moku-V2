import React, { useEffect, useMemo, useState } from 'react';
import { Skill } from '../types';
import { ZHANG_CHENG_BG } from '../assets';
import { getSkillExplanation } from '../services/dialogue';

interface SkillAnimationProps {
  skill: Skill;
  onAnimationEnd: () => void;
  isAI?: boolean;
}

const ANIMATION_DURATION = 1875; // ms, should match CSS animation duration (reduced by 1/4)

type SkillParticle = {
  id: number;
  tx: number;
  ty: number;
  delay: number;
};

const SkillAnimation: React.FC<SkillAnimationProps> = ({ skill, onAnimationEnd, isAI }) => {
  const [particles, setParticles] = useState<SkillParticle[]>([]);

  useEffect(() => {
    // Generate particles for burst effect
    const newParticles: SkillParticle[] = [];
    const particleCount = 30;
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const distance = 300 + Math.random() * 200;
      newParticles.push({
        id: i,
        tx: Math.cos(angle) * distance,
        ty: Math.sin(angle) * distance,
        delay: Math.random() * 0.3,
      });
    }
    setParticles(newParticles);

    const timer = setTimeout(() => {
      onAnimationEnd();
    }, ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [onAnimationEnd]);

  const [quotePart1, quotePart2] = useMemo(() => {
    const explanation = getSkillExplanation(skill.id);
    const firstBangIndex = explanation.indexOf('！');

    if (firstBangIndex > -1) {
      const p1 = explanation.substring(0, firstBangIndex + 1);
      const p2 = explanation.substring(firstBangIndex + 1).trim();
      return [p1, p2 || null];
    }
    
    return [explanation, null];
  }, [skill.id]);

  const themeClass = `theme-${skill.id}`;

  return (
    <div className={`skill-animation-overlay ${themeClass} ${isAI ? 'is-ai' : ''}`}>
      <div className="skill-animation-bg"></div>
      
      {/* Player Indicator */}
      <div className="skill-user-badge">
        {isAI ? '🎭 张技能五 使用技能' : '⚔️ 你 使用技能'}
      </div>
      
      {/* Screen Flash Effect */}
      <div className="screen-flash"></div>
      
      {/* Particle Burst Effect */}
      <div className="skill-particles">
        {particles.map(particle => (
          <div
            key={particle.id}
            className="skill-particle"
            style={{
              left: '50%',
              top: '50%',
              '--tx': `${particle.tx}px`,
              '--ty': `${particle.ty}px`,
              animationDelay: `${particle.delay}s`,
            } as React.CSSProperties}
          />
        ))}
      </div>
      
      <div
        className="skill-animation-char"
        style={{ backgroundImage: `url(${ZHANG_CHENG_BG})` }}
      ></div>
      <div className="skill-animation-text">
        {skill.name}
      </div>
      {skill.name === '终极奥义' && (
        <div className="skill-animation-score">
          积分 +999
        </div>
      )}
      <div className="skill-animation-quote">
          <span className="quote-part-1">{quotePart1}</span>
          {quotePart2 && <span className="quote-part-2">{quotePart2}</span>}
      </div>
    </div>
  );
};

export default SkillAnimation;