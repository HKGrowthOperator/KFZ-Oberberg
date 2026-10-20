# KFZ Oberberg – Webseite (Entwurf)

Statische Seite, ohne Build-Schritt. Einfach den Ordner auf einen Webspace laden.

| Datei / Ordner | Inhalt |
|---|---|
| `index.html` | Die Seite |
| `styles.css` | Gestaltung |
| `main.js` | Öffnungszeiten-Status, HU-Plakette, Formular, Einblenden beim Scrollen (ohne Bibliotheken) |
| `img/` | Platzhalter-Fotos (CC0, siehe `img/BILDNACHWEIS.tsv`) |
| `video/` | Hero-Film fürs Web (`hero.mp4` Desktop, `hero-mobil.mp4`, `hero-poster.jpg`) |
| `film/` | HyperFrames-Projekt, aus dem der Hero-Film gerendert wird |

## Hero-Film neu rendern (HyperFrames)

```bash
cd film
npx hyperframes check                     # prüfen
npx hyperframes render -f 30 -q high -o renders/hero-master.mp4
# Web-Fassungen erzeugen
ffmpeg -i renders/hero-master.mp4 -an -vf scale=1600:-2 -c:v libx264 -crf 26 -movflags +faststart ../video/hero.mp4
ffmpeg -i renders/hero-master.mp4 -an -vf scale=960:-2  -c:v libx264 -crf 28 -movflags +faststart ../video/hero-mobil.mp4
ffmpeg -ss 0.5 -i renders/hero-master.mp4 -frames:v 1 -vf scale=1600:-2 ../video/hero-poster.jpg
```

Echte Fotos: in `film/assets/` mit gleichem Dateinamen ersetzen und neu rendern.

## Vor dem Livegang

- Alle gelb markierten Platzhalter ersetzen (Telefon, Adresse, E-Mail, Zeiten, Zahlen, Über-uns-Text, Zitat)
- Öffnungszeiten zusätzlich in `main.js` (`OPEN`) eintragen
- Formular an einen Formular-Dienst anbinden (aktuell öffnet es nur das E-Mail-Programm)
- `impressum.html` und `datenschutz.html` anlegen
- Platzhalter-Fotos durch echte Fotos des Betriebs ersetzen
- Google Fonts (Barlow, Barlow Condensed, JetBrains Mono) für DSGVO lokal einbinden
- Festpreis-Tabelle, Team und Über-uns-Text mit echten Angaben füllen; Ort (hier "Gummersbach") bestätigen
