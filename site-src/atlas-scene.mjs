/* Original MIT-licensed miniature knowledge atlas. Three.js is supplied locally. */

/** A finite camera pan: preserve viewing angle/zoom and stop when interrupted. */
export function createAtlasCameraFlight({ camera, controls, requestRender, win, reducedMotion = () => false, canRun = () => true }) {
  let frame = 0, destination = null, disposed = false;
  function cancel() {
    if (frame) win.cancelAnimationFrame(frame);
    frame = 0;
    destination = null;
  }
  function moveTo(point) {
    const delta = point.clone().sub(controls.target);
    camera.position.add(delta);
    // OrbitControls constrains target around cursor; move both to avoid clamping.
    controls.cursor.add(delta);
    controls.target.copy(point);
    controls.update();
    requestRender();
  }
  function finish() {
    if (!destination) return;
    const point = destination.clone();
    cancel();
    if (!disposed && canRun()) moveTo(point);
  }
  return {
    cancel,
    finish,
    flyTo(point) {
      cancel();
      if (disposed || !canRun()) return;
      destination = point.clone();
      if (reducedMotion()) { finish(); return; }
      const from = controls.target.clone(), to = destination.clone();
      const started = win.performance.now();
      function step(now) {
        frame = 0;
        if (disposed || !canRun()) { cancel(); return; }
        if (reducedMotion()) { finish(); return; }
        const progress = Math.max(0, Math.min(1, (now - started) / 520));
        moveTo(from.clone().lerp(to, 1 - Math.pow(1 - progress, 3)));
        if (progress < 1) frame = win.requestAnimationFrame(step);
        else destination = null;
      }
      frame = win.requestAnimationFrame(step);
    },
    dispose() { disposed = true; cancel(); },
  };
}

/**
 * Creates an on-demand Three.js scene, using SVG when WebGL is unavailable.
 * The surrounding reader owns the equivalent
 * accessible concept list, relation descriptions, and scenario/history controls.
 */
