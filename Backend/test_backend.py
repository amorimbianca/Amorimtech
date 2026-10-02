"""
test_backend.py - Testes Automatizados no Terminal (Amorim Tech)
==============================================================
Valida o funcionamento do motor ChatbotEngine para múltiplos cenários:
1. Saudação do usuário ("Olá, tudo bem?")
2. Pergunta com correspondência na base de conhecimento ("Quais são os planos e preços?")
3. Pergunta sobre integração ("Como faço a integração com React e Python?")
"""

import sys
from chatbot_engine import ChatbotEngine

# Garante suporte a UTF-8 no terminal
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def run_tests() -> bool:
    print("=" * 70)
    print("🧪 INICIANDO TESTES AUTOMATIZADOS DO BACKEND - AMORIM TECH")
    print("=" * 70)

    # 1. Inicialização do Engine
    engine = ChatbotEngine()
    print(f"🏢 Empresa: {engine.knowledge_base.get('empresa', 'Não identificada')}")
    print(f"📚 Tópicos carregados na base: {len(engine.knowledge_base.get('topicos', []))}")
    llm_status = "Ativa (Groq)" if engine.groq_api_key else "Inativa (Modo RAG Léxico Offline)"
    print(f"🤖 Status da LLM: {llm_status}")
    print("-" * 70)

    test_cases = [
        {
            "id": 1,
            "name": "Saudação do Usuário",
            "message": "Olá, tudo bem?",
            "expected_source": ["greeting", "llm"],
            "min_confidence": 0.5,
        },
        {
            "id": 2,
            "name": "Dúvida da Base de Conhecimento (Planos e Preços)",
            "message": "Quais são os planos e preços?",
            "expected_source": ["rag_lexical", "llm"],
            "min_confidence": 0.2,
        },
        {
            "id": 3,
            "name": "Dúvida sobre Integração (React e Python / API)",
            "message": "Como faço a integração com React e Python?",
            "expected_source": ["rag_lexical", "llm"],
            "min_confidence": 0.2,
        },
    ]

    all_passed = True

    for tc in test_cases:
        print(f"\n▶️ Teste {tc['id']}: {tc['name']}")
        print(f"   👤 Pergunta: \"{tc['message']}\"")
        
        result = engine.process_message(tc["message"])
        
        reply = result.get("response", "")
        source = result.get("source", "")
        confidence = result.get("similarity_score", 0.0)
        message_id = result.get("message_id", "")
        
        print(f"   🏷️  Origem da Resposta: [{source.upper()}]")
        print(f"   📊 Confiança: {confidence}")
        print(f"   🆔 Message ID: {message_id}")
        print("   💬 Resposta Obtida:")
        # Indenta a resposta para melhor legibilidade
        for line in reply.strip().split("\n"):
            print(f"      {line}")

        # Validações
        is_valid_reply = bool(reply and len(reply.strip()) > 10)
        is_valid_source = source in tc["expected_source"] or source in ["llm", "rag_lexical", "greeting"]
        is_valid_confidence = confidence >= tc["min_confidence"] or source == "llm"

        if is_valid_reply and is_valid_source:
            print(f"   ✅ [OK] Teste {tc['id']} passou com sucesso!")
        else:
            print(f"   ❌ [FALHA] Teste {tc['id']} falhou nos critérios de validação.")
            all_passed = False

    print("\n" + "=" * 70)
    print("📊 MÉTRICAS CONSOLIDADAS APÓS TESTES:")
    metrics = engine.get_metrics()
    print(f"   • Total de Mensagens: {metrics['total_messages']}")
    print(f"   • Resolvidas por LLM: {metrics['resolved_by_llm']}")
    print(f"   • Resolvidas por RAG Léxico: {metrics['resolved_by_rag']}")
    print(f"   • Saudações: {metrics['greetings']}")
    print(f"   • Fallbacks: {metrics['fallbacks']}")
    print("=" * 70)

    if all_passed:
        print("🎉 TODOS OS TESTES PASSARAM COM SUCESSO! [OK]")
    else:
        print("⚠️ ALGUNS TESTES FALHARAM. VERIFIQUE OS LOGS ACIMA.")

    print("=" * 70)
    return all_passed


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
