import React, { useEffect, useRef } from 'react';

/**
 * Ultra-Smooth Liquid Mesh Gradient Background (Stripe / Apple Music style).
 * Tuned with faster, more noticeable multi-harmonic liquid movement and higher
 * contrast between the glowing crimson pools and deep obsidian valleys.
 */
export default function FluidBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let t = 0;

    /**
     * Uses a 0.5x internal resolution buffer for buttery 120fps performance
     * and ultra-smooth Gaussian blending when scaled to full viewport.
     */
    const handleResize = () => {
      canvas.width = Math.max(480, Math.floor(window.innerWidth * 0.5));
      canvas.height = Math.max(320, Math.floor(window.innerHeight * 0.5));
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // 6 organic liquid currents with faster frequencies and wider travel range
    const liquidCurrents = [
      {
        xBase: 0.25,
        yBase: 0.3,
        xAmp: 0.34,
        yAmp: 0.3,
        freqX: 0.013,
        freqY: 0.011,
        radiusRatio: 0.42,
        phase: 0,
        innerColor: 'rgba(239, 68, 68, 0.65)',
        midColor: 'rgba(185, 28, 28, 0.28)',
      },
      {
        xBase: 0.75,
        yBase: 0.28,
        xAmp: 0.32,
        yAmp: 0.34,
        freqX: -0.011,
        freqY: 0.014,
        radiusRatio: 0.45,
        phase: 1.8,
        innerColor: 'rgba(220, 38, 38, 0.6)',
        midColor: 'rgba(127, 29, 29, 0.26)',
      },
      {
        xBase: 0.5,
        yBase: 0.5,
        xAmp: 0.38,
        yAmp: 0.28,
        freqX: 0.015,
        freqY: -0.012,
        radiusRatio: 0.38,
        phase: 3.4,
        innerColor: 'rgba(248, 113, 113, 0.5)',
        midColor: 'rgba(153, 27, 27, 0.22)',
      },
      {
        xBase: 0.28,
        yBase: 0.75,
        xAmp: 0.33,
        yAmp: 0.26,
        freqX: -0.012,
        freqY: -0.01,
        radiusRatio: 0.44,
        phase: 4.9,
        innerColor: 'rgba(190, 18, 60, 0.56)',
        midColor: 'rgba(76, 5, 25, 0.24)',
      },
      {
        xBase: 0.74,
        yBase: 0.72,
        xAmp: 0.31,
        yAmp: 0.31,
        freqX: 0.0115,
        freqY: 0.0135,
        radiusRatio: 0.42,
        phase: 2.6,
        innerColor: 'rgba(220, 38, 38, 0.58)',
        midColor: 'rgba(69, 10, 10, 0.24)',
      },
      {
        xBase: 0.48,
        yBase: 0.38,
        xAmp: 0.36,
        yAmp: 0.32,
        freqX: -0.0095,
        freqY: 0.0155,
        radiusRatio: 0.35,
        phase: 5.7,
        innerColor: 'rgba(244, 63, 94, 0.45)',
        midColor: 'rgba(136, 19, 55, 0.18)',
      },
    ];

    /**
     * Renders one frame of the screen-blended liquid mesh gradient.
     */
    const renderSmoothMesh = () => {
      t += 1;
      const { width, height } = canvas;
      const maxDim = Math.max(width, height);

      // Deep obsidian base canvas
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#050508';
      ctx.fillRect(0, 0, width, height);

      // Additive screen blending makes intersecting crimson pools fuse like real liquid
      ctx.globalCompositeOperation = 'screen';

      liquidCurrents.forEach((blob) => {
        const cx =
          width *
          (blob.xBase +
            Math.sin(t * blob.freqX + blob.phase) * blob.xAmp +
            Math.cos(t * (blob.freqX * 0.65) - blob.phase) * (blob.xAmp * 0.35));

        const cy =
          height *
          (blob.yBase +
            Math.cos(t * blob.freqY + blob.phase) * blob.yAmp +
            Math.sin(t * (blob.freqY * 0.75) + blob.phase) * (blob.yAmp * 0.35));

        // Noticeable breathing pulse on the liquid radius
        const radius =
          maxDim *
          blob.radiusRatio *
          (1 + 0.18 * Math.sin(t * 0.022 + blob.phase));

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        grad.addColorStop(0, blob.innerColor);
        grad.addColorStop(0.45, blob.midColor);
        grad.addColorStop(1, 'rgba(5, 5, 8, 0)');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = window.requestAnimationFrame(renderSmoothMesh);
    };

    renderSmoothMesh();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#050508]"
    >
      {/* Blurred Liquid Mesh Canvas */}
      <canvas
        ref={canvasRef}
        className="w-full h-full block scale-110 blur-2xl opacity-100"
      />

      {/* Soft Ambient Vignette to anchor foreground contrast */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_42%,rgba(5,5,8,0.48)_100%)]" />
    </div>
  );
}
