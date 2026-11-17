import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    target: 'es2022',
    rolldownOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        privacy: resolve(import.meta.dirname, 'privacy/index.html'),
        bronnen: resolve(import.meta.dirname, 'bronnen/index.html'),
        offerte: resolve(import.meta.dirname, 'offerte/index.html'),
        q7q9: resolve(import.meta.dirname, 'kennis/bat-q7-vs-bat-q9/index.html'),
        noodstroom: resolve(import.meta.dirname, 'kennis/noodstroom/index.html'),
        installatiecheck: resolve(import.meta.dirname, 'kennis/installatiecheck/index.html'),
        faseVergelijking: resolve(import.meta.dirname, 'kennis/1-fase-of-3-fasen/index.html'),
        modellen: resolve(import.meta.dirname, 'modellen/index.html'),
        datasheet: resolve(import.meta.dirname, 'datasheet/index.html'),
        prijs: resolve(import.meta.dirname, 'kennis/prijs-en-installatie/index.html'),
        zonnepanelen: resolve(import.meta.dirname, 'kennis/bestaande-zonnepanelen/index.html'),
        garantie: resolve(import.meta.dirname, 'kennis/garantie/index.html')
      }
    }
  }
});
