import React, { useEffect, useRef, useState } from 'react';
import { useThemeStore } from '../store/useThemeStore';

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
  | 'alien-out'
  | 'shooting'
  | 'alien-in'
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
  heartX: number;
  heartY: number;
}

export const ShootingStars: React.FC = () => {
  const { theme } = useThemeStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [mission, setMission] = useState<AlienMission | null>(null);
  const [isLaserFiring, setIsLaserFiring] = useState<boolean>(false);

  // Cinematic Alien Ship & Alien Landing Mission
  useEffect(() => {
    if (theme !== 'dark') {
      setMission(null);
      setIsLaserFiring(false);
      return;
    }

    let missionTimer: any;
    const timeouts: any[] = [];

    const startAlienMission = () => {
      // Find all visible like-heart buttons
      const heartContainers = Array.from(
        document.querySelectorAll<HTMLElement>('.like-heart-container:not(.burning-heart)')
      );

      if (heartContainers.length === 0) {
        scheduleNext(5000);
        return;
      }

      // Filter visible cards in viewport
      const visibleHearts = heartContainers.filter((heart) => {
        const r = heart.getBoundingClientRect();
        return (
          r.top >= 80 &&
          r.bottom <= window.innerHeight - 40 &&
          r.left >= 40 &&
          r.right <= window.innerWidth - 40
        );
      });

      const targetPool = visibleHearts.length > 0 ? visibleHearts : heartContainers;
      const targetHeart = targetPool[Math.floor(Math.random() * targetPool.length)];

      if (!targetHeart) {
        scheduleNext(5000);
        return;
      }

      const card = targetHeart.closest<HTMLElement>('.sticky-note');
      if (!card) {
        scheduleNext(5000);
        return;
      }

      const cardRect = card.getBoundingClientRect();
      const heartRect = targetHeart.getBoundingClientRect();

      const ufoX = cardRect.left + cardRect.width / 2;
      const ufoY = Math.max(30, cardRect.top - 85);
      const alienX = cardRect.left + cardRect.width / 2;
      const alienY = cardRect.top - 22;
      const heartX = heartRect.left + 10;
      const heartY = heartRect.top + 10;

      const fromLeft = Math.random() > 0.5;
      const startX = fromLeft ? -120 : window.innerWidth + 120;
      const startY = Math.max(-50, ufoY - 120);

      const newMission: AlienMission = {
        id: Date.now(),
        phase: 'flying-in',
        startX,
        startY,
        ufoX,
        ufoY,
        alienX,
        alienY,
        heartX,
        heartY,
      };

      setMission(newMission);

      // Timeline Phase 1: UFO Arrives & Hovers
      timeouts.push(
        setTimeout(() => {
          setMission((prev) => (prev ? { ...prev, phase: 'hovering' } : null));
        }, 1600)
      );

      // Timeline Phase 2: Alien steps out on tractor beam
      timeouts.push(
        setTimeout(() => {
          setMission((prev) => (prev ? { ...prev, phase: 'alien-out' } : null));
        }, 2200)
      );

      // Timeline Phase 3: Alien Aims & Shoots the Heart with Laser Blaster!
      timeouts.push(
        setTimeout(() => {
          setMission((prev) => (prev ? { ...prev, phase: 'shooting' } : null));
          setIsLaserFiring(true);

          // Ignite Heart with Burning Fire effect!
          targetHeart.classList.add('burning-heart');

          // Laser pulse duration
          timeouts.push(
            setTimeout(() => {
              setIsLaserFiring(false);
            }, 600)
          );

          // Extinguish burning heart after 6.5 seconds
          timeouts.push(
            setTimeout(() => {
              targetHeart.classList.remove('burning-heart');
            }, 6500)
          );
        }, 3400)
      );

      // Timeline Phase 4: Alien Beams back into Ship
      timeouts.push(
        setTimeout(() => {
          setMission((prev) => (prev ? { ...prev, phase: 'alien-in' } : null));
        }, 4600)
      );

      // Timeline Phase 5: UFO flies away into space
      timeouts.push(
        setTimeout(() => {
          setMission((prev) => (prev ? { ...prev, phase: 'flying-out' } : null));
        }, 5500)
      );

      // Timeline Phase 6: Clean up and schedule next mission
      timeouts.push(
        setTimeout(() => {
          setMission(null);
          scheduleNext(16000 + Math.random() * 16000);
        }, 7200)
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

      {/* Laser Blaster Beam */}
      {mission && isLaserFiring && (
        <svg className="fixed inset-0 w-full h-full pointer-events-none z-50">
          <defs>
            <linearGradient id="alienLaserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4ade80" />
              <stop offset="50%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#f43f5e" />
            </linearGradient>
            <filter id="laserRayGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Plasma Laser Bolt */}
          <line
            x1={mission.alienX + 8}
            y1={mission.alienY + 14}
            x2={mission.heartX}
            y2={mission.heartY}
            stroke="url(#alienLaserGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            filter="url(#laserRayGlow)"
            className="laser-beam"
          />
          <line
            x1={mission.alienX + 8}
            y1={mission.alienY + 14}
            x2={mission.heartX}
            y2={mission.heartY}
            stroke="#ffffff"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="laser-beam"
          />

          {/* Impact Explosion Ring on Heart */}
          <circle
            cx={mission.heartX}
            cy={mission.heartY}
            r="20"
            fill="none"
            stroke="#f97316"
            strokeWidth="3.5"
            className="laser-impact"
          />
          <circle
            cx={mission.heartX}
            cy={mission.heartY}
            r="8"
            fill="#ffffff"
            className="laser-impact"
          />
        </svg>
      )}

      {/* Alien UFO Spaceship */}
      {mission && (
        <div
          className="fixed pointer-events-none transition-all duration-700 ease-out z-40"
          style={{
            left:
              mission.phase === 'flying-in'
                ? `${mission.startX}px`
                : mission.phase === 'flying-out'
                ? `${mission.ufoX + 800}px`
                : `${mission.ufoX}px`,
            top:
              mission.phase === 'flying-in'
                ? `${mission.startY}px`
                : mission.phase === 'flying-out'
                ? `${mission.ufoY - 400}px`
                : `${mission.ufoY}px`,
            transform: `translate(-50%, -50%) ${
              mission.phase === 'flying-out'
                ? 'rotate(20deg) scale(0.8)'
                : mission.phase === 'flying-in'
                ? 'rotate(-8deg)'
                : 'rotate(0deg)'
            }`,
            opacity: mission.phase === 'flying-out' ? 0.3 : 1,
            transitionDuration:
              mission.phase === 'flying-in'
                ? '1.5s'
                : mission.phase === 'flying-out'
                ? '1.2s'
                : '0.4s',
          }}
        >
          <div className="relative ufo-glow flex flex-col items-center">
            {/* UFO Saucer SVG */}
            <svg
              width="86"
              height="44"
              viewBox="0 0 86 44"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Glass Dome */}
              <ellipse
                cx="43"
                cy="17"
                rx="16"
                ry="13"
                fill="#38bdf8"
                fillOpacity="0.45"
                stroke="#7dd3fc"
                strokeWidth="1.2"
              />

              {/* Alien Inside Dome (Only when not stepped out) */}
              {(mission.phase === 'flying-in' || mission.phase === 'flying-out') && (
                <>
                  <ellipse cx="43" cy="16" rx="5.5" ry="6.5" fill="#4ade80" />
                  <ellipse cx="40.8" cy="14.5" rx="1.6" ry="2.4" transform="rotate(-15 40.8 14.5)" fill="#0f172a" />
                  <ellipse cx="45.2" cy="14.5" rx="1.6" ry="2.4" transform="rotate(15 45.2 14.5)" fill="#0f172a" />
                  <circle cx="41.1" cy="14" r="0.5" fill="#ffffff" />
                  <circle cx="45.5" cy="14" r="0.5" fill="#ffffff" />
                </>
              )}

              {/* Saucer Upper Metallic Hull */}
              <ellipse
                cx="43"
                cy="24"
                rx="38"
                ry="10"
                fill="url(#saucerMetalGrad)"
                stroke="#94a3b8"
                strokeWidth="1"
              />

              {/* Saucer Lower Base */}
              <path
                d="M17 24C17 29 28 33 43 33C58 33 69 29 69 24"
                fill="#334155"
                stroke="#64748b"
                strokeWidth="1"
              />

              {/* Blinking Anti-Gravity Thruster Lights */}
              <circle cx="16" cy="24" r="2.2" fill="#f43f5e" className="animate-pulse" />
              <circle cx="29" cy="26" r="2.5" fill="#38bdf8" className="animate-pulse" style={{ animationDelay: '0.2s' }} />
              <circle cx="43" cy="27" r="2.8" fill="#facc15" className="animate-pulse" style={{ animationDelay: '0.4s' }} />
              <circle cx="57" cy="26" r="2.5" fill="#38bdf8" className="animate-pulse" style={{ animationDelay: '0.6s' }} />
              <circle cx="70" cy="24" r="2.2" fill="#a855f7" className="animate-pulse" style={{ animationDelay: '0.8s' }} />

              <defs>
                <linearGradient id="saucerMetalGrad" x1="5" y1="14" x2="81" y2="34" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#f1f5f9" />
                  <stop offset="0.5" stopColor="#94a3b8" />
                  <stop offset="1" stopColor="#475569" />
                </linearGradient>
              </defs>
            </svg>

            {/* Glowing Downward Tractor Elevator Beam */}
            {mission.phase !== 'flying-in' && mission.phase !== 'flying-out' && (
              <div
                className="ufo-beam w-24 h-28 -mt-2.5 bg-gradient-to-b from-cyan-400/50 via-emerald-400/25 to-transparent animate-pulse"
                style={{ clipPath: 'polygon(30% 0%, 70% 0%, 100% 100%, 0% 100%)' }}
              />
            )}
          </div>
        </div>
      )}

      {/* 👽 Cute Alien Stepping Out with Ray Gun Blaster */}
      {mission &&
        (mission.phase === 'alien-out' ||
          mission.phase === 'shooting' ||
          mission.phase === 'alien-in') && (
          <div
            className="fixed pointer-events-none z-50 transition-all duration-500 ease-out"
            style={{
              left: `${mission.alienX}px`,
              top: `${mission.alienY}px`,
              transform: `translate(-50%, -50%) ${
                mission.phase === 'alien-in'
                  ? 'translateY(-40px) scale(0.7) opacity-0'
                  : 'translateY(0) scale(1) opacity-100'
              }`,
            }}
          >
            <div className="relative flex flex-col items-center">
              {/* Animated Raygun Muzzle Sparkle during Shooting */}
              {mission.phase === 'shooting' && (
                <div className="absolute top-4 -right-3 text-sm animate-ping">⚡</div>
              )}

              {/* Alien Character SVG */}
              <svg width="42" height="46" viewBox="0 0 42 46" fill="none">
                {/* Alien Head */}
                <ellipse cx="21" cy="14" rx="9" ry="11" fill="#4ade80" stroke="#22c55e" strokeWidth="1" />
                {/* Cute Big Alien Eyes */}
                <ellipse cx="17.5" cy="12.5" rx="2.5" ry="3.8" transform="rotate(-15 17.5 12.5)" fill="#0f172a" />
                <ellipse cx="24.5" cy="12.5" rx="2.5" ry="3.8" transform="rotate(15 24.5 12.5)" fill="#0f172a" />
                <circle cx="18" cy="11.5" r="0.9" fill="#ffffff" />
                <circle cx="25" cy="11.5" r="0.9" fill="#ffffff" />
                {/* Alien Smile */}
                <path d="M19 18C20 19.5 22 19.5 23 18" stroke="#15803d" strokeWidth="1" strokeLinecap="round" />

                {/* Spacesuit Body */}
                <rect x="14" y="24" width="14" height="12" rx="4" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                {/* Belt */}
                <rect x="14" y="31" width="14" height="2.5" fill="#0369a1" />

                {/* Legs */}
                <rect x="15" y="36" width="4" height="7" rx="2" fill="#0284c7" />
                <rect x="23" y="36" width="4" height="7" rx="2" fill="#0284c7" />

                {/* Left Arm Holding Ray Gun */}
                <path d="M14 26L8 30" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" />
                
                {/* Right Arm Aiming Sci-Fi Ray Gun towards the Heart */}
                <path d="M28 26L34 31" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" />

                {/* Sci-Fi Ray Gun Blaster */}
                <rect x="32" y="28" width="9" height="4.5" rx="1.5" fill="#f43f5e" stroke="#e11d48" strokeWidth="0.8" />
                <rect x="39" y="29.2" width="3" height="2" fill="#38bdf8" />
                <circle cx="35" cy="30.2" r="1" fill="#facc15" />
              </svg>
            </div>
          </div>
        )}
    </div>
  );
};
