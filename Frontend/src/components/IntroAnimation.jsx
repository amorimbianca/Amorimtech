import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

/**
 * Componente IntroAnimation (Amorim Tech)
 * Apresentação cinematográfica baseada no conceito convertToPath() do GSAP.
 * Anima os traçados vetoriais (SVG paths) das letras da marca com degradês luminosos
 * da paleta oficial e transita suavemente para o Chatbot.
 *
 * @param {Object} props
 * @param {Function} props.onComplete - Callback acionado quando a intro termina.
 */
export default function IntroAnimation({ onComplete }) {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const pathGroupRef = useRef(null);
  const subtitleRef = useRef(null);
  const lightRayRef = useRef(null);
  const badgeRef = useRef(null);
  const [isRendered, setIsRendered] = useState(true);

  useEffect(() => {
    // Detecção de preferência de redução de movimento do usuário
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ctx = gsap.context(() => {
      const paths = pathGroupRef.current ? pathGroupRef.current.querySelectorAll('.letter-path') : [];

      // Inicialização dos comprimentos de traçado para o efeito convertToPath / stroke drawing
      paths.forEach((path) => {
        const length = path.getTotalLength ? path.getTotalLength() : 300;
        gsap.set(path, {
          strokeDasharray: length + 2,
          strokeDashoffset: length + 2,
          fillOpacity: 0,
          opacity: 0,
        });
      });

      if (prefersReducedMotion) {
        // Versão simplificada para acessibilidade
        const quickTl = gsap.timeline({
          onComplete: () => {
            setIsRendered(false);
            if (onComplete) onComplete();
          },
        });

        quickTl
          .to(containerRef.current, { opacity: 1, duration: 0.3 })
          .to(paths, { opacity: 1, fillOpacity: 1, strokeDashoffset: 0, duration: 0.5, stagger: 0.03 })
          .to(subtitleRef.current, { opacity: 1, duration: 0.4 })
          .to(containerRef.current, { opacity: 0, duration: 0.5, delay: 0.4 });

        return;
      }

      // =======================================================================
      // Timeline Principal GSAP — Sequência Elegante & Tecnológica
      // =======================================================================
      const masterTl = gsap.timeline({
        onComplete: () => {
          setIsRendered(false);
          if (onComplete) onComplete();
        },
      });

      // 1. Entrada suave da tela de introdução
      masterTl
        .fromTo(
          containerRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.45, ease: 'power2.out' }
        )
        // 2. Construção dos traçados SVG (efeito convertToPath / stroke drawing)
        .fromTo(
          paths,
          { opacity: 0, strokeDashoffset: (i, target) => (target.getTotalLength ? target.getTotalLength() + 2 : 300) },
          {
            opacity: 1,
            strokeDashoffset: 0,
            duration: 1.35,
            stagger: {
              each: 0.07,
              from: 'start',
            },
            ease: 'power3.inOut',
          },
          '-=0.1'
        )
        // 3. Preenchimento luminoso com degradê da marca
        .to(
          paths,
          {
            fillOpacity: 1,
            strokeWidth: 1.5,
            duration: 0.65,
            stagger: 0.03,
            ease: 'power2.out',
          },
          '-=0.45'
        )
        // 4. Revelação do subtítulo e badge institucional
        .fromTo(
          badgeRef.current,
          { opacity: 0, y: -10, scale: 0.9 },
          { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.5)' },
          '-=0.4'
        )
        .fromTo(
          subtitleRef.current,
          { opacity: 0, y: 12, letterSpacing: '3px' },
          { opacity: 1, y: 0, letterSpacing: '6px', duration: 0.7, ease: 'power2.out' },
          '-=0.35'
        )
        // 5. Feixe de luz passando pelas letras (shimmer sweep)
        .fromTo(
          lightRayRef.current,
          { xPercent: -120, opacity: 0 },
          { xPercent: 180, opacity: 0.85, duration: 0.95, ease: 'power2.inOut' },
          '-=0.25'
        )
        // 6. Destaque estático confortável
        .to({}, { duration: 0.45 })
        // 7. Saída elegante com fade out e leve desfoque para revelar o chatbot
        .to(
          containerRef.current,
          {
            opacity: 0,
            scale: 1.03,
            filter: 'blur(10px)',
            duration: 0.75,
            ease: 'power3.inOut',
          }
        );
    }, containerRef);

    return () => ctx.revert();
  }, [onComplete]);

  if (!isRendered) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#FAF4E5',
        backgroundImage: `
          radial-gradient(circle at 50% 45%, rgba(253, 155, 183, 0.4) 0%, rgba(243, 230, 189, 0.6) 40%, transparent 75%),
          radial-gradient(circle at 85% 85%, rgba(216, 151, 60, 0.25) 0%, transparent 50%),
          radial-gradient(circle at 15% 15%, rgba(173, 40, 49, 0.15) 0%, transparent 50%)
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        overflow: 'hidden',
        cursor: 'default',
        userSelect: 'none',
        pointerEvents: 'auto',
      }}
    >
      {/* Elementos Orgânicos de Fundo da Intro */}
      <div
        style={{
          position: 'absolute',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(253, 155, 183, 0.5) 0%, rgba(243, 230, 189, 0.2) 70%, transparent 80%)',
          filter: 'blur(60px)',
          top: '20%',
          left: '30%',
          pointerEvents: 'none',
          animation: 'float-blob-1 14s infinite alternate ease-in-out',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(216, 151, 60, 0.35) 0%, transparent 75%)',
          filter: 'blur(55px)',
          bottom: '15%',
          right: '25%',
          pointerEvents: 'none',
          animation: 'float-blob-2 16s infinite alternate ease-in-out',
        }}
      />

      {/* Conteúdo Central da Animação */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          maxWidth: '92vw',
          width: '880px',
          padding: '20px',
        }}
      >
        {/* Badge Institucional Superior */}
        <div
          ref={badgeRef}
          style={{
            padding: '6px 18px',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.85)',
            border: '1.5px solid rgba(216, 151, 60, 0.35)',
            boxShadow: '0 4px 16px rgba(216, 151, 60, 0.18)',
            fontSize: '0.78rem',
            fontWeight: 700,
            color: '#AD2831',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            marginBottom: '24px',
            backdropFilter: 'blur(10px)',
          }}
        >
          ✨ Plataforma Inteligente
        </div>

        {/* SVG com Paths Precisos das Letras de AMORIM TECH (Efeito convertToPath) */}
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
          <svg
            ref={svgRef}
            viewBox="0 0 900 160"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '160px',
              display: 'block',
              filter: 'drop-shadow(0 8px 24px rgba(100, 13, 20, 0.12))',
            }}
          >
            <defs>
              {/* Degradê Oficial das Letras */}
              <linearGradient id="amorimBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D8973C" />
                <stop offset="45%" stopColor="#FD9BB7" />
                <stop offset="100%" stopColor="#AD2831" />
              </linearGradient>

              {/* Degradê do Traçado Dourado/Vinho */}
              <linearGradient id="amorimStrokeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#D8973C" />
                <stop offset="50%" stopColor="#AD2831" />
                <stop offset="100%" stopColor="#640D14" />
              </linearGradient>

              {/* Shimmer Light Mask */}
              <linearGradient id="shimmerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="white" stopOpacity="0" />
                <stop offset="50%" stopColor="white" stopOpacity="0.75" />
                <stop offset="100%" stopColor="white" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grupo de Letras em Vetores SVG (Paths) */}
            <g
              ref={pathGroupRef}
              stroke="url(#amorimStrokeGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="url(#amorimBrandGrad)"
            >
              {/* === PALAVRA 1: AMORIM === */}
              {/* Letra A */}
              <path
                className="letter-path"
                d="M 35,135 L 68,25 L 101,135 M 48,96 L 88,96"
              />
              {/* Letra M */}
              <path
                className="letter-path"
                d="M 120,135 L 120,25 L 148,88 L 176,25 L 176,135"
              />
              {/* Letra O */}
              <path
                className="letter-path"
                d="M 232,25 C 262,25 278,48 278,80 C 278,112 262,135 232,135 C 202,135 186,112 186,80 C 186,48 202,25 232,25 Z"
              />
              {/* Letra R */}
              <path
                className="letter-path"
                d="M 298,135 L 298,25 L 332,25 C 354,25 364,36 364,56 C 364,74 352,84 330,84 L 298,84 M 328,84 L 364,135"
              />
              {/* Letra I */}
              <path
                className="letter-path"
                d="M 388,25 L 388,135"
              />
              {/* Letra M */}
              <path
                className="letter-path"
                d="M 412,135 L 412,25 L 440,88 L 468,25 L 468,135"
              />

              {/* === SEPARADOR TECNOLÓGICO === */}
              <path
                className="letter-path"
                d="M 498,35 L 498,125"
                strokeWidth="2"
                stroke="#D8973C"
                opacity="0.6"
              />

              {/* === PALAVRA 2: TECH === */}
              {/* Letra T */}
              <path
                className="letter-path"
                d="M 526,25 L 576,25 M 551,25 L 551,135"
              />
              {/* Letra E */}
              <path
                className="letter-path"
                d="M 632,25 L 594,25 L 594,135 L 632,135 M 594,80 L 626,80"
              />
              {/* Letra C */}
              <path
                className="letter-path"
                d="M 698,42 C 688,30 674,25 658,25 C 628,25 612,48 612,80 C 612,112 628,135 658,135 C 674,135 688,130 698,118"
              />
              {/* Letra H */}
              <path
                className="letter-path"
                d="M 718,25 L 718,135 M 764,25 L 764,135 M 718,80 L 764,80"
              />
            </g>
          </svg>

          {/* Efeito de Feixe de Luz (Light Shimmer) */}
          <div
            ref={lightRayRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '60%',
              height: '100%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.75) 50%, transparent 100%)',
              transform: 'skewX(-25deg)',
              pointerEvents: 'none',
              opacity: 0,
            }}
          />
        </div>

        {/* Subtítulo Tecnológico com Espaçamento Dinâmico */}
        <p
          ref={subtitleRef}
          style={{
            marginTop: '22px',
            fontFamily: 'var(--font-heading)',
            fontSize: '0.92rem',
            fontWeight: 700,
            color: '#640D14',
            textTransform: 'uppercase',
            textAlign: 'center',
            letterSpacing: '4px',
            opacity: 0,
          }}
        >
          IA Generativa & Atendimento Conversacional
        </p>
      </div>
    </div>
  );
}
