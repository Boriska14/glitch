import { formatDate } from "@/lib/volumes";
import type { Note } from "@/lib/types";

const TONES = ["cobalt", "rust", "sand", "red"] as const;

export default function NoteCards({ notes }: { notes: Note[] }) {
  return (
    <ul className="pins">
      {notes.map((n, i) => (
        <li key={n.id} className={`pin ${TONES[i % TONES.length]}`}>
          <p className="pin-text">{n.text}</p>
          <p className="pin-meta">
            <time dateTime={n.date}>{formatDate(n.date)}</time>
            {n.url && <a href={n.url} target="_blank" rel="noopener noreferrer">Sur Substack ↗</a>}
          </p>
        </li>
      ))}
    </ul>
  );
}
