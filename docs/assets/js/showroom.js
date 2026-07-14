/* ELFATINA — 3D showroom: rotating mannequin wearing each abaya */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";

const MODELS = {
  sahara: {
    name: "عباية الصحراء",
    desc: "سوداء بامتداد الليل، يشقّها شريط ذهبي مطرز من العنق إلى الأرض.",
    link: "../products/sahara.html",
    abaya: 0x17110c, hijab: 0xd9c8a9, trim: true, hem: true,
  },
  sakina: {
    name: "عباية السَّكِينة",
    desc: "بيج هادئة بلمسة لؤلؤية على الأكمام — أناقة تهمس ولا تصرخ.",
    link: "../products/sakina.html",
    abaya: 0xe6d5b8, hijab: 0xb09a78, pearls: true,
  },
  fajr: {
    name: "عباية الفجر",
    desc: "رملية بقبعة انسيابية تنسدل كضوء الفجر الأول.",
    link: "../products/fajr.html",
    abaya: 0xcbb391, hijab: 0xcbb391, hood: true,
  },
  layl: {
    name: "عباية اللَّيل",
    desc: "سوداء تتلألأ بكريستال مبعثر على الصدر — قطعة السهرة.",
    link: "../products/layl.html",
    abaya: 0x141017, hijab: 0x2a2433, sparkle: true, hem: true,
  },
  madina: {
    name: "عباية المدينة",
    desc: "مفتوحة من الأمام: سوادٌ واثق فوق كريمي هادئ.",
    link: "../products/madina.html",
    abaya: 0x1a140f, hijab: 0x0f0b08, opening: true, inner: 0xe9dcc3,
  },
};

const stage = document.getElementById("stage3d");
if (stage) init();

