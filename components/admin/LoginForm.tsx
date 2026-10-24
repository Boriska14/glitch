"use client";
import { useActionState } from "react";
import { login } from "@/app/admin/actions";

export default function LoginForm({ withEmail, ready }: { withEmail: boolean; ready: boolean }) {
  const [state, action, pending] = useActionState(login, undefined);
  return (
    <form action={action} className="adm-card login">
      <h1>Espace privé</h1>
      <p className="adm-muted">Connexion réservée à l'éditrice de GLITCH.</p>
      {withEmail && (
        <>
          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" autoComplete="username" required autoFocus />
        </>
      )}
      <label htmlFor="password">Mot de passe</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required autoFocus={!withEmail} />
      {!ready && <p className="adm-error" role="alert">Supabase n'est pas encore relié : renseigne <code>content/supabase.json</code> (voir le README, étape 3).</p>}
      {state?.error && <p className="adm-error" role="alert">{state.error}</p>}
      <button className="adm-btn primary" disabled={pending}>{pending ? "Connexion…" : "Se connecter"}</button>
    </form>
  );
}
