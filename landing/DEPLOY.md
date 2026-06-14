# Cloudflare Pages — getdossier.co

Deploy the static landing (single HTML file).

## Option A — Git connect (recommended)

1. Push this repo to GitHub.
2. Cloudflare Dashboard → Workers & Pages → Create → Connect to Git.
3. **Build settings**
   - Framework preset: None
   - Build command: *(leave empty)*
   - Build output directory: `landing`
4. Custom domains → add `getdossier.co` and `www.getdossier.co`.
5. DNS at Cloudflare: apex `A`/`AAAA` or CNAME to Pages (wizard handles this).

## Option B — Wrangler CLI

```bash
npm i -g wrangler
wrangler pages deploy landing --project-name=getdossier
```

## Before go-live

- Default Cal.com link: `preframe/30min` (no env vars required).
- Optional separate Zoom/Teams events:
  - `VITE_CAL_ZOOM_LINK` — e.g. `preframe/zoom-30`
  - `VITE_CAL_TEAMS_LINK` — e.g. `preframe/teams-30`
- In Cal.com, enable Zoom + Teams as locations on the event so clients can pick during booking.
- Optional: run `npx tsx scripts/export-landing-openers.ts` in RunDossier to paste real anonymized openers from your DB.

## Cal.com — notifications hôte (`ara@getdossier.co`)

Quand quelqu’un réserve via l’embed, **Cal.com envoie automatiquement** un courriel à l’organisateur (vous) et un au client. Ce n’est pas géré par le code du landing — c’est la configuration du compte Cal.com `preframe`.

### 1. Adresse de notification (obligatoire)

1. Connectez-vous à [app.cal.com](https://app.cal.com) avec le compte **preframe**.
2. **Settings → My Account → Email** (ou Profile).
3. Mettez **`ara@getdossier.co`** comme courriel principal du compte (ou ajoutez-le et vérifiez-le si Cal.com permet plusieurs adresses).
4. Sauvegardez et confirmez le lien de vification envoyé à cette boîte.

Sans cette étape, les notifications partent vers l’ancien courriel du compte (ex. celui de Joe Hader).

### 2. Activer les courriels de réservation

1. **Settings → Notifications**.
2. Activez les notifications par courriel pour :
   - **New booking** (nouvelle réservation)
   - **Reschedule** (report)
   - **Cancellation** (annulation)
3. Vérifiez aussi l’événement **30 Min Meeting** (`preframe/30min`) → **Advanced** → les rappels / confirmations hôte ne doivent pas être désactivés.

### 3. Contenu du courriel (ce que vous recevrez)

Cal.com inclut en général dans le courriel organisateur :

- Date et heure (fuseau du client + le vôtre)
- Nom et courriel du participant
- Lieu (Zoom, Teams, lien de visio)
- Lien pour rejoindre / gérer la réservation (reporter, annuler)

### 4. Test rapide

1. Réservez un créneau test avec une autre adresse courriel.
2. Vérifiez la boîte **`ara@getdossier.co`** (et les spams).
3. Le client doit recevoir sa propre confirmation.

### 5. (Optionnel) Courriel depuis `@getdossier.co`

Pour que l’expéditeur affiche `noreply@getdossier.co` ou similaire, il faut **SMTP personnalisé** (fonctionnalité organisation Cal.com). Sinon les courriels viennent de Cal.com — le contenu et la destination restent corrects.

### Profil public

Mettez aussi le profil Cal.com à jour : **Ara Ghahramanyan**, sans photo (**Settings → Profile**), pour cohérence avec le site.

## Remplacer Joe Hader — vous seul comme hôte (capture d’écran confirmation)

Si la page de confirmation affiche encore :

- *« 30 Min Meeting between **Joe Hader** and … »*
- **Host:** Joe Hader (`joe@preframe.co`)
- **Where:** Cal Video (sans lien Zoom/Teams)

→ ce n’est **pas** le site `getdossier.co`, c’est le **compte Cal.com `preframe`** qui appartient encore à Joe. Le code de l’embed ne peut pas changer le nom de l’hôte.

### Étape A — Votre identité (une seule personne : vous)

1. [app.cal.com](https://app.cal.com) → compte **preframe** (identifiants de Joe ou invitation équipe).
2. **Settings → Profile**
   - **Name:** `Ara Ghahramanyan`
   - **Email:** `ara@getdossier.co` (vérifier le lien de confirmation)
   - **Avatar:** supprimer la photo
   - **Username:** garder `preframe` ou passer à `getdossier` si vous préférez (mettre à jour `DEFAULT_CAL_LINK` dans `landing/src/lib/cal.js` si le username change).
3. Si **Joe Hader** apparaît comme membre d’équipe : **Settings → Teams / Members** → retirer Joe ou transférer la propriété du compte à vous.
4. Événement **30 Min Meeting** → onglet **Assignment** / hôte : **vous seul** (pas de round-robin, pas de co-hôte Joe).

Après sauvegarde, les confirmations doivent afficher :

- **Host:** Ara Ghahramanyan (`ara@getdossier.co`)
- Titre du type : *« … with Ara Ghahramanyan »* (le client est l’invité, pas vous).

### Étape B — Lien de réunion Zoom / Teams (pas Cal Video)

1. **App Store** → installer **Zoom** et **Microsoft Teams** ([guide Zoom](https://cal.com/help/event-types/adding-zoom)).
2. Ouvrir l’événement **`preframe/30min`** → **Location**.
3. **Retirer** « Cal Video ».
4. **Ajouter** « Zoom Video » et/ou « Microsoft Teams » (le client choisit à la réservation).
5. **Save**.

Chaque réservation génère alors un **lien de visio unique** dans la confirmation, les courriels et le fichier calendrier (.ics).

### Étape C — Titre personnalisé (optionnel)

Événement **30 Min Meeting** → **Advanced** → **Custom event name** :

```text
Dossier fit call — {Scheduler} & {Organiser}
```

ou simplement :

```text
{Event type title} with {Organiser}
```

(`{Organiser}` = Ara Ghahramanyan une fois le profil mis à jour.)

### Étape D — Vérification

1. Réserver un créneau test avec un courriel **autre** que le vôtre (vous êtes l’hôte, pas l’invité).
2. La confirmation doit montrer **vous** comme host, **le client** comme guest, et **Zoom/Teams** avec lien cliquable.
3. Vérifier **`ara@getdossier.co`** pour le courriel organisateur.

### Si vous n’avez pas accès au compte `preframe`

Créez un compte Cal.com à votre nom (`getdossier` ou `ara-ghahramanyan`), recréez l’événement 30 min, puis dites-moi le slug — nous mettrons à jour `preframe/30min` dans le code.
