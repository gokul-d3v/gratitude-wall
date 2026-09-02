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
      const cards = Array.from(document.querySelectorAll<HTMLElement>('.sticky-note'));

      if (cards.length === 0) {
        scheduleNext(5000);
        return;
      }

      // Filter visible cards in viewport
      const visibleCards = cards.filter((card) => {
        const r = card.getBoundingClientRect();
        return (
          r.top >= 80 &&
          r.bottom <= window.innerHeight - 40 &&
          r.left >= 40 &&
          r.right <= window.innerWidth - 40
        );
      });

      const targetPool = visibleCards.length > 0 ? visibleCards : cards;
      const targetCard = targetPool[Math.floor(Math.random() * targetPool.length)];

      if (!targetCard) {
        scheduleNext(5000);
        return;
      }

      const cardRect = targetCard.getBoundingClientRect();

      const ufoX = cardRect.left + cardRect.width / 2;
      const ufoY = Math.max(30, cardRect.top - 85);
      const alienX = cardRect.left + cardRect.width / 2;
      const alienY = cardRect.top - 20;

      const fromLeft = Math.random() > 0.5;
      const startX = fromLeft ? -140 : window.innerWidth + 140;
      const startY = Math.max(-50, ufoY - 100);

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

      // Phase 1: UFO arrives and hovers above card
      timeouts.push(
        setTimeout(() => {
          setMission((prev) => (prev ? { ...prev, phase: 'hovering' } : null));
        }, 1500)
      );

      // Phase 2: Alien descends down the glowing tractor beam
      timeouts.push(
        setTimeout(() => {
          setMission((prev) => (prev ? { ...prev, phase: 'alien-descending' } : null));
        }, 2100)
      );

      // Phase 3: Alien lands on top of the card and waves happily to everyone!
      timeouts.push(
        setTimeout(() => {
          setMission((prev) => (prev ? { ...prev, phase: 'alien-waving' } : null));
        }, 2800)
      );

      // Phase 4: Alien beams back up into the ship
      timeouts.push(
        setTimeout(() => {
          setMission((prev) => (prev ? { ...prev, phase: 'alien-ascending' } : null));
        }, 6000)
      );

      // Phase 5: UFO zooms away into the galaxy
      timeouts.push(
        setTimeout(() => {
          setMission((prev) => (prev ? { ...prev, phase: 'flying-out' } : null));
        }, 6900)
      );

      // Phase 6: Mission complete -> schedule next visit
      timeouts.push(
        setTimeout(() => {
          setMission(null);
          scheduleNext(15000 + Math.random() * 15000);
        }, 8400)
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

      {/* UFO Spaceship */}
      {mission && (
        <div
          className="fixed pointer-events-none transition-all duration-700 ease-out z-40"
          style={{
            left:
              mission.phase === 'flying-in'
                ? `${mission.startX}px`
                : mission.phase === 'flying-out'
                ? `${mission.ufoX + 750}px`
                : `${mission.ufoX}px`,
            top:
              mission.phase === 'flying-in'
                ? `${mission.startY}px`
                : mission.phase === 'flying-out'
                ? `${mission.ufoY - 350}px`
                : `${mission.ufoY}px`,
            transform: `translate(-50%, -50%) ${
              mission.phase === 'flying-out'
                ? 'rotate(18deg) scale(0.85)'
                : mission.phase === 'flying-in'
                ? 'rotate(-8deg)'
                : 'rotate(0deg)'
            }`,
            opacity: mission.phase === 'flying-out' ? 0.2 : 1,
            transitionDuration:
              mission.phase === 'flying-in'
                ? '1.4s'
                : mission.phase === 'flying-out'
                ? '1.3s'
                : '0.4s',
          }}
        >
          <div className="relative ufo-glow flex flex-col items-center">
            {/* UFO Saucer SVG */}
            <svg
              width="88"
              height="46"
              viewBox="0 0 88 46"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Glass Cockpit Dome */}
              <ellipse
                cx="44"
                cy="18"
                rx="17"
                ry="14"
                fill="#38bdf8"
                fillOpacity="0.45"
                stroke="#7dd3fc"
                strokeWidth="1.2"
              />

              {/* Alien inside dome when flying */}
              {(mission.phase === 'flying-in' || mission.phase === 'flying-out') && (
                <>
                  <ellipse cx="44" cy="17" rx="6" ry="7" fill="#4ade80" />
                  <ellipse cx="41.8" cy="15.5" rx="1.6" ry="2.4" transform="rotate(-15 41.8 15.5)" fill="#0f172a" />
                  <ellipse cx="46.2" cy="15.5" rx="1.6" ry="2.4" transform="rotate(15 46.2 15.5)" fill="#0f172a" />
                  <circle cx="42" cy="15" r="0.5" fill="#ffffff" />
                  <circle cx="46.4" cy="15" r="0.5" fill="#ffffff" />
                </>
              )}

              {/* Metallic Hull */}
              <ellipse
                cx="44"
                cy="25"
                rx="40"
                ry="11"
                fill="url(#ufoSaucerMetal)"
                stroke="#94a3b8"
                strokeWidth="1"
              />

              {/* Saucer Lower Base */}
              <path
                d="M18 25C18 30.5 29 34.5 44 34.5C59 34.5 70 30.5 70 25"
                fill="#334155"
                stroke="#64748b"
                strokeWidth="1"
              />

              {/* Blinking Anti-Gravity Thruster Lights */}
              <circle cx="16" cy="25" r="2.2" fill="#f43f5e" className="animate-pulse" />
              <circle cx="30" cy="27.5" r="2.5" fill="#38bdf8" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
              <circle cx="44" cy="28.5" r="2.8" fill="#facc15" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
              <circle cx="58" cy="27.5" r="2.5" fill="#38bdf8" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
              <circle cx="72" cy="25" r="2.2" fill="#a855f7" className="animate-pulse" style={{ animationDelay: '0.8s' }} />

              <defs>
                <linearGradient id="ufoSaucerMetal" x1="5" y1="15" x2="83" y2="35" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f8fafc" />
                  <stop offset="0.5" stopColor="#94a3b8" />
                  <stop offset="1" stopColor="#475569" />
                </linearGradient>
              </defs>
            </svg>

            {/* Glowing Downward Tractor Elevator Beam */}
            {mission.phase !== 'flying-in' && mission.phase !== 'flying-out' && (
              <div
                className="ufo-beam w-24 h-28 -mt-2 bg-gradient-to-b from-cyan-400/50 via-emerald-400/25 to-transparent animate-pulse"
                style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)' }}
              />
            )}
          </div>
        </div>
      )}

      {/* 👽 High Quality Animated Alien Character */}
      {mission &&
        (mission.phase === 'alien-descending' ||
          mission.phase === 'alien-waving' ||
          mission.phase === 'alien-ascending') && (
          <div
            className="fixed pointer-events-none z-50 transition-all duration-500 ease-out"
            style={{
              left: `${mission.alienX}px`,
              top: `${mission.alienY}px`,
              transform: `translate(-50%, -50%) ${
                mission.phase === 'alien-descending'
                  ? 'translateY(-35px) scale(0.6) opacity-60'
                  : mission.phase === 'alien-ascending'
                  ? 'translateY(-40px) scale(0.6) opacity-0'
                  : 'translateY(0) scale(1) opacity-100'
              }`,
              transitionDuration:
                mission.phase === 'alien-descending' || mission.phase === 'alien-ascending'
                  ? '0.7s'
                  : '0.4s',
            }}
          >
            <div className="relative flex flex-col items-center alien-body-bounce">
              {/* Friendly Floating Greeting Bubble */}
              {mission.phase === 'alien-waving' && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/95 border border-cyan-400/80 shadow-[0_0_12px_rgba(56,189,248,0.4)] text-[11px] font-black text-cyan-300 flex items-center gap-1.5 whitespace-nowrap animate-in zoom-in-75 duration-300 z-50">
                  <span>👋</span>
                  <span>Hi {userName ? userName : 'there'}!</span>
                  <span className="text-amber-300">✨</span>
                </div>
              )}

              {/* Detailed Animated Alien Vector SVG with Fluid Hand Wave */}
              <svg width="54" height="60" viewBox="0 0 54 60" fill="none">
                <defs>
                  <linearGradient id="alienSkin" x1="16" y1="10" x2="36" y2="32" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#86efac" />
                    <stop offset="0.6" stopColor="#4ade80" />
                    <stop offset="1" stopColor="#22c55e" />
                  </linearGradient>
                  <linearGradient id="alienSuit" x1="17" y1="30" x2="35" y2="46" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#38bdf8" />
                    <stop offset="1" stopColor="#0284c7" />
                  </linearGradient>
                </defs>

                {/* Antenna Stalk */}
                <path d="M26 12C26 8 29 5 29 3" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" />
                {/* Glowing Antenna Orb */}
                <circle cx="29" cy="3" r="3.2" fill="#38bdf8" className="alien-antenna" stroke="#7dd3fc" strokeWidth="1" />

                {/* Big Expressive Alien Head */}
                <ellipse cx="26" cy="20" rx="12.5" ry="13.5" fill="url(#alienSkin)" stroke="#16a34a" strokeWidth="1" />

                {/* Big Glossy Space Eyes */}
                <ellipse cx="21" cy="18.5" rx="3.6" ry="5.4" transform="rotate(-15 21 18.5)" fill="#0f172a" />
                <ellipse cx="31" cy="18.5" rx="3.6" ry="5.4" transform="rotate(15 31 18.5)" fill="#0f172a" />

                {/* Multi-reflection Eye Highlights (Cute/Alive look) */}
                <circle cx="21.6" cy="16.8" r="1.4" fill="#ffffff" />
                <circle cx="20" cy="20.5" r="0.7" fill="#ffffff" />
                <circle cx="31.6" cy="16.8" r="1.4" fill="#ffffff" />
                <circle cx="30" cy="20.5" r="0.7" fill="#ffffff" />

                {/* Cute Cheeks */}
                <circle cx="17" cy="23.5" r="1.8" fill="#f43f5e" fillOpacity="0.4" />
                <circle cx="35" cy="23.5" r="1.8" fill="#f43f5e" fillOpacity="0.4" />

                {/* Happy Warm Smile */}
                <path d="M23.5 24.5C24.8 26.5 27.2 26.5 28.5 24.5" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />

                {/* Spacesuit Collar */}
                <path d="M19 32C22 34 30 34 33 32" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" />

                {/* Spacesuit Body */}
                <rect x="18" y="32" width="16" height="14" rx="4" fill="url(#alienSuit)" stroke="#0369a1" strokeWidth="1" />

                {/* Star Badge on Chest */}
                <circle cx="26" cy="37" r="2.4" fill="#facc15" />
                <path d="M26 35.2L26.6 36.4L27.8 36.4L26.8 37.2L27.2 38.4L26 37.5L24.8 38.4L25.2 37.2L24.2 36.4L25.4 36.4Z" fill="#ffffff" />

                {/* Suit Belt */}
                <rect x="18" y="41" width="16" height="2.5" fill="#0c4a6e" />
                <rect x="24" y="41" width="4" height="2.5" fill="#38bdf8" />

                {/* Legs */}
                <rect x="19.5" y="46" width="4.5" height="8" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />
                <rect x="28" y="46" width="4.5" height="8" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="0.8" />

                {/* Left Arm (Resting on hip) */}
                <path d="M18 34L12 40" stroke="#4ade80" strokeWidth="3.2" strokeLinecap="round" />
                <circle cx="11.5" cy="40.5" r="2.2" fill="#4ade80" />

                {/* Right Arm: Natural Shoulder Base */}
                <path d="M34 34L40 26" stroke="#4ade80" strokeWidth="3.2" strokeLinecap="round" />

                {/* Fluid Waving Forearm & Cute Open Palm 👋 */}
                <g className="alien-waving-hand">
                  <path d="M40 26L46 16" stroke="#4ade80" strokeWidth="3.2" strokeLinecap="round" />
                  
                  {/* Palm */}
                  <circle cx="46.5" cy="14.5" r="2.8" fill="#4ade80" />
                  {/* Fingers */}
                  <path d="M46.5 12L47 9" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M48.5 13L50.5 11" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" />
                  <path d="M44.5 13.5L42.5 12" stroke="#4ade80" strokeWidth="1.8" strokeLinecap="round" />
                </g>
              </svg>
            </div>
          </div>
        )}
    </div>
  );
};
