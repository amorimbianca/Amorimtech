import React, { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';
import IntroAnimation from './components/IntroAnimation';
import ParticleBackground from './components/ParticleBackground';
import CustomCursor from './components/CustomCursor';

// URL base da API FastAPI (suporta variável de ambiente VITE_API_BASE_URL no Vercel/Produção)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * App.jsx — Ponto de Entrada e Orquestrador Principal
 *
 * Responsabilidades:
 *  1. Efeito de gradiente orgânico interativo que segue o mouse (LERP)
 *  2. Verificação periódica de saúde da API via GET /api/metrics (health check)
 *  3. Controle da tela de introdução animada
 *  4. Renderização da camada de fundo (partículas), da janela de chat e do cursor customizado
 */
export default function App() {
  const [showIntro, setShowIntro] = useState(true);

  /** 'online' | 'offline' | 'checking' — compartilhado com ChatWindow e Header */
  const [apiStatus, setApiStatus] = useState('checking');

  // ── 1. Gradiente Interativo seguindo o cursor via LERP ──
  useEffect(() => {
    let targetX = 50;
    let targetY = 40;
    let currentX = 50;
    let currentY = 40;
    let animationFrameId;

    const handleMouseMove = (e) => {
      targetX = (e.clientX / window.innerWidth) * 100;
      targetY = (e.clientY / window.innerHeight) * 100;
    };

    const updateMouseGlow = () => {
      // Suavização orgânica (LERP) para movimento elegante
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      document.documentElement.style.setProperty('--mouse-x', `${currentX.toFixed(2)}%`);
      document.documentElement.style.setProperty('--mouse-y', `${currentY.toFixed(2)}%`);

      animationFrameId = requestAnimationFrame(updateMouseGlow);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrameId = requestAnimationFrame(updateMouseGlow);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // ── 2. Health Check periódico em GET /api/metrics ──
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/metrics`, {
          method: 'GET',
          // Timeout curto para não travar a UI
          signal: AbortSignal.timeout?.(5000),
        });
        setApiStatus(res.ok ? 'online' : 'offline');
      } catch {
        setApiStatus('offline');
      }
    };

    // Verifica imediatamente ao montar e a cada 15 segundos
    checkApiHealth();
    const interval = setInterval(checkApiHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Tela de Introdução Animada (exibida apenas uma vez) */}
      {showIntro && <IntroAnimation onComplete={() => setShowIntro(false)} />}

      {/* Camada de Fundo: Gradiente Orgânico & Partículas Interativas */}
      <ParticleBackground />

      {/*
        Janela Principal do Chatbot
        O ChatWindow recebe apiStatus (lido pelo Header.jsx para exibir a bolinha)
        e setApiStatus para atualizar quando a API responde/falha durante o chat.
      */}
      <ChatWindow apiStatus={apiStatus} setApiStatus={setApiStatus} />

      {/* Cursor Customizado com Glow Fluido */}
      <CustomCursor />
    </>
  );
}
