"""
chatbot_engine.py - Motor de Inteligência Artificial & PLN (Amorim Tech)
======================================================================
Este módulo implementa a classe ChatbotEngine, responsável por:
1. Carregar a base de conhecimento institucional (base_conhecimento.json);
2. Processar mensagens via LLM Generativa (Groq / Llama-3) com RAG e ancoragem temporal;
3. Fornecer motor léxico offline com pré-processamento de texto, remoção de stopwords e cálculo de similaridade;
4. Realizar detecção de saudações e fallback inteligente;
5. Gerenciar métricas de atendimento e feedbacks de usuários.
"""

import json
import os
import re
import sys
import unicodedata
import urllib.request
import urllib.error
import uuid
from datetime import datetime
from typing import Dict, List, Any, Optional, Tuple

# Garante compatibilidade de saída UTF-8 no console do Windows
if sys.stdout.encoding != "utf-8":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def _load_env_file(env_path: Optional[str] = None) -> None:
    """
    Carrega variáveis de ambiente de um arquivo .env sem necessidade de bibliotecas externas.
    """
    if env_path is None:
        # Tenta localizar .env no diretório atual, no diretório do script ou na raiz do projeto
        current_dir = os.path.dirname(os.path.abspath(__file__))
        candidates = [
            os.path.join(current_dir, ".env"),
            os.path.join(os.path.dirname(current_dir), ".env"),
            os.path.join(os.getcwd(), ".env"),
        ]
        for candidate in candidates:
            if os.path.isfile(candidate):
                env_path = candidate
                break

    if env_path and os.path.isfile(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        key, _, value = line.partition("=")
                        key = key.strip()
                        value = value.strip().strip("'\"")
                        if key and key not in os.environ:
                            os.environ[key] = value
        except Exception:
            pass


class ChatbotEngine:
    """
    Motor principal do Chatbot da Amorim Tech.
    Orquestra o processamento de linguagem natural, integração com LLM e base de conhecimento RAG.
    """

    # Lista de stopwords comuns em português para filtragem no motor léxico
    STOPWORDS_PT = {
        "a", "ao", "aos", "aquela", "aquelas", "aquele", "aqueles", "aquilo", "as", "ate", "até",
        "com", "como", "da", "das", "de", "dela", "delas", "dele", "deles", "depois", "do", "dos",
        "e", "ela", "elas", "ele", "eles", "em", "entre", "era", "eram", "eramos", "éramos",
        "essa", "essas", "esse", "esses", "esta", "estadas", "estava", "estavam", "estávamos",
        "estas", "este", "estes", "estou", "eu", "foi", "fomos", "foram", "ha", "há", "havia",
        "isso", "isto", "ja", "já", "lhe", "lhes", "mais", "mas", "me", "mesmo", "meu", "meus",
        "minha", "minhas", "muito", "na", "nao", "não", "nas", "nem", "no", "nos", "nós", "nossa",
        "nossas", "nosso", "nossos", "num", "numa", "o", "os", "ou", "para", "pela", "pelas",
        "pelo", "pelos", "por", "qual", "quais", "quando", "que", "quem", "sao", "são", "se",
        "seja", "sejam", "sem", "sera", "será", "serao", "serão", "seu", "seus", "so", "só",
        "sua", "suas", "tambem", "também", "te", "tem", "temos", "têm", "tenho", "ter", "teu",
        "teus", "tinha", "tinham", "tive", "tivemos", "tu", "tua", "tuas", "um", "uma", "umas",
        "uns", "voce", "você", "voces", "vocês", "vos"
    }

    # Padrões de saudações em português
    GREETING_PATTERNS = [
        "ola", "olá", "oi", "oie", "bom dia", "boa tarde", "boa noite",
        "e ai", "e aí", "opa", "tudo bem", "como vai", "fala", "hello", "hey"
    ]

    def __init__(self, base_conhecimento_path: Optional[str] = None):
        """
        Inicializa o motor do Chatbot, carregando a base de dados, configurações de ambiente e métricas.
        """
        # Carrega variáveis do arquivo .env caso exista
        _load_env_file()

        # Configurações da LLM Groq
        self.groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
        self.groq_model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile").strip()
        self.groq_api_url = "https://api.groq.com/openai/v1/chat/completions"

        # Histórico de conversação multi-turn para a LLM
        self.conversation_history: List[Dict[str, str]] = []

        # Carregamento da base de conhecimento
        self.knowledge_base = self._load_knowledge_base(base_conhecimento_path)

        # Gestão de Métricas
        self.metrics: Dict[str, int] = {
            "total_messages": 0,
            "resolved_by_llm": 0,
            "resolved_by_rag": 0,
            "greetings": 0,
            "fallbacks": 0,
            "positive_feedbacks": 0,
            "negative_feedbacks": 0,
        }

        # Registro de mensagens processadas para vinculação de feedback
        self.message_log: Dict[str, Dict[str, Any]] = {}

    # =========================================================================
    # 1. Carregamento da Base de Conhecimento
    # =========================================================================
    def _load_knowledge_base(self, custom_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Localiza e carrega o arquivo base_conhecimento.json.
        """
        paths_to_try = []
        if custom_path:
            paths_to_try.append(custom_path)

        current_dir = os.path.dirname(os.path.abspath(__file__))
        paths_to_try.extend([
            os.path.join(current_dir, "base_conhecimento.json"),
            os.path.join(current_dir, "Backend", "base_conhecimento.json"),
            os.path.join(os.path.dirname(current_dir), "Backend", "base_conhecimento.json"),
            os.path.join(os.getcwd(), "base_conhecimento.json"),
            os.path.join(os.getcwd(), "Backend", "base_conhecimento.json"),
            os.path.join(os.getcwd(), "backend", "base_conhecimento.json"),
        ])

        for path in paths_to_try:
            if os.path.isfile(path):
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        return json.load(f)
                except Exception as e:
                    print(f"⚠️ Erro ao carregar base de conhecimento em {path}: {e}")

        # Retorno padrão de segurança caso o arquivo não seja encontrado
        return {
            "empresa": "Amorim Tech Soluções Inteligentes",
            "descricao": "Soluções em Inteligência Artificial e RAG corporativo.",
            "topicos": [],
            "faq_rapido": []
        }

    # =========================================================================
    # 2. Orquestração da LLM Generativa (Groq / Llama-3) & RAG
    # =========================================================================
    def _get_current_date_pt(self) -> str:
        """
        Retorna a data atual real formatada por extenso em português.
        """
        meses = [
            "janeiro", "fevereiro", "março", "abril", "maio", "junho",
            "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
        ]
        dias_semana = [
            "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira",
            "Sexta-feira", "Sábado", "Domingo"
        ]
        agora = datetime.now()
        dia_semana = dias_semana[agora.weekday()]
        mes = meses[agora.month - 1]
        return f"{dia_semana}, {agora.day:02d} de {mes} de {agora.year}"

    def _build_system_prompt(self) -> str:
        """
        Constrói o prompt de sistema injetando:
        - Persona da Amorim Tech
        - Base de conhecimento institucional (RAG Factual)
        - Ancoragem temporal real em português
        - Diretrizes estritas de formatação e tom de voz
        """
        empresa = self.knowledge_base.get("empresa", "Amorim Tech Soluções Inteligentes")
        descricao = self.knowledge_base.get("descricao", "")
        data_atual = self._get_current_date_pt()

        # Montagem do bloco de RAG a partir dos tópicos
        topicos_text = []
        for topico in self.knowledge_base.get("topicos", []):
            titulo = topico.get("titulo", topico.get("id", ""))
            perguntas = ", ".join(topico.get("perguntas_chave", []))
            resposta = topico.get("resposta", "")
            topicos_text.append(
                f"### Tópico: {titulo}\n"
                f"- Perguntas Relacionadas: {perguntas}\n"
                f"- Informação Oficial:\n{resposta}\n"
            )
        base_rag_formatada = "\n".join(topicos_text)

        system_prompt = f"""Você é o Assistente Virtual Oficial da empresa {empresa}.
{descricao}

📅 [ANCORAGEM TEMPORAL REAL]:
Hoje é {data_atual}. Use esta data como referência temporal para qualquer resposta sobre prazos, novidades ou calendário.

📚 [BASE DE CONHECIMENTO OFICIAL (RAG FACTUAL)]:
{base_rag_formatada}

🎯 [DIRETRIZES DE ATENDIMENTO E COMPORTAMENTO]:
1. **Fidelidade Factual:** Responda utilizando estritamente as informações da Base de Conhecimento acima. Nunca invente dados, preços ou políticas não citadas.
2. **Tom de Voz:** Seja sempre profissional, acolhedor, empático, prestativo e tecnológico.
3. **Formatação Rica:** Utilize Markdown elegante (negrito, listas, tópicos) e emojis adequados para tornar a leitura dinâmica e agradável.
4. **Respostas Estruturadas:** Mantenha as respostas concisas e objetivas, evitando textos excessivamente longos a menos que o usuário peça detalhes.
5. **Dúvidas Fora do Escopo:** Caso o usuário pergunte algo não coberto pela base, informe educadamente que não possui essa informação específica e forneça os canais de contato humano: e-mail `suporte@amorimtech.com.br` e WhatsApp `+55 (11) 98765-4321`.
6. **Idioma:** Responda sempre em Português do Brasil (pt-BR).
"""
        return system_prompt

    def _call_groq_llm(self, user_message: str) -> Optional[str]:
        """
        Executa a requisição HTTP para a API da Groq utilizando urllib (sem dependências externas).
        Mantém o histórico de conversação multi-turn.
        """
        if not self.groq_api_key:
            return None

        # Monta as mensagens para envio à API Groq
        messages = [{"role": "system", "content": self._build_system_prompt()}]

        # Adiciona histórico multi-turn recente (últimas 6 trocas para manter o contexto sem estourar limites)
        for turn in self.conversation_history[-6:]:
            messages.append(turn)

        # Adiciona a mensagem atual do usuário
        messages.append({"role": "user", "content": user_message})

        payload = {
            "model": self.groq_model,
            "messages": messages,
            "temperature": 0.3,
            "max_tokens": 800,
            "top_p": 0.9,
        }

        data_bytes = json.dumps(payload).encode("utf-8")
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.groq_api_key}",
            "User-Agent": "AmorimTech-ChatbotEngine/1.0",
        }

        req = urllib.request.Request(self.groq_api_url, data=data_bytes, headers=headers, method="POST")

        try:
            with urllib.request.urlopen(req, timeout=12) as response:
                if response.status == 200:
                    res_body = response.read().decode("utf-8")
                    res_json = json.loads(res_body)
                    assistant_message = res_json["choices"][0]["message"]["content"].strip()

                    # Atualiza o histórico de conversação
                    self.conversation_history.append({"role": "user", "content": user_message})
                    self.conversation_history.append({"role": "assistant", "content": assistant_message})

                    return assistant_message
        except urllib.error.HTTPError as e:
            err_msg = e.read().decode("utf-8", errors="ignore")
            print(f"⚠️ Erro HTTP na API Groq ({e.code}): {err_msg}")
        except urllib.error.URLError as e:
            print(f"⚠️ Erro de conexão com a API Groq: {e.reason}")
        except Exception as e:
            print(f"⚠️ Erro inesperado ao chamar LLM Groq: {e}")

        return None

    # =========================================================================
    # 3. Motor Léxico e Fallback Offline
    # =========================================================================
    def _preprocess_text(self, text: str) -> List[str]:
        """
        Pré-processa o texto:
        - Converte para minúsculas;
        - Remove acentos e caracteres diacríticos;
        - Remove pontuações e símbolos;
        - Filtra stopwords em português.
        Retorna uma lista de tokens significativos.
        """
        if not text:
            return []

        # Converte para minúsculas
        text = text.lower()

        # Remove acentos (Normalização NFD)
        text_normalized = unicodedata.normalize("NFD", text)
        text_clean = "".join(ch for ch in text_normalized if unicodedata.category(ch) != "Mn")

        # Extrai apenas palavras alfanuméricas
        words = re.findall(r"\b[a-z0-9_]+\b", text_clean)

        # Filtra stopwords
        tokens = [w for w in words if w not in self.STOPWORDS_PT and len(w) > 1]
        return tokens

    def _calculate_similarity(self, query_tokens: List[str], target_phrase: str) -> float:
        """
        Calcula a taxa de similaridade (coeficiente de Jaccard com matching de radicais)
        entre os tokens da consulta e uma frase de destino.
        """
        if not query_tokens:
            return 0.0

        target_tokens = self._preprocess_text(target_phrase)
        if not target_tokens:
            return 0.0

        # Contabiliza correspondências exatas e por radical (>= 4 caracteres)
        matched_query_count = 0
        matched_target_count = 0

        for q in query_tokens:
            if any(q == t or (len(q) >= 4 and len(t) >= 4 and (q.startswith(t[:4]) or t.startswith(q[:4]))) for t in target_tokens):
                matched_query_count += 1

        for t in target_tokens:
            if any(t == q or (len(t) >= 4 and len(q) >= 4 and (t.startswith(q[:4]) or q.startswith(t[:4]))) for q in query_tokens):
                matched_target_count += 1

        overlap_query = matched_query_count / len(query_tokens)
        overlap_target = matched_target_count / len(target_tokens)

        # Média ponderada dando maior relevância para a cobertura da dúvida do usuário
        return (overlap_query * 0.75) + (overlap_target * 0.25)

    def _is_greeting(self, text: str) -> bool:
        """
        Verifica se a mensagem do usuário é uma saudação.
        """
        clean = text.lower().strip()
        # Remove pontuação básica no final
        clean = re.sub(r"[!\?.,;:]+$", "", clean).strip()

        # Verifica correspondência exata ou início de frase
        for pattern in self.GREETING_PATTERNS:
            if clean == pattern or clean.startswith(pattern + " ") or clean.endswith(" " + pattern):
                return True
        return False

    def _get_greeting_response(self) -> str:
        """
        Gera uma resposta acolhedora de saudação com o nome da empresa e sugestões de tópicos.
        """
        empresa = self.knowledge_base.get("empresa", "Amorim Tech")
        faq_sugestoes = self.knowledge_base.get("faq_rapido", [])

        sugestoes_str = ""
        if faq_sugestoes:
            sugestoes_str = "\n\n💡 **Você pode perguntar sobre:**\n" + "\n".join(f"- {faq}" for faq in faq_sugestoes)

        return (
            f"👋 **Olá! Seja muito bem-vindo à {empresa}!**\n\n"
            f"Eu sou o seu Assistente Virtual com IA. Estou aqui para tirar dúvidas sobre nossos produtos, planos, "
            f"integrações de API e suporte técnico.{sugestoes_str}\n\n"
            f"Como posso te ajudar hoje?"
        )

    def _find_best_topic(self, query: str, threshold: float = 0.25) -> Tuple[Optional[Dict[str, Any]], float]:
        """
        Busca o tópico da base de conhecimento com maior pontuação de similaridade léxica.
        Retorna (topico, pontuacao) ou (None, 0.0) caso não atinja o limiar.
        """
        query_tokens = self._preprocess_text(query)
        if not query_tokens:
            return None, 0.0

        best_topic = None
        best_score = 0.0

        for topico in self.knowledge_base.get("topicos", []):
            scores = []

            # Compara com as perguntas-chave
            for pergunta in topico.get("perguntas_chave", []):
                scores.append(self._calculate_similarity(query_tokens, pergunta))

            # Compara com o título
            titulo = topico.get("titulo", "")
            if titulo:
                scores.append(self._calculate_similarity(query_tokens, titulo) * 1.1)

            # Compara com a resposta
            resposta = topico.get("resposta", "")
            if resposta:
                scores.append(self._calculate_similarity(query_tokens, resposta) * 0.6)

            max_topic_score = max(scores) if scores else 0.0

            if max_topic_score > best_score:
                best_score = max_topic_score
                best_topic = topico

        if best_score >= threshold:
            return best_topic, best_score

        return None, best_score

    def _get_fallback_response(self) -> str:
        """
        Gera uma resposta elegante quando nenhuma correspondência é encontrada na base de conhecimento.
        """
        faq_sugestoes = self.knowledge_base.get("faq_rapido", [])
        sugestoes_md = ""
        if faq_sugestoes:
            sugestoes_md = "\n\n📌 **Perguntas frequentes que podem ajudar:**\n" + "\n".join(f"- {q}" for q in faq_sugestoes)

        return (
            "🤔 **Desculpe, ainda não encontrei uma resposta exata para a sua dúvida.**\n\n"
            "Posso te conectar com nossa equipe humana ou você pode tentar reformular sua pergunta.{sugestoes_md}\n\n"
            "📞 **Canais de Atendimento Humano:**\n"
            "- 📧 **E-mail:** `suporte@amorimtech.com.br`\n"
            "- 📱 **WhatsApp:** `+55 (11) 98765-4321`\n"
            "- ⏰ **Horário:** Seg a Sex, das 08h às 20h"
        ).format(sugestoes_md=sugestoes_md)

    # =========================================================================
    # 4. Processamento de Mensagens & Gestão de Métricas
    # =========================================================================
    def process_message(self, user_message: str) -> Dict[str, Any]:
        """
        Processa a mensagem do usuário seguindo o fluxo de decisão:
        1. Validação e registro de métrica;
        2. Verificação de saudação;
        3. Tentativa de resposta via LLM Generativa (Groq RAG);
        4. Fallback para o Motor Léxico Offline;
        5. Fallback geral de atendimento.

        Retorna um dicionário com os dados da resposta, canal utilizado e identificadores.
        """
        self.metrics["total_messages"] += 1
        message_id = f"msg_{uuid.uuid4().hex[:8]}"
        user_message_clean = (user_message or "").strip()

        if not user_message_clean:
            response_text = "Por favor, digite uma mensagem para que eu possa te ajudar! 😊"
            return {
                "message_id": message_id,
                "response": response_text,
                "source": "empty",
                "similarity_score": 0.0,
                "topic_id": None,
                "faq_rapido": self.knowledge_base.get("faq_rapido", []),
                "timestamp": datetime.now().isoformat(),
            }

        # 1. Detecção de Saudação
        if self._is_greeting(user_message_clean):
            self.metrics["greetings"] += 1
            response_text = self._get_greeting_response()
            result = {
                "message_id": message_id,
                "response": response_text,
                "source": "greeting",
                "similarity_score": 1.0,
                "topic_id": "saudacao",
                "faq_rapido": self.knowledge_base.get("faq_rapido", []),
                "timestamp": datetime.now().isoformat(),
            }
            self.message_log[message_id] = result
            return result

        # 2. Orquestração via LLM Generativa (Groq / Llama-3)
        if self.groq_api_key:
            llm_response = self._call_groq_llm(user_message_clean)
            if llm_response:
                self.metrics["resolved_by_llm"] += 1
                result = {
                    "message_id": message_id,
                    "response": llm_response,
                    "source": "llm",
                    "similarity_score": 1.0,
                    "topic_id": "llm_generativa",
                    "faq_rapido": self.knowledge_base.get("faq_rapido", []),
                    "timestamp": datetime.now().isoformat(),
                }
                self.message_log[message_id] = result
                return result

        # 3. Motor Léxico Offline (RAG Local)
        best_topic, score = self._find_best_topic(user_message_clean)
        if best_topic:
            self.metrics["resolved_by_rag"] += 1
            result = {
                "message_id": message_id,
                "response": best_topic.get("resposta", ""),
                "source": "rag_lexical",
                "similarity_score": round(score, 3),
                "topic_id": best_topic.get("id"),
                "faq_rapido": self.knowledge_base.get("faq_rapido", []),
                "timestamp": datetime.now().isoformat(),
            }
            self.message_log[message_id] = result
            return result

        # 4. Fallback Geral
        self.metrics["fallbacks"] += 1
        result = {
            "message_id": message_id,
            "response": self._get_fallback_response(),
            "source": "fallback",
            "similarity_score": round(score, 3),
            "topic_id": None,
            "faq_rapido": self.knowledge_base.get("faq_rapido", []),
            "timestamp": datetime.now().isoformat(),
        }
        self.message_log[message_id] = result
        return result

    def register_feedback(self, message_id: str, is_positive: bool) -> bool:
        """
        Registra feedback (positivo ou negativo) para uma mensagem respondida.
        """
        if is_positive:
            self.metrics["positive_feedbacks"] += 1
        else:
            self.metrics["negative_feedbacks"] += 1

        if message_id in self.message_log:
            self.message_log[message_id]["feedback"] = "positive" if is_positive else "negative"
            return True

        return True

    def get_metrics(self) -> Dict[str, Any]:
        """
        Retorna as métricas consolidadas do motor do chatbot.
        """
        total = self.metrics["total_messages"]
        positive = self.metrics["positive_feedbacks"]
        negative = self.metrics["negative_feedbacks"]
        total_feedback = positive + negative
        satisfaction_rate = (positive / total_feedback * 100) if total_feedback > 0 else 0.0

        return {
            **self.metrics,
            "total_feedbacks": total_feedback,
            "satisfaction_rate_percent": round(satisfaction_rate, 1),
        }

    def reset_conversation(self) -> None:
        """
        Limpa o histórico de conversação multi-turn.
        """
        self.conversation_history.clear()


# =============================================================================
# Execução Direta / Demonstração
# =============================================================================
if __name__ == "__main__":
    print("🚀 Inicializando Amorim Tech Chatbot Engine...")
    engine = ChatbotEngine()

    print(f"🏢 Empresa: {engine.knowledge_base.get('empresa')}")
    print(f"🤖 LLM Habilitada: {'Sim (Groq)' if engine.groq_api_key else 'Não (Modo Léxico Offline)'}")
    print("-" * 60)

    # Testes rápidos de processamento
    test_queries = [
        "Olá, bom dia!",
        "Quais são os planos e preços?",
        "Como funciona a IA com RAG de vocês?",
        "Posso cancelar sem pagar multa?",
        "Como faço pudim de leite condensado?",  # Pergunta fora de escopo (Fallback)
    ]

    for q in test_queries:
        print(f"\n👤 Usuário: {q}")
        res = engine.process_message(q)
        print(f"🏷️ Origem: [{res['source'].upper()}] (score: {res.get('similarity_score', 0)})")
        print(f"🤖 Resposta:\n{res['response']}")

    # Demonstração de Feedback e Métricas
    print("\n" + "=" * 60)
    print("📊 Métricas Consolidadas:")
    engine.register_feedback("msg_test", True)
    print(json.dumps(engine.get_metrics(), indent=2, ensure_ascii=False))
