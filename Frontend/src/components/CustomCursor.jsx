import { useEffect, useRef, useState } from 'react';

/**
 * CustomCursor — Amorim Tech
 *
 * Inspirado no Kursor.js Type 1:
 * - Ponto central (5 px) alinhado ao cursor real, sem atraso.
 * - Anel externo (~32 px) com LERP 0.12 para atraso suave e orgânico.
 * - Paleta exclusiva Amorim Tech: Golden Apricot (#D8973C), Pearl Beige (#F3E6BD), Black Cherry (#640D14).
 * - Hover em interativos: expansão suave + glow dourado intensificado.
 * - pointer-events: none em todo o componente.
 * - Cursor nativo escondido globalmente via JS; restaurado no cleanup.
 * - Desativado automaticamente em telas touch (pointer: coarse).
 */
export default function CustomCursor() {
  const ringRef  = useRef(null);
  const dotRef   = useRef(null);
  const stateRef = useRef({
    targetX: -200, targetY: -200,
    ringX:   -200, ringY:   -200,
    rafId:    null,
  });
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    // Não ativa em touch
    if (window.matchMedia('(pointer: coarse)').matches) return;

    // Esconde o cursor nativo globalmente
    document.documentElement.style.cursor = 'none';

    const s = stateRef.current;
    const LERP = 0.12;

    const isInteractive = (el) => {
      if (!el) return false;
      if (['BUTTON', 'A', 'INPUT', 'TEXTAREA', 'SELECT', 'LABEL'].includes(el.tagName)) return true;
      if (el.closest('button, a, [role="button"], .quick-action-chip, .action-btn, .header-btn, .btn-mic, .btn-send')) return true;
      return false;
    };

    const onMouseMove = (e) => {
      s.targetX = e.clientX;
      s.targetY = e.clientY;

      if (!visible) {
        // Inicializa anel na posição do cursor para evitar "voo" inicial
        s.ringX = e.clientX;
        s.ringY = e.clientY;
        setVisible(true);
      }

      setHovered(isInteractive(e.target));
    };

    const onMouseLeave = () => setVisible(false);
    const onMouseEnter = () => setVisible(true);

    const loop = () => {
      s.ringX += (s.targetX - s.ringX) * LERP;
      s.ringY += (s.targetY - s.ringY) * LERP;

      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${s.ringX}px, ${s.ringY}px, 0) translate(-50%, -50%)`;
      }
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${s.targetX}px, ${s.targetY}px, 0) translate(-50%, -50%)`;
      }

      s.rafId = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove',    onMouseMove,   { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    s.rafId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove',    onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      cancelAnimationFrame(s.rafId);
      document.documentElement.style.cursor = '';
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const ringSize   = hovered ? 46 : 32;
  const ringBorder = hovered
    ? '1.8px solid rgba(216, 151, 60, 1)'
    : '1.5px solid rgba(216, 151, 60, 0.82)';
  const ringBg     = hovered ? 'rgba(216, 151, 60, 0.10)' : 'transparent';
  const ringGlow   = hovered
    ? '0 0 18px rgba(216, 151, 60, 0.55), 0 0 36px rgba(216, 151, 60, 0.18)'
    : '0 0 9px rgba(216, 151, 60, 0.32), 0 0 0 0.5px rgba(100, 13, 20, 0.22)';

  const dotSize    = hovered ? 7 : 5;
  const dotGlow    = hovered
    ? '0 0 10px rgba(216, 151, 60, 0.95)'
    : '0 0 6px rgba(216, 151, 60, 0.70)';

  const sizeTrans  = 'width 0.22s cubic-bezier(0.16,1,0.3,1), height 0.22s cubic-bezier(0.16,1,0.3,1)';
  const styleTrans = 'border 0.22s ease, background-color 0.22s ease, box-shadow 0.22s ease';

  return (
    <div
      aria-hidden="true"
      style={{
        position:      'fixed',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        999999,
        overflow:      'hidden',
        opacity:       visible ? 1 : 0,
        transition:    'opacity 0.20s ease',
      }}
    >
      {/* Anel externo — segue com atraso suave (LERP) */}
      <div
        ref={ringRef}
        style={{
          position:        'absolute',
          top:             0,
          left:            0,
          width:           `${ringSize}px`,
          height:          `${ringSize}px`,
          borderRadius:    '50%',
          border:          ringBorder,
          backgroundColor: ringBg,
          boxShadow:       ringGlow,
          transition:      `${sizeTrans}, ${styleTrans}`,
          pointerEvents:   'none',
          willChange:      'transform',
        }}
      />

      {/* Ponto central — segue o cursor real sem atraso */}
      <div
        ref={dotRef}
        style={{
          position:        'absolute',
          top:             0,
          left:            0,
          width:           `${dotSize}px`,
          height:          `${dotSize}px`,
          borderRadius:    '50%',
          backgroundColor: '#D8973C',
          boxShadow:       dotGlow,
          transition:      `width 0.18s ease, height 0.18s ease, box-shadow 0.18s ease`,
          pointerEvents:   'none',
          willChange:      'transform',
        }}
      />
    </div>
  );
}
