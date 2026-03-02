# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Progetto

**Preventivatore** — Applicazione web PHP per generare preventivi di porte blindate per l'azienda **Metal 4.0 srls / Maestro Blindati** (Martina Franca, TA).

## Lingua

Il progetto è in italiano. Commenti, variabili e comunicazione con l'utente devono essere in italiano.

## Contesto aziendale

L'azienda produce e vende **porte blindate** (marchio "Maestro Blindati"). I preventivi vengono emessi ai rivenditori/clienti B2B (serramentisti, falegnamerie, ecc.) con numerazione progressiva (attualmente dal 6419 al 7839+). La cartella `Nuova cartella/` contiene 1270 preventivi PDF esistenti (tutti analizzati).

**Statistiche chiave (su 1270 preventivi analizzati):**
- 7% preventivi con porte multiple (fino a 18 pz per posizione)
- ~5% senza sconto (vendite dirette/promozioni speciali)
- Fatturato medio per preventivo: €1.000-€5.000 (range €500-€18.000)

## Struttura preventivo

Ogni preventivo ha questa struttura fissa:

### Intestazione
- Dati azienda: Metal 4.0 srls, Via Mottola Km 2.200 Z.I., 74015 Martina Franca (TA)
- Dati cliente: Ragione sociale, Rif., CAP/Città, Indirizzo, P.IVA
- Metadati: Numero preventivo, Data, Agenzia, Responsabile, Pagamento, Destinazione

### Posizioni (righe del preventivo)
Ogni posizione ha: Numero, Disegno, Descrizione prodotto, Pz, Prezzo, Sconto, Netto, Totale

Le posizioni tipiche includono:

1. **Blindato** (prodotto principale):
   - **Modelli cerniere a vista**: BPlus (classe 3, ~80% dei preventivi), MagnumC4 (classe 4), Rotox (classe 4), Rotox Vista (classe 4), Glass Plus (classe 3, con sfinestratura)
   - **Modelli cerniere a scomparsa**: Complanare (classe 3), Moving (classe 3), Planamuro (classe 3). Hanno telaio dedicato (Telaio Complanare / Telaio Plana / Telaio 65C). Nota: Moving accetta "Supplemento Rotox Classe 4"
   - **Configurazione ante** (dal più frequente): 1 Anta Spingere Destra (52%), 1 Anta Spingere Sinistra (26%), 2 Ante Asimmetriche Spingere Destra (11%), 2 Ante Asimmetriche Spingere Sinistra (4%), 2 Ante Simmetriche Spingere Destra (2%), 2 Ante Simmetriche Spingere Sinistra (0.3%), 1 Anta Tirare Destra/Sinistra (raro, ~1.7% — richiede optional "Apertura a tirare" €180 + optional "Doppia maniglia passante" €80)
   - **Misure**: "Misura Luce Passaggio" in mm (es. 900 x 2100). Per 2 ante simm./asimm. si specifica "Anta Primaria L. xxx mm" e "Anta Secondaria/Antina L. xxx mm" con supplemento €290 cadauno
   - **Serratura**: Ingranaggi con trappola Antieffrazione (standard), Motorizzata Attuatore X1R (€1.680), Motorizzata Easy X1R (€1.970), Motorizzata Smart X1R (€2.360), Multiservizio (€340), Sblocco Rapido (€110)
   - **Cilindro**: EVO K75 Top Securemme (standard, 5 chiavi + 1 cantiere). Optional: Codolo con pomolino Cromo (€90), EVVA MCS (€700)
   - **Defender**: Cromo Satinato (standard), Bronzo Satinato, Ottone Lucido, Serie Quadra (Cromo/Nero Satinato, Cromo Lucido), Meccanico Rotante (Cromo/Bronzo/Ottone Satinato, €180)
   - **Maniglia Interna**: Alluminio Cromo Satinato (standard), Bronzo Satinato, Ottone Lucido, Serie Quadra (Cromo/Nero Satinato), Esclusa
   - **Pomolo Esterno**: Alluminio Cromo Satinato (standard), Bronzo Satinato, Ottone Lucido, Serie Quadra, Pomolo a Uovo Girevole, Escluso
   - **Limitatore**: Cromo Satinato (standard), Serie Quadra, Escluso
   - **Spioncino**: Compreso (standard), A Parte - No Foro, Escluso, Digitale WiFi (€360)
   - **Soglia**: Mobile Paraspifferi (60%), Fissa in Alluminio (24%), Battuta a pavimento con Coibentazione (10%, +€120), Slim (1.4%)
   - **Optional blindato**: Sfinestratura Rettangolare + Vetro Blindato (1 sfin. €1.060, 2 sfin. €1.590, 3 sfin. €2.120, 4 sfin. €2.650 — vetro Sabbiato 84% o Trasparente 16%), Kit Termico/Trasmittanza Certificata (39% dei prev., da €180 a €660 per varie configurazioni KT001-KT020), Kit Acustico 43,8 dB (5.4%, €360, include kit termico), Apertura a tirare (1.6%, €180), Incontro Elettrico (0.6%, €170 1 anta / €225 2 ante), Predisposto senza rivestimento (9.7%, -€100), Doppia Maniglia Passante (0.5%, €80), Grata per sfinestratura (0.6%, €1.150), Supplemento Rotox Classe 4 (per Moving, €730-€860)

