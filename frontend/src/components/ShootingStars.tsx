import React from 'react';
import { useThemeStore } from '../store/useThemeStore';

export const ShootingStars: React.FC = () => {
  const { theme } = useThemeStore();

  if (theme !== 'dark') return null;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
      {/* Ambient Twinkling Stars */}
      <div className="twinkle-star star-1" style={{ top: '12%', left: '15%' }} />
      <div className="twinkle-star star-2" style={{ top: '28%', left: '72%' }} />
      <div className="twinkle-star star-3" style={{ top: '65%', left: '20%' }} />
      <div className="twinkle-star star-1" style={{ top: '45%', left: '88%' }} />
      <div className="twinkle-star star-2" style={{ top: '80%', left: '55%' }} />
      <div className="twinkle-star star-3" style={{ top: '18%', left: '42%' }} />

      {/* Shooting Stars / Meteors */}
      <div
        className="shooting-star"
        style={{ top: '10%', left: '85%', animationDelay: '1s', animationDuration: '4s' }}
      />
      <div
        className="shooting-star"
        style={{ top: '25%', left: '95%', animationDelay: '4.5s', animationDuration: '3.5s' }}
      />
      <div
        className="shooting-star"
        style={{ top: '5%', left: '60%', animationDelay: '8s', animationDuration: '4.2s' }}
      />
      <div
        className="shooting-star"
        style={{ top: '40%', left: '80%', animationDelay: '11.5s', animationDuration: '3.8s' }}
      />
      <div
        className="shooting-star"
        style={{ top: '60%', left: '90%', animationDelay: '15s', animationDuration: '4.5s' }}
      />
    </div>
  );
};