export function createAtlasScene(host, { atlas, onSelect = () => {}, onError = () => {} } = {}) {
  const emptyController = { update() {}, focus() {}, reset() {}, zoom() {}, dispose() {} };
  let wrapper, renderer, controls, resizeObserver, frame = 0;
  let disposed = false, failed = false, errorReported = false;
  let cleanup = () => {};
  const geometries = new Set(), materials = new Set();
  const reportError = (message) => {
    if (errorReported || disposed) return;
    errorReported = true;
    console.warn('[KnowledgeAtlas] '+message);
    try { onError(message); } catch { /* The host retains its readable fallback. */ }
  };

  try {
    const doc = host?.ownerDocument;
    const win = doc?.defaultView;
    const T = win?.KnowledgeThree;
    if (!doc || !win || (!T?.WebGLRenderer && !T?.SVGRenderer) || !T?.OrbitControls) {
      reportError('三维运行时未能加载；仍可使用概念列表、关系和分步说明。');
      return emptyController;
    }

    wrapper = doc.createElement('div');
    wrapper.className = 'atlas-scene';
    Object.assign(wrapper.style, { position: 'absolute', inset: '0', overflow: 'hidden' });
    const webglCanvas = doc.createElement('canvas');
    let context = null, usingSvg = false;
    try {
      context = webglCanvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
      if (context && T.WebGLRenderer) renderer = new T.WebGLRenderer({ canvas: webglCanvas, context, alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch (error) {
      console.warn('[KnowledgeAtlas] WebGL unavailable; trying SVG projection:', error);
    }
    if (!renderer) {
      if (!T.SVGRenderer) {
        reportError('当前浏览器无法创建三维绘图场景；仍可使用完整的概念列表和分步说明。');
        return emptyController;
      }
      renderer = new T.SVGRenderer();
      renderer.setQuality('high');
      renderer.setPrecision?.(2);
      renderer.overdraw = 0.35;
      usingSvg = true;
    }
    const surface = renderer.domElement;
    surface.setAttribute('aria-hidden', 'true');
    surface.setAttribute('focusable', 'false');
    Object.assign(surface.style, { display: 'block', width: '100%', height: '100%', touchAction: 'none' });
    wrapper.dataset.renderer = usingSvg ? 'svg' : 'webgl';
    renderer.setPixelRatio?.(Math.min(win.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(usingSvg ? 0xeff4f0 : 0xf4f7fa, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    if (!usingSvg) {
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
    }
    wrapper.append(surface);
    const labelLayer = doc.createElement('div');
    labelLayer.className = 'atlas-label-layer';
    Object.assign(labelLayer.style, { position: 'absolute', inset: '0', overflow: 'hidden', pointerEvents: 'none' });
    wrapper.append(labelLayer);
    host.append(wrapper);

    const scene = new T.Scene();
    // SVGRenderer supports ambient/directional lighting but not hemisphere light.
    scene.add(usingSvg ? new T.AmbientLight(0x9aa5b0) : new T.HemisphereLight(0xffffff, 0x8fa6b9, 2.4));
    const sunlight = new T.DirectionalLight(0xffffff, usingSvg ? 0.72 : 2.8);
    sunlight.position.set(-8, 18, 12);
    scene.add(sunlight);
    const fill = new T.DirectionalLight(0xcce9ff, usingSvg ? 0.23 : 1.2);
    fill.position.set(12, 7, -12);
    scene.add(fill);
    const camera = new T.OrthographicCamera(-16, 16, 12, -12, 0.1, 200);
    controls = new T.OrbitControls(camera, surface);
    controls.enableDamping = false;
    controls.enablePan = true;
    controls.screenSpacePanning = false;
    controls.minPolarAngle = 0.28;
    controls.maxPolarAngle = 1.15;
    controls.minZoom = 0.65;
    controls.maxZoom = 3.5;
    controls.rotateSpeed = 0.55;
    controls.panSpeed = 0.7;
    controls.zoomSpeed = 0.7;
    controls.maxTargetRadius = 12;

    const categoryList = atlas?.categories || [];
    const nodeList = atlas?.nodes || [];
    const edgeList = atlas?.edges || [];
    const history = atlas?.history || [];
    const categoryMap = new Map(categoryList.map((c) => [c.id, c]));
    const nodeMap = new Map(nodeList.map((n) => [n.id, n]));
    const records = new Map();
    let scenery = new T.Group(), edges = new T.Group();
    scene.add(scenery, edges);
    let districtLabels = [], eventMarkers = [], edgeRecords = [], width = 1, height = 1;
    let bounds = { minX: -14, maxX: 14, minZ: -12, maxZ: 12 };
    let state = { mode: 'graph', selectedId: null, visibleIds: nodeList.map((n) => n.id), focusIds: [] };
    let visibleSet = new Set(state.visibleIds), focusSet = new Set();
    let layoutKey = '', hoveredId = null, pointerStart = null;
    let isDark = doc.documentElement.dataset.theme === 'dark';
    const themedMaterials = new Map();
    const motionPreference = win.matchMedia?.('(prefers-reduced-motion: reduce)');
    const flight = createAtlasCameraFlight({ camera, controls, requestRender, win,
      reducedMotion: () => Boolean(motionPreference?.matches),
      canRun: () => !disposed && !failed && !doc.hidden && !host.hidden,
    });
    const projectPoint = new T.Vector3();
    const raycaster = new T.Raycaster();
    const pointer = new T.Vector2();
    const up = new T.Vector3(0, 1, 0);
    const landmarkOrder = ['cpu', 'program', 'algorithm', 'network', 'database', 'os', 'llm', 'rag', 'ml', 'bim', 'gis', 'twin', 'bits', 'memory', 'api', 'security'];

    const ownGeometry = (geometry) => { geometries.add(geometry); return geometry; };
    const ownMaterial = (material) => { materials.add(material); return material; };
    const material = (color, options = {}) => {
      if (!usingSvg) return ownMaterial(new T.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...options }));
      const { roughness, metalness, emissiveIntensity, ...supported } = options;
      const surfaceMaterial = new T.MeshLambertMaterial({ color, ...supported });
      if (emissiveIntensity != null) surfaceMaterial.emissive.multiplyScalar(emissiveIntensity);
      return ownMaterial(surfaceMaterial);
    };
    const roundSegments = usingSvg ? 10 : 24;
    const tint = (color, amount = 0.82) => new T.Color(color).lerp(new T.Color(0xffffff), amount);
    function themed(surface, light, dark) {
      const colors = { light: new T.Color(light), dark: new T.Color(dark) };
      themedMaterials.set(surface, colors);
      surface.color.copy(isDark ? colors.dark : colors.light);
      return surface;
    }
    const box = (x, y, z) => ownGeometry(new T.BoxGeometry(x, y, z));
    const mesh = (parent, geometry, surface, x = 0, y = 0, z = 0) => {
      const object = new T.Mesh(geometry, surface);
      object.position.set(x, y, z);
      parent.add(object);
      return object;
    };
    const rod = (parent, a, b, radius, surface) => {
      const delta = new T.Vector3().subVectors(b, a);
      const object = mesh(parent, ownGeometry(new T.CylinderGeometry(radius, radius, delta.length(), 6)), surface);
      object.position.copy(a).add(b).multiplyScalar(0.5);
      object.quaternion.setFromUnitVectors(up, delta.normalize());
      return object;
    };
    const polyline = (parent, points, color, opacity = 1, dashed = false) => {
      const lineMaterial = ownMaterial(dashed
        ? new T.LineDashedMaterial({ color, transparent: true, opacity, dashSize: usingSvg ? 3 : 0.25, gapSize: usingSvg ? 3 : 0.17, depthWrite: false })
        : new T.LineBasicMaterial({ color, transparent: true, opacity, depthWrite: false }));
      const line = new T.Line(ownGeometry(new T.BufferGeometry().setFromPoints(points)), lineMaterial);
      if (dashed) line.computeLineDistances();
      parent.add(line);
      return line;
    };

    function makeModel(node) {
      const color = categoryMap.get(node.category)?.color || '#547fa3';
      const primary = material(color);
      const pale = material(tint(color, 0.75));
      const porcelain = material('#ffffff');
      const dark = material(new T.Color(color).multiplyScalar(0.48), { metalness: 0.25 });
      const surfaces = [primary, pale, porcelain, dark];
      const group = new T.Group();
      group.userData.nodeId = node.id;
      const shadow = material('#243c52', { transparent: true, opacity: 0.055, depthWrite: false });
      const shadowMesh = mesh(group, ownGeometry(new T.CircleGeometry(0.91, roundSegments)), shadow, 0.06, 0.015, 0.09);
      shadowMesh.rotation.x = -Math.PI / 2;
      if (usingSvg) shadowMesh.renderOrder = -10;
      mesh(group, ownGeometry(new T.CylinderGeometry(0.76, 0.82, 0.12, roundSegments)), porcelain, 0, 0.09, 0);
      mesh(group, ownGeometry(new T.CylinderGeometry(0.77, 0.77, 0.035, roundSegments)), pale, 0, 0.158, 0);
      const model = new T.Group();
      model.position.y = 0.16;
      group.add(model);

      switch (node.shape) {
        case 'chip': {
          mesh(model, box(1.02, 0.27, 0.87), dark, 0, 0.25, 0);
          mesh(model, box(0.72, 0.15, 0.58), primary, 0, 0.46, 0);
          mesh(model, box(0.3, 0.025, 0.26), pale, 0, 0.55, 0);
          for (const side of [-1, 1]) for (let i = -1; i <= 1; i++) {
            mesh(model, box(0.22, 0.07, 0.1), pale, side * 0.6, 0.23, i * 0.25);
            mesh(model, box(0.1, 0.07, 0.21), pale, i * 0.28, 0.23, side * 0.53);
          }
          break;
        }
        case 'database': {
          for (let i = 0; i < 3; i++) {
            mesh(model, ownGeometry(new T.CylinderGeometry(0.48, 0.48, 0.23, roundSegments)), i === 2 ? primary : pale, 0, 0.18 + i * 0.27, 0);
            mesh(model, ownGeometry(new T.CylinderGeometry(0.485, 0.485, 0.025, roundSegments)), porcelain, 0, 0.3 + i * 0.27, 0);
          }
          break;
        }
        case 'network': {
          const center = new T.Vector3(0, 0.72, 0);
          mesh(model, box(0.4, 0.36, 0.4), primary, center.x, center.y, center.z);
          const points = [[-0.54, 0.21, -0.35], [0.54, 0.21, -0.27], [0.08, 0.21, 0.57]];
          for (const values of points) {
            const endpoint = new T.Vector3(...values);
            rod(model, center, endpoint, 0.035, primary);
            mesh(model, box(0.34, 0.25, 0.3), pale, ...values);
            mesh(model, box(0.2, 0.025, 0.18), porcelain, values[0], values[1] + 0.14, values[2]);
          }
          break;
        }
        case 'building': {
          const blocks = [[-0.29, 0.55, 0.02, 0.48, 1.1, 0.54], [0.27, 0.36, 0.1, 0.38, 0.72, 0.48], [0.13, 0.21, -0.36, 0.5, 0.42, 0.3]];
          blocks.forEach(([x, y, z, w, h, d], i) => {
            mesh(model, box(w, h, d), i ? pale : primary, x, y, z);
            mesh(model, box(w + 0.035, 0.045, d + 0.035), porcelain, x, h + 0.02, z);
            for (let row = 0.2; row < h - 0.08; row += 0.23) {
              mesh(model, box(w * 0.57, 0.07, 0.02), porcelain, x, row, z + d / 2 + 0.012);
            }
          });
          break;
        }
        case 'brain': {
          const points = [[-0.38, 0.59, 0], [-0.22, 0.92, -0.08], [0.16, 0.98, -0.02], [0.42, 0.66, 0.02], [0.19, 0.39, 0.18], [-0.19, 0.36, 0.18], [0.02, 0.67, -0.26]].map((p) => new T.Vector3(...p));
          const joins = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [1, 6], [3, 6], [5, 6], [0, 4]];
          joins.forEach(([a, b]) => rod(model, points[a], points[b], 0.025, primary));
          points.forEach((point, i) => mesh(model, ownGeometry(new T.OctahedronGeometry(i === 6 ? 0.21 : 0.24, 0)), i % 2 ? pale : primary, point.x, point.y, point.z));
          mesh(model, box(0.18, 0.22, 0.2), pale, 0, 0.13, 0.08);
          break;
        }
        case 'shield': {
          const shape = new T.Shape();
          shape.moveTo(-0.44, 0.42);
          shape.lineTo(0, 0.58); shape.lineTo(0.44, 0.42); shape.lineTo(0.36, -0.1);
          shape.quadraticCurveTo(0.25, -0.34, 0, -0.48);
          shape.quadraticCurveTo(-0.25, -0.34, -0.36, -0.1);
          shape.closePath();
          mesh(model, ownGeometry(new T.ExtrudeGeometry(shape, { depth: 0.13, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.025, bevelSegments: 1, steps: 1 })), primary, 0, 0.55, -0.07);
          rod(model, new T.Vector3(-0.19, 0.58, 0.12), new T.Vector3(-0.03, 0.43, 0.12), 0.038, porcelain);
          rod(model, new T.Vector3(-0.03, 0.43, 0.12), new T.Vector3(0.24, 0.76, 0.12), 0.038, porcelain);
          break;
        }
        case 'document': {
          const page = new T.Group();
          page.rotation.x = -0.14;
          page.position.set(0, 0.57, 0);
          model.add(page);
          mesh(page, box(0.8, 1.04, 0.11), porcelain);
          mesh(page, box(0.82, 0.19, 0.12), primary, 0, 0.42, 0.005);
          for (let line = 0; line < 3; line++) mesh(page, box(line === 2 ? 0.35 : 0.56, 0.055, 0.035), pale, line === 2 ? -0.1 : 0, 0.13 - line * 0.17, 0.07);
          break;
        }
        case 'cube': {
          const solid = mesh(model, box(0.8, 0.8, 0.8), pale, 0, 0.54, 0);
          solid.rotation.y = Math.PI / 8;
          const outlineMaterial = ownMaterial(new T.LineBasicMaterial({ color }));
          const outline = new T.LineSegments(ownGeometry(new T.EdgesGeometry(solid.geometry)), outlineMaterial);
          solid.add(outline);
          surfaces.push(outlineMaterial);
          if (node.id === 'coordinates') {
            for (const [endpoint, axisColor] of [[[0.9, 0.16, 0], '#d76657'], [[0, 1.24, 0], '#5d9a79'], [[0, 0.16, 0.9], '#658dd2']]) {
              const axisSurface = material(axisColor);
              surfaces.push(axisSurface);
              rod(model, new T.Vector3(0, 0.16, 0), new T.Vector3(...endpoint), 0.025, axisSurface);
            }
          }
          break;
        }
        case 'stack':
        default: {
          for (let i = 0; i < 4; i++) {
            const layer = mesh(model, box(0.94, 0.13, 0.72), i === 3 ? primary : (i % 2 ? porcelain : pale), i % 2 ? 0.035 : -0.025, 0.14 + i * 0.19, 0);
            layer.rotation.y = (i % 2 ? 1 : -1) * 0.04;
          }
          mesh(model, box(0.45, 0.025, 0.37), pale, 0, 0.79, 0);
          break;
        }
      }

      const ringMaterial = material(color, { emissive: color, emissiveIntensity: 0.18, roughness: 0.9 });
      const ring = mesh(group, ownGeometry(new T.TorusGeometry(0.89, 0.035, usingSvg ? 4 : 6, usingSvg ? 20 : 40)), ringMaterial, 0, 0.14, 0);
      ring.rotation.x = Math.PI / 2;
      ring.visible = false;
      const pointerMaterial = material(color);
      const marker = mesh(group, ownGeometry(new T.ConeGeometry(0.13, 0.28, 4)), pointerMaterial, 0, 1.68, 0);
      marker.rotation.z = Math.PI;
      marker.visible = false;
      const label = doc.createElement('button');
      label.type = 'button';
      label.className = 'atlas-node-label';
      label.textContent = node.label;
      label.title = `${node.label}：${node.summary || ''}`;
      label.setAttribute('aria-label', `查看概念：${node.label}`);
      Object.assign(label.style, { position: 'absolute', transform: 'translate(-50%, 0)', pointerEvents: 'auto', maxWidth: '148px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' });
      label.style.setProperty('--node-color', color);
      label.addEventListener('click', () => { if (!disposed && !failed) onSelect(node.id); });
      labelLayer.append(label);
      const nightColors = [new T.Color(color), new T.Color(color).lerp(new T.Color('#14251c'), 0.55), new T.Color(color).lerp(new T.Color('#0e1914'), 0.85), new T.Color(color).multiplyScalar(0.34)];
      const record = { node, group, label, ring, marker, surfaces: surfaces.map((surface, index) => ({ surface, color: surface.color.clone(), nightColor: nightColors[index] ?? surface.color.clone() })), anchor: new T.Vector3(), visible: true };
      records.set(node.id, record);
      scene.add(group);
    }

    nodeList.forEach(makeModel);

    function releaseGroup(group) {
      group.traverse((object) => {
        if (object.geometry) { object.geometry.dispose(); geometries.delete(object.geometry); }
        const ownSurfaces = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
        ownSurfaces.forEach((surface) => { surface.dispose(); materials.delete(surface); themedMaterials.delete(surface); });
      });
      scene.remove(group);
    }

    function addDistrictLabel(text, point, color, options = {}) {
      const element = doc.createElement('div');
      element.className = 'atlas-district-label';
      element.textContent = text;
      if (options.title) element.title = options.title;
      Object.assign(element.style, { position: 'absolute', transform: 'translate(-50%, -50%)', pointerEvents: 'none', whiteSpace: 'nowrap', color: color || '#52647a' });
      labelLayer.append(element);
      districtLabels.push({ element, point, color: color || '#52647a', ...options });
    }

    function platform(centerX, centerZ, sizeX, sizeZ, color) {
      const deckSurface = themed(material(color, { roughness: 0.95 }), tint(color, 0.96), new T.Color(color).lerp(new T.Color('#0e1914'), 0.98));
      const deck = mesh(scenery, box(sizeX, 0.13, sizeZ), deckSurface, centerX, -0.08, centerZ);
      const x = sizeX / 2, z = sizeZ / 2;
      const border = polyline(scenery, [[-x, -z], [x, -z], [x, z], [-x, z], [-x, -z]].map(([a, b]) => new T.Vector3(centerX + a, 0.005, centerZ + b)), tint(color, 0.5), 0.62);
      themed(border.material, tint(color, 0.5), tint(color, 0.28));
      // SVG uses a painter's algorithm: large floor polygons must stay behind models.
      if (usingSvg) { deck.renderOrder = -30; border.renderOrder = -29; }
    }

    function graphLayout() {
      const positions = new Map();
      const categories = categoryList.slice(0, 4);
      const groups = categories.map((category) => nodeList.filter((node) => node.category === category.id));
      const columns = 4, cellX = 2.95, cellZ = 2.7;
      const rowDepth = [0, 1].map((row) => Math.max(2, ...groups.slice(row * 2, row * 2 + 2).map((items) => Math.ceil(items.length / columns))) * cellZ + 2.0);
      const totalDepth = rowDepth[0] + rowDepth[1] + 1.6;
      categories.forEach((category, index) => {
        const items = groups[index], rows = Math.max(1, Math.ceil(items.length / columns));
        const row = Math.floor(index / 2), x = index % 2 ? 6.85 : -6.85;
        const z = row === 0 ? -totalDepth / 2 + rowDepth[0] / 2 : totalDepth / 2 - rowDepth[1] / 2;
        platform(x, z, 12.3, rowDepth[row], category.color);
        addDistrictLabel(`${category.label} · ${items.length}`, new T.Vector3(x, 0.06, z - rowDepth[row] / 2 + 0.45), category.color);
        items.forEach((node, itemIndex) => {
          const column = itemIndex % columns, itemRow = Math.floor(itemIndex / columns);
          const rowSize = Math.min(columns, items.length - itemRow * columns);
          positions.set(node.id, new T.Vector3(x + (column - (rowSize - 1) / 2) * cellX, 0, z + (itemRow - (rows - 1) / 2) * cellZ + 0.5));
        });
      });
      bounds = { minX: -13.4, maxX: 13.4, minZ: -totalDepth / 2 - 0.2, maxZ: totalDepth / 2 + 0.3 };
      return positions;
    }

    function scenarioLayout() {
      const scenario = (atlas?.scenarios || []).find((item) => item.id === state.scenarioId) || atlas?.scenarios?.[0];
      const ids = [...new Set((scenario?.steps || []).flatMap((step) => step.nodes || []))].filter((id) => nodeMap.has(id));
      const positions = new Map();
      const columns = Math.min(5, Math.max(3, Math.ceil(Math.sqrt(ids.length * 1.6))));
      const rows = Math.max(1, Math.ceil(ids.length / columns));
      const gapX = 3.7, gapZ = 4.2;
      const sizeX = Math.max(11, (columns - 1) * gapX + 4.4), sizeZ = Math.max(7, (rows - 1) * gapZ + 5);
      platform(0, 0, sizeX, sizeZ, '#79949c');
      ids.forEach((id, index) => {
        const row = Math.floor(index / columns), rowSize = Math.min(columns, ids.length - row * columns);
        const column = row % 2 ? rowSize - 1 - index % columns : index % columns;
        positions.set(id, new T.Vector3((column - (rowSize - 1) / 2) * gapX, 0, (row - (rows - 1) / 2) * gapZ + 0.4));
      });
      addDistrictLabel('协作工作台', new T.Vector3(0, 0.05, -sizeZ / 2 + 0.55), '#527680');
      bounds = { minX: -sizeX / 2 - 0.6, maxX: sizeX / 2 + 0.6, minZ: -sizeZ / 2 - 0.3, maxZ: sizeZ / 2 + 0.5 };
      return positions;
    }

    function historyLayout() {
      const positions = new Map(), assigned = new Set();
      const columns = Math.min(6, Math.max(3, Math.ceil(Math.sqrt(history.length * 2))));
      const rows = Math.max(1, Math.ceil(history.length / columns));
      const stepX = 4.8, stepZ = 7.1;
      const eventPoints = [];
      history.forEach((event, index) => {
        const row = Math.floor(index / columns), col = row % 2 ? columns - 1 - index % columns : index % columns;
        const x = (col - (columns - 1) / 2) * stepX, z = (row - (rows - 1) / 2) * stepZ - 1.1;
        const point = new T.Vector3(x, 0.08, z);
        eventPoints.push(point);
        const current = event.id === state.eventId;
        const eventColor = current ? '#bb7753' : '#9ba9b7';
        const marker = mesh(scenery, ownGeometry(new T.CylinderGeometry(0.15, 0.15, 0.075, 16)), material(eventColor), x, 0.09, z);
        eventMarkers.push({ id: event.id, marker });
        const sameYear = history.filter((item) => item.year === event.year).length > 1;
        const date = sameYear ? (event.dateLabel?.match(/^\d{4}-\d{2}/)?.[0] || String(event.year)) : String(event.year);
        addDistrictLabel(date, new T.Vector3(x, 0.12, z - 0.55), current ? '#9b4e2a' : '#718194', { eventId: event.id, title: `${event.dateLabel}：${event.title}` });
        const ids = (event.nodes || []).filter((id) => nodeMap.has(id) && !assigned.has(id));
        ids.forEach((id, nodeIndex) => {
          assigned.add(id);
          const rowIndex = Math.floor(nodeIndex / 3), rowSize = Math.min(3, ids.length - rowIndex * 3);
          positions.set(id, new T.Vector3(x + (nodeIndex % 3 - (rowSize - 1) / 2) * 1.45, 0, z + 1.65 + rowIndex * 1.95));
        });
      });
      if (eventPoints.length > 1) {
        polyline(scenery, eventPoints, '#9baab9', 0.7);
        eventPoints.slice(1).forEach((point, index) => {
          const from = eventPoints[index];
          const arrow = mesh(scenery, ownGeometry(new T.ConeGeometry(0.09, 0.28, 4)), material('#9baab9'));
          arrow.position.copy(from).lerp(point, 0.6);
          arrow.quaternion.setFromUnitVectors(up, new T.Vector3().subVectors(point, from).normalize());
        });
      }
      const unassigned = nodeList.filter((node) => !assigned.has(node.id) && visibleSet.has(node.id));
      unassigned.forEach((node, index) => positions.set(node.id, new T.Vector3((index - (unassigned.length - 1) / 2) * 2.0, 0, (rows - 1) * stepZ / 2 + 4.3)));
      const values = [...positions.values(), ...eventPoints];
      bounds = {
        minX: Math.min(-4, ...values.map((v) => v.x)) - 1.7,
        maxX: Math.max(4, ...values.map((v) => v.x)) + 1.7,
        minZ: Math.min(-3, ...values.map((v) => v.z)) - 1.3,
        maxZ: Math.max(3, ...values.map((v) => v.z)) + 1.7,
      };
      // A regular grid is a reading aid only; dates are labels, not a metric scale.
      return positions;
    }

    function makeEdges(positions) {
      edgeRecords = [];
      if (state.mode === 'history') return;
      edgeList.forEach((edge, index) => {
        const from = positions.get(edge.from), to = positions.get(edge.to);
        if (!from || !to || edge.from === edge.to) return;
        const delta = new T.Vector3().subVectors(to, from), distance = delta.length();
        const direction = delta.clone().normalize();
        const start = from.clone().addScaledVector(direction, 0.9); start.y = 0.22;
        const end = to.clone().addScaledVector(direction, -0.94); end.y = 0.22;
        const middle = start.clone().add(end).multiplyScalar(0.5);
        middle.y = 0.55 + Math.min(distance * 0.035, 0.85) + (index % 3) * 0.055;
        const curve = new T.QuadraticBezierCurve3(start, middle, end);
        const color = edge.type === 'foundation' ? '#72869b' : (categoryMap.get(nodeMap.get(edge.from)?.category)?.color || '#527e88');
        const line = polyline(edges, curve.getPoints(24), color, 0.25, edge.type === 'collaboration');
        if (usingSvg) line.renderOrder = -5;
        let arrow = null;
        if (edge.type !== 'collaboration') {
          const arrowSurface = material(color, { transparent: true, opacity: 0.48, depthWrite: false });
          arrow = mesh(edges, ownGeometry(new T.ConeGeometry(0.11, 0.31, 5)), arrowSurface);
          arrow.position.copy(curve.getPoint(0.9));
          arrow.quaternion.setFromUnitVectors(up, curve.getTangent(0.9).normalize());
          if (usingSvg) arrow.renderOrder = -5;
        }
        edgeRecords.push({ edge, line, arrow, color: new T.Color(color) });
      });
    }

    function applyState() {
      const hasFocus = focusSet.size > 0;
      records.forEach((record, id) => {
        const selected = id === state.selectedId;
        const focused = focusSet.has(id);
        const muted = hasFocus && !focused && !selected;
        record.visible = visibleSet.has(id) && !!record.group.userData.placed;
        record.group.visible = record.visible;
        record.ring.visible = focused || selected || hoveredId === id;
        record.marker.visible = selected;
        record.surfaces.forEach(({ surface, color, nightColor }, index) => {
          surface.color.copy(isDark ? nightColor : color);
          if (muted) surface.color.lerp(new T.Color(isDark ? '#142a20' : '#f1f4f7'), isDark ? 0.66 : 0.71);
          // A small emissive accent keeps selected colors clear without a bloom pass.
          surface.emissive?.copy(surface.color).multiplyScalar(isDark && !muted && (selected || focused) ? (index === 0 ? 0.12 : 0.025) : 0);
        });
        record.label.classList.toggle('is-selected', selected);
        record.label.classList.toggle('is-focused', focused);
        record.label.classList.toggle('is-muted', muted);
        record.label.setAttribute('aria-pressed', selected ? 'true' : 'false');
      });
      edgeRecords.forEach(({ edge, line, arrow, color }) => {
        const endpointsVisible = visibleSet.has(edge.from) && visibleSet.has(edge.to);
        const selected = !!state.selectedId && (edge.from === state.selectedId || edge.to === state.selectedId);
        const withinFocus = focusSet.has(edge.from) && focusSet.has(edge.to);
        const showing = endpointsVisible && (state.mode === 'scenario' ? (!hasFocus || withinFocus) : (!state.selectedId || selected));
        line.visible = showing;
        line.material.color.copy(isDark ? tint(color, 0.18) : color.clone().multiplyScalar(0.36));
        line.material.opacity = selected ? 0.86 : withinFocus ? 0.7 : 0.24;
        if (arrow) {
          arrow.visible = showing;
          arrow.material.color.copy(line.material.color);
          arrow.material.opacity = selected || withinFocus ? 0.95 : 0.48;
        }
      });
      districtLabels.forEach(({ element, eventId, color }) => {
        if (eventId) {
          element.classList.toggle('is-selected', eventId === state.eventId);
          element.style.color = eventId === state.eventId ? (isDark ? '#fbbf24' : '#92400e') : (isDark ? '#9cb8a9' : '#4b6356');
        } else element.style.color = '#' + (isDark ? new T.Color(color) : new T.Color(color).multiplyScalar(0.23)).getHexString();
      });
      eventMarkers.forEach(({ id, marker }) => {
        const current = id === state.eventId;
        marker.material.color.set(current ? (isDark ? '#fbbf24' : '#b45309') : '#9ba9b7');
        marker.scale.setScalar(current ? 1.65 : 1);
      });
    }

    function applyAtlasTheme() {
      if (disposed || failed) return;
      isDark = doc.documentElement.dataset.theme === 'dark';
      scene.background = new T.Color(isDark ? '#0b1510' : '#ecf4ee');
      renderer.setClearColor(scene.background, 1);
      themedMaterials.forEach((colors, surface) => surface.color.copy(isDark ? colors.dark : colors.light));
      applyState();
      requestRender();
    }

    function frameCamera(resetPosition = false) {
      const center = new T.Vector3((bounds.minX + bounds.maxX) / 2, 0.15, (bounds.minZ + bounds.maxZ) / 2);
      if (resetPosition) {
        flight.cancel();
        camera.zoom = 1;
        controls.target.copy(center);
        controls.cursor.copy(center);
        controls.maxTargetRadius = Math.max(8, (bounds.maxX - bounds.minX) * 0.45);
        camera.position.copy(center).add(new T.Vector3(4.6, 32, 34));
        camera.lookAt(center);
        controls.update();
      }
      camera.updateMatrixWorld(true);
      let horizontal = 0, vertical = 0;
      for (const x of [bounds.minX, bounds.maxX]) for (const z of [bounds.minZ, bounds.maxZ]) for (const y of [0, 2]) {
        const point = new T.Vector3(x, y, z).applyMatrix4(camera.matrixWorldInverse);
        horizontal = Math.max(horizontal, Math.abs(point.x));
        vertical = Math.max(vertical, Math.abs(point.y));
      }
      const aspect = width / height;
      const halfHeight = Math.max(vertical + 1.0, (horizontal + 0.8) / aspect);
      camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
      camera.top = halfHeight; camera.bottom = -halfHeight;
      camera.updateProjectionMatrix();
      requestRender();
    }

    function placeLabels() {
      const occupied = [];
      const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
      districtLabels.forEach(({ element, point }) => {
        projectPoint.copy(point).project(camera);
        const x = (projectPoint.x + 1) * width / 2, y = (1 - projectPoint.y) * height / 2;
        const shown = projectPoint.z >= -1 && projectPoint.z <= 1 && x > 10 && x < width - 10 && y > 10 && y < height - 10;
        element.style.visibility = shown ? 'visible' : 'hidden';
        if (shown) {
          element.style.left = `${x}px`; element.style.top = `${y}px`;
          occupied.push({ left: x - element.offsetWidth / 2 - 5, right: x + element.offsetWidth / 2 + 5, top: y - 12, bottom: y + 12 });
        }
      });
      const candidates = [];
      records.forEach((record, id) => {
        const { label, node } = record;
        label.style.visibility = 'hidden';
        label.tabIndex = -1;
        label.setAttribute('aria-hidden', 'true');
        const selected = id === state.selectedId, focused = focusSet.has(id), hovered = id === hoveredId;
        const focusOnly = state.mode !== 'graph' || !!state.selectedId;
        if (!record.visible || (focusOnly && focusSet.size && !selected && !focused && !hovered)) return;
        record.anchor.set(0, -0.02, 0).applyMatrix4(record.group.matrixWorld).project(camera);
        if (record.anchor.z < -1 || record.anchor.z > 1) return;
        const x = (record.anchor.x + 1) * width / 2, y = (1 - record.anchor.y) * height / 2 + 7;
        const landmark = landmarkOrder.indexOf(id);
        const priority = selected ? 10000 : hovered ? 9000 : focused ? 8000 : landmark >= 0 ? 1000 - landmark : 100 - nodeList.indexOf(node);
        candidates.push({ record, x, y, priority, mustShow: selected || hovered });
      });
      candidates.sort((a, b) => b.priority - a.priority).forEach(({ record, x, y, priority, mustShow }) => {
        const element = record.label;
        const w = Math.min(element.offsetWidth || record.node.label.length * 12 + 24, 148), h = element.offsetHeight || 27;
        const alternatives = priority >= 8000 ? [[0, 0], [0, 23], [-20, 12], [20, 12], [0, -27]] : [[0, 0]];
        let placement = null;
        for (const [dx, dy] of alternatives) {
          const cx = x + dx, cy = y + dy;
          const rect = { left: cx - w / 2 - 3, right: cx + w / 2 + 3, top: cy - 2, bottom: cy + h + 3 };
          if (rect.left < 6 || rect.right > width - 6 || rect.top < 6 || rect.bottom > height - 6) continue;
          if (occupied.some((other) => intersects(rect, other))) continue;
          placement = { cx, cy, rect }; break;
        }
        if (!placement && mustShow && x > 0 && x < width && y > 0 && y < height) {
          placement = { cx: Math.max(w / 2 + 7, Math.min(width - w / 2 - 7, x)), cy: Math.min(height - h - 7, y), rect: null };
        }
        if (!placement) return;
        element.style.left = `${placement.cx}px`; element.style.top = `${placement.cy}px`;
        element.style.visibility = 'visible';
        element.style.zIndex = priority >= 8000 ? '3' : '2';
        element.tabIndex = 0;
        element.removeAttribute('aria-hidden');
        if (placement.rect) occupied.push(placement.rect);
      });
    }

    function requestRender() {
      if (frame || disposed || failed) return;
      frame = win.requestAnimationFrame(() => {
        frame = 0;
        if (disposed || failed) return;
        try { renderer.render(scene, camera); placeLabels(); }
        catch { failed = true; reportError('三维画面暂时不可用；请继续使用概念列表和文字说明。'); }
      });
    }

    function resize() {
      if (disposed || failed) return;
      flight.cancel();
      const rectangle = host.getBoundingClientRect();
      width = Math.max(1, Math.round(rectangle.width));
      height = Math.max(1, Math.round(rectangle.height));
      renderer.setPixelRatio?.(Math.min(win.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      frameCamera(false);
    }

    function update(view = {}) {
      if (disposed || failed) return;
      if (view.selectedId !== undefined && view.selectedId !== state.selectedId) flight.cancel();
      state = { ...state, ...view };
      if (!['graph', 'scenario', 'history'].includes(state.mode)) state.mode = 'graph';
      visibleSet = new Set(Array.isArray(state.visibleIds) ? state.visibleIds : nodeList.map((node) => node.id));
      focusSet = new Set(Array.isArray(state.focusIds) ? state.focusIds : []);
      if (state.selectedId && visibleSet.has(state.selectedId)) focusSet.add(state.selectedId);
      const nextLayoutKey = `${state.mode}:${state.mode === 'scenario' ? state.scenarioId || '' : ''}`;
      if (nextLayoutKey !== layoutKey) {
        layoutKey = nextLayoutKey;
        releaseGroup(scenery); releaseGroup(edges);
        districtLabels.forEach(({ element }) => element.remove());
        districtLabels = []; eventMarkers = [];
        scenery = new T.Group(); edges = new T.Group(); scene.add(scenery, edges);
        const positions = state.mode === 'scenario' ? scenarioLayout() : state.mode === 'history' ? historyLayout() : graphLayout();
        records.forEach((record, id) => {
          const position = positions.get(id);
          record.group.userData.placed = !!position;
          if (position) record.group.position.copy(position);
          record.group.scale.setScalar(state.mode === 'history' ? 0.8 : state.mode === 'scenario' ? 1.12 : 1);
        });
        makeEdges(positions);
        frameCamera(true);
      }
      applyState();
      requestRender();
    }

    function pick(event) {
      const rectangle = surface.getBoundingClientRect();
      if (!rectangle.width || !rectangle.height) return null;
      pointer.set(((event.clientX - rectangle.left) / rectangle.width) * 2 - 1, -((event.clientY - rectangle.top) / rectangle.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const targets = [...records.values()].filter((record) => record.visible).map((record) => record.group);
      const hit = raycaster.intersectObjects(targets, true)[0];
      if (!hit) return null;
      let object = hit.object;
      while (object && !object.userData.nodeId) object = object.parent;
      return object?.userData.nodeId || null;
    }

    const pointerDown = (event) => { if (event.button === 0 && event.isPrimary !== false) pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId }; };
    const pointerMove = (event) => {
      if (disposed || failed || event.buttons) return;
      const next = pick(event);
      if (next !== hoveredId) { hoveredId = next; applyState(); requestRender(); }
      surface.style.cursor = next ? 'pointer' : 'grab';
    };
    const pointerUp = (event) => {
      if (!pointerStart || pointerStart.id !== event.pointerId) return;
      const distance = Math.hypot(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
      pointerStart = null;
      if (distance < 7 && !disposed && !failed) { const id = pick(event); if (id) onSelect(id); }
    };
    const pointerLeave = () => { hoveredId = null; applyState(); requestRender(); };
    const pointerCancel = () => { pointerStart = null; };
    const contextLost = (event) => {
      event.preventDefault();
      failed = true;
      flight.cancel();
      controls.enabled = false;
      if (frame) win.cancelAnimationFrame(frame);
      frame = 0;
      reportError('浏览器已释放三维绘图资源；概念列表、关系和场景说明仍可继续使用。');
    };
    surface.addEventListener('pointerdown', pointerDown);
    surface.addEventListener('pointermove', pointerMove);
    surface.addEventListener('pointerup', pointerUp);
    surface.addEventListener('pointerleave', pointerLeave);
    surface.addEventListener('pointercancel', pointerCancel);
    if (!usingSvg) surface.addEventListener('webglcontextlost', contextLost);
    controls.addEventListener('change', requestRender);
    controls.addEventListener('start', flight.cancel);
    const onVisibility = () => { if (doc.hidden) flight.cancel(); else requestRender(); };
    const onMotionChange = () => { if (motionPreference.matches) flight.finish(); };
    doc.addEventListener('visibilitychange', onVisibility);
    win.addEventListener('clh:themechange', applyAtlasTheme);
    motionPreference?.addEventListener?.('change', onMotionChange);
    if (win.ResizeObserver) { resizeObserver = new win.ResizeObserver(resize); resizeObserver.observe(host); }
    else win.addEventListener('resize', resize);

    cleanup = () => {
      if (frame) win.cancelAnimationFrame(frame);
      flight.dispose();
      resizeObserver?.disconnect();
      win.removeEventListener('resize', resize);
      doc.removeEventListener('visibilitychange', onVisibility);
      win.removeEventListener('clh:themechange', applyAtlasTheme);
      motionPreference?.removeEventListener?.('change', onMotionChange);
      surface.removeEventListener('pointerdown', pointerDown);
      surface.removeEventListener('pointermove', pointerMove);
      surface.removeEventListener('pointerup', pointerUp);
      surface.removeEventListener('pointerleave', pointerLeave);
      surface.removeEventListener('pointercancel', pointerCancel);
      surface.removeEventListener('webglcontextlost', contextLost);
      controls.removeEventListener('change', requestRender);
      controls.removeEventListener('start', flight.cancel);
    };
    resize();
    update(state);
    applyAtlasTheme();
    if (doc.fonts?.ready) doc.fonts.ready.then(() => { if (!disposed) requestRender(); }).catch(() => {});

    return {
      update,
      focus(id) {
        const record = records.get(id);
        if (!disposed && !failed && record?.visible) flight.flyTo(record.group.position);
      },
      reset() { if (!disposed && !failed) frameCamera(true); },
      zoom(factor) {
        if (disposed || failed || !Number.isFinite(factor) || factor <= 0) return;
        flight.cancel();
        camera.zoom = Math.max(controls.minZoom, Math.min(controls.maxZoom, camera.zoom / factor));
        camera.updateProjectionMatrix();
        controls.update();
        requestRender();
      },
      dispose() {
        if (disposed) return;
        disposed = true;
        cleanup();
        controls.dispose();
        geometries.forEach((geometry) => geometry.dispose());
        materials.forEach((surface) => surface.dispose());
        geometries.clear(); materials.clear();
        renderer.dispose?.();
        renderer.forceContextLoss?.();
        wrapper.remove();
      },
    };
  } catch (error) {
    console.error('[KnowledgeAtlas] Scene startup failed:',error);
    cleanup();
    resizeObserver?.disconnect();
    controls?.dispose();
    geometries.forEach((geometry) => geometry.dispose());
    materials.forEach((surface) => surface.dispose());
    renderer?.dispose?.();
    renderer?.forceContextLoss?.();
    wrapper?.remove();
    reportError('无法启动三维场景；仍可使用概念列表、关系和分步说明。');
    return emptyController;
  }
}
