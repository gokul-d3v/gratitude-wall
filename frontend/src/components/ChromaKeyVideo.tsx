import React, { useEffect, useRef } from 'react';

interface ChromaKeyVideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  videoSrc: string;
  className?: string;
}

export const ChromaKeyVideo: React.FC<ChromaKeyVideoProps> = ({ videoSrc, className, ...props }) => {
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

      // Sync canvas resolution to the native video resolution for high quality
      if (video.videoWidth > 0 && (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight)) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      if (canvas.width === 0 || canvas.height === 0) {
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

        // High quality green screen detection with anti-aliasing and spill suppression
        if (g > r * 1.05 && g > b * 1.05 && g > 40) {
           const diff = Math.min(g - r, g - b);
           if (diff > 25) {
              frame.data[i * 4 + 3] = 0; // Fully transparent
           } else {
              // Anti-aliasing soft edge
              const alpha = Math.max(0, 255 - (diff * 10));
              frame.data[i * 4 + 3] = alpha;
              
              // Color spill suppression: reduce green tint on edges
              if (alpha > 0) {
                 frame.data[i * 4 + 1] = (r + b) / 2; // Neutralize green to gray
              }
           }
        }
      }

      ctx.putImageData(frame, 0, 0);
      animationFrameId = requestAnimationFrame(processFrame);
    };

    video.addEventListener('play', () => {
      animationFrameId = requestAnimationFrame(processFrame);
    });

    if (!video.paused) {
      animationFrameId = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
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
        className="w-full h-full object-contain drop-shadow-2xl"
      />
    </div>
  );
};
