'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface RiskMeterProps {
  score: number;
  animated?: boolean;
}

export function RiskMeter({ score, animated = true }: RiskMeterProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score);

  useEffect(() => {
    if (!animated) {
      setDisplayScore(score);
      return;
    }

    // Animate the score
    const duration = 1000;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(interval);
      } else {
        setDisplayScore(Math.round(current));
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [score, animated]);

  const getColor = () => {
    if (score >= 80) return 'fraud';
    if (score >= 50) return 'suspicious';
    return 'safe';
  };

  const getColorClass = () => {
    const color = getColor();
    return {
      safe: 'text-safe',
      suspicious: 'text-suspicious',
      fraud: 'text-fraud',
    }[color];
  };

  const getGradient = () => {
    const color = getColor();
    return {
      safe: 'from-safe to-safe/50',
      suspicious: 'from-suspicious to-suspicious/50',
      fraud: 'from-fraud to-fraud/50',
    }[color];
  };

  const rotation = (displayScore / 100) * 180 - 90;

  return (
    <div className="relative flex flex-col items-center">
      {/* Meter background */}
      <div className="relative h-32 w-64 overflow-hidden">
        {/* Background arc */}
        <div className="absolute inset-0 rounded-t-full border-8 border-secondary" style={{ borderBottom: 'none' }} />
        
        {/* Colored arc */}
        <div
          className={cn('absolute inset-0 rounded-t-full border-8 bg-gradient-to-r', getGradient())}
          style={{
            borderBottom: 'none',
            clipPath: `polygon(0 100%, 0 0, ${displayScore}% 0, ${displayScore}% 100%)`,
            opacity: 0.3,
          }}
        />
        
        {/* Needle */}
        <div
          className="absolute bottom-0 left-1/2 h-24 w-1 origin-bottom transition-transform duration-500"
          style={{ transform: `translateX(-50%) rotate(${rotation}deg)` }}
        >
          <div className={cn('h-full w-full rounded-full bg-gradient-to-t', getGradient())} />
        </div>
        
        {/* Center circle */}
        <div className="absolute bottom-0 left-1/2 h-4 w-4 -translate-x-1/2 translate-y-1/2 rounded-full bg-card border-2 border-border" />
      </div>

      {/* Score display */}
      <div className={cn('mt-4 text-5xl font-bold', getColorClass())}>
        {displayScore}
      </div>
      <p className="text-sm text-muted-foreground">Risk Score</p>

      {/* Scale labels */}
      <div className="mt-4 flex w-64 justify-between text-xs text-muted-foreground">
        <span>0</span>
        <span className="text-safe">Safe</span>
        <span className="text-suspicious">Suspicious</span>
        <span className="text-fraud">Fraud</span>
        <span>100</span>
      </div>
    </div>
  );
}
