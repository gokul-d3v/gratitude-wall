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

interface UFOFlight {
  id: number;
  top: number;
  direction: 'ltr' | 'rtl';
  duration: number;
}

interface LaserStrike {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export const ShootingStars: React.FC = () => {
  const { theme } = useThemeStore();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ufoElementRef = useRef<HTMLDivElement | null>(null);

  const [currentUFO, setCurrentUFO] = useState<UFOFlight | null>(null);
  const [laser, setLaser] = useState<LaserStrike | null>(null);

  // Periodic Alien UFO Flights + Card Laser Shoot
  useEffect(() => {
    if (theme !== 'dark') {
      setCurrentUFO(null);
      setLaser(null);
      return;
    }

    let ufoTimer: any;
    let shootTimer: any;

    const launchUFO = () => {
      const direction: 'ltr' | 'rtl' = Math.random() > 0.5 ? 'ltr' : 'rtl';
      const duration = 12 + Math.random() * 5; // 12-17s cruise
      const top = 10 + Math.random() * 45; // 10% to 55% screen height

      const flight: UFOFlight = {
        id: Date.now(),
        top,
        direction,
        duration,
      };

      setCurrentUFO(flight);

      // Mid-flight shoot target post (between 3.5s and 6s into the flight)
      const shootDelay = 3500 + Math.random() * 2500;
      shootTimer = setTimeout(() => {
        shootRandomPost();
      }, shootDelay);

      // Clear when flight is done and schedule next
      setTimeout(() => {
        setCurrentUFO(null);
        scheduleNext();
      }, (duration + 1) * 1000);
    };

    const shootRandomPost = () => {
      // Find all available like heart containers that are not currently burning
      const heartContainers = Array.from(
        document.querySelectorAll<HTMLElement>('.like-heart-container:not(.burning-heart)')
      );

      if (heartContainers.length === 0) return;

      // Filter visible hearts in viewport
      const visibleHearts = heartContainers.filter((heart) => {
        const r = heart.getBoundingClientRect();
        return r.top >= 0 && r.bottom <= window.innerHeight && r.left >= 0 && r.right <= window.innerWidth;
      });

      const targetPool = visibleHearts.length > 0 ? visibleHearts : heartContainers;
      const targetHeart = targetPool[Math.floor(Math.random() * targetPool.length)];

      if (!targetHeart) return;

      const heartRect = targetHeart.getBoundingClientRect();
      const targetCenterX = heartRect.left + 10;
      const targetCenterY = heartRect.top + 10;

      // Determine UFO current position
      let ufoX = window.innerWidth * 0.5;
      let ufoY = window.innerHeight * 0.25;

      if (ufoElementRef.current) {
        const ufoRect = ufoElementRef.current.getBoundingClientRect();
        ufoX = ufoRect.left + ufoRect.width / 2;
        ufoY = ufoRect.bottom;
      }

      // 1. Fire Laser Beam directly at the Heart
      setLaser({
        id: Date.now(),
        startX: ufoX,
        startY: ufoY,
        endX: targetCenterX,
        endY: targetCenterY,
      });

      // 2. Set Heart on Fire with animated burning flames!
      targetHeart.classList.add('burning-heart');

      // 3. Clear laser visual after 550ms
      setTimeout(() => {
        setLaser(null);
      }, 550);

      // 4. Extinguish flame after 6 seconds
      setTimeout(() => {
        targetHeart.classList.remove('burning-heart');
      }, 6000);
    };

    const scheduleNext = () => {
      const delay = 14000 + Math.random() * 16000; // Next flight in 14-30s
      ufoTimer = setTimeout(launchUFO, delay);
    };

    // First UFO launches 3.5s after dark mode is active
    ufoTimer = setTimeout(launchUFO, 3500);

    return () => {
      clearTimeout(ufoTimer);
      clearTimeout(shootTimer);
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
      const count = Math.floor((canvas.width * canvas.height) / 20000);
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

        // Radiant star head
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
        ctx.shadowColor = 'rgba(255, 255, 255, 1)';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        ctx.arc(star.x, star.y, 2.2, 0, Math.PI * 2);
        ctx.fill();

        // 4-point sparkle flare
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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />

      {/* Dynamic Laser Strike */}
      {laser && (
        <svg className="fixed inset-0 w-full h-full pointer-events-none z-30">
          <defs>
            <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#f43f5e" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <filter id="laserGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Core High-Energy Plasma Laser */}
          <line
            x1={laser.startX}
            y1={laser.startY}
            x2={laser.endX}
            y2={laser.endY}
            stroke="url(#laserGrad)"
            strokeWidth="5"
            strokeLinecap="round"
            filter="url(#laserGlow)"
            className="laser-beam"
          />
          <line
            x1={laser.startX}
            y1={laser.startY}
            x2={laser.endX}
            y2={laser.endY}
            stroke="#ffffff"
            strokeWidth="2"
            strokeLinecap="round"
            className="laser-beam"
          />

          {/* Impact Explosion Burst */}
          <circle
            cx={laser.endX}
            cy={laser.endY}
            r="28"
            fill="none"
            stroke="#f97316"
            strokeWidth="4"
            className="laser-impact"
          />
          <circle
            cx={laser.endX}
            cy={laser.endY}
            r="12"
            fill="#ffffff"
            className="laser-impact"
          />
        </svg>
      )}

      {/* Floating Alien Spaceship */}
      {currentUFO && (
        <div
          key={currentUFO.id}
          ref={ufoElementRef}
          className={`fixed pointer-events-none z-20 ${
            currentUFO.direction === 'ltr' ? 'ufo-ltr' : 'ufo-rtl'
          }`}
          style={{
            top: `${currentUFO.top}%`,
            animationDuration: `${currentUFO.duration}s`,
          }}
        >
          <div className="relative ufo-glow flex flex-col items-center">
            <svg
              width="74"
              height="38"
              viewBox="0 0 74 38"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Glass Dome */}
              <ellipse
                cx="37"
                cy="15"
                rx="14"
                ry="11"
                fill="#38bdf8"
                fillOpacity="0.4"
                stroke="#7dd3fc"
                strokeWidth="1"
              />

              {/* Little Green Alien Head */}
              <ellipse cx="37" cy="14.5" rx="5" ry="6" fill="#4ade80" />
              <ellipse
                cx="35"
                cy="13.2"
                rx="1.4"
                ry="2.2"
                transform="rotate(-15 35 13.2)"
                fill="#0f172a"
              />
              <ellipse
                cx="39"
                cy="13.2"
                rx="1.4"
                ry="2.2"
                transform="rotate(15 39 13.2)"
                fill="#0f172a"
              />
              <circle cx="35.3" cy="12.7" r="0.5" fill="#ffffff" />
              <circle cx="39.3" cy="12.7" r="0.5" fill="#ffffff" />

              {/* Metallic Saucer Body */}
              <ellipse
                cx="37"
                cy="21"
                rx="34"
                ry="9"
                fill="url(#ufoSaucerGrad)"
                stroke="#94a3b8"
                strokeWidth="0.8"
              />

              {/* Saucer Lower Base */}
              <path
                d="M14 21C14 25.5 24 29.5 37 29.5C50 29.5 60 25.5 60 21"
                fill="#334155"
                stroke="#64748b"
                strokeWidth="0.8"
              />

              {/* Blinking Anti-Gravity Thruster Lights */}
              <circle cx="15" cy="21" r="2" fill="#f43f5e" className="animate-pulse" />
              <circle
                cx="26"
                cy="23"
                r="2.2"
                fill="#38bdf8"
                className="animate-pulse"
                style={{ animationDelay: '0.2s' }}
              />
              <circle
                cx="37"
                cy="24"
                r="2.5"
                fill="#facc15"
                className="animate-pulse"
                style={{ animationDelay: '0.4s' }}
              />
              <circle
                cx="48"
                cy="23"
                r="2.2"
                fill="#38bdf8"
                className="animate-pulse"
                style={{ animationDelay: '0.6s' }}
              />
              <circle
                cx="59"
                cy="21"
                r="2"
                fill="#a855f7"
                className="animate-pulse"
                style={{ animationDelay: '0.8s' }}
              />

              <defs>
                <linearGradient
                  id="ufoSaucerGrad"
                  x1="3"
                  y1="12"
                  x2="71"
                  y2="30"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#e2e8f0" />
                  <stop offset="0.5" stopColor="#94a3b8" />
                  <stop offset="1" stopColor="#475569" />
                </linearGradient>
              </defs>
            </svg>

            {/* Glowing Downward Light Beam */}
            <div
              className="ufo-beam w-16 h-28 -mt-2 bg-gradient-to-b from-cyan-400/40 via-emerald-400/15 to-transparent"
              style={{ clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)' }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
