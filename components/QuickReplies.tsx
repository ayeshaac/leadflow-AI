"use client";

export default function QuickReplies({ options, onSelect }: { options: string[]; onSelect: (option: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          className="rounded-full border border-lime-300/30 bg-lime-300/[0.06] px-3 py-2 text-left text-xs font-medium text-lime-200 transition hover:border-lime-300 hover:bg-lime-300 hover:text-black"
          key={option}
          onClick={() => onSelect(option)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}
