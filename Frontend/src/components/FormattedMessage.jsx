import React, { useMemo } from 'react';
import { marked } from 'marked';

// Configurações globais do parser Marked para formatações seguras e quebras de linha automáticas
marked.setOptions({
  gfm: true,
  breaks: true,
  pedantic: false,
});

/**
 * Componente FormattedMessage
 * Renderiza textos em Markdown gerados pelo Chatbot (títulos, negrito, listas, blocos de código e links).
 *
 * @param {Object} props
 * @param {string} props.content - Texto em formato Markdown a ser renderizado.
 * @param {string} [props.className=""] - Classes CSS adicionais.
 */
export default function FormattedMessage({ content = '', className = '' }) {
  const htmlContent = useMemo(() => {
    if (!content || typeof content !== 'string') {
      return '';
    }

    try {
      // Converte Markdown em HTML
      const rawHtml = marked.parse(content);
      return rawHtml;
    } catch (err) {
      console.error('Erro ao processar Markdown na mensagem:', err);
      // Fallback para texto plano caso o parser falhe
      return content;
    }
  }, [content]);

  return (
    <div
      className={`formatted-markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
}
