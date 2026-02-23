"use client";

import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface TurnInfo {
  model: string;
  usage: TokenUsage;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [turnInfos, setTurnInfos] = useState<TurnInfo[]>([]);
  const [showTokenInfo, setShowTokenInfo] = useState(false);
  const [modelName, setModelName] = useState("gpt-4o-mini");
  const [totalSessionTokens, setTotalSessionTokens] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => setModelName(d.model))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages([...newMessages, { role: "assistant", content: data.error }]);
      } else {
        setMessages([...newMessages, { role: "assistant", content: data.message }]);
        const info: TurnInfo = { model: data.model, usage: data.usage };
        setTurnInfos((prev) => [...prev, info]);
        setTotalSessionTokens((prev) => prev + data.usage.totalTokens);
      }
    } catch {
      setMessages([
        ...newMessages,
        { role: "assistant", content: "Waduh, ada gangguan koneksi nih. Coba lagi ya!" },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setTurnInfos([]);
    setTotalSessionTokens(0);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-rose-50 via-white to-pink-50">
      {/* Header */}
      <header className="bg-white border-b border-rose-100 shadow-sm px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
            ARA
          </div>
          <div>
            <h1 className="font-semibold text-gray-800 text-sm leading-tight">
              Ara · ERHA Beauty Advisor
            </h1>
            <p className="text-xs text-green-500 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block"></span>
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTokenInfo((v) => !v)}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition-colors font-medium"
          >
            {showTokenInfo ? "Tutup Info" : "Info Token"}
          </button>
          {messages.length > 0 && (
            <button
              onClick={resetChat}
              className="text-xs bg-rose-50 hover:bg-rose-100 text-rose-500 px-3 py-1.5 rounded-full transition-colors font-medium"
            >
              Reset
            </button>
          )}
        </div>
      </header>

      {/* Token Info Panel */}
      {showTokenInfo && (
        <div className="bg-slate-800 text-slate-200 px-4 py-3 text-xs font-mono border-b border-slate-700">
          <p className="text-slate-400 mb-1.5 font-sans font-semibold text-xs uppercase tracking-wider">
            Debug · Token Usage
          </p>
          <div className="flex flex-wrap gap-4 mb-1">
            <span>
              Model:{" "}
              <span className="text-emerald-400">{modelName}</span>
            </span>
            <span>
              Turns:{" "}
              <span className="text-yellow-400">{turnInfos.length}</span>
            </span>
            <span>
              Session total:{" "}
              <span className="text-blue-400">{totalSessionTokens} tokens</span>
            </span>
          </div>
          {turnInfos.length > 0 && (
            <div className="mt-2 max-h-28 overflow-y-auto space-y-0.5 border-t border-slate-700 pt-2">
              {turnInfos.map((t, i) => (
                <div key={i} className="flex gap-4 text-slate-300">
                  <span className="text-slate-500 w-12">Turn {i + 1}</span>
                  <span>
                    in=<span className="text-purple-400">{t.usage.promptTokens}</span>
                  </span>
                  <span>
                    out=<span className="text-pink-400">{t.usage.completionTokens}</span>
                  </span>
                  <span>
                    total=<span className="text-blue-400">{t.usage.totalTokens}</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              ARA
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Halo! Aku Ara 👋
              </h2>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                Beauty Advisor ERHA yang siap bantu kamu dapetin kulit sehat bebas jerawat!
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 w-full max-w-sm">
              {[
                "Kulit aku berminyak banget, ada solusi?",
                "Produk apa yang cocok buat jerawat meradang?",
                "Udah nyoba banyak produk tapi ga mempan 😔",
                "Ceritain dong tentang ERHA Acneact",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => {
                    setInput(prompt);
                    inputRef.current?.focus();
                  }}
                  className="text-left text-xs bg-white border border-rose-100 hover:border-rose-300 hover:bg-rose-50 text-gray-600 px-3 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm">
                A
              </div>
            )}
            <div
              className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-gradient-to-br from-rose-400 to-pink-500 text-white rounded-tr-sm shadow-md"
                  : "bg-white text-gray-700 rounded-tl-sm shadow-sm border border-gray-100"
              }`}
            >
              {msg.content}
            </div>
            {msg.role === "user" && (
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0 mt-0.5">
                U
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm">
              A
            </div>
            <div className="bg-white border border-gray-100 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
              <span
                className="w-2 h-2 bg-rose-300 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-rose-100 px-4 py-3">
        <div className="flex items-end gap-2 max-w-2xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Tulis pesanmu di sini..."
            rows={1}
            className="flex-1 resize-none rounded-2xl border border-gray-200 focus:border-rose-300 focus:ring-2 focus:ring-rose-100 px-4 py-3 text-sm text-gray-700 placeholder-gray-400 outline-none transition-all max-h-32 overflow-y-auto bg-gray-50"
            style={{ minHeight: "48px" }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height =
                Math.min(target.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center text-white shadow-md transition-all active:scale-95 flex-shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5 translate-x-0.5"
            >
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">
          ERHA Acneact Acne Cleanser Scrub Beta Plus · Rp110.900
        </p>
      </div>
    </div>
  );
}
