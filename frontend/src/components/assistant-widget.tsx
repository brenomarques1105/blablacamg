"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useRef, useState } from "react";
import {
  CarFront,
  Check,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Send,
  X,
} from "lucide-react";
import { ChatMarkdown } from "@/components/chat-markdown";
import { extractPhones } from "@/lib/format";
import type { TipoTrajeto } from "@/lib/database.types";

type Message = { role: "assistant" | "user"; text: string };

const welcomeMessage =
  "Opa, sou o Tião da CAMG, seu assistente de caronas! Me conta de onde você sai, em que dia e mais ou menos que horas. Vou procurar uma carona pra você.\n\nEx.: *Preciso ir amanhã saindo do Caiçara perto das 07:40.*";

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<TipoTrajeto>("Ida");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: welcomeMessage },
  ]);
  const [historyByType, setHistoryByType] = useState<Record<TipoTrajeto, Message[]>>({
    Ida: [],
    Volta: [],
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy, open]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    const prompt = message.trim();
    if (!prompt || busy) return;

    setMessages((current) => [...current, { role: "user", text: prompt }]);
    setMessage("");
    setBusy(true);
    scrollToBottom();

    try {
      const response = await fetch("/api/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo_trajeto: tipo,
          mensagem: prompt,
          historico: historyByType[tipo],
        }),
      });
      const result = (await response.json()) as { text?: string; error?: string; mensagemContexto?: string };
      const reply = result.text;
      if (!response.ok || !reply) {
        throw new Error(result.error ?? "Não consegui encontrar uma resposta agora.");
      }
      setMessages((current) => [...current, { role: "assistant", text: reply }]);
      setHistoryByType((current) => {
        const turn: Message[] = [
          { role: "user", text: (result.mensagemContexto ?? prompt).slice(0, 500) },
          { role: "assistant", text: reply.slice(0, 500) },
        ];
        return { ...current, [tipo]: [...current[tipo], ...turn].slice(-8) };
      });
    } catch (cause) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text:
            cause instanceof Error
              ? cause.message
              : "Não foi possível consultar o assistente.",
        },
      ]);
    } finally {
      setBusy(false);
      scrollToBottom();
    }
  }

  function scrollToBottom() {
    requestAnimationFrame(() =>
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      }),
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-30 inline-flex h-14 items-center gap-3 rounded-full bg-[#174b38] px-5 text-sm font-bold text-white shadow-xl shadow-emerald-950/20 transition hover:-translate-y-0.5 hover:bg-[#103b2b]"
        aria-label="Falar com o Tião da CAMG"
      >
        <Image src="/tiao-da-camg.webp" alt="" width={36} height={36} unoptimized className="rounded-full bg-white/15 object-contain" />
        <span>Tião da CAMG</span>
      </button>
    );
  }

  return (
    <section
      role="dialog"
      onKeyDown={(event) => { if (event.key === "Escape") setOpen(false); }}
      aria-label="Tião da CAMG, assistente de caronas"
      className="fixed bottom-4 right-3 z-40 flex h-[min(690px,calc(100dvh-2rem))] w-[min(430px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[1.75rem] border border-[#d9e6dd] bg-white shadow-2xl shadow-emerald-950/20 sm:bottom-6 sm:right-6"
    >
      <header className="flex items-center justify-between bg-[#174b38] px-5 py-4 text-white">
        <div className="flex items-center gap-3">
          <Image src="/tiao-da-camg.webp" alt="" width={48} height={48} unoptimized className="rounded-full bg-white/15 object-contain" />
          <div>
            <p className="font-bold">Tião da CAMG</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-emerald-100">
              Assistente de caronas
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Fechar assistente"
          className="grid size-9 place-items-center rounded-lg text-white/80 hover:bg-white/10"
        >
          <X size={19} />
        </button>
      </header>

      <div className="border-b border-[var(--line)] px-4 py-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
          Qual trajeto você procura?
        </p>
        <div className="grid grid-cols-2 gap-2">
          {([
            { value: "Ida", title: "Ida", hint: "Para a CAMG", icon: CarFront },
            { value: "Volta", title: "Volta", hint: "Saindo da CAMG", icon: MapPin },
          ] as const).map(({ value, title, hint, icon: Icon }) => (
            <button
              aria-pressed={tipo === value}
              disabled={busy}
              key={value}
              onClick={() => setTipo(value)}
              className={`flex items-center gap-2.5 rounded-xl border p-2.5 text-left transition ${
                tipo === value
                  ? "border-emerald-700 bg-emerald-50 text-emerald-950"
                  : "border-[var(--line)] text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon size={17} />
              <span>
                <span className="block text-xs font-bold">{title}</span>
                <span className="block text-[10px] text-slate-500">{hint}</span>
              </span>
              {tipo === value && <Check className="ml-auto text-emerald-800" size={15} />}
            </button>
          ))}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-[#f6f8f6] p-4">
        {messages.map((item, index) => (
          <div
            key={`${item.role}-${index}`}
            className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[90%] rounded-2xl px-3.5 py-3 text-sm leading-6 ${
                item.role === "user"
                  ? "rounded-br-md bg-[#174b38] text-white"
                  : "rounded-bl-md border border-[var(--line)] bg-white text-slate-700"
              }`}
            >
              <div className="chat-markdown">
                {item.role === "assistant" ? <ChatMarkdown text={item.text} /> : <p className="whitespace-pre-wrap">{item.text}</p>}
              </div>
              {item.role === "assistant" &&
                index > 0 &&
                extractPhones(item.text).length > 0 && (
                  <PhoneButton text={item.text} />
                )}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div role="status" className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-[var(--line)] bg-white px-3.5 py-3 text-xs font-medium text-slate-600">
              <LoaderCircle className="animate-spin text-emerald-800" size={15} />
              Analisando rotas e horários dos motoristas...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={send} className="border-t border-[var(--line)] bg-white p-3">
        <label className="sr-only" htmlFor="ride-message">
          Descreva sua necessidade de carona
        </label>
        <div className="flex items-end gap-2 rounded-2xl border border-[var(--line)] bg-[#fbfcfb] p-2 focus-within:border-emerald-700 focus-within:ring-4 focus-within:ring-emerald-50">
          <textarea
            ref={inputRef}
            id="ride-message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            rows={2}
            maxLength={1500}
            placeholder="De onde você sai, quando e que horas?"
            className="max-h-28 min-h-11 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-slate-400"
          />
          <button
            disabled={busy || message.trim().length < 4}
            aria-label="Enviar mensagem"
            className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#174b38] text-white transition hover:bg-[#103b2b] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send size={17} />
          </button>
        </div>
        <p className="mt-2 text-center text-[10px] text-slate-400">
          A resposta pode levar alguns segundos.
        </p>
      </form>
    </section>
  );
}

function PhoneButton({ text }: { text: string }) {
  return <div className="flex flex-wrap gap-2">{extractPhones(text).map((phone) => (
    <a
      key={phone}
      href={`https://wa.me/${phone}`}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#e9f6ed] px-3 py-2 text-xs font-bold text-emerald-900 hover:bg-[#d8efdf]"
    >
      <MessageCircle size={14} /> WhatsApp: +{phone}
    </a>
  ))}</div>;
}
