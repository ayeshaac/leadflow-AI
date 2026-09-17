"use client";

import { useEffect, useState } from "react";
import LeadChat from "./LeadChat";

export default function LeadChatLauncher() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleClick = (event: Event) => {
      const target = event.target as HTMLElement;
      const trigger = target.closest("a, button");
      const label = trigger?.textContent?.replace(/\s+/g, " ").trim();
      if (label === "Build Your Agent" || label === "Get Started") {
        event.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return <LeadChat open={open} onClose={() => setOpen(false)} />;
}
