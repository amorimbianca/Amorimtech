import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bot,
  User,
  Send,
  ThumbsUp,
  ThumbsDown,
  Volume2,
  VolumeX,
  RefreshCw,
  BarChart2,
  HelpCircle,
  Download,
  Cpu,
  BookOpen,
  MessageSquare,
  Star,
} from 'lucide-react';
import VoiceInput from './VoiceInput';
import FormattedMessage from './FormattedMessage';
import Header from './Header';

// URL base da API FastAPI (em produção no Vercel usa a mesma origem '', em desenvolvimento usa import.meta.env ou localhost)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL !== undefined ? import.meta.env.VITE_API_BASE_URL : (import.meta.env.PROD ? '' : 'http://localhost:8000');

// ─────────────────────────────────────────────
// Mensagem de boas-vindas inicial
// ─────────────────────────────────────────────
const WELCOME_MESSAGE = {
  id: 'msg_welcome',
  sender: 'bot',
  text: '👋 **Olá! Seja muito bem-vindo à Amorim Tech Soluções Inteligentes!**\n\nEu sou o seu Assistente Virtual com IA e Voz. Estou aqui para tirar dúvidas sobre nossos produtos, planos, integrações de API e suporte técnico.\n\n💡 *Você pode digitar sua pergunta ou clicar no ícone de microfone para falar!*',
  source: 'greeting',
  confidence: 1.0,
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  suggestedActions: [
    'Quais são os planos e preços da Amorim Tech?',
    'Como funciona a IA Generativa com RAG?',
    'Como integrar a Amorim Tech via API?',
    'Como entrar em contato com o suporte técnico?',
  ],
  feedback: null,
};

// ─────────────────────────────────────────────
// Badge de origem da resposta
// ─────────────────────────────────────────────
function SourceBadge({ source }) {
  const map = {
    llm: { label: '⚡ LLM Generativa', cls: 'source-badge llm' },
    rag_lexical: { label: '📚 Base RAG', cls: 'source-badge rag_lexical' },
    greeting: { label: '👋 Saudação', cls: 'source-badge' },
    fallback: { label: '💡 Suporte Geral', cls: 'source-badge' },
  };
  const badge = map[source];
  if (!badge) return null;
  return <span className={badge.cls}>{badge.label}</span>;
}