function init() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch (e) {
    stage.innerHTML = '<p class="webgl-fallback">متصفحك لا يدعم العرض ثلاثي الأبعاد — شاهدي الصور في صفحات القطع.</p>';
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 50);
  camera.position.set(0, 1.75, 6.6);
  camera.lookAt(0, 1.55, 0);

  // Boutique lighting: warm key spot (the atelier lamp), soft fill, gold rim
  scene.add(new THREE.AmbientLight(0xffe3c2, 0.55));
  const spot = new THREE.SpotLight(0xffd9a0, 260, 30, Math.PI / 5, 0.45, 1.8);
  spot.position.set(2.4, 7.5, 3.5);
  spot.castShadow = true;
  spot.shadow.mapSize.set(1024, 1024);
  scene.add(spot);
  const rim = new THREE.DirectionalLight(0xd49a3a, 1.1);
  rim.position.set(-4, 3, -4);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0xfff2dc, 0.5);
  fill.position.set(-2, 2, 4);
  scene.add(fill);

  // Golden podium
  const podium = new THREE.Group();
  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(1.75, 1.85, 0.16, 64),
    new THREE.MeshStandardMaterial({ color: 0xb07e2e, metalness: 0.75, roughness: 0.3 })
  );
  disc.position.y = 0.08;
  disc.receiveShadow = true;
  podium.add(disc);
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(2.05, 2.15, 0.1, 64),
    new THREE.MeshStandardMaterial({ color: 0x3a2611, metalness: 0.4, roughness: 0.6 })
  );
  base.position.y = -0.05;
  podium.add(base);
  scene.add(podium);

  // Mannequin group (rebuilt per model)
  const mannequin = new THREE.Group();
  mannequin.position.y = 0.16;
  scene.add(mannequin);

  // Abaya silhouette profile: radius at each height (hem → neck)
  const PROFILE = [
    [1.0, 0.0], [0.97, 0.06], [0.62, 0.9], [0.46, 1.55],
    [0.48, 2.0], [0.52, 2.28], [0.36, 2.5], [0.29, 2.6],
  ];
  const profilePts = PROFILE.map(([r, y]) => new THREE.Vector2(r, y));
  function radiusAt(y) {
    for (let i = 0; i < PROFILE.length - 1; i++) {
      const [r1, y1] = PROFILE[i], [r2, y2] = PROFILE[i + 1];
      if (y >= y1 && y <= y2) return r1 + ((y - y1) / (y2 - y1)) * (r2 - r1);
    }
    return 0.29;
  }

  const SKIN = new THREE.MeshStandardMaterial({ color: 0xdca87e, roughness: 0.75 });

  function buildMannequin(cfg) {
    // dispose previous
    mannequin.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material.dispose) o.material.dispose();
    });
    mannequin.clear();

    const fabric = new THREE.MeshStandardMaterial({
      color: cfg.abaya, roughness: 0.82, metalness: 0.02, side: THREE.DoubleSide,
    });
    const hijabMat = new THREE.MeshStandardMaterial({ color: cfg.hijab, roughness: 0.7, side: THREE.DoubleSide });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xd49a3a, metalness: 0.85, roughness: 0.25, emissive: 0x3a2606, emissiveIntensity: 0.6,
    });

    // Body — full skirt lathe; "madina" gets a front opening revealing a cream inner
    const phi = cfg.opening ? Math.PI * 2 - 0.7 : Math.PI * 2;
    const body = new THREE.Mesh(new THREE.LatheGeometry(profilePts, 64, 0, phi), fabric);
    if (cfg.opening) {
      body.rotation.y = Math.PI / 2 + 0.35; // opening faces the camera
      const inner = new THREE.Mesh(
        new THREE.LatheGeometry(profilePts.map((p) => new THREE.Vector2(p.x * 0.93, p.y)), 48),
        new THREE.MeshStandardMaterial({ color: cfg.inner, roughness: 0.85 })
      );
      inner.castShadow = true;
      mannequin.add(inner);
    }
    body.castShadow = true;
    mannequin.add(body);

    // Sleeves + hands
    [-1, 1].forEach((s) => {
      const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.13, 1.05, 20), fabric);
      sleeve.position.set(s * 0.62, 1.85, 0.12);
      sleeve.rotation.z = s * 0.42;
      sleeve.rotation.x = -0.12;
      sleeve.castShadow = true;
      mannequin.add(sleeve);
      const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 16, 12), SKIN);
      hand.position.set(s * 0.82, 1.34, 0.18);
      mannequin.add(hand);
    });

    // Head + hijab
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.225, 24, 18), SKIN);
    head.position.y = 2.82;
    head.position.z = 0.02;
    mannequin.add(head);
    const hijab = new THREE.Mesh(new THREE.SphereGeometry(0.265, 24, 18), hijabMat);
    hijab.position.y = 2.85;
    hijab.position.z = -0.045;
    hijab.scale.set(1, 1.06, 1);
    hijab.castShadow = true;
    mannequin.add(hijab);
    const drape = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.85, 20, 1, true), hijabMat);
    drape.position.set(0, 2.45, -0.14);
    drape.rotation.x = 0.16;
    mannequin.add(drape);

    if (cfg.hood) {
      const hood = new THREE.Mesh(new THREE.ConeGeometry(0.36, 0.6, 20, 1, true), fabric);
      hood.position.set(0, 2.78, -0.2);
      hood.rotation.x = 0.55;
      mannequin.add(hood);
    }

    // Gold front trim: beads following the silhouette down the front
    if (cfg.trim) {
      for (let i = 0; i <= 34; i++) {
        const y = 0.06 + (2.5 - 0.06) * (i / 34);
        const bead = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), goldMat);
        bead.position.set(0, y, radiusAt(y) + 0.012);
        mannequin.add(bead);
      }
    }
    // Gold hem + neck rings
    if (cfg.hem) {
      const hem = new THREE.Mesh(new THREE.TorusGeometry(0.985, 0.018, 10, 64), goldMat);
      hem.rotation.x = Math.PI / 2;
      hem.position.y = 0.05;
      mannequin.add(hem);
      const neck = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.014, 8, 40), goldMat);
      neck.rotation.x = Math.PI / 2;
      neck.position.y = 2.58;
      mannequin.add(neck);
    }
    // Crystal sparkle on the chest (layl)
    if (cfg.sparkle) {
      const crystal = new THREE.MeshStandardMaterial({
        color: 0xffffff, emissive: 0xfff2cc, emissiveIntensity: 0.9, roughness: 0.15, metalness: 0.6,
      });
      for (let i = 0; i < 46; i++) {
        const y = 1.75 + Math.random() * 0.75;
        const a = (Math.random() - 0.5) * 1.5; // front hemisphere
        const r = radiusAt(y) + 0.01;
        const dot = new THREE.Mesh(new THREE.SphereGeometry(0.014 + Math.random() * 0.012, 6, 5), crystal);
        dot.position.set(Math.sin(a) * r, y, Math.cos(a) * r);
        mannequin.add(dot);
      }
    }
    // Pearl rows on the sleeves (sakina)
    if (cfg.pearls) {
      const pearl = new THREE.MeshStandardMaterial({
        color: 0xfdf6ea, roughness: 0.25, emissive: 0x555044, emissiveIntensity: 0.25,
      });
      [-1, 1].forEach((s) => {
        for (let i = 0; i < 6; i++) {
          const t = i / 5;
          const dot = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), pearl);
          dot.position.set(s * (0.66 + t * 0.14), 1.72 - t * 0.32, 0.24);
          mannequin.add(dot);
        }
      });
    }
  }

  // ---- interactions ----
  const chips = document.querySelectorAll(".showroom-chips button[data-model]");
  const nameEl = document.getElementById("sr-name");
  const descEl = document.getElementById("sr-desc");
  const linkEl = document.getElementById("sr-link");

  function setModel(id) {
    const cfg = MODELS[id];
    if (!cfg) return;
    buildMannequin(cfg);
    if (nameEl) nameEl.textContent = cfg.name;
    if (descEl) descEl.textContent = cfg.desc;
    if (linkEl) linkEl.href = cfg.link;
    chips.forEach((c) => c.classList.toggle("on", c.dataset.model === id));
  }
  chips.forEach((c) => c.addEventListener("click", () => setModel(c.dataset.model)));

  const param = new URLSearchParams(location.search).get("model");
  setModel(MODELS[param] ? param : "sahara");

  // drag to rotate (mouse + touch), auto-rotate when idle
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let rotY = 0.4, targetY = 0.4, dragging = false, lastX = 0, idleAt = 0;
  stage.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; stage.setPointerCapture(e.pointerId); });
  stage.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    targetY += (e.clientX - lastX) * 0.012;
    lastX = e.clientX;
    idleAt = performance.now() + 2500;
  });
  ["pointerup", "pointercancel", "pointerleave"].forEach((ev) =>
    stage.addEventListener(ev, () => { dragging = false; })
  );

  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage);
  resize();

  renderer.setAnimationLoop((t) => {
    if (!dragging && t > idleAt && !reduced) targetY += 0.004;
    rotY += (targetY - rotY) * 0.08;
    mannequin.rotation.y = rotY;
    podium.rotation.y = rotY * 0.4;
    renderer.render(scene, camera);
  });
}
