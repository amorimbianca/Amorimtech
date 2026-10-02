# 💬 Prompt 07: Reconhecimento de Voz (STT) com Web Speech API & Suporte Mobile

* **Projeto:** 01 — Chatbot de Suporte Full-Stack (AfesuTech)
* **Camada:** Camada 4 — Multimodalidade, Acessibilidade & Mobile
* **Arquivo Alvo:** `frontend/src/components/VoiceInput.jsx`

---

## 🎯 Objetivo
Construir o componente React de entrada por voz nativa no navegador (Speech-to-Text) com suporte total ao português do Brasil (`pt-BR`), animação visual pulsante de gravação e alta compatibilidade tanto para Desktop quanto para **Smartphones (Android e iOS/iPhone)**.

---

## 📋 Prompt para Copiar e Executar na IA

```text
Crie um componente React chamado "VoiceInput.jsx" que utilize a Web Speech API (window.SpeechRecognition ou window.webkitSpeechRecognition) nativa dos navegadores para entrada por voz, com suporte robusto para computadores e smartphones (Android/iOS).

Requisitos do componente:
1. Botão com ícone de microfone (Lucide React: Mic / MicOff).
2. Configuração de idioma para Português do Brasil ("pt-BR") e inicialização limpa a cada clique para máxima estabilidade em celulares.
3. Validação de contexto seguro (HTTPS) com aviso amigável caso o usuário acesse em HTTP não seguro no celular.
4. Estado visual "isListening" que exibe indicador animado flutuante ("Ouvindo no celular... Fale agora!").
5. Quando a fala for reconhecida com sucesso, envia o texto transcrito para a função de callback da prop "onTranscript(transcript)".
6. Tratamento de erros detalhado (permissão negada, ausência de fala detectada ou navegador incompatível).
7. Limpeza e encerramento do reconhecimento no cleanup do useEffect ao desmontar o componente.
8. Props aceitas: "onTranscript" (função de callback obrigatória) e "disabled" (booleano opcional).
```

---

## 📱 Guia Prático: Como Testar no Smartphone na Sala de Aula

Como os computadores do laboratório não possuem microfones conectados, as alunas podem testar o reconhecimento de voz diretamente no próprio celular:

### 1️⃣ Passo 1: Iniciar os Servidores no Computador
No terminal do computador, inicie o backend e o frontend:
```bash
# Terminal 1 (Backend FastAPI):
cd 01_chatbot_atendimento_fullstack/backend
python main.py

# Terminal 2 (Frontend React/Vite):
cd 01_chatbot_atendimento_fullstack/frontend
npm run dev
```

---

### 2️⃣ Passo 2: Gerar o Túnel HTTPS Seguro para o Celular
Abra um **terceiro terminal** no computador e execute o comando:
```bash
npx localtunnel --port 3000
```
> 📌 O comando gerará um link público seguro como: `https://chat-afesu-aluna.loca.lt`

---

### 3️⃣ Passo 3: Abrir no Celular e Testar
1. A aluna digita ou escaneia o link `https://...` no navegador do celular (**Google Chrome** no Android ou **Safari** no iPhone).
2. Se aparecer a tela inicial do Localtunnel pedindo confirmação de IP, clique em **"Click to Continue"**.
3. Toque no **botão de microfone** no chat.
4. O celular solicitará: *"Deseja permitir que este site use seu microfone?"* ➔ Toque em **Permitir**.
5. Fale no celular: *"Quais são os planos e preços?"* ou *"Como funciona o suporte técnico?"*.
6. O texto será transcrito automaticamente para a caixa de mensagem e enviado para a IA! 🎉

---

## 💡 Dicas para Solução de Problemas no Celular:
* **Android (Chrome):** Se o microfone não abrir, toque no ícone de **cadeado/configurações** na barra de endereços do Chrome ➔ *Permissões do site* ➔ *Microfone* ➔ Marque **Permitir**.
* **iPhone (Safari):** Certifique-se de que o Safari tem permissão de microfone em *Ajustes do iPhone* ➔ *Safari* ➔ *Microfone*.