# 💬 Prompt 02: Motor de Inteligência Artificial & PLN

* **Projeto:** 01 — Chatbot de Suporte Full-Stack (AfesuTech)
* **Camada:** Camada 2 — Inteligência Artificial & PLN (AI Engine)
* **Arquivo Alvo:** `backend/chatbot_engine.py`

---

## 🎯 Objetivo
Construir a classe em Python responsável por carregar a base de conhecimento, calcular similaridade léxica/semântica, orquestrar a LLM (Groq / Llama-3) com ancoragem temporal e fornecer fallback seguro.

---

## 📋 Prompt para Copiar e Executar na IA

```text
Crie um arquivo Python chamado "chatbot_engine.py" com a classe "ChatbotEngine" para processar as mensagens do Chatbot.

Requisitos da classe:
1. Carregar automaticamente o arquivo "base_conhecimento.json".
2. Suporte a LLM Generativa (Groq API com modelo Llama-3) lendo variáveis do arquivo ".env" caso exista:
   - Método "_build_system_prompt()": constrói o prompt de sistema injetando o contexto da empresa, a base de conhecimento (RAG) e a data atual real em português.
   - Método "_call_groq_llm(user_message)": executa a requisição HTTP usando urllib (sem dependências externas pesadas) mantendo histórico de conversação multi-turn.
3. Motor Léxico e Fallback Offline (caso não haja chave de API):
   - Método "_preprocess_text(text)": converte para minúsculas, remove pontuação e filtra stopwords em português.
   - Método "_calculate_similarity(query_tokens, target_phrase)": calcula a taxa de sobreposição de termos.
   - Detecção de saudações ("olá", "bom dia", "oi").
   - Busca pelo melhor tópico com limiar de corte de similaridade.
   - Resposta de fallback elegante quando não encontrar correspondência.
4. Gestão de Métricas:
   - Dicionário com total de mensagens, resolvidas por base/LLM, fallbacks e feedbacks positivos/negativos.
   - Método "register_feedback(message_id, is_positive)".

Documente o código com comentários didáticos e claros.