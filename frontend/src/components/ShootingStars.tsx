import React, { useEffect, useRef, useState } from 'react';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { ChromaKeyVideo } from './ChromaKeyVideo';

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
      // Disable animation on mobile devices
      if (window.innerWidth < 768) {
        scheduleNext(15000);
        return;
      }

      const brandContainer = document.getElementById('brotify-brand-container');
      
      if (!brandContainer) {
        scheduleNext(5000);
        return;
      }

      const brandRect = brandContainer.getBoundingClientRect();

      const createDustBurst = (rect: DOMRect, particleCount: number, durationMultiplier: number) => {
        const dustContainer = document.createElement('div');
        dustContainer.style.position = 'fixed';
        dustContainer.style.left = `${rect.left}px`;
        dustContainer.style.top = `${rect.top}px`;
        dustContainer.style.width = `${rect.width}px`;
        dustContainer.style.height = `${rect.height}px`;
        dustContainer.style.pointerEvents = 'none';
        dustContainer.style.zIndex = '1000';
        document.body.appendChild(dustContainer);

        for (let i = 0; i < particleCount; i++) {
          const particle = document.createElement('div');
          particle.style.position = 'absolute';
          particle.style.width = '4px';
          particle.style.height = '4px';
          // More vibrant dust colors matching UI
          particle.style.background = Math.random() > 0.6 ? '#0058bd' : (Math.random() > 0.5 ? '#38bdf8' : '#64748b');
          particle.style.left = `${Math.random() * 100}%`;
          particle.style.top = `${Math.random() * 100}%`;
          particle.style.borderRadius = '50%';
          particle.style.boxShadow = '0 0 4px rgba(0,88,189,0.5)';
          
          const angle = Math.random() * Math.PI * 2;
          const velocity = 30 + Math.random() * 70;
          const tx = Math.cos(angle) * velocity + 30; // Drift right more
          const ty = Math.sin(angle) * velocity - 40; // Float upwards
          
          particle.animate([
            { transform: 'translate(0, 0) scale(1)', opacity: 1, filter: 'blur(0px)' },
            { transform: `translate(${tx * 0.5}px, ${ty * 0.5}px) scale(0.8)`, opacity: 0.8, filter: 'blur(1px)', offset: 0.5 },
            { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0, filter: 'blur(2px)' }
          ], {
            duration: (2500 + Math.random() * 1500) * durationMultiplier, // Slower animation
            easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
            fill: 'forwards'
          });
          
          dustContainer.appendChild(particle);
        }

        setTimeout(() => {
          if (document.body.contains(dustContainer)) {
            document.body.removeChild(dustContainer);
          }
        }, 5000 * durationMultiplier);
      };

      // 1. Hide the original brand container instantly
      brandContainer.style.transition = 'none';
      brandContainer.style.opacity = '0';

      // 2. Explode logo into slow dust
      createDustBurst(brandRect, 180, 1.2);

      // 3. After 3.5 seconds (when dust clears), spawn the character animation
      timeouts.push(
        setTimeout(() => {
          // Position EXACTLY on top of the BROTIFY logo area
          const ufoX = brandRect.left + brandRect.width / 2;
          const ufoY = brandRect.bottom + 75; // Increased to ensure the greeting bubble doesn't clip on mobile
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
              // Dust burst for character appearing! Use an approximate bounding box for the character
              createDustBurst(new DOMRect(ufoX - 50, ufoY - 120, 100, 120), 100, 1.0);
            }, 250) // Short delay to let the DOM element mount first
          );

          // Phase 2: Fade out the character after waving
          timeouts.push(
            setTimeout(() => {
              setMission((prev) => (prev ? { ...prev, phase: 'flying-out' } : null));
              
              // Dust burst for character disappearing!
              createDustBurst(new DOMRect(ufoX - 50, ufoY - 120, 100, 120), 100, 1.0);

              // Restore the logo text smoothly after the character fades out
              setTimeout(() => {
                brandContainer.style.transition = 'opacity 1.5s ease-in-out';
                brandContainer.style.opacity = '1';
              }, 2000); // Wait longer for the character dust to settle before restoring logo
              
            }, 6000) // Stay longer (6s)
          );

          // Phase 3: Mission complete -> schedule next visit
          timeouts.push(
            setTimeout(() => {
              setMission(null);
              scheduleNext(15000 + Math.random() * 15000);
            }, 9000)
          );
        }, 3000) // 3 seconds wait for Thanos snap to clear completely
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
            transform: `translate(-50%, ${mission.phase === 'alien-waving' ? '-100%' : 'calc(-100% + 20px)'}) scaleX(${mission.startX > window.innerWidth / 2 ? -1 : 1}) scale(${mission.phase === 'alien-waving' ? 1 : 0.9})`,
            opacity: mission.phase === 'alien-waving' ? 1 : 0,
            filter: `blur(${mission.phase === 'alien-waving' ? '0px' : '10px'})`,
            transition: 'all 2.0s cubic-bezier(0.25, 1, 0.5, 1)',
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
              transform: `translate(-50%, ${mission.phase === 'alien-waving' ? '-100%' : 'calc(-100% + 20px)'}) scale(${mission.phase === 'alien-waving' ? 1 : 0.9})`,
              opacity: mission.phase === 'alien-waving' ? 1 : 0,
              filter: `blur(${mission.phase === 'alien-waving' ? '0px' : '10px'})`,
              transition: 'all 2.0s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
          >
            <div className="relative flex flex-col items-center">
              {/* Friendly Floating Greeting Bubble */}
              {mission.phase === 'alien-waving' && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/95 border border-cyan-400/80 shadow-[0_0_12px_rgba(56,189,248,0.4)] text-[11px] font-black text-cyan-300 flex items-center gap-1.5 whitespace-nowrap animate-in zoom-in-75 duration-300 z-50">
                  <span>👋</span>
                  <span>Hi {userName ? userName : 'there'}!</span>
                  <span className="text-amber-300">✨</span>
                </div>
              )}

              {/* Custom Character Waving Video (Canvas Chroma Key) */}
              <ChromaKeyVideo 
                videoSrc="/charecter.mp4" 
                className="w-auto h-[120px]" 
              />
            </div>
          </div>
        )}
    </div>
  );
};
