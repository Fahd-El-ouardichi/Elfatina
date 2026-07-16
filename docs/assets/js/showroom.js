/* ELFATINA — Abaya Design Studio
   Boutique dress-form mannequin + optional GLB designs + live fabric/trim customizer.

   TO LOAD YOUR OWN 3D DESIGNS:
   1. Put the file in  docs/assets/models/   e.g.  sahara.glb
   2. Set  file: "../assets/models/sahara.glb"  on the preset below.
   3. Name materials inside the model "fabric", "hijab", "trim" —
      the color pickers will then recolor the right parts automatically.
*/
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const PRESETS = {
  sahara: {
    name: "عباية الصحراء",
    desc: "سوداء بامتداد الليل، يشقّها شريطان مطرزان من العنق إلى الأرض.",
    link: "../products/sahara.html",
    fabric: 0x17110c, hijab: 0xd9c8a9, trim: "gold", crystals: false, opening: false, hood: false,
    file: null, // e.g. "../assets/models/sahara.glb"
  },
  sakina: {
    name: "عباية السَّكِينة",
    desc: "بيج هادئة بلمسة لؤلؤية — أناقة تهمس ولا تصرخ.",
    link: "../products/sakina.html",
    fabric: 0xe6d5b8, hijab: 0xb09a78, trim: "pearl", crystals: false, opening: false, hood: false,
    file: null,
  },
  fajr: {
    name: "عباية الفجر",
    desc: "رملية بقبعة انسيابية تنسدل كضوء الفجر الأول.",
    link: "../products/fajr.html",
    fabric: 0xcbb391, hijab: 0xcbb391, trim: "none", crystals: false, opening: false, hood: true,
    file: null,
  },
  layl: {
    name: "عباية اللَّيل",
    desc: "سوداء تتلألأ بكريستال مبعثر على الصدر — قطعة السهرة.",
    link: "../products/layl.html",
    fabric: 0x141017, hijab: 0x2a2433, trim: "gold", crystals: true, opening: false, hood: false,
    file: null,
  },
  madina: {
    name: "عباية المدينة",
    desc: "مفتوحة من الأمام: سوادٌ واثق فوق كريمي هادئ.",
    link: "../products/madina.html",
    fabric: 0x1a140f, hijab: 0x0f0b08, trim: "none", crystals: false, opening: true, hood: false,
    file: null,
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

  const loadingEl = document.createElement("div");
  loadingEl.className = "stage-loading";
  loadingEl.textContent = "جاري تحميل التصميم…";
  loadingEl.style.display = "none";
  stage.appendChild(loadingEl);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0.6, 1.9, 5.6);

  try {
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.05).texture;
    scene.environmentIntensity = 0.55;
  } catch (e) { /* lights only */ }

  scene.add(new THREE.AmbientLight(0xffe3c2, 0.25));
  const spot = new THREE.SpotLight(0xffd9a0, 220, 30, Math.PI / 5, 0.5, 1.8);
  spot.position.set(2.4, 7.5, 3.5);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  spot.shadow.bias = -0.0004;
  scene.add(spot);
  const rim = new THREE.DirectionalLight(0xc9899a, 0.8);
  rim.position.set(-4, 3, -4);
  scene.add(rim);

  // Podium
  const podium = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.05, 1.12, 0.16, 96),
    new THREE.MeshStandardMaterial({ color: 0xb08558, metalness: 0.8, roughness: 0.28 })
  );
  disc.position.y = 0.08;
  disc.receiveShadow = true;
  podium.add(disc);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(1.3, 1.38, 0.1, 96),
    new THREE.MeshStandardMaterial({ color: 0x3a2028, metalness: 0.4, roughness: 0.6 })
  );
  base.position.y = -0.05;
  podium.add(base);
  scene.add(podium);

  const mannequin = new THREE.Group();
  mannequin.position.y = 0.16;
  scene.add(mannequin);
  let currentKind = "proc"; // "proc" | "glb"

  // ---------- boutique dress-form silhouette ----------
  // Straight column with a soft A-flare, sloped shoulders, no head (like a real atelier form)
  const RAW = [
    [0.5, 0.0], [0.49, 0.06], [0.4, 0.8], [0.35, 1.5],
    [0.36, 2.0], [0.36, 2.25], [0.3, 2.4], [0.17, 2.52], [0.1, 2.58],
  ];
  const spline = new THREE.CatmullRomCurve3(RAW.map(([r, y]) => new THREE.Vector3(r, y, 0)));
  const profilePts = spline.getPoints(48).map((p) => new THREE.Vector2(Math.max(p.x, 0.001), p.y));
  function radiusAt(y) {
    let best = profilePts[0];
    for (const p of profilePts) if (Math.abs(p.y - y) < Math.abs(best.y - y)) best = p;
    return best.x;
  }

  // Wide batwing sleeve gathered at the cuff (lathe profile, hanging down)
  const SLEEVE_PTS = [
    new THREE.Vector2(0.09, 0), new THREE.Vector2(0.15, -0.3), new THREE.Vector2(0.165, -0.6),
    new THREE.Vector2(0.12, -0.85), new THREE.Vector2(0.055, -0.97), new THREE.Vector2(0.075, -1.08),
  ];

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

  function fabricMaterial(hex) {
    const c = new THREE.Color(hex);
    const sheenC = c.clone().lerp(new THREE.Color(0xfff2dc), 0.35);
    return new THREE.MeshPhysicalMaterial({
      color: c, roughness: 0.78, metalness: 0.0, side: THREE.DoubleSide,
      sheen: 1.0, sheenRoughness: 0.5, sheenColor: sheenC,
    });
  }

  function clearMannequin() {
    if (currentKind === "proc") {
      mannequin.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material && o.material.dispose) o.material.dispose();
      });
    }
    mannequin.clear();
  }

  function buildProcedural(cfg) {
    const fabric = fabricMaterial(cfg.fabric);
    const hijabMat = fabricMaterial(cfg.hijab);
    hijabMat.sheenRoughness = 0.35;
    const trimMat = cfg.trim !== "none"
      ? new THREE.MeshStandardMaterial({ ...TRIMS[cfg.trim], emissiveIntensity: 0.5 })
      : null;

    // Body
    const phi = cfg.opening ? Math.PI * 2 - 0.6 : Math.PI * 2;
    const body = new THREE.Mesh(addFolds(new THREE.LatheGeometry(profilePts, 96, 0, phi), 0.024), fabric);
    if (cfg.opening) {
      body.rotation.y = Math.PI / 2 + 0.3;
      const inner = new THREE.Mesh(
        addFolds(new THREE.LatheGeometry(profilePts.map((p) => new THREE.Vector2(p.x * 0.93, p.y)), 64), 0.016),
        fabricMaterial(0xe9dcc3)
      );
      inner.castShadow = true;
      mannequin.add(inner);
    }
    body.castShadow = true;
    mannequin.add(body);

    // Batwing sleeves with gathered cuffs — no stick arms
    [-1, 1].forEach((s) => {
      const sleeve = new THREE.Mesh(new THREE.LatheGeometry(SLEEVE_PTS, 28), fabric);
      sleeve.position.set(s * 0.33, 2.42, 0.02);
      sleeve.rotation.z = s * 0.16;
      sleeve.castShadow = true;
      mannequin.add(sleeve);
      if (trimMat) {
        // embroidered cuff band
        const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.012, 8, 28), trimMat);
        cuff.rotation.x = Math.PI / 2;
        cuff.position.set(s * 0.33 + s * 0.16 * 0.97, 2.42 - 0.94, 0.02);
        mannequin.add(cuff);
      }
    });

    // Draped scarf at the neck (like a boutique display) — takes the hijab color
    const neckCap = new THREE.Mesh(new THREE.SphereGeometry(0.1, 18, 12), hijabMat);
    neckCap.scale.set(1, 0.7, 1);
    neckCap.position.set(0, 2.6, 0);
    mannequin.add(neckCap);
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.05, 12, 36), hijabMat);
    scarf.rotation.x = Math.PI / 2;
    scarf.position.set(0, 2.54, 0.01);
    scarf.castShadow = true;
    mannequin.add(scarf);
    const tail = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.42, 16, 1, true), hijabMat);
    tail.position.set(0.09, 2.32, 0.19);
    tail.rotation.x = -0.28;
    mannequin.add(tail);
    if (cfg.hood) {
      const hood = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 20, 1, true), fabric);
      hood.position.set(0, 2.5, -0.2);
      hood.rotation.x = 0.7;
      mannequin.add(hood);
    }

    // Front placket: fabric-covered buttons like the atelier pieces
    const btnMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(cfg.fabric).multiplyScalar(1.5), roughness: 0.6,
    });
    [2.32, 2.16, 2.0].forEach((y) => {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.026, 10, 8), btnMat);
      b.scale.z = 0.55;
      b.position.set(0, y, radiusAt(y) + 0.014);
      mannequin.add(b);
    });

    // Twin embroidery columns framing the front panel
    if (trimMat) {
      [-0.16, 0.16].forEach((th) => {
        for (let i = 0; i <= 30; i++) {
          const y = 0.1 + (2.42 - 0.1) * (i / 30);
          const r = radiusAt(y) + 0.012;
          const bead = new THREE.Mesh(new THREE.SphereGeometry(0.017, 8, 6), trimMat);
          bead.position.set(Math.sin(th) * r, y, Math.cos(th) * r);
          mannequin.add(bead);
        }
      });
      const hem = new THREE.Mesh(new THREE.TorusGeometry(0.49, 0.012, 10, 96), trimMat);
      hem.rotation.x = Math.PI / 2;
      hem.position.y = 0.05;
      mannequin.add(hem);
    }

    if (cfg.crystals) {
      const crystal = new THREE.MeshStandardMaterial({
        color: 0xffffff, emissive: 0xfff2cc, emissiveIntensity: 0.9, roughness: 0.15, metalness: 0.6,
      });
      for (let i = 0; i < 46; i++) {
        const y = 1.85 + Math.random() * 0.55;
        const a = (Math.random() - 0.5) * 1.0;
        const r = radiusAt(y) + 0.008;
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.01 + Math.random() * 0.008, 6, 5), crystal);
        dot.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
        mannequin.add(dot);
      }
    }
  }

  // ---------- GLB designs: load, fit to podium, recolor by material name ----------
  const loader = new GLTFLoader();
  const glbCache = {};
  function loadCached(url) {
    if (glbCache[url]) return Promise.resolve(glbCache[url]);
    return new Promise((res, rej) =>
      loader.load(url, (g) => { glbCache[url] = g.scene; res(g.scene); }, undefined, rej)
    );
  }
  function fitToPodium(obj) {
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const scale = 2.7 / Math.max(size.y, 0.001);
    obj.scale.multiplyScalar(scale);
    const box2 = new THREE.Box3().setFromObject(obj);
    const c = box2.getCenter(new THREE.Vector3());
    obj.position.x -= c.x;
    obj.position.z -= c.z;
    obj.position.y -= box2.min.y;
  }
  function applyColorsToGlb(root, cfg) {
    root.traverse((o) => {
      if (!o.isMesh || !o.material) return;
      const n = ((o.material.name || "") + " " + (o.name || "")).toLowerCase();
      if (n.includes("hijab") || n.includes("scarf")) o.material.color.set(cfg.hijab);
      else if (n.includes("trim") || n.includes("gold") || n.includes("embroid")) {
        const t = TRIMS[cfg.trim] || TRIMS.gold;
        o.material.color.set(t.color);
        o.material.metalness = t.metalness;
      } else if (n.includes("skin") || n.includes("body") || n.includes("face")) {
        /* leave skin alone */
      } else if (o.material.color) o.material.color.set(cfg.fabric);
    });
  }

  async function show(cfg) {
    clearMannequin();
    if (cfg.file) {
      loadingEl.style.display = "";
      try {
        const original = await loadCached(cfg.file);
        const inst = original.clone(true);
        inst.traverse((o) => {
          if (o.isMesh) { o.castShadow = true; o.material = o.material.clone(); }
        });
        fitToPodium(inst);
        mannequin.add(inst);
        currentKind = "glb";
        applyColorsToGlb(inst, cfg);
      } catch (e) {
        buildProcedural(cfg);
        currentKind = "proc";
      }
      loadingEl.style.display = "none";
    } else {
      buildProcedural(cfg);
      currentKind = "proc";
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
    show(state);
    if (nameEl) nameEl.textContent = state.name;
    if (descEl) descEl.textContent = state.desc;
    if (linkEl) { linkEl.href = state.link; linkEl.style.display = ""; }
    presetBtns.forEach((c) => c.classList.toggle("on", c.dataset.model === id));
    markSwatches();
  }

  function customized() {
    // recolor a loaded design in place; rebuild the procedural one
    if (currentKind === "glb") applyColorsToGlb(mannequin, state);
    else show(state);
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

  const saveBtn = document.getElementById("sr-save");
  if (saveBtn) saveBtn.addEventListener("click", () => {
    renderer.setClearColor(0x201216, 1);
    renderer.render(scene, camera);
    const a = document.createElement("a");
    a.href = renderer.domElement.toDataURL("image/png");
    a.download = "elfatina-design.png";
    a.click();
    renderer.setClearColor(0x000000, 0);
  });

  const param = new URLSearchParams(location.search).get("model");
  applyPreset(PRESETS[param] ? param : "sahara");

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.4, 0);
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
