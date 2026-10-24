"use client";
import { useActionState, useEffect, useState } from "react";
import { submitMessage, type SubmitState } from "@/app/(site)/actions";

type Props = { kind: "letter" | "comment"; targetType?: "volume" | "post"; targetSlug?: string; title: string; cta: string };

export default function MessageForm({ kind, targetType, targetSlug, title, cta }: Props) {
  const [state, action, pending] = useActionState<SubmitState, FormData>(submitMessage, undefined);
  const [ts, setTs] = useState("");
  const [round, setRound] = useState(0);
  useEffect(() => { setTs(String(Date.now())); }, [round]);
  useEffect(() => { if (state?.ok) setRound((r) => r + 1); }, [state]);

  const v = state?.values ?? {};
  return (
    <form action={action} className="mform" key={round} aria-labelledby={`mf-${kind}-${targetSlug ?? "x"}`}>
      <h3 id={`mf-${kind}-${targetSlug ?? "x"}`}>{title}</h3>
      <input type="hidden" name="kind" value={kind} />
      {targetType && <input type="hidden" name="targetType" value={targetType} />}
      {targetSlug && <input type="hidden" name="targetSlug" value={targetSlug} />}
      <input type="hidden" name="ts" value={ts} />
      {/* champ piège pour les robots : invisible, jamais rempli par un humain */}
      <div className="hp" aria-hidden><label>Ne pas remplir<input type="text" name="website" tabIndex={-1} autoComplete="off" /></label></div>

      <div className="mf-row">
        <label><span>Prénom ou pseudo</span><input name="name" required maxLength={60} autoComplete="nickname" defaultValue={v.name} /></label>
        {kind === "letter" && <label><span>Objet (facultatif)</span><input name="subject" maxLength={120} defaultValue={v.subject} /></label>}
      </div>
      <label><span>{kind === "letter" ? "Ta lettre" : "Ton commentaire"}</span><textarea name="body" rows={kind === "letter" ? 7 : 4} required minLength={10} maxLength={1500} defaultValue={v.body} /></label>
      <label><span>E-mail (facultatif, jamais affiché : pour te répondre en privé)</span><input name="email" type="email" maxLength={200} autoComplete="email" defaultValue={v.email} /></label>
      <p className="mf-note">Ton message est relu avant d'être publié. Pas de liens, merci.</p>
      {state?.error && <p className="mf-error" role="alert">{state.error}</p>}
      {state?.ok && <p className="mf-ok" role="status">Merci ! Ton message est bien arrivé : il sera visible après relecture.</p>}
      <button className="btn" disabled={pending}>{pending ? "Envoi…" : cta}</button>
    </form>
  );
}
