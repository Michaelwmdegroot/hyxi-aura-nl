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
        noodstroom: resolve(import.meta.dirname, 'kennis/noodstroom/index.html'),
        installatiecheck: resolve(import.meta.dirname, 'kennis/installatiecheck/index.html'),
        faseVergelijking: resolve(import.meta.dirname, 'kennis/1-fase-of-3-fasen/index.html'),
        modellen: resolve(import.meta.dirname, 'modellen/index.html'),
        datasheet: resolve(import.meta.dirname, 'datasheet/index.html'),
        prijs: resolve(import.meta.dirname, 'kennis/prijs-en-installatie/index.html'),
        zonnepanelen: resolve(import.meta.dirname, 'kennis/bestaande-zonnepanelen/index.html'),
        garantie: resolve(import.meta.dirname, 'kennis/garantie/index.html'),
        salderen: resolve(import.meta.dirname, 'kennis/salderingsregeling-2027/index.html'),
        btw: resolve(import.meta.dirname, 'kennis/btw-subsidie/index.html'),
        dynamisch: resolve(import.meta.dirname, 'kennis/dynamisch-energiecontract/index.html'),
        uitbreiden: resolve(import.meta.dirname, 'kennis/uitbreiden/index.html'),
        buiten: resolve(import.meta.dirname, 'kennis/buiten-plaatsen/index.html'),
        compareHub: resolve(import.meta.dirname, 'vergelijken/index.html'),
        hyxiPower: resolve(import.meta.dirname, 'hyxi-power/index.html'),
        capacitySizing: resolve(import.meta.dirname, 'kennis/hoeveel-kwh-nodig/index.html'),
        cloudApp: resolve(import.meta.dirname, 'kennis/app-monitoring/index.html'),
        compare0: resolve(import.meta.dirname, 'vergelijken/hyxi-aura-vs-sigenergy/index.html'),
        compare1: resolve(import.meta.dirname, 'vergelijken/hyxi-aura-vs-alphaess/index.html'),
        compare2: resolve(import.meta.dirname, 'vergelijken/hyxi-aura-vs-tesla-powerwall/index.html'),
        compare3: resolve(import.meta.dirname, 'vergelijken/hyxi-aura-vs-enphase/index.html'),
        compare4: resolve(import.meta.dirname, 'vergelijken/hyxi-aura-vs-huawei/index.html'),
        compare5: resolve(import.meta.dirname, 'vergelijken/hyxi-aura-vs-byd/index.html'),
        compare6: resolve(import.meta.dirname, 'vergelijken/hyxi-aura-vs-solaredge/index.html'),
        compare7: resolve(import.meta.dirname, 'vergelijken/hyxi-aura-vs-ecoflow/index.html'),
        compare8: resolve(import.meta.dirname, 'vergelijken/hyxi-aura-vs-sessy/index.html')
      }
    }
  }
});
