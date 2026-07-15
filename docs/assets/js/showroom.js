/* ELFATINA — Abaya Design Studio
   Full-orbit 3D viewer + live fabric/trim customizer + design snapshot. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const PRESETS = {
  sahara: {
    name: "عباية الصحراء",
    desc: "سوداء بامتداد الليل، يشقّها شريط ذهبي مطرز من العنق إلى الأرض.",
    link: "../products/sahara.html",
    fabric: 0x17110c, hijab: 0xd9c8a9, trim: "gold", crystals: false, opening: false, hood: false,
  },
  sakina: {
    name: "عباية السَّكِينة",
    desc: "بيج هادئة بلمسة لؤلؤية — أناقة تهمس ولا تصرخ.",
    link: "../products/sakina.html",
    fabric: 0xe6d5b8, hijab: 0xb09a78, trim: "pearl", crystals: false, opening: false, hood: false,
  },
  fajr: {
    name: "عباية الفجر",
    desc: "رملية بقبعة انسيابية تنسدل كضوء الفجر الأول.",
    link: "../products/fajr.html",
    fabric: 0xcbb391, hijab: 0xcbb391, trim: "none", crystals: false, opening: false, hood: true,
  },
  layl: {
    name: "عباية اللَّيل",
    desc: "سوداء تتلألأ بكريستال مبعثر على الصدر — قطعة السهرة.",
    link: "../products/layl.html",
    fabric: 0x141017, hijab: 0x2a2433, trim: "gold", crystals: true, opening: false, hood: false,
  },
  madina: {
    name: "عباية المدينة",
    desc: "مفتوحة من الأمام: سوادٌ واثق فوق كريمي هادئ.",
    link: "../products/madina.html",
    fabric: 0x1a140f, hijab: 0x0f0b08, trim: "none", crystals: false, opening: true, hood: false,
  },
};

const TRIMS = {
  gold:   { color: 0xd4a03a, metalness: 0.9, roughness: 0.22, emissive: 0x3a2606 },
  silver: { color: 0xd9dde4, metalness: 0.95, roughness: 0.18, emissive: 0x22262c },
  pearl:  { color: 0xfdf6ea, metalness: 0.15, roughness: 0.28, emissive: 0x555044 },
};

const stage = document.getElementById("stage3d");
if (stage) init();

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch (e) {
    stage.innerHTML = '<p class="webgl-fallback">متصفحك لا يدعم العرض ثلاثي الأبعاد — شاهدي الصور في صفحات القطع.</p>';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0.6, 1.9, 5.6);

  // Soft studio reflections make fabric + gold read as real materials
  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.05).texture;
    scene.environmentIntensity = 0.55;
  } catch (e) { /* fall back to lights only */ }

  // Warm boutique lighting
  scene.add(new THREE.AmbientLight(0xffe3c2, 0.25));
  const spot = new THREE.SpotLight(0xffd9a0, 220, 30, Math.PI / 5, 0.5, 1.8);
  spot.position.set(2.4, 7.5, 3.5);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.bias = -0.0004;
  scene.add(spot);
  const rim = new THREE.DirectionalLight(0xd49a3a, 0.9);
  rim.position.set(-4, 3, -4);
  scene.add(rim);

  // Golden podium
  const podium = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.12, 0.16, 96),
    new THREE.MeshStandardMaterial({ color: 0xb07e2e, metalness: 0.8, roughness: 0.28 })
  );
  disc.position.y = 0.08;
  disc.receiveShadow = true;
  podium.add(disc);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.3, 1.38, 0.1, 96),
    new THREE.MeshStandardMaterial({ color: 0x3a2611, metalness: 0.4, roughness: 0.6 })
  );
  base.position.y = -0.05;
  podium.add(base);
  scene.add(podium);

  const mannequin = new THREE.Group();
  mannequin.position.y = 0.16;
  scene.add(mannequin);

  // Slim A-line silhouette (~170cm), smoothed with a spline.
  // Shoulders slope down naturally — no square shelf at the top.
  const RAW = [
    [0.52, 0.0], [0.51, 0.06], [0.4, 0.9], [0.34, 1.55],
    [0.365, 2.0], [0.37, 2.2], [0.31, 2.38], [0.2, 2.5], [0.12, 2.6],
  ];
  const spline = new THREE.CatmullRomCurve3(RAW.map(([r, y]) => new THREE.Vector3(r, y, 0)));
  const profilePts = spline.getPoints(48).map((p) => new THREE.Vector2(Math.max(p.x, 0.001), p.y));
  function radiusAt(y) {
    let best = profilePts[0];
    for (const p of profilePts) if (Math.abs(p.y - y) < Math.abs(best.y - y)) best = p;
    return best.x;
  }

  // Sculpt soft vertical folds into the skirt so it drapes like cloth
  function addFolds(geo, strength) {
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const r = Math.hypot(x, z);
      if (r < 0.02) continue;
      const theta = Math.atan2(x, z);
      const falloff = Math.pow(Math.max(0, (1.25 - y) / 1.25), 1.6);
      const amp = strength * falloff;
      const nr = r + Math.sin(theta * 9) * amp + Math.sin(theta * 4 + 1.7) * amp * 0.5;
      pos.setX(i, Math.sin(theta) * nr);
      pos.setZ(i, Math.cos(theta) * nr);
    }
    geo.computeVertexNormals();
    return geo;
  }

  const SKIN = new THREE.MeshStandardMaterial({ color: 0xdca87e, roughness: 0.75 });

  function fabricMaterial(hex) {
    const c = new THREE.Color(hex);
    const sheenC = c.clone().lerp(new THREE.Color(0xfff2dc), 0.35);
    return new THREE.MeshPhysicalMaterial({
      color: c, roughness: 0.78, metalness: 0.0, side: THREE.DoubleSide,
      sheen: 1.0, sheenRoughness: 0.5, sheenColor: sheenC,
    });
  }

  function buildMannequin(cfg) {
    mannequin.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material.dispose) o.material.dispose();
    });
    mannequin.clear();

    const fabric = fabricMaterial(cfg.fabric);
    const hijabMat = fabricMaterial(cfg.hijab);
    hijabMat.sheenRoughness = 0.35; // silkier headscarf
    const trimMat = cfg.trim !== "none"
      ? new THREE.MeshStandardMaterial({ ...TRIMS[cfg.trim], emissiveIntensity: 0.5 })
      : null;

    // Body with cloth folds; "madina" opens at the front over a cream inner layer
    const phi = cfg.opening ? Math.PI * 2 - 0.7 : Math.PI * 2;
    const bodyGeo = addFolds(new THREE.LatheGeometry(profilePts, 96, 0, phi), 0.028);
    const body = new THREE.Mesh(bodyGeo, fabric);
    if (cfg.opening) {
      body.rotation.y = Math.PI / 2 + 0.35;
      const innerGeo = addFolds(
        new THREE.LatheGeometry(profilePts.map((p) => new THREE.Vector2(p.x * 0.93, p.y)), 64),
        0.02
      );
      const inner = new THREE.Mesh(innerGeo, fabricMaterial(0xe9dcc3));
      inner.castShadow = true;
      mannequin.add(inner);
    }
    body.castShadow = true;
    mannequin.add(body);

    // Sleeves + hands
    [-1, 1].forEach((s) => {
      // arms hang close to the body, slight natural bend forward
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.05, 24), fabric);
      sleeve.position.set(s * 0.37, 1.8, 0.07);
      sleeve.rotation.z = s * 0.11;
      sleeve.rotation.x = -0.06;
      sleeve.castShadow = true;
      mannequin.add(sleeve);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 12), SKIN);
      hand.scale.set(0.85, 1.25, 0.7);
      hand.position.set(s * 0.43, 1.24, 0.12);
      mannequin.add(hand);
    });

    // Head + wrapped hijab: face visible in front, scarf covering the rest
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.145, 24, 18), SKIN);
    head.scale.set(0.9, 1.12, 0.95);
    head.position.set(0, 2.82, 0.03);
    mannequin.add(head);
    // scarf shell sits behind/over the head, leaving the face open
    const hijab = new THREE.Mesh(
      new THREE.SphereGeometry(0.175, 24, 18, Math.PI * 0.65, Math.PI * 1.7),
      hijabMat
    );
    hijab.position.set(0, 2.84, -0.005);
    hijab.scale.set(0.98, 1.14, 1.02);
    hijab.castShadow = true;
    mannequin.add(hijab);
    // wrapped fold framing the face
    const frame = new THREE.Mesh(new THREE.TorusGeometry(0.125, 0.026, 12, 40), hijabMat);
    frame.position.set(0, 2.83, 0.1);
    frame.rotation.x = -0.12;
    mannequin.add(frame);
    // under-chin wrap
    const chin = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.03, 10, 32, Math.PI), hijabMat);
    chin.position.set(0, 2.72, 0.06);
    chin.rotation.x = Math.PI / 2.4;
    chin.rotation.z = Math.PI;
    mannequin.add(chin);
    const drape = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.72, 24, 1, true), hijabMat);
    drape.position.set(0, 2.48, -0.11);
    drape.rotation.x = 0.14;
    mannequin.add(drape);

    if (cfg.hood) {
      const hood = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.48, 24, 1, true), fabric);
      hood.position.set(0, 2.82, -0.15);
      hood.rotation.x = 0.55;
      mannequin.add(hood);
    }

    // Embroidery: bead line down the front + hem/neck rings, in the chosen trim
    if (trimMat) {
      for (let i = 0; i <= 34; i++) {
        const y = 0.06 + (2.55 - 0.06) * (i / 34);
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 6), trimMat);
        bead.position.set(0, y, radiusAt(y) + 0.012);
        mannequin.add(bead);
      }
      const hem = new THREE.Mesh(new THREE.TorusGeometry(0.505, 0.013, 10, 96), trimMat);
      hem.rotation.x = Math.PI / 2;
      hem.position.y = 0.05;
      mannequin.add(hem);
      const neck = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.011, 8, 48), trimMat);
      neck.rotation.x = Math.PI / 2;
      neck.position.y = 2.6;
      mannequin.add(neck);
    }

    // Crystals scattered on the chest
    if (cfg.crystals) {
      const crystal = new THREE.MeshStandardMaterial({
        color: 0xffffff, emissive: 0xfff2cc, emissiveIntensity: 0.9, roughness: 0.15, metalness: 0.6,
      });
      for (let i = 0; i < 46; i++) {
        const y = 1.9 + Math.random() * 0.6;
        const a = (Math.random() - 0.5) * 1.1;
        const r = radiusAt(y) + 0.008;
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.01 + Math.random() * 0.009, 6, 5), crystal);
        dot.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
        mannequin.add(dot);
      }
    }
  }

  // ---------- state + UI ----------
  const state = { ...PRESETS.sahara };
  const nameEl = document.getElementById("sr-name");
  const descEl = document.getElementById("sr-desc");
  const linkEl = document.getElementById("sr-link");
  const presetBtns = document.querySelectorAll("#sr-presets button[data-model]");
  const fabricSw = document.querySelectorAll("#sw-fabric button[data-c]");
  const hijabSw = document.querySelectorAll("#sw-hijab button[data-c]");
  const trimBtns = document.querySelectorAll("#sw-trim button[data-trim]");
  const crystalsBtn = document.getElementById("btn-crystals");
  const pickFabric = document.getElementById("pick-fabric");
  const pickHijab = document.getElementById("pick-hijab");

  function markSwatches() {
    fabricSw.forEach((b) => b.classList.toggle("on", parseInt(b.dataset.c.slice(1), 16) === state.fabric));
    hijabSw.forEach((b) => b.classList.toggle("on", parseInt(b.dataset.c.slice(1), 16) === state.hijab));
    trimBtns.forEach((b) => b.classList.toggle("on", b.dataset.trim === state.trim));
    if (crystalsBtn) crystalsBtn.classList.toggle("on", state.crystals);
  }

  function applyPreset(id) {
    Object.assign(state, PRESETS[id]);
    buildMannequin(state);
    if (nameEl) nameEl.textContent = state.name;
    if (descEl) descEl.textContent = state.desc;
    if (linkEl) { linkEl.href = state.link; linkEl.style.display = ""; }
    presetBtns.forEach((c) => c.classList.toggle("on", c.dataset.model === id));
    markSwatches();
  }

  function customized() {
    buildMannequin(state);
    if (nameEl) nameEl.textContent = "تصميمكِ الخاص ✦";
    if (descEl) descEl.textContent = "قماشكِ، لونكِ، لمساتكِ — عباية لا تشبه إلا أنتِ. احفظي الصورة وأرسليها لنا لنخيطها لكِ.";
    presetBtns.forEach((c) => c.classList.remove("on"));
    markSwatches();
  }

  presetBtns.forEach((c) => c.addEventListener("click", () => applyPreset(c.dataset.model)));
  fabricSw.forEach((b) => b.addEventListener("click", () => { state.fabric = parseInt(b.dataset.c.slice(1), 16); customized(); }));
  hijabSw.forEach((b) => b.addEventListener("click", () => { state.hijab = parseInt(b.dataset.c.slice(1), 16); customized(); }));
  trimBtns.forEach((b) => b.addEventListener("click", () => { state.trim = b.dataset.trim; customized(); }));
  if (crystalsBtn) crystalsBtn.addEventListener("click", () => { state.crystals = !state.crystals; customized(); });
  if (pickFabric) pickFabric.addEventListener("input", () => { state.fabric = parseInt(pickFabric.value.slice(1), 16); customized(); });
  if (pickHijab) pickHijab.addEventListener("input", () => { state.hijab = parseInt(pickHijab.value.slice(1), 16); customized(); });

  // Save the current design as an image
  const saveBtn = document.getElementById("sr-save");
  if (saveBtn) saveBtn.addEventListener("click", () => {
    renderer.setClearColor(0x1a0f06, 1);
    renderer.render(scene, camera);
    const a = document.createElement("a");
    a.href = renderer.domElement.toDataURL("image/png");
    a.download = "elfatina-design.png";
    a.click();
    renderer.setClearColor(0x000000, 0);
  });

  const param = new URLSearchParams(location.search).get("model");
  applyPreset(PRESETS[param] ? param : "sahara");

  // Full orbit: rotate in every direction, zoom, soft damping, auto-spin when idle
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.45, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 2.6;
  controls.maxDistance = 8.5;
  controls.minPolarAngle = Math.PI * 0.12;
  controls.maxPolarAngle = Math.PI * 0.58;
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 1.5;
  let resumeAt = 0;
  controls.addEventListener("start", () => { controls.autoRotate = false; });
  controls.addEventListener("end", () => { resumeAt = performance.now() + 3500; });

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  renderer.setAnimationLoop((t) => {
    if (!controls.autoRotate && resumeAt && t > resumeAt && !reduced) { controls.autoRotate = true; resumeAt = 0; }
    controls.update();
    renderer.render(scene, camera);
  });
}
