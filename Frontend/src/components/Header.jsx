import React from 'react';
import { Bot, Sparkles, Cpu } from 'lucide-react';

/**
 * Header.jsx — Cabeçalho Institucional da Amorim Tech
 *
 * Props:
 *  - apiStatus: 'online' | 'offline' | 'checking'
 *  - actions:   nó React opcional com botões de ação (Exportar, Métricas, Limpar)
 */
export default function Header({ apiStatus = 'checking', actions }) {
  // Texto e cor da bolinha de status
  const statusConfig = {
    online:   { label: 'API Online',    color: 'var(--status-online)',  pulse: true  },
    offline:  { label: 'API Offline',   color: 'var(--status-offline)', pulse: false },
    checking: { label: 'Conectando…',   color: 'var(--status-warning)', pulse: true  },
  };
  const status = statusConfig[apiStatus] ?? statusConfig.checking;

  return (
    <header className="chat-header" role="banner">
      {/* ── Logotipo & Identidade da Marca ── */}
      <div className="header-brand">
        {/* Ícone com gradiente institucional */}
        <div className="brand-icon" aria-hidden="true">
          <Bot size={26} />
        </div>

        <div className="brand-info">
          <h1>
            Amorim Tech AI{' '}
            <Sparkles size={18} color="var(--color-golden-apricot)" aria-hidden="true" />
          </h1>

          {/* Identificação do curso / produto */}
          <p className="brand-course">
            <Cpu size={12} aria-hidden="true" />
            <span>Chatbot Full-Stack com IA &amp; Voz</span>
          </p>
        </div>
      </div>

      {/* ── Área Direita: Status + Ações ── */}
      <div className="header-actions">
        {/* Bolinha de status de conexão com a API */}
        <div
          id="api-status-indicator"
          className="status-indicator-wrapper"
          title={`Backend FastAPI: ${status.label}`}
          aria-live="polite"
          aria-label={`Status da API: ${status.label}`}
        >
          <div className="status-dot-container">
            <div
              className={`status-dot ${apiStatus === 'online' ? 'online' : ''} ${apiStatus === 'checking' ? 'checking' : ''}`}
              style={{ backgroundColor: status.color }}
            />
          </div>
          <span>{status.label}</span>
        </div>

        {/* Slot para botões de ação injetados pelo ChatWindow */}
        {actions}
      </div>
    </header>
  );
}
