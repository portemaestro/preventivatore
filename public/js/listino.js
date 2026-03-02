// Caricamento parallelo dati listino dal backend
import { api } from './api.js';
import { getStato, setListino, setListinoCaricato } from './stato.js';

/**
 * Carica tutti i dati del listino in parallelo
 * Usa cache in memoria: se già caricato non rifà le chiamate
 */
export async function caricaListino() {
    const stato = getStato();
    if (stato.listinoCaricato) return;

    const chiamate = [
        { chiave: 'blindati', endpoint: '/listino/blindati' },
        { chiave: 'telai', endpoint: '/listino/telai' },
        { chiave: 'rivestimenti.laminati', endpoint: '/listino/rivestimenti/laminati' },
        { chiave: 'rivestimenti.impiallacciati', endpoint: '/listino/rivestimenti/impiallacciati' },
        { chiave: 'rivestimenti.stratificati', endpoint: '/listino/rivestimenti/stratificati' },
        { chiave: 'rivestimenti.okoume', endpoint: '/listino/rivestimenti/okoume' },
        { chiave: 'rivestimenti.alluminio', endpoint: '/listino/rivestimenti/alluminio' },
        { chiave: 'rivestimenti.pvc', endpoint: '/listino/rivestimenti/pvc' },
        { chiave: 'optional', endpoint: '/listino/optional' },
        { chiave: 'trasporto', endpoint: '/listino/trasporto' },
        { chiave: 'supplementi', endpoint: '/listino/supplementi' }
    ];

    const risultati = await Promise.all(
        chiamate.map(c => api.get(c.endpoint).catch(err => {
            console.error(`Errore caricamento ${c.chiave}:`, err);
            return null;
        }))
    );

    risultati.forEach((dati, i) => {
        if (dati) {
            setListino(chiamate[i].chiave, dati);
        }
    });

    setListinoCaricato();
    console.log('Listino caricato completamente');
}
