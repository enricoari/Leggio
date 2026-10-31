# Leggio d'insieme

Web app per suonare insieme: chi organizza sceglie un brano dalla cartella Google Drive, gli altri entrano col codice o col QR, e al via il PDF della parte di ognuno scorre a tempo su tutti i telefoni.

Funziona su iPhone e Android, senza account. Si installa da Safari con **Aggiungi alla schermata Home**.

---

## 1. Pubblicarla su GitHub Pages (una volta)

1. Su github.com premi **New repository**. Chiamalo per esempio `leggio`, lascialo **Public** e premi **Create repository**.
2. Nella pagina del repository premi **uploading an existing file**. Trascina **tutto il contenuto** di questa cartella (`index.html`, `app.js`, `config.js`, `sw.js`, `manifest.webmanifest`, `.nojekyll`, la cartella `icons`) e premi **Commit changes**.
   - Se il file `.nojekyll` non si vede nel Finder o in Esplora risorse, non è un problema: serve solo a velocizzare la pubblicazione.
3. Vai in **Settings → Pages**. In *Build and deployment* scegli **Deploy from a branch**, branch **main**, cartella **/ (root)**, e premi **Save**.
4. Dopo 1–2 minuti l'app è online all'indirizzo `https://TUONOME.github.io/leggio/`.

## 2. Creare la chiave API di Google (una volta, 5 minuti)

La chiave serve all'app per leggere la tua cartella Drive condivisa. È gratuita.

1. Vai su <https://console.cloud.google.com> con il tuo account Google.
2. In alto premi il selettore dei progetti, poi **Nuovo progetto**. Chiamalo `Leggio` e premi **Crea**.
3. Dal menu apri **API e servizi → Libreria**, cerca **Google Drive API** e premi **Abilita**.
4. Apri **API e servizi → Credenziali → Crea credenziali → Chiave API**. Copia la chiave (inizia con `AIza…`).
5. Premi **Modifica chiave API** e limitala, così funziona solo con la tua app:
   - **Restrizioni dell'applicazione:** *Siti web*, aggiungi `https://TUONOME.github.io/*`
   - **Restrizioni delle API:** *Limita chiave*, seleziona solo **Google Drive API**
   - Premi **Salva**. Le restrizioni possono metterci qualche minuto ad attivarsi.

## 3. Preparare la cartella su Drive

La struttura attesa:

```
Leggio/                     ← cartella principale
├── Inno alla gioia/        ← una cartella per brano
│   ├── Clarinetto 1.pdf    ← un PDF per parte
│   ├── Tromba.pdf
│   └── Basso.pdf
└── Fra Martino/
    └── ...
```

1. Tasto destro sulla cartella principale → **Condividi** → in *Accesso generale* scegli **Chiunque abbia il link** (Visualizzatore).
2. Copia il link.

Dal nome del file l'app capisce lo strumento: "Clarinetto", "Cl. Sib", "Tromba", "Sax alto", "Basso", ecc. Se non lo riconosce, lo cambi tu dall'app.

## 4. Scrivere chiave e cartella in `config.js`

Su GitHub apri `config.js`, premi la matita ✏️, compila e premi **Commit changes**:

```js
window.LEGGIO_CONFIG = {
  apiKey: "AIzaSy...la-tua-chiave",
  folder: "https://drive.google.com/drive/folders/1AbC..."
};
```

In alternativa puoi inserirle dall'app, in **Brano → Impostazioni di Drive**. Vale però solo per quel telefono.

## 5. Installarla sull'iPhone

1. Apri `https://TUONOME.github.io/leggio/` con **Safari**.
2. Tocca **Condividi** (il quadrato con la freccia) → **Aggiungi alla schermata Home**.
3. Da quel momento si apre dall'icona, a schermo intero.

---

## Come si usa

**Chi organizza**
1. Scrive il nome, sceglie lo strumento e preme **Crea una sessione**.
2. Preme **Brano**, sceglie il brano dall'elenco di Drive e preme **Apri**. Alla prima apertura l'app scarica le parti e trova i righi e le stanghette.
3. Controlla le parti: quelle con **In tempo** sono a posto. Una parte con **+3 battute** o simile va aperta con **Controlla** per correggere i righi. Di solito sono pause di più battute, che vanno contate per intero.
4. Imposta BPM, tempo in chiave e battuta di partenza.
5. Tocca il **codice** in alto a sinistra per mostrare il QR agli altri.
6. Preme **Avvia**. Parte una battuta di conteggio, poi lo spartito scorre per tutti. **Stop** ferma tutti.

**Chi suona**
1. Inquadra il QR con la fotocamera, oppure apre l'app e scrive il codice.
2. Scrive il nome, sceglie lo strumento e preme **Entra**.
3. Riceve da solo il PDF del suo strumento. Dalle impostazioni (icona con i cursori) può cambiare parte, grandezza, modo di scorrimento e PDF in negativo.

**Consigli**
- **Orientamento:** in orizzontale i righi scorrono uno dopo l'altro; in verticale la pagina sale riga per riga.
- **Sincronia:** se un telefono sembra in ritardo o in anticipo, sistemalo con **Correzione sincronia** nelle impostazioni.
- **Audio:** su iPhone il metronomo si sente solo se il tasto silenzioso laterale è spento e dopo aver toccato lo schermo una volta.

## Limiti da sapere

- **Ritornelli, D.C. e Coda non sono seguiti:** l'app legge il PDF dall'alto in basso. Per i brani con ritornelli serve una versione "srotolata".
- **Serve internet** su tutti i telefoni (va bene il 4G): per scaricare i PDF da Drive e per mettere in contatto i telefoni. Una volta scaricato, il PDF resta salvato sul telefono.
- **Reti che bloccano il collegamento diretto:** i telefoni si collegano direttamente a quello di chi organizza, attraverso il servizio gratuito PeerJS. Alcune reti mobili o Wi-Fi aziendali bloccano questo tipo di collegamento. Se un telefono non entra, mettete tutti sullo stesso Wi-Fi o sull'hotspot di chi organizza.
- **Scansioni:** i PDF esportati da MuseScore, Finale o Sibelius vengono letti bene. Le scansioni storte o sbiadite possono dare un numero di battute sbagliato, che si corregge con **Controlla**.
- **Un PDF modificato su Drive viene riletto da zero:** le correzioni fatte con **Controlla** valgono per quella versione del file.

## File

| File | Cosa fa |
|---|---|
| `index.html` | Pagina e stile |
| `app.js` | Tutta la logica: Drive, lettura dei PDF, sessione, scorrimento, metronomo |
| `config.js` | Chiave API e cartella Drive |
| `sw.js` | Rende l'app installabile e veloce da riaprire |
| `manifest.webmanifest`, `icons/` | Nome e icona dell'app |

Librerie usate, caricate da CDN: pdf.js 3.11.174, PeerJS 1.5.4, qrcode-generator 1.4.4.
