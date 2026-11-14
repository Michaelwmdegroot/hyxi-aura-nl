import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ENERGY_MODES, energyScenario, modeAtHour } from './energy-model.mjs';

/**
 * An illustrative architectural model. All consumer explanations and controls
 * stay in semantic HTML outside the canvas. No WebGL or animation is necessary
 * to understand or operate the page.
 */
export async function mountEnergyScene(container, { onReady = () => {}, onError = () => {}, canvas: suppliedCanvas = null, context: suppliedContext = null } = {}) {
  if (!(container instanceof HTMLElement)) throw new TypeError('A scene container is required');
  let renderer;
  try {
    const renderingCanvas = suppliedCanvas || document.createElement('canvas');
    const context = suppliedContext || renderingCanvas.getContext('webgl2', { antialias: true, alpha: true, powerPreference: 'low-power' });
    if (!context) {
      onError(new Error('WebGL2 is unavailable; use the architectural illustration'));
      return null;
    }
    renderer = new THREE.WebGLRenderer({ canvas: renderingCanvas, context, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch (error) {
    onError(error);
    return null;
  }

  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  canvas.setAttribute('role', 'presentation');
  canvas.dataset.energyCanvas = '';
  Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block', pointerEvents: 'none' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0xffffff, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Architecture and light direction stay still: render the shadow map once.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-5, 5, 4, -4, 0.1, 60);
  camera.position.set(8.4, 6.6, 9.6);
  camera.lookAt(0, 0.8, 0);

  const model = new THREE.Group();
  model.position.set(-0.15, 0, -0.15);
  scene.add(model);

  const materials = new Set();
  const geometries = new Set();
  const material = (color, options = {}) => {
    const value = new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0, ...options });
    materials.add(value);
    return value;
  };
  const basic = (color, options = {}) => {
    const value = new THREE.MeshBasicMaterial({ color, ...options });
    materials.add(value);
    return value;
  };
  const mesh = (geometry, mat, parent = model) => {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, mat);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  };
  const box = (w, h, d, mat, x, y, z, parent = model, radius = 0) => {
    const object = mesh(radius ? new RoundedBoxGeometry(w, h, d, 2, radius) : new THREE.BoxGeometry(w, h, d), mat, parent);
    object.position.set(x, y, z);
    return object;
  };
  const cylinder = (top, bottom, h, mat, x, y, z, parent = model, segments = 24) => {
    const object = mesh(new THREE.CylinderGeometry(top, bottom, h, segments), mat, parent);
    object.position.set(x, y, z);
    return object;
  };

  const stucco = material('#f4f1e9');
  const stone = material('#e3dac9');
  const path = material('#e9e2d4');
  const dark = material('#272b2b');
  const roof = material('#383d3d');
  const ridge = material('#4d5250');
  const oak = material('#b6916e');
  const lawn = material('#b9c0a5');
  const leaf = material('#8a9774');
  const leafLight = material('#a4af8b');
  const trunk = material('#9d8064');
  const planter = material('#d5cec0');
  const solarGlass = material('#213b47', { metalness: 0.35, roughness: 0.28 });
  const solarFrame = material('#4a5659', { metalness: 0.45, roughness: 0.38 });
  const solarWire = material('#6d8790', { metalness: 0.1, roughness: 0.6 });
  const glass = material('#617c7f', { metalness: 0.15, roughness: 0.25, emissive: '#eab77b', emissiveIntensity: 0.12 });
  const windowGlow = material('#d8bea0', { emissive: '#ffba70', emissiveIntensity: 0.22, roughness: 0.8 });
  const batteryMat = material('#282d2d', { metalness: 0.24, roughness: 0.36 });
  const batteryBand = material('#444b48', { metalness: 0.3, roughness: 0.3 });
  const batteryLight = material('#78c99c', { emissive: '#78c99c', emissiveIntensity: 1.2 });

  // Pale stone foundation with a bevel catches the light like an architectural maquette.
  box(7.1, 0.22, 5.7, stone, 0, -0.12, 0.2, model, 0.13);
  box(6.87, 0.035, 5.46, path, 0, 0.008, 0.2, model, 0.08);
  box(2.1, 0.035, 4.5, lawn, -2.36, 0.034, 0.04, model, 0.08);
  box(0.75, 0.035, 2.17, lawn, 2.86, 0.035, -1.27, model, 0.07);

  // The house front is +Z; the PV slope and battery sit on the visible +X side.
  const house = new THREE.Group();
  house.position.set(-0.25, 0, -0.38);
  model.add(house);
  box(3.28, 0.14, 3, stone, 0, 0.11, 0, house, 0.03);
  box(3.18, 1.7, 2.83, stucco, 0, 1.03, 0, house);
  const frontGable = new THREE.Shape();
  frontGable.moveTo(-1.59, 0);
  frontGable.lineTo(1.59, 0);
  frontGable.lineTo(0, 1.04);
  frontGable.closePath();
  const gable = mesh(new THREE.ExtrudeGeometry(frontGable, { depth: 2.83, bevelEnabled: false }), stucco, house);
  gable.position.set(0, 1.88, -1.415);

  const slope = Math.atan2(1.1, 1.85);
  const roofLength = Math.hypot(1.85, 1.1);
  for (const side of [-1, 1]) {
    const sheet = box(roofLength, 0.095, 3.22, roof, side * 0.925, 2.41, 0, house);
    sheet.rotation.z = -side * slope;
    // Slender standing seams add definition without loading any textures.
    for (let z = -1.47; z < 1.55; z += 0.29) {
      const seam = box(roofLength - 0.025, 0.014, 0.014, ridge, side * 0.925, 2.463, z, house);
      seam.rotation.z = -side * slope;
    }
    box(0.07, 0.12, 3.28, dark, side * 1.86, 1.87, 0, house);
  }
  box(0.09, 0.08, 3.28, dark, 0, 2.995, 0, house);

  // Six framed PV modules with visible cell subdivisions.
  const panels = new THREE.Group();
  panels.position.set(0.97, 2.47, 0);
  panels.rotation.z = -slope;
  house.add(panels);
  for (const x of [-0.47, 0.47]) {
    for (const z of [-0.96, 0, 0.96]) {
      box(0.86, 0.055, 0.88, solarFrame, x, 0, z, panels, 0.01);
      box(0.81, 0.014, 0.83, solarGlass, x, 0.034, z, panels, 0.005);
      for (let n = 1; n < 5; n++) box(0.003, 0.003, 0.81, solarWire, x - 0.405 + n * 0.162, 0.044, z, panels);
      for (let n = 1; n < 5; n++) box(0.81, 0.003, 0.003, solarWire, x, 0.044, z - 0.415 + n * 0.166, panels);
    }
  }

  // Tall glazing, recessed front door, timber slats and detailed frames.
  box(1.51, 1.32, 0.055, dark, 0.55, 0.91, 1.437, house);
  box(1.36, 1.17, 0.025, glass, 0.55, 0.92, 1.475, house);
  box(0.048, 1.25, 0.07, dark, 0.55, 0.92, 1.5, house);
  box(0.05, 1.25, 0.07, dark, 0.08, 0.92, 1.5, house);
  box(0.05, 1.25, 0.07, dark, 1.02, 0.92, 1.5, house);
  box(1.54, 0.055, 0.15, stone, 0.55, 0.25, 1.48, house);
  box(0.62, 1.34, 0.07, dark, -0.96, 0.91, 1.45, house);
  box(0.52, 1.24, 0.025, oak, -0.96, 0.91, 1.493, house);
  for (let n = 0; n < 8; n++) box(0.011, 1.22, 0.012, trunk, -1.18 + n * 0.064, 0.91, 1.51, house);
  box(0.022, 0.20, 0.032, dark, -0.78, 0.93, 1.53, house);
  box(0.68, 0.07, 0.32, dark, -0.96, 1.64, 1.52, house);
  box(0.46, 0.46, 0.06, dark, 0, 2.13, 1.44, house);
  box(0.35, 0.35, 0.02, glass, 0, 2.13, 1.48, house);
  box(0.035, 0.36, 0.03, dark, 0, 2.13, 1.5, house);
  box(0.36, 0.035, 0.03, dark, 0, 2.13, 1.5, house);
  // Side room, visible to the right of the entry facade.
  box(0.05, 1.05, 0.87, dark, 1.61, 0.99, -0.57, house);
  box(0.025, 0.92, 0.74, glass, 1.646, 0.99, -0.57, house);
  box(0.05, 0.96, 0.035, dark, 1.67, 0.99, -0.57, house);
  box(0.05, 0.035, 0.77, dark, 1.67, 1.02, -0.57, house);
  for (let z = -1.35; z < -1.02; z += 0.07) box(0.035, 1.42, 0.028, oak, 1.62, 0.96, z, house);
  // A wall light, downpipe and entry paving make the miniature feel inhabited.
  box(0.075, 0.18, 0.07, dark, -0.5, 1.13, 1.48, house);
  box(0.052, 0.105, 0.015, windowGlow, -0.5, 1.13, 1.521, house);
  cylinder(0.027, 0.027, 1.63, dark, 1.58, 1.02, 1.44, house, 12);
  for (let z = 1.55; z < 2.75; z += 0.37) box(0.73, 0.035, 0.29, stone, -1.21, 0.048, z, model, 0.02);
  box(0.83, 0.08, 0.45, stone, -1.21, 0.09, 1.22, model, 0.025);

  // Illustrative modular battery. The exact product is shown elsewhere via HYXI imagery.
  const batteryGroup = new THREE.Group();
  batteryGroup.position.set(1.66, 0.05, 0.53);
  model.add(batteryGroup);
  box(0.47, 0.08, 0.64, batteryBand, 0, 0.05, 0, batteryGroup, 0.035);
  for (let n = 0; n < 3; n++) {
    box(0.44, 0.27, 0.58, batteryMat, 0, 0.235 + n * 0.275, 0, batteryGroup, 0.035);
    box(0.004, 0.012, 0.48, batteryBand, 0.224, 0.23 + n * 0.275, 0, batteryGroup);
  }
  box(0.44, 0.24, 0.58, batteryMat, 0, 1.00, 0, batteryGroup, 0.035);
  box(0.009, 0.018, 0.30, batteryLight, 0.226, 1.01, 0, batteryGroup, 0.006);
  box(0.011, 0.055, 0.11, batteryBand, 0.225, 1.075, 0, batteryGroup, 0.006);

  const shrub = (x, z, scale = 1, parent = model) => {
    cylinder(0.15 * scale, 0.13 * scale, 0.24 * scale, planter, x, 0.14 * scale, z, parent);
    const foliage = mesh(new THREE.IcosahedronGeometry(0.25 * scale, 2), leafLight, parent);
    foliage.position.set(x, 0.38 * scale, z);
    foliage.scale.y = 0.85;
  };
  shrub(-1.88, 1.36, 0.85);
  shrub(0.91, 1.4, 0.85);
  shrub(2.88, -2.08, 1.15);
  const tree = (x, z, scale = 1) => {
    cylinder(0.035 * scale, 0.06 * scale, 1.25 * scale, trunk, x, 0.66 * scale, z, model, 10);
    const crown = mesh(new THREE.IcosahedronGeometry(0.66 * scale, 2), leaf, model);
    crown.position.set(x, 1.58 * scale, z);
    crown.scale.set(0.85, 1.12, 0.85);
    const highlight = mesh(new THREE.IcosahedronGeometry(0.40 * scale, 1), leafLight, model);
    highlight.position.set(x - 0.2 * scale, 1.82 * scale, z + 0.12 * scale);
    cylinder(0.38 * scale, 0.38 * scale, 0.045, stone, x, 0.06, z, model);
  };
  tree(-2.65, -1.7, 0.93);
  tree(-2.65, 1.55, 0.67);
  // Low boundary slats, kept below the house rather than hiding it.
  for (let n = 0; n < 20; n++) box(0.07, 0.42, 0.045, oak, -3.22 + n * 0.13, 0.27, -2.37, model, 0.008);
  box(2.55, 0.045, 0.045, oak, -1.99, 0.47, -2.37, model);

  // A small grid terminal gives the flow an unambiguous endpoint.
  const gridGroup = new THREE.Group();
  gridGroup.position.set(2.78, 0.04, 1.94);
  model.add(gridGroup);
  cylinder(0.29, 0.31, 0.07, stone, 0, 0.03, 0, gridGroup);
  cylinder(0.18, 0.18, 0.025, dark, 0, 0.08, 0, gridGroup);
  for (const x of [-0.075, 0.075]) box(0.04, 0.24, 0.04, dark, x, 0.22, 0, gridGroup, 0.005);
  box(0.26, 0.04, 0.04, dark, 0, 0.29, 0, gridGroup, 0.005);
  box(0.19, 0.04, 0.04, dark, 0, 0.22, 0, gridGroup, 0.005);

  const flowRoot = new THREE.Group();
  model.add(flowRoot);
  const colorEnergy = '#ef7444';
  const colorGrid = '#8b9b9a';
  const makeFlow = (points, color = colorEnergy) => {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'catmullrom', 0.2);
    const idleMat = basic('#b7b5a8', { transparent: true, opacity: 0.38 });
    const activeMat = basic(color, { transparent: true, opacity: 0.8 });
    const idle = mesh(new THREE.TubeGeometry(curve, 48, 0.012, 5, false), idleMat, flowRoot);
    idle.castShadow = false;
    const active = mesh(new THREE.TubeGeometry(curve, 48, 0.022, 6, false), activeMat, flowRoot);
    active.castShadow = false;
    const dots = Array.from({ length: 3 }, (_, n) => {
      const dot = mesh(new THREE.SphereGeometry(0.046, 9, 7), basic(color), flowRoot);
      dot.castShadow = false;
      dot.position.copy(curve.getPoint(n / 3));
      return dot;
    });
    return { curve, active, dots, enabled: false, reverse: false };
  };
  const flows = {
    solarHouse: makeFlow([[0.65, 2.74, 0.72], [1.17, 2.1, 1.34], [1.04, 1.35, 1.48], [0.62, 1.05, 1.47]]),
    solarBattery: makeFlow([[0.78, 2.63, -0.25], [1.62, 2.05, 0.2], [1.95, 1.46, 0.53], [1.89, 1.03, 0.53]]),
    batteryHouse: makeFlow([[1.93, 0.30, 0.79], [2.15, 0.11, 1.0], [2.02, 0.10, 1.61], [1.40, 0.10, 1.88], [0.61, 0.15, 1.67], [0.61, 0.60, 1.16]]),
    gridHouse: makeFlow([[2.76, 0.12, 1.94], [2.50, 0.11, 2.15], [1.70, 0.11, 2.30], [0.65, 0.11, 2.16], [0.61, 0.6, 1.16]], colorGrid),
  };

  const hemi = new THREE.HemisphereLight('#fff8e8', '#bdc1b0', 2.7);
  scene.add(hemi);
  const sunlight = new THREE.DirectionalLight('#fff0d8', 3.2);
  sunlight.position.set(-3, 9, 5);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(1024, 1024);
  sunlight.shadow.camera.left = -6;
  sunlight.shadow.camera.right = 6;
  sunlight.shadow.camera.top = 6;
  sunlight.shadow.camera.bottom = -6;
  sunlight.shadow.camera.near = 0.5;
  sunlight.shadow.camera.far = 20;
  sunlight.shadow.normalBias = 0.025;
  sunlight.shadow.bias = -0.00012;
  sunlight.shadow.radius = 4;
  scene.add(sunlight);
  const fill = new THREE.DirectionalLight('#dbe7ed', 0.7);
  fill.position.set(7, 5, -5);
  scene.add(fill);

  // A very light contact shadow grounds the entire model on the page.
  const shadowMat = new THREE.ShadowMaterial({ color: '#8a8375', opacity: 0.12 });
  materials.add(shadowMat);
  const shadow = mesh(new THREE.PlaneGeometry(30, 30), shadowMat, scene);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.24;
  shadow.castShadow = false;

  let mode = 'solar';
  let batteryEnabled = true;
  let destroyed = false;
  let visible = true;
  let contextLost = false;
  let animationFrame = 0;
  let lastFrame = 0;
  let phase = 0;
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reducedMotion = motionQuery.matches;

  const render = () => {
    if (!destroyed && !contextLost) renderer.render(scene, camera);
  };
  const activeAnimation = () => !destroyed && visible && !document.hidden && !reducedMotion && !contextLost;
  const tick = time => {
    animationFrame = 0;
    if (!activeAnimation()) return;
    // 30fps is plenty for gently moving energy dots, and halves mobile GPU work.
    if (time - lastFrame >= 32) {
      phase += Math.min((time - lastFrame) / 1000 || 0, 0.1) * 0.22;
      lastFrame = time;
      for (const flow of Object.values(flows)) {
        if (!flow.enabled) continue;
        flow.dots.forEach((dot, index) => {
          const t = (phase + index / 3) % 1;
          dot.position.copy(flow.curve.getPoint(flow.reverse ? 1 - t : t));
        });
      }
      render();
    }
    animationFrame = window.requestAnimationFrame(tick);
  };
  const syncAnimation = () => {
    if (!activeAnimation()) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    } else if (!animationFrame) {
      lastFrame = performance.now();
      animationFrame = window.requestAnimationFrame(tick);
    }
  };
  const update = () => {
    const energy = energyScenario(mode, batteryEnabled);
    for (const flow of Object.values(flows)) { flow.enabled = false; flow.reverse = false; }
    if (mode === 'solar') {
      flows.solarHouse.enabled = true;
      flows.solarBattery.enabled = batteryEnabled;
      flows.gridHouse.enabled = !batteryEnabled;
      flows.gridHouse.reverse = !batteryEnabled;
    } else {
      flows.batteryHouse.enabled = batteryEnabled;
      flows.gridHouse.enabled = mode === 'evening' && !batteryEnabled;
    }
    for (const flow of Object.values(flows)) {
      flow.active.visible = flow.enabled;
      flow.dots.forEach(dot => { dot.visible = flow.enabled; });
    }
    const night = mode !== 'solar';
    sunlight.color.set(night ? '#dce5f4' : '#fff0d8');
    sunlight.intensity = night ? 1.05 : 3.2;
    hemi.color.set(night ? '#dbe5f3' : '#fff8e8');
    hemi.intensity = night ? 1.9 : 2.7;
    fill.intensity = night ? 1.1 : 0.7;
    glass.color.set(night && energy.home ? '#d2a978' : '#617c7f');
    glass.emissiveIntensity = night && energy.home ? 0.7 : 0.12;
    windowGlow.emissiveIntensity = energy.home ? (night ? 1.1 : 0.22) : 0;
    batteryLight.color.set(batteryEnabled ? (mode === 'backup' ? '#f2a66e' : '#78c99c') : '#4a514d');
    batteryLight.emissive.set(batteryEnabled ? (mode === 'backup' ? '#f2a66e' : '#78c99c') : '#000000');
    gridGroup.visible = true;
    canvas.dataset.mode = mode;
    canvas.dataset.battery = String(batteryEnabled);
    render();
    syncAnimation();
  };
  const resize = () => {
    if (destroyed) return;
    const { width, height } = container.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    const aspect = width / height;
    const viewHeight = Math.max(6.2, 8.6 / aspect);
    camera.left = -viewHeight * aspect / 2;
    camera.right = viewHeight * aspect / 2;
    camera.top = viewHeight / 2;
    camera.bottom = -viewHeight / 2;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    render();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  const intersectionObserver = new IntersectionObserver(entries => {
    visible = entries[0]?.isIntersecting ?? false;
    syncAnimation();
  }, { rootMargin: '40px' });
  intersectionObserver.observe(container);
  const onVisibility = () => syncAnimation();
  const onMotion = event => { reducedMotion = event.matches; syncAnimation(); render(); };
  const onContextLost = event => {
    event.preventDefault();
    contextLost = true;
    syncAnimation();
    canvas.style.visibility = 'hidden';
    onError(new Error('WebGL context unavailable'));
  };
  const onContextRestored = () => {
    contextLost = false;
    canvas.style.visibility = 'visible';
    renderer.shadowMap.needsUpdate = true;
    update();
    onReady();
  };
  document.addEventListener('visibilitychange', onVisibility);
  motionQuery.addEventListener('change', onMotion);
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  container.append(canvas);
  resize();
  update();
  onReady();

  return {
    setMode(next) {
      if (!ENERGY_MODES.includes(next)) throw new RangeError('Unknown energy scenario');
      if (destroyed) return;
      mode = next;
      update();
    },
    setBattery(enabled) {
      if (destroyed) return;
      batteryEnabled = Boolean(enabled);
      update();
    },
    setTime(hour) {
      if (destroyed) return;
      mode = modeAtHour(hour);
      update();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery.removeEventListener('change', onMotion);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      for (const geometry of geometries) geometry.dispose();
      for (const mat of materials) mat.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