2. **Telaio**:
   - **Modelli**: Telaio 65C (~55%), Telaio Ridotto L (~24%), Telaio Ridotto Z (~16%), Telaio ad Adattare (~6%), Telaio Complanare, Telaio Plana
   - **Colore Interno**: Marrone (standard, gratis), Bianco Simil RAL 9010 (€280 1 anta / €380 2 ante), RAL a Campione (€550/€650)
   - **Colore Esterno**: Marrone (standard, gratis), Bianco Simil RAL 9010, RAL a Campione, "uguale a Interno"
   - **Verniciatura bicolore**: combinazioni diverse int/est con supplementi (vedi pag. 7 listino)
   - **Strutture speciali**: Sopraluce (10.1%, €450 + vetro €400), Fiancoluce (1.3%, monolaterale €630-€850 + vetro €500, bilaterale il doppio), Controtelaio con Guida Cappotto (raro, €110). Il telaio con sopraluce/fiancoluce ha "Misure Struttura" con H/L luce blindato separata

3. **Rivestimento lato interno** (~98% laminato, ~22% okoumè):
   - **Laminato 6mm**: Lisci Lam (standard, gratis con i colori base), Matrix (supplemento €60-€120), Long Life (supplemento €340+)
   - **MDF 7/12mm**: Liscio o pantografato (€400-€580), laccato RAL standard o a campione (+€200)
   - **Okoumè 14mm**: pantografato (€580+), varie essenze e tinte
   - **Impiallacciato 7mm**: Tanganica, Frassino, Ciliegio (€280-€560)
   - Per sfinestrature: tipo "Svetrato" con "Sfinestratura Dritta lato Interno con Fermavetro"

4. **Rivestimento lato esterno** (varie tipologie):
   - **Laminato 6mm**: stessi colori dell'interno (~78%)
   - **Okoumè 14mm** (~20%): pantografato, modelli da catalogo (Ursa, Cassiopea, ecc.), ambiente "Esposto alle intemperie" o "Condominio"
   - **Alluminio Aluform Infinity** (~17%): modelli (Sahara/H, Atacama/H, Gibson/H, Zaffiro, ecc.) con colori RAL e finiture grinz
   - **PVC Linea Classica** (~16%): Liscio o pantografato, colori (Marrone Testa di Moro, Bianco, ecc.)
   - **Bachelite/Stratificato** (~3%): Linea Lisci, colori Raffaello (Verde, Grigio, Marrone)
   - **MDF Laccato** 7/12mm: RAL standard o a campione, fondo da verniciare
   - **Alluminio Linea Europa**: pannelli con modelli da catalogo (Classica), fuori standard

5. **Coprifilo / Imbotte**:
   - **Coprifilo Laminato**: 8cm standard (€130), fino a 20cm
   - **Coprifilo Metallico Piatto**: su 3 lati (€60)
   - **Kit Imbotte Laminato + Coprifili**: fino a 150mm (€405), 151-250mm (€480), 251-350mm ecc.
   - **Kit Imbotte Impiallacciato + Coprifili**: prezzi più alti, stessi scaglioni di profondità
   - **Coprifilo Okoumè/MDF**: 7cm standard (€280+), vari spessori

