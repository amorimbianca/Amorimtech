# 💬 Prompt 03: Servidor de API REST com FastAPI

* **Projeto:** 01 — Chatbot de Suporte Full-Stack (AfesuTech)
* **Camada:** Camada 3 — API REST & Comunicação Web
* **Arquivo Alvo:** `backend/main.py`

---

## 🎯 Objetivo
Criar o servidor web com FastAPI que expõe o motor de IA via rotas HTTP REST, com suporte a CORS, validação com Pydantic e monitoramento de métricas.

---

## 📋 Prompt para Copiar e Executar na IA

```text
Crie um arquivo "main.py" utilizando FastAPI para expor o "ChatbotEngine" via API REST.

O servidor deve conter:
1. Configuração de CORS (CORSMiddleware) liberando todas as origens para conexão com o frontend Vite/React.
2. Modelos Pydantic:
   - MessageRequest: campo "message" (obrigatório) e "session_id" (opcional).
   - FeedbackRequest: campo "message_id" (str) e "is_positive" (bool).
   - ChatResponse: "reply" (str), "source" (str), "confidence" (float), "timestamp" (float) e "suggested_actions" (List[str]).
3. Endpoints da API:
   - GET "/": status da API e lista de endpoints disponíveis.
   - POST "/api/chat": recebe a mensagem, processa no engine e retorna o ChatResponse.
   - GET "/api/knowledge-base": retorna a base de conhecimento carregada.
   - GET "/api/metrics": retorna o total de atendimentos e a taxa calculada de satisfação (%).
   - POST "/api/feedback": registra a avaliação de Like/Dislike.
4. Bloco de execução com uvicorn na porta 8000.
```