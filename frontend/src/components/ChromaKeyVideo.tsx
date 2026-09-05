import React, { useEffect, useRef } from 'react';

interface ChromaKeyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  videoSrc: string;
  width?: number;
  height?: number;
  className?: string;
}

export const ChromaKeyVideo: React.FC<ChromaKeyVideoProps> = ({ videoSrc, width, height, className, ...props }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let animationFrameId: number;

    const processFrame = () => {
      if (video.paused || video.ended) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const l = frame.data.length / 4;

      for (let i = 0; i < l; i++) {
        const r = frame.data[i * 4 + 0];
        const g = frame.data[i * 4 + 1];
        const b = frame.data[i * 4 + 2];

        // More robust green screen detection
        if (g > r * 1.2 && g > b * 1.2 && g > 60) {
           // Smooth falloff based on green intensity difference
           const diff = Math.min(g - r, g - b);
           if (diff > 40) {
              frame.data[i * 4 + 3] = 0; // Transparent
           } else {
              frame.data[i * 4 + 3] = Math.max(0, 255 - (diff * 6)); // Partial transparency
           }
        }
      }

      ctx.putImageData(frame, 0, 0);
      animationFrameId = requestAnimationFrame(processFrame);
    };

    video.addEventListener('play', () => {
      animationFrameId = requestAnimationFrame(processFrame);
    });

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`} style={{ width, height }}>
      <video
        ref={videoRef}
        src={videoSrc}
        className="hidden"
        crossOrigin="anonymous"
        playsInline
        muted
        autoPlay
        loop
        {...props}
      />
      <canvas
        ref={canvasRef}
        width={width || 200}
        height={height || 120}
        className="w-full h-full object-contain drop-shadow-2xl"
      />
    </div>
  );
};
