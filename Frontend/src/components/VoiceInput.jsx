import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, AlertCircle, Radio } from 'lucide-react';

/**
 * Componente VoiceInput - Entrada por Voz (Speech-to-Text)
 * Utiliza a Web Speech API nativa com compatibilidade para Desktop e Smartphones (Android/iOS).
 *
 * @param {Object} props
 * @param {Function} props.onTranscript - Callback que recebe a string de texto transcrita.
 * @param {boolean} [props.disabled=false] - Se o botão de microfone está desabilitado.
 */
export default function VoiceInput({ onTranscript, disabled = false }) {
  const [isListening, setIsListening] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // Verifica se o navegador suporta Web Speech API e contexto seguro
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
    }

    // Cleanup ao desmontar o componente
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Silêncio em caso de abort
        }
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Limpa mensagens de erro temporárias após 5 segundos
  const triggerError = (msg) => {
    setErrorMessage(msg);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setErrorMessage('');
    }, 5000);
  };

  const startListening = () => {
    setErrorMessage('');
    setInterimText('');

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      triggerError('Seu navegador não suporta reconhecimento de voz. Use o Google Chrome ou Safari.');
      return;
    }

    // Validação de contexto seguro (HTTPS ou Localhost) essencial para celulares
    const isSecure =
      window.isSecureContext ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.protocol === 'https:';

    if (!isSecure) {
      triggerError('O microfone no celular requer conexão HTTPS segura (use túnel Localtunnel/ngrok).');
      return;
    }

    try {
      // Aborta qualquer instância anterior para garantir inicialização limpa
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'pt-BR';
      recognition.continuous = false; // Em celulares, false oferece maior estabilidade
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let currentInterim = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            currentInterim += transcript;
          }
        }

        if (currentInterim) {
          setInterimText(currentInterim);
        }

        if (finalTranscript) {
          setIsListening(false);
          setInterimText('');
          if (onTranscript && typeof onTranscript === 'function') {
            onTranscript(finalTranscript.trim());
          }
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        setInterimText('');

        switch (event.error) {
          case 'not-allowed':
          case 'permission-denied':
            triggerError('Permissão de microfone negada. Toque no cadeado da barra de navegação e permita o microfone.');
            break;
          case 'no-speech':
            triggerError('Nenhuma fala foi detectada. Tente falar um pouco mais alto.');
            break;
          case 'network':
            triggerError('Erro de conexão no serviço de voz. Verifique sua internet.');
            break;
          case 'aborted':
            // Cancelamento intencional
            break;
          default:
            triggerError(`Erro no reconhecimento de voz (${event.error}).`);
            break;
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      triggerError(`Não foi possível iniciar o microfone: ${err.message || err}`);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        recognitionRef.current.abort();
      }
    }
    setIsListening(false);
    setInterimText('');
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
      {/* Botão Principal de Microfone */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled || !isSupported}
        className={`btn-mic ${isListening ? 'recording' : ''}`}
        title={
          !isSupported
            ? 'Reconhecimento de voz não suportado neste navegador'
            : isListening
            ? 'Clique para parar de gravar'
            : 'Falar por voz (Speech-to-Text)'
        }
        aria-label={isListening ? 'Parar gravação de voz' : 'Iniciar gravação de voz'}
      >
        {isListening ? (
          <Radio size={20} className="animate-pulse" />
        ) : !isSupported ? (
          <MicOff size={20} />
        ) : (
          <Mic size={20} />
        )}
      </button>

      {/* Indicador Flutuante quando estiver Ouvindo no Celular/Desktop */}
      {isListening && (
        <div
          style={{
            position: 'absolute',
            bottom: '120%',
            right: '0',
            backgroundColor: 'rgba(28, 6, 10, 0.96)',
            border: '1px solid var(--color-cotton-candy)',
            boxShadow: '0 8px 24px rgba(253, 155, 183, 0.35)',
            backdropFilter: 'blur(16px)',
            color: 'var(--color-pearl-beige)',
            padding: '10px 16px',
            borderRadius: '14px',
            fontSize: '0.85rem',
            whiteSpace: 'nowrap',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            animation: 'message-appear 0.25s ease-out forwards',
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-cotton-candy)',
              display: 'inline-block',
              animation: 'pulse-ring 1.2s infinite',
            }}
          />
          <div>
            <strong style={{ color: 'var(--color-cotton-candy)' }}>Ouvindo no celular...</strong> Fale agora!
            {interimText && (
              <div
                style={{
                  fontSize: '0.78rem',
                  color: 'var(--color-golden-apricot)',
                  marginTop: '4px',
                  fontStyle: 'italic',
                  maxWidth: '220px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                &ldquo;{interimText}&rdquo;
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerta Visual Amigável em caso de Erro de Permissão ou HTTPS */}
      {errorMessage && (
        <div
          style={{
            position: 'absolute',
            bottom: '120%',
            right: '0',
            backgroundColor: 'rgba(100, 13, 20, 0.96)',
            border: '1px solid var(--color-cotton-candy)',
            color: 'var(--color-pearl-beige)',
            padding: '10px 14px',
            borderRadius: '10px',
            fontSize: '0.8rem',
            maxWidth: '280px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.6)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            lineHeight: '1.4',
            animation: 'message-appear 0.25s ease-out forwards',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-cotton-candy)' }} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
