import React, { useEffect, useRef } from 'react';

/**
 * Componente ParticleBackground (Amorim Tech)
 * Camada independente e altamente performática de background animado com:
 * 1. Gradiente orgânico luminoso com iluminação ambiente interativa;
 * 2. Densidade aprimorada de partículas de neve digital em 3 camadas de profundidade;
 * 3. Física de deslocamento de ar suave e amortecida quando o cursor se aproxima.
 */
export default function ParticleBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Ajuste dinâmico de redimensionamento
    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Posição do Mouse e Interpolação (LERP)
    const mouse = {
      x: -1000,
      y: -1000,
      targetX: -1000,
      targetY: -1000,
      radius: 140, // Raio de influência da força do ar do cursor
      isActive: false,
    };

    let mouseTimeout;
    const handleMouseMove = (e) => {
      mouse.targetX = e.clientX;
      mouse.targetY = e.clientY;
      mouse.isActive = true;

      // Atualiza variáveis CSS para a iluminação ambiente
      const xPercent = (e.clientX / width) * 100;
      const yPercent = (e.clientY / height) * 100;
      document.documentElement.style.setProperty('--mouse-x', `${xPercent.toFixed(2)}%`);
      document.documentElement.style.setProperty('--mouse-y', `${yPercent.toFixed(2)}%`);

      clearTimeout(mouseTimeout);
      mouseTimeout = setTimeout(() => {
        mouse.isActive = false;
      }, 3000);
    };

    const handleMouseLeave = () => {
      mouse.isActive = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);

    // Paleta de partículas luminosas Amorim Tech
    const particleColors = [
      { r: 243, g: 230, b: 189 }, // Pearl Beige (#F3E6BD)
      { r: 253, g: 155, b: 183 }, // Cotton Candy (#FD9BB7)
      { r: 216, g: 151, b: 60 },  // Golden Apricot (#D8973C)
      { r: 255, g: 248, b: 235 }, // Pure Pearl White
    ];

    // Quantidade aumentada de partículas para efeito de neve digital imersivo
    const particleCount = Math.min(Math.floor((width * height) / 8500), 160);
    const particles = [];

    // Criação em 3 camadas de profundidade
    for (let i = 0; i < particleCount; i++) {
      const color = particleColors[Math.floor(Math.random() * particleColors.length)];
      // Camada 0: Fundo (pequeno, lento, suave) | Camada 1: Médio | Camada 2: Primeiro plano (maior, mais rápido, brilho)
      const depth = Math.random();
      let radius, speedY, baseOpacity;

      if (depth < 0.45) {
        // Camada distante
        radius = Math.random() * 0.9 + 0.8;
        speedY = Math.random() * 0.4 + 0.25;
        baseOpacity = Math.random() * 0.35 + 0.2;
      } else if (depth < 0.82) {
        // Camada intermediária
        radius = Math.random() * 1.2 + 1.6;
        speedY = Math.random() * 0.6 + 0.45;
        baseOpacity = Math.random() * 0.4 + 0.38;
      } else {
        // Camada frontal (destaque)
        radius = Math.random() * 1.6 + 2.6;
        speedY = Math.random() * 0.85 + 0.65;
        baseOpacity = Math.random() * 0.4 + 0.55;
      }

      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius,
        speedY,
        speedX: Math.random() * 0.4 - 0.2, // Deriva horizontal suave
        vx: 0,
        vy: 0,
        swayAngle: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.018 + 0.006,
        swayAmplitude: Math.random() * 0.65 + 0.25,
        baseOpacity,
        color,
        isForeground: depth >= 0.82,
      });
    }

    // Loop de Animação e Renderização em Canvas 60fps
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Interpolação suave do mouse (easing)
      if (mouse.isActive) {
        mouse.x += (mouse.targetX - mouse.x) * 0.14;
        mouse.y += (mouse.targetY - mouse.y) * 0.14;
      } else {
        mouse.x += (-1000 - mouse.x) * 0.06;
        mouse.y += (-1000 - mouse.y) * 0.06;
      }

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // 1. Oscilação natural contínua da neve
        p.swayAngle += p.swaySpeed;
        const sway = Math.sin(p.swayAngle) * p.swayAmplitude;

        // 2. Deslocamento de ar interativo com o mouse
        if (mouse.isActive) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < mouse.radius && dist > 0) {
            const force = (1 - dist / mouse.radius) * 2.2;
            const angle = Math.atan2(dy, dx);
            p.vx += Math.cos(angle) * force * 0.8;
            p.vy += Math.sin(angle) * force * 0.8;
          }
        }

        // 3. Amortecimento da força (Damping)
        p.vx *= 0.92;
        p.vy *= 0.92;

        // 4. Atualização de posições
        p.x += p.speedX + sway + p.vx;
        p.y += p.speedY + p.vy;

        // 5. Reposicionamento infinito contínuo
        if (p.y > height + 10) {
          p.y = -10;
          p.x = Math.random() * width;
          p.vx = 0;
          p.vy = 0;
        } else if (p.y < -15) {
          p.y = height + 5;
        }

        if (p.x > width + 10) {
          p.x = -10;
        } else if (p.x < -10) {
          p.x = width + 10;
        }

        // 6. Desenho com brilho suave e efeito de neve luminosa
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.baseOpacity})`;

        if (p.isForeground) {
          ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.6)`;
          ctx.shadowBlur = 6;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      clearTimeout(mouseTimeout);
    };
  }, []);

  return (
    <div
      className="background-canvas-wrapper"
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {/* Luz ambiente interativa seguindo o cursor com gradiente luminoso */}
      <div className="mouse-interactive-light" />

      {/* Blobs orgânicos em gradiente suave com movimento contínuo */}
      <div className="ambient-blob blob-1" />
      <div className="ambient-blob blob-2" />
      <div className="ambient-blob blob-3" />

      {/* Canvas de partículas de neve digital */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'block',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
