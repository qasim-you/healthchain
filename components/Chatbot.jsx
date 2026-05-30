"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { X, Send, Loader2, Sparkles, Mic, Volume2 } from "lucide-react";

const HealthBotIcon = () => (
  <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    <circle cx="20" cy="20" r="20" fill="url(#botGrad)" />
    <path d="M14 20h12M20 14v12" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="20" cy="20" r="7" stroke="white" strokeWidth="2" strokeOpacity="0.6" />
    <circle cx="15" cy="17" r="1.5" fill="white" />
    <circle cx="25" cy="17" r="1.5" fill="white" />
    <defs>
      <linearGradient id="botGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#14b8a6" />
        <stop offset="1" stopColor="#38bdf8" />
      </linearGradient>
    </defs>
  </svg>
);

export default function Chatbot() {
  const pathname = usePathname();
  if (pathname && pathname.startsWith("/chat")) return null;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "👋 Hello! I'm **HealthBot**, your AI guide for the HealthChain platform.\n\nAre you here as a **Patient** or a **Doctor**? I can help in English and Urdu."
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setSpeechSupported(
      typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance !== "undefined"
    );

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "ur-PK";
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
      if (event.results[event.results.length - 1].isFinal) {
        setIsListening(false);
        recognition.stop();
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setSttSupported(true);

    return () => {
      recognition.stop?.();
    };
  }, []);

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(/\n/g, "<br/>");
  };

  const speakText = (text) => {
    if (!speechSupported || typeof window === "undefined") return;
    const stripped = text.replace(/<[^>]*>/g, "");
    const utterance = new window.SpeechSynthesisUtterance(stripped);
    utterance.lang = /[\u0600-\u06FF]/.test(stripped) ? "ur-PK" : "en-US";
    utterance.rate = 1;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleVoiceInput = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch (error) {
      console.error("Voice recognition failed to start:", error);
      setIsListening(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;
    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/groq-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const data = await response.json();
      const reply = data?.reply || "معذرت، ابھی جواب دینے میں مسئلہ ہو گیا ہے۔ دوبارہ کوشش کریں۔";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      speakText(reply);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again.\n\nمعاف کیجیے، فی الحال کنکشن میں مسئلہ ہے۔ دوبارہ کوشش کریں۔"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-full bg-white border border-slate-200 shadow-lg shadow-slate-300/20 hover:-translate-y-0.5 transition-all"
          aria-label="Open HealthBot"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-500 p-2 text-white shadow-inner">
            <HealthBotIcon />
          </div>
          <div className="text-left leading-tight">
            <p className="text-sm font-semibold text-slate-900">HealthBot</p>
            <p className="text-[11px] text-slate-500">Voice + Urdu support</p>
          </div>
          <Sparkles className="w-4 h-4 text-cyan-500 animate-pulse" />
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] sm:w-[430px] h-[580px] flex flex-col rounded-[32px] overflow-hidden border border-slate-200 shadow-2xl shadow-slate-300/30 bg-slate-50">
          <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-cyan-600 to-sky-600 text-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-3xl bg-white/10 flex items-center justify-center border border-white/20 shadow-lg shadow-cyan-500/20">
                <HealthBotIcon />
              </div>
              <div>
                <p className="text-sm font-semibold">HealthBot</p>
                <p className="text-[11px] text-cyan-100">Real-time voice chat in Urdu & English</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
            {messages.map((msg, index) => {
              const isUser = msg.role === "user";
              const isRTL = /[\u0600-\u06FF]/.test(msg.content);
              return (
                <div key={index} className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}>
                  {!isUser && (
                    <div className="w-10 h-10 rounded-3xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                      <HealthBotIcon />
                    </div>
                  )}
                  <div
                    dir={isRTL ? "rtl" : "ltr"}
                    className={`max-w-[80%] px-4 py-3 rounded-3xl text-sm leading-6 ${
                      isUser
                        ? "bg-cyan-600 text-white rounded-br-[6px] shadow-lg shadow-cyan-200/40"
                        : "bg-white text-slate-900 border border-slate-200 shadow-sm"
                    }`}
                    style={{ wordBreak: "break-word" }}
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />
                  {isUser && (
                    <div className="w-10 h-10 rounded-3xl bg-cyan-100 text-cyan-700 flex items-center justify-center border border-cyan-200">
                      <span className="text-xs font-semibold">U</span>
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-10 h-10 rounded-3xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
                  <HealthBotIcon />
                </div>
                <div className="px-4 py-3 rounded-3xl bg-white border border-slate-200 shadow-sm flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />
                  <span className="text-slate-500 text-sm">Typing...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-5 py-4 border-t border-slate-200 bg-slate-50">
            <div className="mb-3 flex flex-wrap gap-2">
              {[
                "I'm a Patient",
                "I'm a Doctor",
                "والٹ کیسے جوڑیں؟",
                "مجھے مریض کا طریقہ کار بتائیں"
              ].map((q) => (
                <button
                  type="button"
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-[11px] px-3 py-1.5 rounded-full border border-cyan-200 text-cyan-700 hover:bg-cyan-50 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Ask HealthBot or ask in Urdu..."
                className="flex-1 rounded-3xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-200 transition-all"
              />
              {sttSupported && (
                <button
                  type="button"
                  onClick={handleVoiceInput}
                  className={`w-12 h-12 rounded-3xl border ${
                    isListening ? "border-rose-500 bg-rose-50 text-rose-600" : "border-slate-200 bg-white text-slate-600"
                  } flex items-center justify-center transition-colors`}
                  aria-label={isListening ? "Stop voice input" : "Start voice input"}
                >
                  <Mic size={18} />
                </button>
              )}
              {speechSupported && (
                <button
                  type="button"
                  onClick={() => speakText(messages[messages.length - 1]?.content || messages[0].content)}
                  className="w-12 h-12 rounded-3xl border border-slate-200 bg-white text-slate-600 flex items-center justify-center transition-colors hover:bg-slate-100"
                  aria-label="Play last response"
                >
                  <Volume2 size={18} />
                </button>
              )}
              <button
                type="button"
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="w-12 h-12 rounded-3xl bg-cyan-600 text-white flex items-center justify-center hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Send message"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
