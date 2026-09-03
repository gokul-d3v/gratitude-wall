import React, { useEffect, useRef, useState } from 'react';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';

interface Star {
  x: number;
  y: number;
  length: number;
  speed: number;
  angle: number;
  opacity: number;
  maxOpacity: number;
  fadeSpeed: number;
  state: 'fading-in' | 'fading-out';
  trailColor: string;
}


interface TwinkleStar {
  x: number;
  y: number;
  size: number;
  alpha: number;
  alphaSpeed: number;
}

type MissionPhase =
  | 'flying-in'
  | 'hovering'
  | 'alien-descending'
  | 'alien-waving'
  | 'alien-ascending'
  | 'flying-out';

interface AlienMission {
  id: number;
  phase: MissionPhase;
  startX: number;
  startY: number;
  ufoX: number;
  ufoY: number;
  alienX: number;
  alienY: number;
}

export const ShootingStars: React.FC = () => {
  const { theme } = useThemeStore();
  const { user, isAuthenticated } = useAuthStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mission, setMission] = useState<AlienMission | null>(null);

  const userName =
    isAuthenticated && user?.fullName
      ? user.fullName.split(' ')[0]
      : user?.email
      ? user.email.split('@')[0]
      : null;

  // Cinematic Friendly Alien Visit Mission
  useEffect(() => {
    if (theme !== 'dark') {
      setMission(null);
      return;
    }

    let missionTimer: any;
    const timeouts: any[] = [];

    const startAlienMission = () => {
      const brandContainer = document.getElementById('brotify-brand-container');
      
      if (!brandContainer) {
        scheduleNext(5000);
        return;
      }

      const brandRect = brandContainer.getBoundingClientRect();

      // Hide the original brand container instantly
      brandContainer.style.transition = 'none';
      brandContainer.style.opacity = '0';

      // Create particle dust elements for the snap
      const dustContainer = document.createElement('div');
      dustContainer.style.position = 'fixed';
      dustContainer.style.left = `${brandRect.left}px`;
      dustContainer.style.top = `${brandRect.top}px`;
      dustContainer.style.width = `${brandRect.width}px`;
      dustContainer.style.height = `${brandRect.height}px`;
      dustContainer.style.pointerEvents = 'none';
      dustContainer.style.zIndex = '1000';
      document.body.appendChild(dustContainer);

      const particleCount = 120;
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.width = '3px';
        particle.style.height = '3px';
        particle.style.background = Math.random() > 0.5 ? '#0058bd' : '#424753'; // Match brotify text colors
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.borderRadius = '50%';
        
        const angle = Math.random() * Math.PI * 2;
        const velocity = 20 + Math.random() * 60;
        const tx = Math.cos(angle) * velocity + 20; // Drift right slightly
        const ty = Math.sin(angle) * velocity - 30; // Float upwards
        
        particle.animate([
          { transform: 'translate(0, 0) scale(1)', opacity: 1 },
          { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
        ], {
          duration: 1200 + Math.random() * 1000,
          easing: 'cubic-bezier(0, .9, .57, 1)',
          fill: 'forwards'
        });
        
        dustContainer.appendChild(particle);
      }

      setTimeout(() => {
        if (document.body.contains(dustContainer)) {
          document.body.removeChild(dustContainer);
        }
      }, 2500);

      // After 2.2 seconds (when dust clears), spawn the character animation
      timeouts.push(
        setTimeout(() => {
          // Position EXACTLY on top of the BROTIFY logo area
          const ufoX = brandRect.left + brandRect.width / 2;
          const ufoY = brandRect.bottom + 10; // Character standing exactly where the logo text was
          const alienX = ufoX; 
          const alienY = ufoY; // Exactly the same floor level

          const fromLeft = Math.random() > 0.5;
          const startX = fromLeft ? -200 : window.innerWidth + 200;
          const startY = ufoY; 

          const newMission: AlienMission = {
            id: Date.now(),
            phase: 'flying-in',
            startX,
            startY,
            ufoX,
            ufoY,
            alienX,
            alienY,
          };

          setMission(newMission);

          // Phase 1: Both fade in together
          timeouts.push(
            setTimeout(() => {
              setMission((prev) => (prev ? { ...prev, phase: 'alien-waving' } : null));
            }, 250) // Short delay to let the DOM element mount first
          );

          // Phase 2: Fade out the character after waving
          timeouts.push(
            setTimeout(() => {
              setMission((prev) => (prev ? { ...prev, phase: 'flying-out' } : null));
              
              // Restore the logo text smoothly after the character fades out
              setTimeout(() => {
                brandContainer.style.transition = 'opacity 1s ease-in-out';
                brandContainer.style.opacity = '1';
              }, 1200);
              
            }, 5000)
          );

          // Phase 3: Mission complete -> schedule next visit
          timeouts.push(
            setTimeout(() => {
              setMission(null);
              scheduleNext(15000 + Math.random() * 15000);
            }, 7500)
          );
        }, 2200) // 2.2 seconds wait for Thanos snap
      );
    };

    const scheduleNext = (delay: number) => {
      missionTimer = setTimeout(startAlienMission, delay);
    };

    // First mission starts 3.5 seconds after entering dark mode
    scheduleNext(3500);

    return () => {
      clearTimeout(missionTimer);
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [theme]);

  // Shooting Stars & Ambient Twinkle Canvas Engine
  useEffect(() => {
    if (theme !== 'dark') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let stars: Star[] = [];
    let twinkleStars: TwinkleStar[] = [];
    let lastSpawn = Date.now();

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initTwinkleStars();
    };

    const initTwinkleStars = () => {
      twinkleStars = [];
      const count = Math.floor((canvas.width * canvas.height) / 22000);
      for (let i = 0; i < count; i++) {
        twinkleStars.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: 0.8 + Math.random() * 1.5,
          alpha: Math.random() * 0.7,
          alphaSpeed: 0.005 + Math.random() * 0.01,
        });
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const spawnStar = () => {
      const x = Math.random() * (canvas.width * 0.8) + canvas.width * 0.2;
      const y = Math.random() * (canvas.height * 0.5);
      const angle = Math.PI / 4 + (Math.random() * 0.2 - 0.1);
      const speed = 14 + Math.random() * 10;
      const length = 140 + Math.random() * 120;
      const maxOpacity = 0.8 + Math.random() * 0.2;

      stars.push({
        x,
        y,
        length,
        speed,
        angle,
        opacity: 0,
        maxOpacity,
        fadeSpeed: 0.05,
        state: 'fading-in',
        trailColor: Math.random() > 0.4 ? '255, 255, 255' : '147, 197, 253',
      });
    };

    setTimeout(() => {
      spawnStar();
    }, 600);

    const updateAndDraw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Ambient twinkling stars
      for (const ts of twinkleStars) {
        ts.alpha += ts.alphaSpeed;
        if (ts.alpha > 0.8 || ts.alpha < 0.1) {
          ts.alphaSpeed = -ts.alphaSpeed;
        }

        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, ts.alpha)})`;
        ctx.beginPath();
        ctx.arc(ts.x, ts.y, ts.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Spawn shooting stars
      const now = Date.now();
      if (now - lastSpawn > 2200 + Math.random() * 2200) {
        spawnStar();
        lastSpawn = now;
      }

      // 3. Draw & update shooting stars
      stars = stars.filter((star) => {
        star.x -= Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;

        if (star.state === 'fading-in') {
          star.opacity += star.fadeSpeed;
          if (star.opacity >= star.maxOpacity) {
            star.state = 'fading-out';
          }
        } else {
          star.opacity -= star.fadeSpeed * 0.55;
        }

        if (star.opacity <= 0 || star.x < -star.length || star.y > canvas.height + star.length) {
          return false;
        }

        const tailX = star.x + Math.cos(star.angle) * star.length;
        const tailY = star.y - Math.sin(star.angle) * star.length;

        const gradient = ctx.createLinearGradient(star.x, star.y, tailX, tailY);
        gradient.addColorStop(0, `rgba(${star.trailColor}, ${star.opacity})`);
        gradient.addColorStop(0.25, `rgba(${star.trailColor}, ${star.opacity * 0.7})`);
        gradient.addColorStop(1, `rgba(${star.trailColor}, 0)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(tailX, tailY);
        ctx.stroke();

        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.arc(star.x, star.y, 2.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 255, 255, ${star.opacity * 0.9})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(star.x - 4, star.y);
        ctx.lineTo(star.x + 4, star.y);
        ctx.moveTo(star.x, star.y - 4);
        ctx.lineTo(star.x, star.y + 4);
        ctx.stroke();

        ctx.restore();

        return true;
      });

      animationFrameId = requestAnimationFrame(updateAndDraw);
    };

    updateAndDraw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [theme]);

  if (theme !== 'dark') return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-30 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* BMW i7 Car */}
      {mission && (
        <div
          className="fixed pointer-events-none z-40"
          style={{
            left: `${mission.ufoX}px`,
            top: `${mission.ufoY}px`,
            transform: `translate(-50%, ${mission.phase === 'alien-waving' ? '-100%' : 'calc(-100% + 15px)'}) scaleX(${mission.startX > window.innerWidth / 2 ? -1 : 1})`,
            opacity: mission.phase === 'alien-waving' ? 1 : 0,
            transition: 'all 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <div className="relative flex flex-col items-center drop-shadow-2xl">
            {/* BMW i7 Image */}
            <img 
              src="/bmw-i7.png" 
              alt="BMW i7" 
              className="w-[180px] h-auto object-contain" 
            />
          </div>
        </div>
      )}

      {/* 👽 High Quality Animated Character */}
      {mission && (
          <div
            className="fixed pointer-events-none z-50"
            style={{
              left: `${mission.alienX}px`,
              top: `${mission.alienY}px`,
              transform: `translate(-50%, ${mission.phase === 'alien-waving' ? '-100%' : 'calc(-100% + 15px)'})`,
              opacity: mission.phase === 'alien-waving' ? 1 : 0,
              transition: 'all 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
            }}
          >
            <div className="relative flex flex-col items-center">
              {/* Friendly Floating Greeting Bubble */}
              {mission.phase === 'alien-waving' && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/95 border border-cyan-400/80 shadow-[0_0_12px_rgba(56,189,248,0.4)] text-[11px] font-black text-cyan-300 flex items-center gap-1.5 whitespace-nowrap animate-in zoom-in-75 duration-300 z-50">
                  <span>👋</span>
                  <span>Hi {userName ? userName : 'there'}!</span>
                  <span className="text-amber-300">✨</span>
                </div>
              )}

              {/* Custom Character Waving Video */}
              <video 
                src="/charecter.webm" 
                autoPlay 
                loop 
                muted 
                playsInline
                className="w-auto h-[120px] drop-shadow-2xl" 
              />
            </div>
          </div>
        )}
    </div>
  );
};
