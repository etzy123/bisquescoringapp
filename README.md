# Bisque Golf App

Live golfscores voor je flight: handicaps volgens WHS, meerdere spelvormen tegelijk
(Stableford, Strokeplay, Matchplay, Skins, 4BBB Stableford en Mexicanen) en een stand
die op ieders telefoon direct meeloopt.

## Wat zit erin

| Bestand | Wat het doet |
|---|---|
| `server.js` | Node-server: serveert de app, bewaart rondes in Postgres en stuurt wijzigingen live door via WebSockets |
| `courses.js` | De banen die bij de eerste start worden toegevoegd (gele tee heren) |
| `public/index.html` | De app zelf |
| `public/manifest.webmanifest`, `public/sw.js`, `public/icons/` | Maken er een installeerbare app (PWA) van |

## Online zetten op Railway

Je hebt een gratis GitHub-account en een Railway-account nodig.

### 1. Zet de code op GitHub

1. Ga naar github.com, klik op **New repository**, noem hem `bisque-golf-app` en maak hem aan (privé mag).
2. Klik op de pagina van de nieuwe repository op **uploading an existing file**.
3. Pak de zip uit en sleep **de inhoud** van de map `bisque-golf-app` naar het uploadvenster
   (dus `server.js`, `package.json`, de map `public`, enzovoort; niet de map zelf).
4. Klik op **Commit changes**.

### 2. Maak het project op Railway

1. Ga naar railway.com en log in met je GitHub-account.
2. Klik op **New Project** en kies **Deploy from GitHub repo**. Kies `bisque-golf-app`.
   Railway herkent zelf dat het een Node-app is en start hem met `npm start`.
3. Klik in hetzelfde project op **+ New** (of **Create**) en kies **Database** en daarna **PostgreSQL**.

### 3. Koppel de database en stel de groepscode in

1. Klik op de app-service (niet de database) en open **Variables**.
2. Voeg toe:
   - `DATABASE_URL` met als waarde `${{Postgres.DATABASE_URL}}`
     (Railway vult dit aan; heet je database-service anders, gebruik dan die naam).
   - `ACCESS_CODE` met een code naar keuze, bijvoorbeeld `birdie2026`.
     Iedereen moet deze code één keer invoeren. Laat je hem weg, dan kan iedereen met de link erin.
3. Railway start de app opnieuw. In de **Deployments**-log zie je `Draait op poort …`.

### 4. Maak een webadres aan

1. Open bij de app-service **Settings** en dan **Networking**.
2. Klik op **Generate Domain**. Je krijgt een adres zoals `bisque-golf-app-production.up.railway.app`.
3. Open dat adres. De zes banen staan er al in.

## Op je telefoon zetten

- **iPhone (Safari):** open het adres, tik op het deel-icoon en kies **Zet op beginscherm**.
- **Android (Chrome):** open het adres, tik op de drie puntjes en kies **App installeren** of **Toevoegen aan startscherm**.

De app opent daarna schermvullend met een eigen icoon.

## Delen met je flight

Stuur het webadres en de groepscode. Of gebruik in een ronde de knop **Deel deze ronde**:
dan gaan je medespelers direct naar die ronde. Wie de code invoert, kan scores invoeren
en ziet alles live.

Tip: met `?code=JOUWCODE` achter het adres (bijvoorbeeld
`https://…railway.app/?code=birdie2026`) hoeft iemand de code niet zelf te typen.
Deel zo'n link alleen met je eigen groep.

## Slecht bereik op de baan

De app blijft openen zonder verbinding. Scores die je invoert terwijl je even geen bereik
hebt, worden opnieuw verstuurd zodra de verbinding terug is. Bovenin zie je **Live** of
**Offline**. Laat de app open tot er weer **Live** staat voordat je hem afsluit.

## Banen aanpassen of toevoegen

- In de app: kies bij een nieuwe ronde een baan, pas tees, par of stroke index aan en start
  de ronde. De aangepaste baan wordt bewaard.
- Of vooraf: zet de baan in `courses.js`. Nieuwe banen worden bij de volgende start toegevoegd;
  bestaande banen in de database worden niet overschreven.

Controleer course rating en slope altijd op de officiële scorekaart van de club.

## Lokaal testen

```bash
npm install
npm start
```

Open daarna `http://localhost:3000`. Zonder `DATABASE_URL` bewaart de server alles in het
geheugen; dat is handig om te proberen, maar de data verdwijnt bij een herstart.
