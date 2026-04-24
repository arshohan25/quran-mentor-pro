import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Send, Sparkles, AlertTriangle, Trash2, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };
const STORAGE_KEY = "islamic_qa_chat";

const SUGGESTED_BN = [
  "নামাজে রুকুর দোয়া কী?",
  "যাকাতের নিসাব কত?",
  "তাহাজ্জুদ পড়ার সঠিক সময়?",
  "জুমআর দিনের আমল কী কী?",
];

export default function AskPage() {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {}
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const stream = async (next: Msg[]) => {
    setLoading(true);
    abortRef.current = new AbortController();
    let buf = "";
    const upsert = (chunk: string) => {
      buf += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: buf } : m));
        }
        return [...prev, { role: "assistant", content: buf }];
      });
    };

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/islamic-qa`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: next }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "সমস্যা হয়েছে" }));
        toast.error(err.error || `Error ${resp.status}`);
        setLoading(false);
        return;
      }
      if (!resp.body) throw new Error("No stream body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let done = false;
      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        textBuffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, idx);
          textBuffer = textBuffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) upsert(c);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      if (e.name !== "AbortError") {
        console.error(e);
        toast.error(t("উত্তর আনতে সমস্যা হয়েছে", "Failed to get answer"));
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const send = (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    if (q.length > 2000) {
      toast.error(t("প্রশ্ন অনেক বড় (২০০০ অক্ষর সর্বোচ্চ)", "Question too long (max 2000 chars)"));
      return;
    }
    const next = [...messages, { role: "user" as const, content: q }];
    setMessages(next);
    setInput("");
    stream(next);
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <header className="islamic-header shrink-0">
        <div className="container flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80 transition-opacity p-1">
              <ArrowLeft className="w-5 h-5" strokeWidth={1.8} />
            </Link>
            <div>
              <h1 className="text-lg font-bold leading-tight flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accent" />
                {t("ইসলামিক প্রশ্নোত্তর (AI)", "Islamic Q&A (AI)", "أسئلة وأجوبة")}
              </h1>
              <p className="text-primary-foreground/50 text-[10px]">
                {t("যেকোনো ইসলামিক প্রশ্ন করুন", "Ask any Islamic question", "اسأل أي سؤال")}
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <button onClick={clearChat} className="p-2 hover:bg-primary-foreground/10 rounded-lg" aria-label="Clear">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* Disclaimer banner */}
      <div className="bg-accent/10 border-b border-accent/20 px-3 py-2 shrink-0">
        <div className="max-w-2xl mx-auto flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
          <p className="text-[10.5px] leading-relaxed text-foreground/75">
            {t(
              "এই উত্তরগুলো AI দ্বারা generated — fiqh-সংক্রান্ত ব্যক্তিগত মাসআলায় যোগ্য আলেমের পরামর্শ নিন।",
              "These answers are AI-generated — for personal fiqh matters, consult a qualified scholar.",
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 pb-24">
        <div className="max-w-2xl mx-auto space-y-3">
          {messages.length === 0 ? (
            <div className="text-center py-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="font-bold text-foreground">
                  {t("আসসালামু আলাইকুম 🌙", "Assalamu alaikum 🌙")}
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("নিচের সাজেশন থেকে শুরু করুন বা নিজে প্রশ্ন লিখুন", "Pick a suggestion or type your own")}
                </p>
              </div>
              <div className="grid gap-2">
                {SUGGESTED_BN.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-xs bg-card border border-border rounded-xl px-3 py-2.5 hover:border-primary/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-card border border-border text-foreground"
                  }`}
                >
                  {m.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:text-foreground prose-strong:text-foreground prose-p:text-foreground prose-li:text-foreground prose-p:my-1.5 prose-headings:my-2 prose-ul:my-1.5">
                      <ReactMarkdown>{m.content || "…"}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pl-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              {t("চিন্তা করছি…", "Thinking…")}
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-border bg-card/95 backdrop-blur-xl px-3 py-2.5 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="max-w-2xl mx-auto flex items-end gap-2"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t("আপনার প্রশ্ন লিখুন…", "Type your question…")}
            rows={1}
            className="flex-1 resize-none bg-background border border-border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()} className="shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