6. **Maniglione** (presente in ~20% dei preventivi):
   - **Hoppe**: E5726 (dritto, il più usato), E5095 (Athinai curvo), E5091 (Dallas), E5011 (Athinai dritto), E5511. Finiture: Cromo Satinato, Nero Satinato. Varie lunghezze (400-1800mm)
   - **Aluform**: codici A9xx (A95, ecc.), con altezze da 400 a 1700mm

7. **Accessori vari**:
   - **Posa in Opera**: prezzo variabile (€150-€400)
   - **Produzione Express**: Platinum 5gg (€250), Gold 10gg (€140), Silver 15gg (€100) — non scontabile
   - **Kit illuminazione LED**: h.1700 (€380)
   - **Fermapannello Interno**: in legno (€150)
   - **Marketing/Promozioni** (9.5%): posizioni promozionali con prezzo ridotto (es. "Promozione per MAGNUMC4 classe 4" €37)
   - **Proposte Speciali** (5.3%): testo in footer che suggerisce upgrade (es. defender Defendoor, upgrade a Rotox classe 4)
   - **Trasporto come posizione**: nei preventivi grandi, il trasporto può essere una posizione separata ("Trasporto anticipato controtelai" + "Trasporto porte")

8. **Garanzia All Risk**: €18 (1 anta misura standard), €38 (fuori standard o 2 ante) — non scontabile

### Riepilogo economico
- **Totale materiali**: somma di tutte le posizioni scontabili
- **Sconto**: applicato solo sul Totale materiali. Sconti più frequenti: 50% (60%), 50+10% (13%), 50+5% (9%), 40% (2.4%), 30% (2.2%), 45% (1.7%), 50+20% (1.3%), 50+30% (1.2%), 35% (1.2%), 25% (0.9%), 55+5%, 55+20%, 37%, 20%, 50+15% (rari). Nessuno sconto nel 5.5% dei casi. Lo sconto composto "50+10%" significa: prima -50%, poi -10% sul risultato
- **Netto Materiali**: Totale materiali - Sconto
- **Tot. non scontabile**: somma di voci escluse dallo sconto (garanzia, posa in opera, express, marketing)
- **Imballo**: €40 (1 anta standard), €60 (2 ante o fuori standard), €80 (sopraluce/fiancoluce). Può essere omesso
- **Trasporto**: tariffe per regione (Puglia €60-€90, Campania/Basilicata €70-€100, Lazio/Toscana €80-€110, Lombardia €90-€120, Veneto/Sicilia €100-€130, fino a €360 per misure grandi). Mezzo: Corriere, Mittente, o Destinatario. Può essere omesso
- **Imponibile**: Netto Materiali + Tot. non scontabile + Imballo + Trasporto
- **IVA**: 22% sull'Imponibile
- **Totale preventivo**: Imponibile + IVA. Nota: alcuni preventivi mostrano solo Totale materiali + Imponibile senza dettaglio sconto (quando il preventivo è senza sconto, es. per clienti diretti)

### Metadati intestazione
- **Agenzie**: DIREZIONALE (64.5%), SCLAVO MAXIM (13.5%), GUARIENTO MASSIMO (7.5%), BUGLIONI ALESSIO (2.5%), PIPPO MAZZAGLIA (1.7%), BORTOLINI MARIANO (1.4%), LEONE GIANCARLO (0.9%), PRIMAFORMA (0.6%), INFOBOX (0.3%), NUZZI PASQUALE, IVAN DEL NEGRO
- **Responsabile**: sempre "GIUSEPPE"
- **Pagamenti**: 50% ordine - 50% merce pronta (52%), 50% ordine - 50% contrassegno (17%), 50% ordine - 50% RI.BA. 30gg (7%), RI.BA. 60+10 (5%), 50% ordine - 50% Bonifico 60gg (3.5%), 50-30-20 ordine/merce/montaggio (3.3%), 100% all'ordine (2.7%), Rimessa diretta (2.3%), altri rari

