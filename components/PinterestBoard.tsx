"use client";
import { useEffect } from "react";
import type { Moodboard } from "@/lib/types";

declare global {
  interface Window { PinUtils?: { build: () => void } }
}

/** Intègre un board Pinterest (widget officiel) + un bouton qui renvoie vers ton compte. */
export default function PinterestBoard({ m }: { m: Moodboard }) {
  useEffect(() => {
    const id = "pinterest-pinit";
    if (document.getElementById(id)) {
      window.PinUtils?.build();
      return;
    }
    const s = document.createElement("script");
    s.id = id;
    s.async = true;
    s.src = "https://assets.pinterest.com/js/pinit.js";
    document.body.appendChild(s);
  }, []);

  return (
    <article className="card moodboard">
      <h3>{m.title}</h3>
      {m.note && <p className="muted">{m.note}</p>}
      <div className="pin-wrap">
        <a
          data-pin-do="embedBoard"
          data-pin-board-width="900"
          data-pin-scale-height="340"
          data-pin-scale-width="115"
          href={m.url}
        >
          {m.title}
        </a>
      </div>
      <a className="btn" href={m.url} target="_blank" rel="noopener noreferrer">Voir le board sur Pinterest ↗</a>
    </article>
  );
}
