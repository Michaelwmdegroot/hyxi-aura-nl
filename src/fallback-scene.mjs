/**
 * Accessible-page companion for devices without WebGL: an original SVG
 * architectural illustration, driven by the same three teaching scenarios.
 * The surrounding HTML contains the descriptions, values and controls.
 */
let sequence = 0;

export function mountFallbackScene(container) {
  if (!(container instanceof HTMLElement)) throw new TypeError('A fallback scene container is required');
  const id = `aura-house-${++sequence}`;
  const project = (x, y, z) => [420 + (x - z) * 48, 281 + (x + z) * 24 - y * 64];
  const points = values => values.map(value => project(...value).map(n => n.toFixed(2)).join(',')).join(' ');
  const polygon = (values, fill, css = '', more = '') => `<polygon points="${points(values)}" fill="${fill}" class="${css}" ${more}/>`;
  const line = (from, to, stroke, width = 1, css = '') => {
    const [x1, y1] = project(...from); const [x2, y2] = project(...to);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" class="${css}"/>`;
  };
  const top = (x1, z1, x2, z2, y, fill, css = '', more = '') => polygon([[x1,y,z1],[x2,y,z1],[x2,y,z2],[x1,y,z2]], fill, css, more);
  const front = (x1, y1, x2, y2, z, fill, css = '', more = '') => polygon([[x1,y1,z],[x2,y1,z],[x2,y2,z],[x1,y2,z]], fill, css, more);
  const side = (z1, y1, z2, y2, x, fill, css = '', more = '') => polygon([[x,y1,z1],[x,y1,z2],[x,y2,z2],[x,y2,z1]], fill, css, more);
  const cube = (x1, y1, z1, x2, y2, z2, colors, css = '') => `<g class="${css}">${front(x1,y1,x2,y2,z2,colors[0])}${side(z1,y1,z2,y2,x2,colors[1])}${top(x1,z1,x2,z2,y2,colors[2])}</g>`;
  const circleOnFront = (x, y, z, radius, fill, css = '', more = '') => polygon(Array.from({ length: 36 }, (_, n) => { const angle = n / 36 * Math.PI * 2; return [x + Math.cos(angle) * radius, y + Math.sin(angle) * radius, z]; }), fill, css, more);
  const softTree = (x, z, size = 1) => {
    const [baseX, baseY] = project(x, 0, z);
    const [trunkX, trunkY] = project(x, 0.95 * size, z);
    const [leafX, leafY] = project(x, 1.55 * size, z);
    return `<g class="tree"><ellipse cx="${baseX + 8}" cy="${baseY + 3}" rx="${24 * size}" ry="${10 * size}" fill="#757b63" opacity=".12"/><path d="M ${baseX} ${baseY - 1} L ${trunkX} ${trunkY - 12}" stroke="#aa8964" stroke-width="${4.5 * size}" stroke-linecap="round"/><path d="M ${trunkX} ${trunkY + 8} l ${-9 * size} ${-17 * size} M ${trunkX} ${trunkY} l ${9 * size} ${-14 * size}" stroke="#aa8964" stroke-width="${2.2 * size}" stroke-linecap="round"/><ellipse cx="${leafX}" cy="${leafY}" rx="${28 * size}" ry="${39 * size}" fill="url(#${id}-leaf)"/><ellipse cx="${leafX - 10 * size}" cy="${leafY - 7 * size}" rx="${15 * size}" ry="${26 * size}" fill="#c2cba8" opacity=".40"/><path d="M ${leafX - 3 * size} ${leafY + 31 * size} Q ${leafX + 4 * size} ${leafY + 1 * size} ${leafX - 2 * size} ${leafY - 18 * size}" fill="none" stroke="#7f926e" stroke-width="${1.1 * size}" opacity=".35"/></g>`;
  };
  const shrub = (x, z, size = 1) => {
    const [sx, sy] = project(x, 0.17, z);
    return `<g><ellipse cx="${sx}" cy="${sy + 11 * size}" rx="${13 * size}" ry="${6 * size}" fill="#81866e" opacity=".12"/><path d="M ${sx - 11 * size} ${sy} L ${sx - 8 * size} ${sy + 13 * size} Q ${sx} ${sy + 17 * size} ${sx + 8 * size} ${sy + 13 * size} L ${sx + 11 * size} ${sy} Z" fill="#ccc6b9"/><ellipse cx="${sx}" cy="${sy}" rx="${11 * size}" ry="${5 * size}" fill="#e3dfd1"/><ellipse cx="${sx}" cy="${sy - 8 * size}" rx="${12 * size}" ry="${14 * size}" fill="url(#${id}-leaf)"/></g>`;
  };

  // Ground is a cut stone island with subtly bevelled front edges.
  let architecture = `<ellipse cx="433" cy="352" rx="245" ry="88" fill="#788070" opacity=".06" filter="url(#${id}-soft)"/>`;
  architecture += front(-3.4,-0.18,3.4,0,2.7,'#d7d4c7');
  architecture += side(-2.7,-0.18,2.7,0,3.4,'#cbcbbf');
  architecture += top(-3.4,-2.7,3.4,2.7,0,'url(#'+id+'-stone)');
  architecture += top(-3.24,-2.53,-1.98,2.5,0.015,'#bdc8a6','lawn');
  architecture += top(2.5,-2.53,3.24,0.63,0.015,'#c6ceaf','lawn');
  architecture += top(-1.98,-2.53,2.5,-1.85,0.015,'#c1cba9','lawn');
  // Lightly etched paving gives scale without a dense grid.
  for (const z of [1.66, 2.18]) architecture += line([-1.88,.025,z],[3.24,.025,z],'#cfcfc1',.7);
  for (const x of [-.5,.75,2]) architecture += line([x,.025,1.66],[x,.025,2.52],'#d5d4c7',.7);
  architecture += softTree(-2.65,-1.65,.94);
  architecture += shrub(2.86,-2.08,.95);
  for(let x=-3.15;x<-.6;x+=.14) architecture += front(x,.03,x+.055,.38,-2.47,'#b9a17e');
  architecture += line([-3.18,.32,-2.47],[-.65,.32,-2.47],'#b49c77',1.5);

  // House: a compact Dutch gable, clear front and side faces, warm mineral finishes.
  architecture += cube(-1.68,.015,-1.52,1.68,.14,1.52,['#dcd7c9','#c9c9bd','#eee8db']);
  architecture += front(-1.58,.14,1.58,1.91,1.42,'#f1eee3','wall-front');
  architecture += side(-1.42,.14,1.42,1.91,1.58,'#dedfd5','wall-side');
  architecture += polygon([[-1.58,1.91,1.42],[1.58,1.91,1.42],[0,2.94,1.42]],'#f6f2e7','wall-gable');

  // Facade glazing in an inset black frame, oak entrance and a lit wall sconce.
  architecture += front(-.22,.27,1.29,1.52,1.438,'#363b36');
  architecture += front(-.15,.34,1.22,1.45,1.447,`url(#${id}-glass)`,'window');
  architecture += polygon([[-.15,1.42,1.451],[.55,1.42,1.451],[-.15,.69,1.451]],'#fff','reflection','opacity=".11"');
  for (const x of [.29,.75]) architecture += front(x,.31,x+.035,1.48,1.455,'#424942');
  architecture += top(-.27,1.43,1.35,1.59,.25,'#dfd9ca');
  architecture += front(-1.30,.17,-.60,1.56,1.435,'#494c42');
  architecture += front(-1.24,.19,-.66,1.51,1.447,`url(#${id}-oak)`);
  for (let x=-1.19;x<-.69;x+=.085) architecture += line([x,.21,1.454],[x,1.49,1.454],'#957756',.65);
  architecture += front(-.76,.75,-.735,.96,1.464,'#454940');
  architecture += cube(-1.36,1.60,1.42,-.53,1.65,1.76,['#363d37','#303932','#50574b']);
  architecture += front(-.46,1.0,-.37,1.22,1.45,'#464c40');
  architecture += front(-.445,1.03,-.385,1.17,1.456,'#f6c787','sconce');
  architecture += front(-.28,2.05,.28,2.58,1.435,'#454c42');
  architecture += front(-.22,2.11,.22,2.52,1.446,`url(#${id}-glass)`,'window');
  architecture += line([0,2.10,1.453],[0,2.53,1.453],'#434b40',1.5);
  architecture += line([-.23,2.31,1.453],[.23,2.31,1.453],'#434b40',1.5);
  architecture += side(-1.04,.55,-.28,1.44,1.6,'#4a5147');
  architecture += side(-.98,.61,-.34,1.38,1.609,`url(#${id}-glass)`,'window');
  architecture += line([1.617,.59,-.66],[1.617,1.40,-.66],'#414b43',1.6);
  architecture += line([1.617,1.0,-1],[1.617,1.0,-.32],'#414b43',1.4);
  for (let z=-1.36;z< -1.12;z+=.07) architecture += side(z,.20,z+.035,1.62,1.603,'#b39673');
  architecture += line([1.62,.15,1.40],[1.62,1.84,1.40],'#727b67',2);

  // Roof planes and seams; PV uses real panel proportions rather than symbols.
  architecture += polygon([[-1.83,1.80,-1.64],[0,3.01,-1.64],[0,3.01,1.64],[-1.83,1.80,1.64]],'#555d5a','roof-far');
  architecture += polygon([[0,3.01,-1.64],[1.83,1.80,-1.64],[1.83,1.80,1.64],[0,3.01,1.64]],`url(#${id}-roof)`,'roof-near');
  for(let z=-1.50;z<1.55;z+=.3) architecture += line([.02,3.017,z],[1.82,1.824,z],'#687371',.65);
  architecture += line([0,3.02,-1.69],[0,3.02,1.69],'#343f3d',3);
  architecture += line([1.84,1.8,-1.68],[1.84,1.8,1.68],'#39433d',4);
  architecture += line([0,3.02,1.68],[1.85,1.80,1.68],'#323e39',4);
  architecture += line([-1.85,1.80,1.68],[0,3.02,1.68],'#48514a',4);
  const roofY = x => 3.055 - x * (1.21 / 1.83);
  const pvSurface = (x1,z1,x2,z2,fill,more='') => polygon([[x1,roofY(x1),z1],[x2,roofY(x2),z1],[x2,roofY(x2),z2],[x1,roofY(x1),z2]],fill,'',more);
  for(const x of [.18,.93]) for(const z of [-1.36,-.43,.50]) {
    architecture += pvSurface(x,z,x+.66,z+.80,'#263a43','stroke="#90a0a1" stroke-width=".8"');
    architecture += pvSurface(x+.035,z+.035,x+.625,z+.765,`url(#${id}-pv)`);
    for(let n=1;n<4;n++) {
      const xx=x+.035+n*.1475;
      architecture += line([xx,roofY(xx)+.002,z+.035],[xx,roofY(xx)+.002,z+.765],'#647f8b',.45);
      const zz=z+.035+n*.1825;
      architecture += line([x+.035,roofY(x+.035)+.002,zz],[x+.625,roofY(x+.625)+.002,zz],'#647f8b',.45);
    }
    architecture += pvSurface(x+.035,z+.035,x+.19,z+.765,'#afc8cf','opacity=".05"');
  }

  // Three shallow entry steps and a restrained garden edge.
  for(let z=1.65;z<2.6;z+=.31) architecture += cube(-1.30,.025,z,-.56,.065,z+.24,['#cfcabc','#d5d0c1','#ede7d9']);
  architecture += shrub(-1.80,1.64,.76);
  architecture += shrub(1.18,1.66,.72);
  architecture += softTree(-2.72,1.28,.64);

  // Hardware remains schematic; the primary page displays genuine HYXI product photos.
  const batteryX=2.10, batteryZ=.43;
  architecture += cube(batteryX-.30,.025,batteryZ-.27,batteryX+.30,.10,batteryZ+.27,['#c5c6b7','#b5bcb0','#e6e7da']);
  let batteryMarkup = '';
  for(let n=0;n<3;n++) batteryMarkup += cube(batteryX-.27,.12+n*.27,batteryZ-.235,batteryX+.27,.375+n*.27,batteryZ+.235,['#343c37','#282f2e','#4b544c']);
  batteryMarkup += cube(batteryX-.27,.94,batteryZ-.235,batteryX+.27,1.22,batteryZ+.235,['#3b433d','#303834','#596158']);
  batteryMarkup += circleOnFront(batteryX,1.085,batteryZ+.24,.069,'none','battery-light',`stroke="#b7d2aa" stroke-width="1.3"`);
  batteryMarkup += circleOnFront(batteryX,1.085,batteryZ+.245,.023,'#b7d2aa','battery-light');
  batteryMarkup += front(batteryX-.075,.995,batteryX+.075,1.008,batteryZ+.245,'#929b89');
  architecture += `<g class="battery-unit">${batteryMarkup}</g>`;

  // Grid terminal at the front left: intentionally compact, away from the home.
  const [gridX,gridY]=project(-.45,.05,2.55);
  architecture += `<g class="grid-terminal"><ellipse cx="${gridX}" cy="${gridY}" rx="20" ry="10" fill="#d5d8c9"/><ellipse cx="${gridX}" cy="${gridY-3}" rx="15" ry="7" fill="#f0eee4" stroke="#bcc4b2" stroke-width="1"/><g fill="none" stroke="#778575" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M ${gridX-6} ${gridY-7} L ${gridX-3} ${gridY-29} L ${gridX+3} ${gridY-29} L ${gridX+6} ${gridY-7} M ${gridX-10} ${gridY-22} H ${gridX+10} M ${gridX-8} ${gridY-15} H ${gridX+8}"/><path d="M ${gridX-3} ${gridY-25} L ${gridX+4} ${gridY-15} M ${gridX+3} ${gridY-25} L ${gridX-4} ${gridY-15}" stroke-width="1.1"/></g><path class="grid-outage" d="M ${gridX-12} ${gridY-30} L ${gridX+12} ${gridY-6}" stroke="#c3775e" stroke-width="2.5" stroke-linecap="round"/></g>`;

  const smooth = coordinates => {
    const pts=coordinates.map(value=>project(...value));
    let value=`M ${pts[0][0]} ${pts[0][1]}`;
    for(let n=0;n<pts.length-1;n++) {
      const a=pts[Math.max(0,n-1)],b=pts[n],c=pts[n+1],d=pts[Math.min(pts.length-1,n+2)];
      value+=` C ${b[0]+(c[0]-a[0])/6} ${b[1]+(c[1]-a[1])/6} ${c[0]-(d[0]-b[0])/6} ${c[1]-(d[1]-b[1])/6} ${c[0]} ${c[1]}`;
    }
    return value;
  };
  const wires={
    'solar-house':smooth([[1.35,roofY(1.35),1.1],[1.77,1.45,1.46],[1.35,1.02,1.53],[.65,1.0,1.49]]),
    'solar-battery':smooth([[1.50,roofY(1.50),.15],[2.03,1.65,.25],[2.18,1.30,.43],[2.14,1.13,.67]]),
    'battery-house':smooth([[2.1,.28,.69],[2.32,.11,1.02],[2.12,.09,1.86],[1.29,.10,2.02],[.63,.33,1.77],[.63,.84,1.47]]),
    'grid-house':smooth([[-.45,.09,2.50],[.05,.10,2.40],[.60,.12,2.12],[.63,.40,1.76],[.63,.83,1.47]]),
  };
  const wiring=Object.entries(wires).map(([name,path])=>`<path d="${path}" class="wire-idle"/><g class="flow flow-${name}" data-flow="${name}"><path d="${path}" class="wire-active"/><path d="${path}" class="wire-pulse"/></g>`).join('');

  const markup=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 500" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false" class="aura-svg-house" data-mode="solar" data-battery="true" data-paused="false" style="display:block;width:100%;height:100%;overflow:visible">
    <defs>
      <linearGradient id="${id}-stone" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f0ede1"/><stop offset="1" stop-color="#e2e0d3"/></linearGradient>
      <linearGradient id="${id}-roof" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#596463"/><stop offset="1" stop-color="#354340"/></linearGradient>
      <linearGradient id="${id}-pv" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#455c65"/><stop offset=".55" stop-color="#2a424f"/><stop offset="1" stop-color="#324e5b"/></linearGradient>
      <linearGradient id="${id}-glass" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#b7c9c4"/><stop offset=".45" stop-color="#91aaa5"/><stop offset="1" stop-color="#6f8b85"/></linearGradient>
      <linearGradient id="${id}-oak" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#c6ab83"/><stop offset="1" stop-color="#b39168"/></linearGradient>
      <radialGradient id="${id}-leaf" cx=".30" cy=".25" r=".8"><stop stop-color="#bccba1"/><stop offset="1" stop-color="#8c9f7d"/></radialGradient>
      <radialGradient id="${id}-sun"><stop stop-color="#f2ba79" stop-opacity=".35"/><stop offset="1" stop-color="#f2ba79" stop-opacity="0"/></radialGradient>
      <filter id="${id}-soft" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="10"/></filter>
    </defs>
    <style>
      .aura-svg-house .wire-idle{fill:none;stroke:#b7bead;stroke-width:1.5;opacity:.28;stroke-linecap:round}
      .aura-svg-house .wire-active{fill:none;stroke:#e68d64;stroke-width:2.3;opacity:.85;stroke-linecap:round}
      .aura-svg-house .wire-pulse{fill:none;stroke:#f16f3f;stroke-width:4.6;stroke-linecap:round;stroke-dasharray:1 22;animation:${id}-flow 2.6s linear infinite}
      .aura-svg-house .flow-grid-house .wire-active{stroke:#9aac9a}.aura-svg-house .flow-grid-house .wire-pulse{stroke:#819880}
      .aura-svg-house .flow.is-reversed .wire-pulse{animation-direction:reverse}
      .aura-svg-house .grid-outage,.aura-svg-house .moon{display:none}
      .aura-svg-house[data-mode="evening"] .sun,.aura-svg-house[data-mode="backup"] .sun{display:none}
      .aura-svg-house[data-mode="evening"] .moon,.aura-svg-house[data-mode="backup"] .moon{display:block}
      .aura-svg-house[data-mode="evening"] .wall-front,.aura-svg-house[data-mode="backup"] .wall-front{fill:#dce2de}
      .aura-svg-house[data-mode="evening"] .wall-side,.aura-svg-house[data-mode="backup"] .wall-side{fill:#bccbc5}
      .aura-svg-house[data-mode="evening"] .wall-gable,.aura-svg-house[data-mode="backup"] .wall-gable{fill:#e3e6e1}
      .aura-svg-house[data-mode="evening"] .window,.aura-svg-house[data-mode="backup"][data-battery="true"] .window{fill:#e9be87}
      .aura-svg-house[data-mode="backup"][data-battery="false"] .window{fill:#647b78}
      .aura-svg-house[data-mode="backup"][data-battery="false"] .sconce{fill:#788278}
      .aura-svg-house[data-mode="backup"] .grid-outage{display:block}
      .aura-svg-house[data-battery="false"] .battery-unit{opacity:0}
      .aura-svg-house[data-mode="backup"] .battery-light{stroke:#e5ac78;fill:#e5ac78}
      .aura-svg-house .flow[hidden]{display:none}
      .aura-svg-house[data-paused="true"] .wire-pulse{animation-play-state:paused}
      @keyframes ${id}-flow{to{stroke-dashoffset:-46}}
      @media(prefers-reduced-motion:reduce){.aura-svg-house .wire-pulse{animation:none}}
    </style>
    <g class="sun"><circle cx="616" cy="100" r="65" fill="url(#${id}-sun)"/><circle cx="616" cy="100" r="20" fill="#edb87c" opacity=".7"/><circle cx="616" cy="100" r="28" fill="none" stroke="#e9c69b" stroke-width=".7" opacity=".6"/></g>
    <g class="moon"><circle cx="616" cy="100" r="32" fill="#cfdad5" opacity=".20"/><path d="M 625 81 A 21 21 0 1 0 631 115 A 22 22 0 0 1 625 81" fill="#bccbc9"/></g>
    ${architecture}<g class="energy-paths">${wiring}</g>
  </svg>`;
  const document = new DOMParser().parseFromString(markup, 'image/svg+xml');
  if (document.querySelector('parsererror')) throw new Error('The fallback illustration could not be constructed');
  const svg = document.documentElement;
  container.replaceChildren(svg);
  let mode='solar';
  let battery=true;
  let destroyed=false;
  const update=()=>{
    if(destroyed)return;
    svg.dataset.mode=mode;
    svg.dataset.battery=String(battery);
    const visible={ 'solar-house':mode==='solar', 'solar-battery':mode==='solar'&&battery, 'battery-house':mode!=='solar'&&battery, 'grid-house':mode!=='backup'&&!battery };
    svg.querySelectorAll('[data-flow]').forEach(flow=>{
      if(visible[flow.dataset.flow]) flow.removeAttribute('hidden'); else flow.setAttribute('hidden','');
      flow.classList.toggle('is-reversed',flow.dataset.flow==='grid-house'&&mode==='solar');
    });
  };
  let observer;
  let inView=true;
  const visibility=()=>{svg.dataset.paused=String(!inView||globalThis.document.hidden);};
  if('IntersectionObserver' in window){
    observer=new IntersectionObserver(entries=>{inView=entries[0]?.isIntersecting??false;visibility();});
    observer.observe(container);
  }
  globalThis.document.addEventListener('visibilitychange',visibility);
  update();
  return{
    setMode(next){if(!['solar','evening','backup'].includes(next))throw new RangeError('Unknown energy scenario');mode=next;update();},
    setBattery(enabled){battery=Boolean(enabled);update();},
    destroy(){if(destroyed)return;destroyed=true;observer?.disconnect();globalThis.document.removeEventListener('visibilitychange',visibility);svg.remove();},
  };
}
