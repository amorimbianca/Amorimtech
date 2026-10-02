# 💬 Prompt 04: Testes Automatizados no Terminal

* **Projeto:** 01 — Chatbot de Suporte Full-Stack (AfesuTech)
* **Camada:** Camada 2/3 — Validação & Qualidade de Software
* **Arquivo Alvo:** `backend/test_backend.py`

---

## 🎯 Objetivo
Criar um script em Python que teste automaticamente cenários de saudações, dúvidas existentes na base e integrações para garantir o funcionamento correto antes de criar o frontend.

---

## 📋 Prompt para Copiar e Executar na IA

```text
Crie um script de teste em Python chamado "test_backend.py" que importe a classe "ChatbotEngine" e execute testes automatizados no terminal para validar:
1. Saudação do usuário ("Olá, tudo bem?")
2. Pergunta que existe na base de conhecimento ("Quais são os planos e preços?")
3. Pergunta sobre integração ("Como faço a integração com React e Python?")

O script deve exibir no terminal o status da LLM, as respostas obtidas, a confiança e confirmar com [OK] se todos os testes passaram.
```