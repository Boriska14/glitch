"use client";
import { useActionState, useState, useTransition } from "react";
import { saveSettings, testSubstack, changePassword, type SubstackTest } from "@/app/admin/actions";
import type { SiteConfig } from "@/lib/types";

export default function SettingsForm({ site, canChangePassword }: { site: SiteConfig; canChangePassword: boolean }) {
  const [state, action, pending] = useActionState(saveSettings, undefined);
  const [pw, pwAction, pwPending] = useActionState(changePassword, undefined);
  const [url, setUrl] = useState(/VOTRE-/.test(site.substackUrl) ? "" : site.substackUrl);
  const [test, setTest] = useState<SubstackTest | undefined>();
  const [testing, startTest] = useTransition();
  const shown = state?.test ?? test;
  const ph = (v: string) => (/VOTRE-/.test(v) ? "" : v);

  return (
    <>
      <form action={action} className="vform">
        <fieldset className="adm-card">
          <legend>Substack</legend>
          <label>
            <span className="label">Adresse de ta newsletter</span>
            <input name="substackUrl" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://monnom.substack.com" inputMode="url" />
            <span className="adm-muted small">Colle l'adresse de ta page Substack (ou juste « monnom »). Un domaine personnalisé fonctionne aussi.</span>
          </label>
          <button type="button" className="adm-btn" disabled={testing} onClick={() => startTest(async () => setTest(await testSubstack(url)))}>
            {testing ? "Test en cours…" : "Tester la connexion"}
          </button>
          {shown && (
            <div className={`adm-note ${shown.ok ? "ok" : "bad"}`} role="status">
              <strong>{shown.ok ? "Connecté" : "Échec"}</strong> · {shown.message}
              {shown.titles && <ul>{shown.titles.map((t) => <li key={t}>{t}</li>)}</ul>}
            </div>
          )}
          <label>
            <span className="label">Pseudo Substack (pour importer tes Notes)</span>
            <input name="substackHandle" defaultValue={site.substackHandle ?? ""} placeholder="monpseudo" />
            <span className="adm-muted small">Laisse vide pour utiliser le début de l'adresse ci-dessus. Tu peux aussi ajouter des notes à la main dans l'onglet Notes.</span>
          </label>
        </fieldset>

        <fieldset className="adm-card">
          <legend>Correspondance</legend>
          <label>
            <span className="label">Sujet du volume (affiché au-dessus du formulaire)</span>
            <input name="letterTopic" defaultValue={site.letterTopic ?? ""} maxLength={140} placeholder="La fois où j'en ai trop dit" />
          </label>
        </fieldset>

        <fieldset className="adm-card">
          <legend>Tes comptes</legend>
          <label><span className="label">Profil Spotify</span><input name="spotifyProfileUrl" defaultValue={ph(site.spotifyProfileUrl)} placeholder="https://open.spotify.com/user/…" inputMode="url" /></label>
          <label><span className="label">Compte Pinterest</span><input name="pinterestProfileUrl" defaultValue={ph(site.pinterestProfileUrl)} placeholder="https://www.pinterest.com/ton-compte/" inputMode="url" /></label>
          <label><span className="label">Instagram (facultatif)</span><input name="instagramUrl" defaultValue={site.instagramUrl ?? ""} placeholder="https://www.instagram.com/…" inputMode="url" /></label>
        </fieldset>

        {state?.error && <p className="adm-error box" role="alert">{state.error}</p>}
        {state?.ok && <p className="adm-note ok" role="status">Réglages enregistrés. Le site est mis à jour.</p>}
        <div className="savebar"><button className="adm-btn primary" disabled={pending}>{pending ? "Enregistrement…" : "Enregistrer"}</button></div>
      </form>

      {canChangePassword && (
        <form action={pwAction} className="adm-card">
          <h2>Changer mon mot de passe</h2>
          <label><span className="label">Nouveau mot de passe (12 caractères minimum)</span><input type="password" name="password" autoComplete="new-password" minLength={12} required /></label>
          <label><span className="label">Confirmer</span><input type="password" name="confirm" autoComplete="new-password" minLength={12} required /></label>
          {pw?.error && <p className="adm-error" role="alert">{pw.error}</p>}
          {pw?.ok && <p className="adm-note ok" role="status">Mot de passe modifié.</p>}
          <button className="adm-btn" disabled={pwPending}>{pwPending ? "…" : "Modifier"}</button>
        </form>
      )}
    </>
  );
}
