# GLITCH Magazine

Site du magazine (Next.js) + espace admin privé (Supabase) : volumes, correspondance, commentaires, notes Substack.
Aucune variable d'environnement Vercel n'est nécessaire.

## Mise en route (≈ 15 minutes)

### 1. Créer le projet Supabase (gratuit)
supabase.com > Sign up > **New project** (région Europe). Note le mot de passe de la base quelque part.

### 2. Créer ton compte admin
Dans le projet : **Authentication > Users > Add user > Create new user** : ton e-mail + un mot de passe solide (12 caractères ou plus), coche **Auto Confirm User**.
C'est avec ce compte que tu te connecteras sur `/admin`.

### 3. Créer les tables
1. Ouvre `supabase/schema.sql`, remplace `TON-EMAIL@exemple.com` (tout en bas) par l'e-mail du compte créé à l'étape 2.
2. Supabase > **SQL Editor > New query**, colle tout le fichier, clique **Run**.
Ça crée les tables, les règles de sécurité (seule toi peux modifier, le public ne peut qu'écrire des messages « en attente ») et le dossier de stockage des couvertures et PDF.

### 4. Relier le site
Supabase > **Project Settings > API** : copie **Project URL** et la clé **anon / publishable**, puis colle-les dans `content/supabase.json` (sur GitHub : ouvrir le fichier > crayon > Commit).
Ces deux valeurs sont publiques par conception. **Ne colle jamais la clé `service_role`.**

### 5. Verrouiller les inscriptions
Supabase > **Authentication > Sign In / Providers** : désactive **Allow new users to sign up**.

### 6. Déployer
Le commit de l'étape 4 redéploie le site sur Vercel. Va sur `ton-site.vercel.app/admin` et connecte-toi.

## Ce que fait l'admin
- **Volumes** : créer / modifier ; couverture et PDF (50 Mo max par fichier sur le plan gratuit) ; sommaire, accroches, playlists Spotify, moodboards Pinterest. Statuts : *Brouillon privé* → *Bientôt* → *Publié*.
- **Messages** : boîte de réception de la correspondance et des commentaires. Publier, refuser, répondre publiquement, supprimer. Les e-mails des lecteurs ne sont visibles que par toi.
- **Notes** : ajout manuel de tes notes Substack (l'import automatique est tenté en plus).
- **Réglages** : adresse Substack (avec test), pseudo pour les Notes, sujet du volume pour la correspondance, liens Spotify / Pinterest / Instagram, changement de mot de passe.

## Bon à savoir
- Un projet Supabase gratuit est **mis en pause après 7 jours sans activité** : le site continue d'afficher ses pages mais l'admin, les messages et les volumes de la base sont indisponibles tant que tu ne le réactives pas (bouton « Restore » dans Supabase). Un passage sur le site chaque semaine suffit en général.
- Mot de passe oublié : Supabase > Authentication > Users > ton compte > **Send password recovery** (ou définis-en un nouveau).
- Substack : les articles viennent du flux RSS (repli : API publique). Les Notes n'ont pas d'API officielle : l'import automatique peut ne pas fonctionner, d'où l'ajout manuel.

## Développement local
`npm install && ADMIN_PASSWORD=motdepasse123 npm run dev` : sans Supabase, les données sont gardées dans `.data/` (mot de passe unique, pour tester seulement).
Les volumes du dossier `content/volumes/*.json` restent pris en compte ; ceux de la base les remplacent à numéro égal.
