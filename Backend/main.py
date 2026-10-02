"""
main.py - Servidor de API REST com FastAPI (Amorim Tech)
======================================================
Este módulo expõe o motor de IA e RAG (ChatbotEngine) por meio de endpoints HTTP REST.
Inclui suporte a CORS, validação de requisições com Pydantic, monitoramento de métricas
e avaliação de feedback pelos usuários.
"""

import time
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from chatbot_engine import ChatbotEngine

# -----------------------------------------------------------------------------
# 1. Inicialização da Aplicação FastAPI e do ChatbotEngine
# -----------------------------------------------------------------------------
app = FastAPI(
    title="Amorim Tech Chatbot API",
    description="API REST para Assistente Virtual Inteligente com suporte a RAG, LLM e PLN Léxico.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Inicializa o motor central de conversação
engine = ChatbotEngine()

# -----------------------------------------------------------------------------
# 2. Configuração de CORS (Liberado para origens web como React / Vite)
# -----------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------------
# 3. Modelos de Dados Pydantic
# -----------------------------------------------------------------------------
class MessageRequest(BaseModel):
    """Modelo de entrada para envio de mensagens ao chatbot."""
    message: str = Field(
        ...,
        description="Mensagem do usuário enviada para processamento pelo chatbot.",
        min_length=1,
        example="Quais são os planos e preços da Amorim Tech?"
    )
    session_id: Optional[str] = Field(
        default=None,
        description="Identificador opcional da sessão do usuário para controle de contexto.",
        example="sess_12345"
    )


class FeedbackRequest(BaseModel):
    """Modelo de entrada para registro de feedback (Like / Dislike)."""
    message_id: str = Field(
        ...,
        description="Identificador da mensagem que está sendo avaliada.",
        example="msg_a1b2c3d4"
    )
    is_positive: bool = Field(
        ...,
        description="Avaliação do usuário: True para Like (positivo), False para Dislike (negativo)."
    )


class ChatResponse(BaseModel):
    """Modelo de resposta estruturada do chatbot."""
    message_id: Optional[str] = Field(
        default=None,
        description="Identificador único da resposta gerada."
    )
    reply: str = Field(
        ...,
        description="Texto da resposta gerada pelo assistente virtual."
    )
    source: str = Field(
        ...,
        description="Origem da resposta (ex: 'llm', 'rag_lexical', 'greeting', 'fallback')."
    )
    confidence: float = Field(
        ...,
        description="Nível de confiança ou similaridade da resposta (entre 0.0 e 1.0)."
    )
    timestamp: float = Field(
        ...,
        description="Timestamp Unix em segundos no momento da resposta."
    )
    suggested_actions: List[str] = Field(
        default_factory=list,
        description="Lista de sugestões de perguntas rápidas ou próximas ações."
    )


# -----------------------------------------------------------------------------
# 4. Endpoints da API REST
# -----------------------------------------------------------------------------
@app.get(
    "/",
    summary="Status da API e Catálogo de Endpoints",
    tags=["Geral"]
)
def root() -> Dict[str, Any]:
    """
    Retorna o status de integridade da API, informações institucionais
    e o catálogo de endpoints disponíveis.
    """
    return {
        "status": "online",
        "service": "Amorim Tech Chatbot REST API",
        "empresa": engine.knowledge_base.get("empresa", "Amorim Tech Soluções Inteligentes"),
        "version": "1.0.0",
        "endpoints": {
            "root": "GET /",
            "chat": "POST /api/chat",
            "knowledge_base": "GET /api/knowledge-base",
            "metrics": "GET /api/metrics",
            "feedback": "POST /api/feedback",
            "docs": "GET /docs"
        }
    }


@app.post(
    "/api/chat",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Processar Mensagem do Chat",
    tags=["Chat"]
)
def chat_endpoint(payload: MessageRequest) -> ChatResponse:
    """
    Recebe uma mensagem de texto do usuário, orquestra a resposta no ChatbotEngine
    (priorizando LLM Generativa com RAG ou Motor Léxico) e retorna a resposta formatada.
    """
    cleaned_message = payload.message.strip()
    if not cleaned_message:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="O campo 'message' não pode ser vazio."
        )

    # Processamento pelo motor inteligente
    result = engine.process_message(cleaned_message)

    # Mapeamento seguro dos campos
    reply = result.get("response", "")
    source = result.get("source", "fallback")
    confidence = float(result.get("similarity_score", 1.0 if source in ["llm", "greeting"] else 0.0))
    suggested_actions = result.get("faq_rapido", []) or []
    message_id = result.get("message_id")

    return ChatResponse(
        message_id=message_id,
        reply=reply,
        source=source,
        confidence=confidence,
        timestamp=time.time(),
        suggested_actions=suggested_actions
    )


@app.get(
    "/api/knowledge-base",
    summary="Consultar Base de Conhecimento Carregada",
    tags=["Base de Conhecimento"]
)
def knowledge_base_endpoint() -> Dict[str, Any]:
    """
    Retorna a base de conhecimento estruturada em memória (tópicos, FAQ rápido e metadados).
    """
    return engine.knowledge_base


@app.get(
    "/api/metrics",
    summary="Métricas de Atendimento e Satisfação",
    tags=["Métricas"]
)
def metrics_endpoint() -> Dict[str, Any]:
    """
    Retorna os indicadores de atendimento, incluindo total de atendimentos e taxa de satisfação (%).
    """
    raw_metrics = engine.get_metrics()
    total_messages = raw_metrics.get("total_messages", 0)
    satisfaction_rate = raw_metrics.get("satisfaction_rate_percent", 0.0)

    return {
        "total_atendimentos": total_messages,
        "taxa_satisfacao_percent": satisfaction_rate,
        "detalhes": raw_metrics
    }


@app.post(
    "/api/feedback",
    status_code=status.HTTP_200_OK,
    summary="Registrar Feedback do Usuário",
    tags=["Feedback"]
)
def feedback_endpoint(payload: FeedbackRequest) -> Dict[str, Any]:
    """
    Registra a avaliação de Like/Dislike para uma mensagem de resposta do assistente.
    """
    success = engine.register_feedback(payload.message_id, payload.is_positive)
    return {
        "success": success,
        "message": "Feedback registrado com sucesso!",
        "message_id": payload.message_id,
        "is_positive": payload.is_positive
    }


# -----------------------------------------------------------------------------
# 5. Bloco de Execução com Uvicorn
# -----------------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn
    print("🚀 Iniciando Servidor FastAPI do Chatbot na porta 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
