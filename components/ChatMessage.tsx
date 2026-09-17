"use client";

export type ChatRole = "assistant" | "user";

export type ChatMessageData = {
  id: number;
  role: ChatRole;
  text: string;
};

export default function ChatMessage({ message }: { message: ChatMessageData }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex animate-[chat-in_0.3s_ease-out] ${isUser ? "justify-end" : "items-start gap-2"}`}>
      {!isUser && <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime-300 text-[8px] font-black text-black">LF</span>}
      <div className={`max-w-[84%] rounded-2xl px-3.5 py-2.5 text-sm leading-5 ${isUser ? "rounded-tr-sm bg-lime-300 text-black" : "rounded-tl-sm border border-white/10 bg-[#191d1b] text-zinc-200"}`}>
        {message.text}
      </div>
    </div>
  );
}
