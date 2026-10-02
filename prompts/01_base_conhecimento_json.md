# 💬 Prompt 01: Criação da Base de Conhecimento JSON

* **Projeto:** 01 — Chatbot de Suporte Full-Stack (AfesuTech)
* **Camada:** Camada 1 — Dados & Conhecimento (RAG)
* **Arquivo Alvo:** `backend/base_conhecimento.json`

---

## 🎯 Objetivo
Criar o arquivo JSON factual com informações institucionais, tópicos de suporte ao cliente, perguntas frequentes e atalhos rápidos da empresa fictícia **AfesuTech**.

---

## 📋 Prompt para Copiar e Executar na IA

```text
Atue como um Engenheiro de Conhecimento e Especialista em IA.
Crie um arquivo JSON chamado "base_conhecimento.json" para alimentar o motor de RAG de uma empresa fictícia de tecnologia chamada "AfesuTech Soluções Inteligentes".

O JSON deve conter exatamente:
1. "empresa": Nome oficial da empresa.
2. "descricao": Breve descrição do negócio e impacto de IA.
3. "topicos": Lista com 6 tópicos essenciais de suporte ao cliente contendo:
   - "id": identificador único (ex: "planos_precos", "suporte_tecnico", "integracao_api", "ia_generativa", "cancelamento_reembolso", "sobre")
   - "perguntas_chave": Lista de 4 a 6 formas que o cliente pode perguntar (incluindo variações formais e informais)
   - "resposta": Resposta clara, acolhedora, com formatação rica em Markdown e emojis
4. "faq_rapido": Lista com 4 perguntas frequentes sugeridas para acesso rápido.

Retorne apenas o código JSON válido e formatado em português.