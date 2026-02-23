"use client";

import React, { useState, useRef, useEffect } from "react";

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  usage?: TokenUsage;
}

function getContextualChips(assistantCount: number): string[] {
  if (assistantCount === 0)
    return [
      "Kulit aku berminyak banget 😩",
      "Sering banget jerawatan nih",
      "Udah nyoba banyak produk tapi ga mempan",
    ];
  if (assistantCount === 1)
    return [
      "Sudah berapa lama ya masalahnya?",
      "Kandungannya apa aja?",
      "Aman buat kulit sensitif?",
    ];
  if (assistantCount === 2)
    return [
      "Ada testimoni yang bisa dibaca?",
      "Berapa lama bisa keliatan hasilnya?",
      "Bedanya sama facial wash biasa apa?",
    ];
  if (assistantCount === 3)
    return ["Harganya berapa?", "Ada bukti klinisnya ga?", "Cara pakainya gimana?"];
  return ["Oke, aku mau coba! 🛒", "Dimana bisa belinya?", "Aku pikir-pikir dulu ya"];
}

function renderContent(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

function detectTestimonial(content: string): { name: string; handle: string; quote: string } | null {
  const lower = content.toLowerCase();
  if (lower.includes("amandabilla") || (lower.includes("amanda") && lower.includes("jerawat"))) {
    return {
      name: "Amanda",
      handle: "@amandabilla98",
      quote: "Cocok, calming dan ngebantu redain jerawat yang lagi meradang. Selalu repurchase!",
    };
  }
  if (lower.includes("silmisyauz") || (lower.includes("silmi") && lower.includes("repurchase"))) {
    return {
      name: "Silmi",
      handle: "@silmisyauz",
      quote: "Udah pakai dari 2023, selalu repurchase. Bikin kulit jarang jerawat dan sehat!",
    };
  }
  return null;
}

function shouldShowProductCard(content: string): boolean {
  return (
    content.includes("Rp110.900") ||
    (content.toLowerCase().includes("bpom") && content.toLowerCase().includes("halal"))
  );
}

function TestimonialCard({
  name,
  handle,
  quote,
}: {
  name: string;
  handle: string;
  quote: string;
}) {
  return (
    <div className="mt-2 bg-rose-50 border border-rose-200 rounded-2xl px-3 py-2.5 shadow-sm">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {name[0]}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800 leading-none">{name}</p>
          <p className="text-xs text-gray-400">{handle}</p>
        </div>
        <span className="ml-auto text-yellow-400 text-xs tracking-tighter">★★★★★</span>
      </div>
      <p className="text-xs text-gray-600 italic leading-relaxed">"{quote}"</p>
    </div>
  );
}

function ProductCard({ onOrder }: { onOrder: () => void }) {
  return (
    <div className="mt-2 bg-white border border-rose-200 rounded-2xl px-3 py-3 shadow-sm">
      <p className="text-xs font-semibold text-rose-500 uppercase tracking-wide mb-0.5">
        ERHA Acneact
      </p>
      <p className="text-sm font-bold text-gray-800 leading-tight">
        Acne Cleanser Scrub Beta Plus
      </p>
      <div className="flex flex-wrap gap-1 mt-1.5">
        {["Kontrol Sebum 8 Jam", "BPOM ✓", "Halal MUI ✓", "Klinis Teruji"].map((tag) => (
          <span
            key={tag}
            className="text-[10px] bg-rose-50 border border-rose-200 text-rose-600 px-1.5 py-0.5 rounded-full font-medium"
          >
            {tag}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between mt-2.5">
        <span className="text-base font-bold text-rose-500">Rp110.900</span>
        <button
          onClick={onOrder}
          className="text-xs bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white px-3 py-1.5 rounded-full font-semibold transition-all active:scale-95 shadow-sm"
        >
          Pesan Sekarang
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showTokenInfo, setShowTokenInfo] = useState(false);
  const [modelName, setModelName] = useState("llama-3.3-70b-versatile");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const assistantMessages = messages.filter((m) => m.role === "assistant");
  const totalSessionTokens = assistantMessages.reduce(
    (sum, m) => sum + (m.usage?.totalTokens ?? 0),
    0
  );

  useEffect(() => {
    fetch("/api/chat")
      .then((r) => r.json())
      .then((d) => setModelName(d.model))
      .catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async (text?: string) => {
    const msgText = (text ?? input).trim();
    if (!msgText || isLoading) return;

    const userMessage: Message = { role: "user", content: msgText };
    const newMessages: Message[] = [...messages, userMessage];
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
        const assistantMessage: Message = {
          role: "assistant",
          content: data.message,
          usage: data.usage,
        };
        setMessages([...newMessages, assistantMessage]);
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
    inputRef.current?.focus();
  };

  const handleOrderClick = () => {
    sendMessage("Oke, aku mau pesan! Gimana caranya?");
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
              Model: <span className="text-emerald-400">{modelName}</span>
            </span>
            <span>
              Turns: <span className="text-yellow-400">{assistantMessages.length}</span>
            </span>
            <span>
              Session total:{" "}
              <span className="text-blue-400">{totalSessionTokens} tokens</span>
            </span>
          </div>
          {assistantMessages.length > 0 && (
            <div className="mt-2 max-h-28 overflow-y-auto space-y-0.5 border-t border-slate-700 pt-2">
              {assistantMessages.map((m, i) =>
                m.usage ? (
                  <div key={i} className="flex gap-4 text-slate-300">
                    <span className="text-slate-500 w-12">Turn {i + 1}</span>
                    <span>
                      in=<span className="text-purple-400">{m.usage.promptTokens}</span>
                    </span>
                    <span>
                      out=<span className="text-pink-400">{m.usage.completionTokens}</span>
                    </span>
                    <span>
                      total=<span className="text-blue-400">{m.usage.totalTokens}</span>
                    </span>
                  </div>
                ) : null
              )}
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
              <h2 className="text-lg font-semibold text-gray-800">Halo! Aku Ara 👋</h2>
              <p className="text-sm text-gray-500 mt-1 max-w-xs">
                Beauty Advisor ERHA siap bantu kamu dapetin kulit sehat bebas jerawat!
              </p>
            </div>
            {/* Product teaser */}
            <div className="bg-white border border-rose-100 rounded-2xl px-4 py-3 max-w-xs w-full text-left shadow-sm">
              <p className="text-xs text-rose-400 font-semibold uppercase tracking-wide mb-1">
                Featured Product
              </p>
              <p className="text-sm font-bold text-gray-800">
                ERHA Acneact Acne Cleanser Scrub Beta Plus
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Terbukti klinis kontrol sebum hingga 8 jam ⏱️
              </p>
              <p className="text-rose-500 font-bold text-sm mt-1.5">Rp110.900</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1 w-full max-w-sm">
              {[
                "Kulit aku berminyak banget 😩",
                "Produk apa yang cocok buat jerawat?",
                "Udah nyoba banyak produk tapi ga mempan",
                "Ceritain dong ERHA Acneact!",
              ].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left text-xs bg-white border border-rose-100 hover:border-rose-300 hover:bg-rose-50 text-gray-600 px-3 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => {
          const isLastAssistant =
            msg.role === "assistant" && i === messages.length - 1;
          const assistantIndex = messages
            .slice(0, i)
            .filter((m) => m.role === "assistant").length;
          const testimonial =
            msg.role === "assistant" ? detectTestimonial(msg.content) : null;
          const showProductCard =
            msg.role === "assistant" && shouldShowProductCard(msg.content);

          return (
            <div key={i}>
              <div
                className={`flex gap-2.5 ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5 shadow-sm">
                    A
                  </div>
                )}
                <div className="max-w-[78%]">
                  {/* Message bubble */}
                  <div
                    className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-gradient-to-br from-rose-400 to-pink-500 text-white rounded-tr-sm shadow-md"
                        : "bg-white text-gray-700 rounded-tl-sm shadow-sm border border-gray-100"
                    }`}
                  >
                    {msg.role === "assistant"
                      ? renderContent(msg.content)
                      : msg.content}
                  </div>

                  {/* Per-message token badge */}
                  {msg.role === "assistant" && msg.usage && (
                    <p className="text-[10px] font-mono text-gray-400 mt-1 ml-1">
                      in:{msg.usage.promptTokens} · out:{msg.usage.completionTokens} · total:
                      {msg.usage.totalTokens}
                    </p>
                  )}

                  {/* Testimonial card */}
                  {testimonial && <TestimonialCard {...testimonial} />}

                  {/* Product card */}
                  {showProductCard && <ProductCard onOrder={handleOrderClick} />}
                </div>

                {msg.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold flex-shrink-0 mt-0.5">
                    U
                  </div>
                )}
              </div>

              {/* Contextual quick reply chips — only after last AI message */}
              {isLastAssistant && !isLoading && (
                <div className="flex flex-wrap gap-2 mt-2 ml-10">
                  {getContextualChips(assistantIndex + 1).map((chip) => (
                    <button
                      key={chip}
                      onClick={() => sendMessage(chip)}
                      className="text-xs bg-white border border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-rose-600 px-3 py-1.5 rounded-full transition-colors shadow-sm font-medium"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}

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
              target.style.height = Math.min(target.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={() => sendMessage()}
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