### Footer
- Annotazioni: "Trasporto mezzo Corriere (56%)/Destinatario (7%)/Mittente (1.5%)", "Controtelaio Assemblato con la Porta", "Evasione indicativa ordine: XX gg lavorativi" (45gg 32%, 40gg 29%, 35gg 11%, 30gg 11%, 20-25gg rari, 5-15gg con Express)
- Campo firma per accettazione ordine
- Testo promozionale opzionale (Follow Up, Garanzia All Risk)
- Proposte Speciali opzionali in footer (suggerimenti upgrade)
- Note aggiuntive a mano (es. "Fattura solo rivestimento alluminio € xxx", "SUPPLEMENTO PER VERSIONE 2ANTE: + €xxx")

## Listino Prezzi 2025 (24 pagine)

Il file `Listino 2025.pdf` contiene tutti i prezzi di listino IVA esclusa:
- **Pag. 2-5**: Prezzi base blindati (BPlus 1 anta €1.280, 2 ante asimm. €2.370, BPlus+Sopraluce, Glass Plus, MagnumC4, Rotox, Rotox Vista), supplementi fuori standard, prezzi rivestimenti standard e optional
- **Pag. 6**: Supplementi fuori standard per dimensioni, Kit Coibentazione Termica (KT001-KT020), Kit Acustico
- **Pag. 7**: Verniciatura telaio (monocolore/bicolore), Telai ridotti, Telaio ad adattare
- **Pag. 8**: Rivestimenti laminati (lisci, matrix, long life) con codici colore, coprifili laminati, imbotti
- **Pag. 9**: Rivestimenti impiallacciati/laccati, kit imbotte essenze/laccati
- **Pag. 10**: Rivestimenti stratificati per esterni (bachelite)
- **Pag. 11**: Rivestimenti Okoumè (classici, inserti, inox, strange, anticati), maggiorazioni fuori standard
- **Pag. 12**: Kit coprifilo e imbotte Okoumè/MDF, supplementi sfinestrature
- **Pag. 13**: Listino analitico rivestimenti legno (modelli specifici con prezzi)
- **Pag. 14**: Rivestimenti Alluminio Aluform (modelli da catalogo pag. 92-96 con prezzi e maniglioni abbinati)
- **Pag. 15**: Rivestimenti Alluminio Europa, PVC, supplementi sfinestrature
- **Pag. 16**: Sopraluce, fiancoluce, vetri blindati, sfinestrature
- **Pag. 17**: Optional vari (serratura multiservizio, incontro elettrico, sensore allarme, kit maniglieria, grata)
- **Pag. 18**: Defender, pomoli, cilindri, limitatore
- **Pag. 19**: Serrature motorizzate (Attuatore €1.680, Easy €1.970, Smart €2.360), DSMART 2.0
- **Pag. 20-21**: Maniglioni Hoppe e Aluform con tutte le misure e finiture, Kit LED
- **Pag. 22**: Porte con cerniere a scomparsa (Planamuro, Complanare, Moving)
- **Pag. 23**: Tariffe trasporto per regione e imballo

## Struttura directory progetto

```
preventivatore/
├── public/              # Document root del web server (index.php, CSS/JS)
├── src/                 # Logica PHP (classi, funzioni, template)
├── data/                # Dati strutturati estratti dal listino (JSON)
├── assets/              # Risorse statiche (immagini, font)
├── Nuova cartella/      # ~1270 PDF di preventivi esistenti (riferimento)
├── Listino 2025.pdf     # Listino prezzi sorgente (24 pagine)
└── CLAUDE.md
```

## Comandi di sviluppo

PHP non è installato globalmente. Node.js v24.13.0 è disponibile. Per avviare un server di sviluppo PHP, installare un ambiente PHP (es. XAMPP, Laragon) e usare:

```bash
php -S localhost:8000 -t public
```

## Architettura

- **Backend**: PHP puro (no framework). I file in `src/` contengono la logica di business.
- **Frontend**: HTML/CSS/JS serviti da `public/`.
- **Dati**: Il listino prezzi va strutturato in `data/` (formato JSON) per essere utilizzato dall'applicazione.
- **Entry point**: `public/index.php` è il punto di ingresso principale.

## Convenzioni

- Encoding UTF-8 per tutti i file
- Indentazione: 4 spazi
- Nomi file e variabili in snake_case
- Nomi classi in PascalCase
- Prezzi sempre in EUR con 2 decimali, separatore decimale virgola nella UI, punto internamente
- IVA al 22%