// ─────────────────────────────────────────────
// Barra de Métricas no Topo
// ─────────────────────────────────────────────
function MetricsBar({ messages, metrics, apiStatus }) {
  const botMessages = messages.filter((m) => m.sender === 'bot' && m.source !== 'greeting');
  const totalMessages = messages.filter((m) => m.sender !== null).length;

  const positives = messages.filter((m) => m.feedback === 'positive').length;
  const negatives = messages.filter((m) => m.feedback === 'negative').length;
  const totalFeedback = positives + negatives;
  const localSatisfaction = totalFeedback > 0 ? Math.round((positives / totalFeedback) * 100) : null;

  const satisfaction = metrics?.taxa_satisfacao_percent ?? localSatisfaction ?? '—';

  const llmCount = botMessages.filter((m) => m.source === 'llm').length;
  const ragCount = botMessages.filter((m) => m.source === 'rag_lexical').length;
  const operationMode = llmCount >= ragCount ? 'LLM Ativa' : 'RAG Base de Conhecimento';
  const ModeIcon = llmCount >= ragCount ? Cpu : BookOpen;

  return (
    <div className="metrics-bar">
      <div className="metric-item" title="Total de mensagens trocadas na sessão">
        <MessageSquare size={14} />
        <span className="metric-value">{totalMessages}</span>
        <span className="metric-label">mensagens</span>
      </div>

      <div className="metric-separator" />

      <div className="metric-item" title="Taxa de satisfação baseada em feedbacks">
        <Star size={14} />
        <span className="metric-value">
          {satisfaction !== '—' ? `${satisfaction}%` : '—'}
        </span>
        <span className="metric-label">satisfação</span>
      </div>

      <div className="metric-separator" />

      <div className="metric-item" title={`Modo de operação atual: ${operationMode}`}>
        <ModeIcon size={14} />
        <span className="metric-value metric-mode">{operationMode}</span>
      </div>

      <div className="metric-separator" />
      <div className="metric-item" title={`Status do Backend: ${apiStatus.toUpperCase()}`}>
        <div className={`status-dot-mini ${apiStatus === 'online' ? 'online' : ''}`} />
        <span className="metric-label">{apiStatus === 'online' ? 'API Online' : 'API Offline'}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Modal de Métricas Detalhadas
// ─────────────────────────────────────────────
function MetricsModal({ metrics, onClose }) {
  if (!metrics) return null;
  return (
    <div className="metrics-modal-overlay" onClick={onClose}>
      <div
        className="metrics-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Indicadores da IA"
      >
        <div className="metrics-modal-header">
          <h3>
            <BarChart2 size={20} /> Indicadores da IA
          </h3>
          <button onClick={onClose} aria-label="Fechar modal de métricas">✕</button>
        </div>
        <div className="metrics-modal-body">
          <div className="metrics-row">
            <span>Total de Atendimentos:</span>
            <strong>{metrics.total_atendimentos ?? 0}</strong>
          </div>
          <div className="metrics-row">
            <span>Taxa de Satisfação:</span>
            <strong className="highlight">{metrics.taxa_satisfacao_percent ?? 0}%</strong>
          </div>
          <div className="metrics-row">
            <span>Feedbacks Positivos:</span>
            <span className="positive">👍 {metrics.detalhes?.positive_feedbacks ?? 0}</span>
          </div>
          <div className="metrics-row">
            <span>Feedbacks Negativos:</span>
            <span className="negative">👎 {metrics.detalhes?.negative_feedbacks ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Componente Principal: ChatWindow
// ─────────────────────────────────────────────
export default function ChatWindow({ apiStatus, setApiStatus }) {
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [showMetricsModal, setShowMetricsModal] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // ── Auto-scroll suave para a última mensagem ──
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // ── Buscar métricas do backend ──
  const fetchMetrics = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/metrics`);
      if (res.ok) setMetrics(await res.json());
    } catch {
      // silencia erros de rede
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // ── Enviar mensagem para POST /api/chat ──
  const handleSendMessage = useCallback(
    async (textToSend) => {
      const text = (textToSend || inputMessage).trim();
      if (!text || isLoading) return;

      const userMsg = {
        id: `msg_user_${Date.now()}`,
        sender: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInputMessage('');
      setIsLoading(true);

      try {
        const res = await fetch(`${API_BASE_URL}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: text, session_id: 'session_web_user' }),
        });

        if (!res.ok) throw new Error(`Erro ${res.status}`);

        const data = await res.json();
        setApiStatus?.('online');

        const botMsg = {
          id: data.message_id || `msg_bot_${Date.now()}`,
          sender: 'bot',
          text: data.reply,
          source: data.source || 'fallback',
          confidence: data.confidence ?? 1.0,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedActions: data.suggested_actions || [],
          feedback: null,
        };

        setMessages((prev) => [...prev, botMsg]);
        fetchMetrics();
      } catch (err) {
        console.error('Erro ao comunicar com a API:', err);
        setApiStatus?.('offline');

        setMessages((prev) => [
          ...prev,
          {
            id: `msg_err_${Date.now()}`,
            sender: 'bot',
            text: '⚠️ **Não foi possível conectar ao servidor backend.**\n\nPor favor, verifique se a API FastAPI está em execução na porta `8000` (`python main.py`).',
            source: 'error',
            confidence: 0.0,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestedActions: ['Tentar novamente'],
            feedback: null,
          },
        ]);
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    },
    [inputMessage, isLoading, fetchMetrics, setApiStatus]
  );

  // ── Feedback Like/Dislike → POST /api/feedback ──
  const handleFeedback = useCallback(
    async (messageId, isPositive) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, feedback: isPositive ? 'positive' : 'negative' }
            : msg
        )
      );
      try {
        await fetch(`${API_BASE_URL}/api/feedback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message_id: messageId, is_positive: isPositive }),
        });
        fetchMetrics();
      } catch (err) {
        console.error('Erro ao enviar feedback:', err);
      }
    },
    [fetchMetrics]
  );

  // ── Text-to-Speech (TTS) ──
  const handleSpeakMessage = useCallback(
    (messageId, text) => {
      if (!('speechSynthesis' in window)) {
        alert('Seu navegador não suporta síntese de voz (TTS).');
        return;
      }
      if (speakingMessageId === messageId) {
        window.speechSynthesis.cancel();
        setSpeakingMessageId(null);
        return;
      }
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*_#`~[\]]/g, '').replace(/\n+/g, '. ');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = 'pt-BR';
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.onstart = () => setSpeakingMessageId(messageId);
      utterance.onend = () => setSpeakingMessageId(null);
      utterance.onerror = () => setSpeakingMessageId(null);
      window.speechSynthesis.speak(utterance);
    },
    [speakingMessageId]
  );

  // ── Reiniciar Conversa ──
  const handleResetChat = useCallback(() => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setSpeakingMessageId(null);
    setMessages([
      {
        ...WELCOME_MESSAGE,
        id: `msg_welcome_${Date.now()}`,
        text: '👋 **Olá novamente! Como posso te ajudar agora?**',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  // ── Exportar Histórico como .txt ──
  const handleExportLog = useCallback(() => {
    const lines = messages.map((msg) => {
      const who = msg.sender === 'user' ? 'Você' : 'Amorim Tech AI';
      const clean = msg.text.replace(/[*_#`~[\]]/g, '').replace(/\n+/g, ' ');
      return `[${msg.timestamp}] ${who}: ${clean}`;
    });
    const content = [
      '=== Log de Atendimento — Amorim Tech AI ===',
      `Data: ${new Date().toLocaleString('pt-BR')}`,
      '',
      ...lines,
      '',
      '=== Fim do Atendimento ===',
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `atendimento_amorim_tech_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  // ── Tecla Enter para enviar ──
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Última mensagem com sugestões
  const lastMsg = messages[messages.length - 1];
  const hasSuggestions = lastMsg?.suggestedActions?.length > 0;

  // Botões de ação injetados no Header via prop
  const headerActions = (
    <>
      {/* Botão Exportar Log */}
      <button
        id="btn-export-log"
        type="button"
        className="header-btn"
        onClick={handleExportLog}
        title="Exportar histórico do atendimento (.txt)"
        aria-label="Exportar histórico do atendimento"
      >
        <Download size={15} />
        <span>Exportar</span>
      </button>

      {/* Botão de Métricas */}
      <button
        id="btn-metrics"
        type="button"
        className="header-btn"
        onClick={() => setShowMetricsModal((v) => !v)}
        title="Ver Indicadores e Métricas de Atendimento"
        aria-label="Ver métricas"
      >
        <BarChart2 size={16} color="var(--color-brown-red)" />
        <span>Métricas</span>
      </button>

      {/* Botão Nova Conversa */}
      <button
        id="btn-reset-chat"
        type="button"
        className="header-btn"
        onClick={handleResetChat}
        title="Reiniciar Atendimento"
        aria-label="Reiniciar atendimento"
      >
        <RefreshCw size={15} />
        <span>Limpar</span>
      </button>
    </>
  );

  return (
    <div className="app-container">
      {/* ── 1. Cabeçalho Institucional ── */}
      <Header apiStatus={apiStatus || 'checking'} actions={headerActions} />

      {/* ── 2. Barra de Métricas no Topo ── */}
      <MetricsBar messages={messages} metrics={metrics} apiStatus={apiStatus || 'checking'} />

      {/* ── 3. Modal de Métricas ── */}
      {showMetricsModal && (
        <MetricsModal metrics={metrics} onClose={() => setShowMetricsModal(false)} />
      )}

      {/* ── 4. Área de Rolagem de Mensagens ── */}
      <main
        className="messages-container"
        role="log"
        aria-live="polite"
        aria-label="Histórico de mensagens"
      >
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.sender}`}>
            <div className={`avatar ${msg.sender}`} aria-hidden="true">
              {msg.sender === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>

            <div style={{ maxWidth: '100%' }}>
              <div className="bubble">
                {msg.sender === 'bot' ? (
                  <FormattedMessage content={msg.text} />
                ) : (
                  <span>{msg.text}</span>
                )}
              </div>

              {/* Metadados */}
              <div className="message-meta">
                <span>{msg.timestamp}</span>
                {msg.sender === 'bot' && <SourceBadge source={msg.source} />}
                {msg.sender === 'bot' &&
                  msg.confidence !== undefined &&
                  msg.source !== 'greeting' && (
                    <span className="confidence-badge" title="Confiança da resposta">
                      {Math.round(msg.confidence * 100)}% conf.
                    </span>
                  )}
              </div>

              {/* Ações da mensagem do Bot */}
              {msg.sender === 'bot' && msg.source !== 'error' && (
                <div className="message-actions">
                  {/* Ouvir resposta (TTS) */}
                  <button
                    id={`btn-speak-${msg.id}`}
                    type="button"
                    className={`action-btn ${speakingMessageId === msg.id ? 'speaking' : ''}`}
                    onClick={() => handleSpeakMessage(msg.id, msg.text)}
                    title={speakingMessageId === msg.id ? 'Parar leitura' : 'Ouvir resposta'}
                    aria-label={
                      speakingMessageId === msg.id
                        ? 'Parar leitura por voz'
                        : 'Ouvir resposta com voz'
                    }
                  >
                    {speakingMessageId === msg.id ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>

                  {/* Like */}
                  <button
                    id={`btn-like-${msg.id}`}
                    type="button"
                    className={`action-btn ${msg.feedback === 'positive' ? 'active-like' : ''}`}
                    onClick={() => handleFeedback(msg.id, true)}
                    title="Avaliar positivamente (Útil)"
                    aria-label="Avaliar como útil"
                    aria-pressed={msg.feedback === 'positive'}
                  >
                    <ThumbsUp size={15} />
                  </button>

                  {/* Dislike */}
                  <button
                    id={`btn-dislike-${msg.id}`}
                    type="button"
                    className={`action-btn ${msg.feedback === 'negative' ? 'active-dislike' : ''}`}
                    onClick={() => handleFeedback(msg.id, false)}
                    title="Avaliar negativamente (Não ajudou)"
                    aria-label="Avaliar como não útil"
                    aria-pressed={msg.feedback === 'negative'}
                  >
                    <ThumbsDown size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Indicador animado "IA digitando..." */}
        {isLoading && (
          <div className="message-row bot" aria-live="polite" aria-label="IA digitando">
            <div className="avatar bot" aria-hidden="true">
              <Bot size={20} />
            </div>
            <div className="bubble typing-bubble">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}

        {/* Âncora para auto-scroll */}
        <div ref={messagesEndRef} />
      </main>

      {/* ── 5. Chips de Ações Rápidas (suggested_actions) ── */}
      {hasSuggestions && !isLoading && (
        <div
          className="quick-actions-container"
          role="list"
          aria-label="Perguntas sugeridas"
        >
          {lastMsg.suggestedActions.map((action, idx) => (
            <button
              key={idx}
              id={`chip-action-${idx}`}
              type="button"
              className="quick-action-chip"
              role="listitem"
              onClick={() => handleSendMessage(action)}
              disabled={isLoading}
              aria-label={`Pergunta sugerida: ${action}`}
            >
              <HelpCircle size={15} color="var(--color-golden-apricot)" />
              <span>{action}</span>
            </button>
          ))}
        </div>
      )}

      {/* ── 6. Barra de Entrada ── */}
      <footer className="chat-input-wrapper">
        <div className="input-bar">
          <input
            id="chat-input"
            ref={inputRef}
            type="text"
            placeholder="Digite sua dúvida ou fale pelo microfone..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            autoFocus
            aria-label="Campo de mensagem"
          />

          <div className="input-actions">
            {/* VoiceInput — preenche ou envia por voz */}
            <VoiceInput
              onTranscript={(transcribedText) => {
                setInputMessage(transcribedText);
                handleSendMessage(transcribedText);
              }}
              disabled={isLoading}
            />

            {/* Botão Enviar */}
            <button
              id="btn-send"
              type="button"
              className="btn-send"
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isLoading}
              title="Enviar mensagem"
              aria-label="Enviar mensagem"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
