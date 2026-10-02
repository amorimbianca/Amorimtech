# 💬 Prompt 09: Janela Principal do Chatbot (`ChatWindow.jsx`)

* **Projeto:** 01 — Chatbot de Suporte Full-Stack (AfesuTech)
* **Camada:** Camada 4 — Interface & Experiência do Usuário (UX)
* **Arquivo Alvo:** `frontend/src/components/ChatWindow.jsx`

---

## 🎯 Objetivo
Construir o componente central da aplicação com histórico de mensagens, botões de ação rápida, avaliação Like/Dislike, barra de métricas, integração com voz e exportação do log do atendimento.

---

## 📋 Prompt para Copiar e Executar na IA

```text
Crie o componente React "ChatWindow.jsx" completo para a experiência de atendimento inteligente.

Funcionalidades obrigatórias:
1. Histórico de mensagens com mensagem de boas-vindas inicial.
2. Integração com o backend FastAPI:
   - Envio de perguntas para "POST /api/chat".
   - Indicador visual animado de carregamento ("IA digitando...").
3. Integração com o componente "VoiceInput.jsx" para preenchimento ou envio por voz.
4. Chips interativos com as perguntas frequentes retornadas pela API ("suggested_actions").
5. Botões de Feedback (Like / Dislike) em cada mensagem da IA que disparam "POST /api/feedback".
6. Barra de métricas no topo exibindo:
   - Total de mensagens trocadas
   - Taxa de satisfação do atendimento (%)
   - Modo de operação (LLM Ativa / RAG Base de Conhecimento)
7. Botão para exportar o histórico do atendimento em arquivo de texto (.txt).
8. Auto-scroll suave sempre para a última mensagem usando "useRef".
```