import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import type { Conversation, Message, Profile } from "../lib/types";
import { timeAgo } from "../lib/utils";

export default function Messages() {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const [conv, setConv] = useState<Conversation | null>(null);
  const [other, setOther] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !session) return;
    (async () => {
      const { data: c } = await supabase
        .from("conversations")
        .select("*, listing:game_listings(*), buyer:profiles!buyer_id(*), seller:profiles!seller_id(*)")
        .eq("id", id)
        .maybeSingle();
      if (!c) { setLoading(false); return; }
      const cnv = c as unknown as Conversation;
      setConv(cnv);
      const otherId = cnv.buyer_id === session.user.id ? cnv.seller_id : cnv.buyer_id;
      setOther((cnv.buyer_id === otherId ? (cnv as any).buyer : (cnv as any).seller) as Profile);
      const { data: msgs } = await supabase.from("messages").select("*").eq("conversation_id", id).order("created_at", { ascending: true });
      setMessages((msgs as Message[]) ?? []);
      setLoading(false);
      bottomRef.current?.scrollIntoView();
    })();
  }, [id, session]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !session || !id) return;
    const body = text.trim();
    setText("");
    const { data } = await supabase
      .from("messages")
      .insert({ conversation_id: id, sender_id: session.user.id, body })
      .select("*")
      .maybeSingle();
    if (data) setMessages((prev) => [...prev, data as Message]);
    bottomRef.current?.scrollIntoView();
  }

  if (loading) return <div className="grid min-h-[60vh] place-items-center"><Loader2 size={24} className="animate-spin text-primary-400" /></div>;
  if (!conv) return <div className="p-8 text-center text-ink-400">Conversation not found.</div>;

  return (
    <div className="mx-auto flex h-[80vh] max-w-2xl flex-col px-4 py-6">
      <div className="mb-3 flex items-center gap-3">
        <Link to={conv.listing ? `/listing/${conv.listing.id}` : "/browse"} className="rounded-lg p-2 text-ink-400 hover:bg-ink-800 hover:text-white"><ArrowLeft size={18} /></Link>
        <div>
          <p className="font-display text-sm font-bold text-white">{other?.full_name ?? "User"}</p>
          <p className="text-xs text-ink-500">{conv.listing?.title ?? "Conversation"}</p>
        </div>
      </div>

      <div className="card flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {messages.map((m) => {
            const mine = m.sender_id === session?.user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-primary-500 text-white" : "bg-ink-800 text-ink-100"}`}>
                  <p>{m.body}</p>
                  <p className={`mt-0.5 text-[10px] ${mine ? "text-primary-100/70" : "text-ink-500"}`}>{timeAgo(m.created_at)}</p>
                </div>
              </div>
            );
          })}
          {messages.length === 0 && <p className="py-10 text-center text-sm text-ink-500">No messages yet. Say hello!</p>}
          <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={send} className="mt-3 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message…" className="input" />
        <button type="submit" disabled={!text.trim()} className="btn-primary"><Send size={16} /></button>
      </form>
    </div>
  );
}
