import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RiverReachData, SurveyEpoch } from '../types/river';
import { ThemeConfig } from '../types/theme';

interface River3DSceneProps {
  river: RiverReachData;
  activeEpoch: SurveyEpoch;
  selectedChainageKm: number;
  showDoDHeatmap: boolean;
  showWaterFlow: boolean;
  showCrossSectionPlane: boolean;
  showVegetation: boolean;
  verticalExaggeration: number;
  waterOpacity: number;
  theme: ThemeConfig;
  onSelectStation?: (stationId: string) => void;
}

// Pre-allocated scratch objects to prevent garbage collection inside the render loop
const _color = new THREE.Color();

export const River3DScene: React.FC<River3DSceneProps> = ({
  river,
  activeEpoch,
  selectedChainageKm,
  showDoDHeatmap,
  showWaterFlow,
  showCrossSectionPlane,
  showVegetation,
  verticalExaggeration,
  waterOpacity,
  theme,
  onSelectStation,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    renderer: THREE.WebGLRenderer;
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    terrainMesh: THREE.Mesh;
    waterMesh: THREE.Mesh;
    slicePlane: THREE.Mesh;
    particlesMesh: THREE.Points;
    porcupinesGroup: THREE.Group;
    towersGroup: THREE.Group;
    bridgesGroup: THREE.Group;
    instancedFoliage: THREE.InstancedMesh;
    dirLight: THREE.DirectionalLight;
    hemiLight: THREE.HemisphereLight;
    rimLight: THREE.DirectionalLight;
    animationFrameId: number;
    isSoftwareGl: boolean;
    updateDynamicProps: (props: River3DSceneProps) => void;
  } | null>(null);

  // Store interactive callbacks in ref
  const onSelectStationRef = useRef(onSelectStation);
  onSelectStationRef.current = onSelectStation;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect software WebGL from GPU renderer string
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = theme.isDark ? 1.15 : 1.05;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(renderer.domElement);

    // Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(theme.three.skyColor);
    scene.fog = new THREE.FogExp2(theme.three.skyColor, theme.three.fogDensity);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.5, 1000);
    camera.position.set(0, 75, 110);

    // Studio Environment Reflections (RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Balanced 3-Point Lighting Rig
    const hemiLight = new THREE.HemisphereLight(
      theme.three.hemiSkyColor,
      theme.three.hemiGroundColor,
      theme.three.hemiIntensity
    );
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(
      theme.three.dirLightColor,
      theme.three.dirLightIntensity
    );
    dirLight.position.set(60, 100, 40);
    dirLight.castShadow = !isSoftwareGl;
    if (dirLight.shadow) {
      dirLight.shadow.mapSize.width = 1024;
      dirLight.shadow.mapSize.height = 1024;
      dirLight.shadow.camera.near = 10;
      dirLight.shadow.camera.far = 250;
      const d = 90;
      dirLight.shadow.camera.left = -d;
      dirLight.shadow.camera.right = d;
      dirLight.shadow.camera.top = d;
      dirLight.shadow.camera.bottom = -d;
      dirLight.shadow.bias = -0.0005;
      dirLight.shadow.normalBias = 0.02;
    }
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(
      theme.three.rimLightColor,
      theme.three.rimLightIntensity
    );
    rimLight.position.set(-60, 40, -60);
    scene.add(rimLight);

    // ==========================================
    // PROCEDURAL BATHYMETRIC TERRAIN GENERATION
    // ==========================================
    const gridX = 140;
    const gridZ = 160;
    const terrainGeo = new THREE.PlaneGeometry(160, 180, gridX, gridZ);
    terrainGeo.rotateX(-Math.PI / 2);

    // Calculate height field and cut/fill differences
    const posAttr = terrainGeo.attributes.position;
    const vertexCount = posAttr.count;
    const colors = new Float32Array(vertexCount * 3);
    const dodArray = new Float32Array(vertexCount);
    const baseElevationArray = new Float32Array(vertexCount);

    const reachSeed = river.id === 'brahmaputra' ? 3.2 : river.id === 'kosi' ? 2.5 : 1.8;
    const channelWidth = river.avgChannelWidthM / 65;

    for (let i = 0; i < vertexCount; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);

      // Sinuous central thalweg path
      const thalwegX = Math.sin(z * 0.035 * river.sinuosityIndex) * 22 + Math.cos(z * 0.018) * 8;
      const distFromThalweg = Math.abs(x - thalwegX);

      // Braided secondary channels & bars
      const braidedFreq = Math.sin(x * 0.15 + reachSeed) * Math.cos(z * 0.12);
      const braidedBar = Math.max(0, Math.sin(x * 0.08 - z * 0.06 + reachSeed * 1.5) * 4.5);

      let bedHeight = 0;
      let isChannel = false;

      if (distFromThalweg < channelWidth) {
        isChannel = true;
        const normalizedDist = distFromThalweg / channelWidth;
        const channelTrough = -(1 - normalizedDist * normalizedDist) * 11.5;
        const bedForms = braidedFreq * 2.2 + braidedBar * 0.8;
        bedHeight = channelTrough + bedForms;
      } else {
        const bankRise = Math.min(12, Math.pow(distFromThalweg - channelWidth, 0.75) * 2.4);
        const leveeSpur = Math.sin(z * 0.1) * 1.2;
        bedHeight = bankRise + leveeSpur;
      }

      baseElevationArray[i] = bedHeight;

      // Multi-epoch differential simulation (DoD: Erosion vs Deposition)
      let dodChange = 0;
      if (isChannel) {
        const bendCurvature = Math.cos(z * 0.035 * river.sinuosityIndex);
        if ((bendCurvature > 0 && x > thalwegX) || (bendCurvature < 0 && x < thalwegX)) {
          dodChange = -2.8 - Math.abs(bendCurvature) * 2.5;
        } else {
          dodChange = 1.8 + Math.abs(braidedBar) * 1.2;
        }
      } else if (distFromThalweg < channelWidth + 6) {
        dodChange = -1.5;
      }

      dodArray[i] = dodChange;
      posAttr.setY(i, bedHeight * verticalExaggeration);
    }

    terrainGeo.computeVertexNormals();

    // Procedural color map based on active theme & DoD setting
    function updateTerrainColors(showDoD: boolean, activeTheme: ThemeConfig) {
      const tc = activeTheme.three.terrainColors;
      const dc = activeTheme.three.dodColors;

      for (let i = 0; i < vertexCount; i++) {
        const y = posAttr.getY(i) / verticalExaggeration;
        const dod = dodArray[i];

        if (showDoD) {
          if (dod < -1.2) {
            // Scour
            const t = Math.min(1, Math.abs(dod) / 5.0);
            _color.setRGB(
              dc.scourMid[0] + (dc.scourMax[0] - dc.scourMid[0]) * t,
              dc.scourMid[1] + (dc.scourMax[1] - dc.scourMid[1]) * t,
              dc.scourMid[2] + (dc.scourMax[2] - dc.scourMid[2]) * t
            );
          } else if (dod > 0.8) {
            // Accretion / Silt
            const t = Math.min(1, dod / 4.0);
            _color.setRGB(
              dc.accretionMid[0] + (dc.accretionMax[0] - dc.accretionMid[0]) * t,
              dc.accretionMid[1] + (dc.accretionMax[1] - dc.accretionMid[1]) * t,
              dc.accretionMid[2] + (dc.accretionMax[2] - dc.accretionMid[2]) * t
            );
          } else {
            // Stable bed
            _color.setRGB(dc.stableBed[0], dc.stableBed[1], dc.stableBed[2]);
          }
        } else {
          // Natural Depth Shading
          if (y < -7) {
            _color.setRGB(tc.trench[0], tc.trench[1], tc.trench[2]);
          } else if (y < -2) {
            _color.setRGB(tc.submerged[0], tc.submerged[1], tc.submerged[2]);
          } else if (y < 1) {
            _color.setRGB(tc.dryBar[0], tc.dryBar[1], tc.dryBar[2]);
          } else {
            _color.setRGB(tc.bank[0], tc.bank[1], tc.bank[2]);
          }
        }

        colors[i * 3] = _color.r;
        colors[i * 3 + 1] = _color.g;
        colors[i * 3 + 2] = _color.b;
      }
      terrainGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }

    updateTerrainColors(showDoDHeatmap, theme);

    const terrainMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: theme.isDark ? 0.85 : 0.75,
      metalness: 0.08,
      flatShading: false,
    });

    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.receiveShadow = !isSoftwareGl;
    scene.add(terrainMesh);

    // ==========================================
    // PHYSICAL WATER LAYER WITH FLOW SHADER
    // ==========================================
    const waterGeo = new THREE.PlaneGeometry(160, 180, 80, 80);
    waterGeo.rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(theme.three.waterColor),
      roughness: theme.three.waterRoughness,
      metalness: theme.three.waterMetalness,
      transmission: isSoftwareGl ? 0 : 0.85,
      transparent: true,
      opacity: waterOpacity,
      ior: 1.333,
      depthWrite: false,
    });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.position.y = -1.2;
    scene.add(waterMesh);

    // ==========================================
    // SUSPENDED SEDIMENT & FLOW PARTICLES
    // ==========================================
    const particleCount = isSoftwareGl ? 300 : 1200;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSpeeds = new Float32Array(particleCount);

    for (let p = 0; p < particleCount; p++) {
      const z = (Math.random() - 0.5) * 160;
      const thalwegX = Math.sin(z * 0.035 * river.sinuosityIndex) * 22;
      const x = thalwegX + (Math.random() - 0.5) * (channelWidth * 1.5);
      const y = -1.5 - Math.random() * 4.5;

      particlePositions[p * 3] = x;
      particlePositions[p * 3 + 1] = y;
      particlePositions[p * 3 + 2] = z;
      particleSpeeds[p] = 0.25 + Math.random() * 0.45;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: theme.three.particleColor,
      size: 0.85,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(particleGeo, particleMat);
    scene.add(particlesMesh);

    // ==========================================
    // 3D CROSS-SECTION SLICING PLANE
    // ==========================================
    const sliceGeo = new THREE.PlaneGeometry(150, 40);
    const sliceMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const slicePlane = new THREE.Mesh(sliceGeo, sliceMat);
    slicePlane.position.set(0, 5, 0);
    scene.add(slicePlane);

    // ==========================================
    // PROCEDURAL COMPOSITE 3-12 PART MODELS
    // ==========================================

    // 1. CWC Gauging Towers (Composite 7-part Group)
    const towersGroup = new THREE.Group();
    river.stations.forEach((station, idx) => {
      const tower = new THREE.Group();
      tower.name = `station-${station.id}`;

      // Base concrete plinth
      const plinthGeo = new THREE.CylinderGeometry(2.4, 2.8, 1.8, 8);
      const plinthMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.9 });
      const plinth = new THREE.Mesh(plinthGeo, plinthMat);
      plinth.position.y = 0.9;
      plinth.castShadow = !isSoftwareGl;
      tower.add(plinth);

      // Steel lattice frame column
      const mastGeo = new THREE.CylinderGeometry(0.35, 0.45, 9, 6);
      const steelMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4, metalness: 0.85 });
      const mast = new THREE.Mesh(mastGeo, steelMat);
      mast.position.y = 1.8 + 4.5;
      tower.add(mast);

      // Equipment observation cabin
      const cabinGeo = new THREE.BoxGeometry(2.2, 2.0, 2.2);
      const cabinMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });
      const cabin = new THREE.Mesh(cabinGeo, cabinMat);
      cabin.position.y = 10.5;
      cabin.castShadow = !isSoftwareGl;
      tower.add(cabin);

      // Solar Panel
      const solarGeo = new THREE.BoxGeometry(2.0, 0.1, 1.4);
      const solarMat = new THREE.MeshStandardMaterial({ color: 0x1e3a8a, roughness: 0.2, metalness: 0.9 });
      const solar = new THREE.Mesh(solarGeo, solarMat);
      solar.position.set(0, 11.8, 0.3);
      solar.rotation.x = -Math.PI / 6;
      tower.add(solar);

      // Antenna whip
      const antennaGeo = new THREE.CylinderGeometry(0.04, 0.08, 4);
      const antenna = new THREE.Mesh(antennaGeo, steelMat);
      antenna.position.set(0.8, 13.5, -0.6);
      tower.add(antenna);

      // Acoustic depth sounder sensor cable extending down to water
      const cableGeo = new THREE.CylinderGeometry(0.06, 0.06, 12);
      const cableMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
      const cable = new THREE.Mesh(cableGeo, cableMat);
      cable.position.set(-0.8, 4.5, 0);
      tower.add(cable);

      // Warning strobe light
      const strobeGeo = new THREE.SphereGeometry(0.35, 8, 8);
      const strobeMat = new THREE.MeshBasicMaterial({ color: station.status === 'critical' ? 0xef4444 : 0x22c55e });
      const strobe = new THREE.Mesh(strobeGeo, strobeMat);
      strobe.position.set(0, 12.2, -0.8);
      tower.add(strobe);

      const stationZ = (station.chainageKm / river.reachLengthKm - 0.5) * 140;
      const thalwegX = Math.sin(stationZ * 0.035 * river.sinuosityIndex) * 22;
      const bankX = thalwegX + (idx % 2 === 0 ? channelWidth + 4 : -channelWidth - 4);

      tower.position.set(bankX, 1.5, stationZ);
      towersGroup.add(tower);
    });
    scene.add(towersGroup);

    // 2. Permeable RCC Porcupine Groyne Fields
    const porcupinesGroup = new THREE.Group();
    river.vulnerabilityZones.forEach((zone) => {
      const clusterZ = (zone.chainageStartKm / river.reachLengthKm - 0.5) * 140;
      const thalwegX = Math.sin(clusterZ * 0.035 * river.sinuosityIndex) * 22;
      const bankOffset = zone.bank === 'Left Bank' ? channelWidth + 1 : -channelWidth - 1;

      for (let k = 0; k < 6; k++) {
        const porcupine = new THREE.Group();
        const strutGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.8, 6);
        const rccMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.95 });

        const s1 = new THREE.Mesh(strutGeo, rccMat);
        s1.rotation.z = Math.PI / 4;
        porcupine.add(s1);

        const s2 = new THREE.Mesh(strutGeo, rccMat);
        s2.rotation.x = Math.PI / 4;
        porcupine.add(s2);

        const s3 = new THREE.Mesh(strutGeo, rccMat);
        s3.rotation.y = Math.PI / 4;
        s3.rotation.z = -Math.PI / 4;
        porcupine.add(s3);

        porcupine.position.set(
          thalwegX + bankOffset + (k % 2) * 3.5,
          -1.0,
          clusterZ + (k - 3) * 4.2
        );
        porcupinesGroup.add(porcupine);
      }
    });
    scene.add(porcupinesGroup);

    // 3. Multi-Span River Bridge
    const bridgesGroup = new THREE.Group();
    const bridgeZ = 15;
    const bridgeThalwegX = Math.sin(bridgeZ * 0.035 * river.sinuosityIndex) * 22;

    const deckGeo = new THREE.BoxGeometry(channelWidth * 2.6, 1.2, 5.5);
    const deckMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.8, metalness: 0.2 });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(bridgeThalwegX, 6.5, bridgeZ);
    deck.castShadow = !isSoftwareGl;
    bridgesGroup.add(deck);

    for (let p = -2; p <= 2; p++) {
      const pierGroup = new THREE.Group();
      const columnGeo = new THREE.CylinderGeometry(1.4, 1.6, 12, 12);
      const concreteMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9 });
      const col = new THREE.Mesh(columnGeo, concreteMat);
      col.position.y = 0;
      col.castShadow = !isSoftwareGl;
      pierGroup.add(col);

      const collarGeo = new THREE.TorusGeometry(2.4, 0.7, 8, 16);
      const collarMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95 });
      const collar = new THREE.Mesh(collarGeo, collarMat);
      collar.rotation.x = Math.PI / 2;
      collar.position.y = -4.5;
      pierGroup.add(collar);

      pierGroup.position.set(bridgeThalwegX + p * 14, 0.5, bridgeZ);
      bridgesGroup.add(pierGroup);
    }
    scene.add(bridgesGroup);

    // 4. Instanced Riparian Foliage
    const treeCount = isSoftwareGl ? 80 : 320;
    const treeGeo = new THREE.ConeGeometry(1.6, 4.5, 6);
    treeGeo.translate(0, 2.25, 0);
    const treeMat = new THREE.MeshStandardMaterial({
      color: theme.id === 'thermal' ? 0x9333ea : 0x166534,
      roughness: 0.9,
      metalness: 0.05,
    });
    const instancedFoliage = new THREE.InstancedMesh(treeGeo, treeMat, treeCount);
    instancedFoliage.castShadow = !isSoftwareGl;

    const dummy = new THREE.Object3D();
    let placed = 0;
    for (let t = 0; t < treeCount; t++) {
      const z = (Math.random() - 0.5) * 160;
      const thalwegX = Math.sin(z * 0.035 * river.sinuosityIndex) * 22;
      const side = Math.random() > 0.5 ? 1 : -1;
      const x = thalwegX + side * (channelWidth + 8 + Math.random() * 24);
      const y = 3.5 + Math.random() * 2.0;

      dummy.position.set(x, y * verticalExaggeration, z);
      const scale = 0.75 + Math.random() * 0.5;
      dummy.scale.set(scale, scale * (0.9 + Math.random() * 0.4), scale);
      dummy.rotation.y = Math.random() * Math.PI * 2;
      dummy.updateMatrix();
      instancedFoliage.setMatrixAt(placed, dummy.matrix);

      if (theme.id === 'thermal') {
        _color.setHSL(0.8 + (Math.random() - 0.5) * 0.08, 0.8, 0.4 + Math.random() * 0.1);
      } else {
        _color.setHSL(0.33 + (Math.random() - 0.5) * 0.05, 0.7, 0.22 + Math.random() * 0.12);
      }
      instancedFoliage.setColorAt(placed, _color);
      placed++;
    }
    instancedFoliage.instanceMatrix.needsUpdate = true;
    if (instancedFoliage.instanceColor) instancedFoliage.instanceColor.needsUpdate = true;
    scene.add(instancedFoliage);

    // ==========================================
    // INTERACTIVE CAMERA ORBIT CONTROLS
    // ==========================================
    let isDragging = false;
    let prevMouseX = 0;
    let prevMouseY = 0;
    let spherical = { radius: 135, theta: 0.0, phi: Math.PI / 3.2 };
    let targetLookAt = new THREE.Vector3(0, 0, 0);

    const updateCameraFromSpherical = () => {
      camera.position.x = targetLookAt.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      camera.position.y = targetLookAt.y + spherical.radius * Math.cos(spherical.phi);
      camera.position.z = targetLookAt.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
      camera.lookAt(targetLookAt);
    };
    updateCameraFromSpherical();

    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 0 || e.button === 2) {
        isDragging = true;
        prevMouseX = e.clientX;
        prevMouseY = e.clientY;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - prevMouseX;
      const dy = e.clientY - prevMouseY;
      prevMouseX = e.clientX;
      prevMouseY = e.clientY;

      if (e.buttons === 2 || e.shiftKey) {
        const panSpeed = 0.12;
        targetLookAt.x -= dx * panSpeed * Math.cos(spherical.theta);
        targetLookAt.z += dx * panSpeed * Math.sin(spherical.theta);
        targetLookAt.y += dy * panSpeed;
      } else {
        spherical.theta -= dx * 0.007;
        spherical.phi = Math.max(0.15, Math.min(Math.PI / 2.05, spherical.phi - dy * 0.007));
      }
      updateCameraFromSpherical();
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(25, Math.min(240, spherical.radius + e.deltaY * 0.12));
      updateCameraFromSpherical();
    };

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const intersects = raycaster.intersectObjects(towersGroup.children, true);
      if (intersects.length > 0) {
        let obj: THREE.Object3D | null = intersects[0].object;
        while (obj && obj.parent !== towersGroup) {
          obj = obj.parent;
        }
        if (obj && obj.name.startsWith('station-')) {
          const stationId = obj.name.replace('station-', '');
          if (onSelectStationRef.current) {
            onSelectStationRef.current(stationId);
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });
    renderer.domElement.addEventListener('click', onClick);

    // Animation & Tick loop
    let frameId = 0;
    let clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const animate = () => {
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      if (particlesMesh.visible) {
        const pPositions = particleGeo.attributes.position.array as Float32Array;
        for (let p = 0; p < particleCount; p++) {
          pPositions[p * 3 + 2] += particleSpeeds[p] * 18 * delta;
          if (pPositions[p * 3 + 2] > 80) {
            pPositions[p * 3 + 2] = -80;
          }
        }
        particleGeo.attributes.position.needsUpdate = true;
      }

      waterMesh.position.y = -1.2 + Math.sin(time * 1.5) * 0.12;

      renderer.render(scene, camera);

      if (isSoftwareGl) {
        afterDraw(animate);
      } else {
        frameId = requestAnimationFrame(animate);
      }
    };

    if (isSoftwareGl) {
      afterDraw(animate);
    } else {
      frameId = requestAnimationFrame(animate);
    }

    // Dynamic props updater
    const updateDynamicProps = (props: River3DSceneProps) => {
      // Update slice plane position based on chainage
      const targetZ = (props.selectedChainageKm / props.river.reachLengthKm - 0.5) * 140;
      slicePlane.position.z = targetZ;
      slicePlane.visible = props.showCrossSectionPlane;

      // Update Theme Atmosphere
      scene.background = new THREE.Color(props.theme.three.skyColor);
      if (scene.fog) {
        (scene.fog as THREE.FogExp2).color.set(props.theme.three.skyColor);
        (scene.fog as THREE.FogExp2).density = props.theme.three.fogDensity;
      }

      // Update Lights
      dirLight.color.set(props.theme.three.dirLightColor);
      dirLight.intensity = props.theme.three.dirLightIntensity;
      hemiLight.color.set(props.theme.three.hemiSkyColor);
      hemiLight.groundColor.set(props.theme.three.hemiGroundColor);
      hemiLight.intensity = props.theme.three.hemiIntensity;
      rimLight.color.set(props.theme.three.rimLightColor);
      rimLight.intensity = props.theme.three.rimLightIntensity;

      // Update Water Material
      (waterMesh.material as THREE.MeshPhysicalMaterial).color.set(props.theme.three.waterColor);
      (waterMesh.material as THREE.MeshPhysicalMaterial).opacity = props.waterOpacity;
      (waterMesh.material as THREE.MeshPhysicalMaterial).roughness = props.theme.three.waterRoughness;
      (waterMesh.material as THREE.MeshPhysicalMaterial).metalness = props.theme.three.waterMetalness;

      // Update Particles
      (particlesMesh.material as THREE.PointsMaterial).color.set(props.theme.three.particleColor);

      // Update DoD vs Natural Terrain colors with theme palette
      updateTerrainColors(props.showDoDHeatmap, props.theme);
      if (terrainGeo.attributes.color) {
        terrainGeo.attributes.color.needsUpdate = true;
      }

      // Toggle flow particles & vegetation
      particlesMesh.visible = props.showWaterFlow;
      instancedFoliage.visible = props.showVegetation;

      // Adjust water level based on active survey epoch
      const epochInfo = props.river.epochs.find((e) => e.id === props.activeEpoch);
      const waterOffset = epochInfo ? epochInfo.waterLevelOffset * 0.8 : 0;
      waterMesh.position.y = -1.2 + waterOffset;
    };

    sceneRef.current = {
      renderer,
      scene,
      camera,
      terrainMesh,
      waterMesh,
      slicePlane,
      particlesMesh,
      porcupinesGroup,
      towersGroup,
      bridgesGroup,
      instancedFoliage,
      dirLight,
      hemiLight,
      rimLight,
      animationFrameId: frameId,
      isSoftwareGl,
      updateDynamicProps,
    };

    const handleResize = () => {
      if (!container || !sceneRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('click', onClick);

      if (isSoftwareGl) {
        clearTimeout(frameId);
      } else {
        cancelAnimationFrame(frameId);
      }

      terrainGeo.dispose();
      terrainMat.dispose();
      waterGeo.dispose();
      waterMat.dispose();
      sliceGeo.dispose();
      sliceMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      treeGeo.dispose();
      treeMat.dispose();
      renderer.dispose();

      if (container && renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, [river.id]);

  // Fast prop updates without re-mounting canvas
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.updateDynamicProps({
        river,
        activeEpoch,
        selectedChainageKm,
        showDoDHeatmap,
        showWaterFlow,
        showCrossSectionPlane,
        showVegetation,
        verticalExaggeration,
        waterOpacity,
        theme,
        onSelectStation,
      });
    }
  }, [
    river,
    activeEpoch,
    selectedChainageKm,
    showDoDHeatmap,
    showWaterFlow,
    showCrossSectionPlane,
    showVegetation,
    verticalExaggeration,
    waterOpacity,
    theme,
    onSelectStation,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* Three.js Isolated Canvas Mount */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Floating 3D Navigation Gizmo / Coordinate Badge (Top-Right) */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end pointer-events-none">
        <div
          className="border px-3 py-1.5 rounded-lg text-xs font-mono shadow-lg flex items-center gap-2"
          style={{
            backgroundColor: theme.ui.cardBg,
            borderColor: theme.ui.border,
            color: theme.ui.textPrimary,
          }}
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: theme.ui.accent }}
          />
          <span>LAT: {river.centerCoordinates.lat.toFixed(4)}° N</span>
          <span className="opacity-40">|</span>
          <span>LNG: {river.centerCoordinates.lng.toFixed(4)}° E</span>
        </div>

        {/* Legend Overlay */}
        {showDoDHeatmap && (
          <div
            className="border p-3 rounded-lg text-xs shadow-xl w-52 pointer-events-auto"
            style={{
              backgroundColor: theme.ui.headerBg,
              borderColor: theme.ui.border,
              color: theme.ui.textPrimary,
            }}
          >
            <div className="text-[11px] font-semibold tracking-wider opacity-60 uppercase mb-2">
              DoD Elevation Change
            </div>
            <div className="h-3 w-full rounded bg-gradient-to-r from-red-500 via-stone-400 to-sky-400 mb-1.5" />
            <div className="flex justify-between text-[10px] opacity-70 font-mono">
              <span>-5.0m Scour</span>
              <span>0m Stable</span>
              <span>+4.0m Silt</span>
            </div>
          </div>
        )}
      </div>

      {/* Camera Instruction Helper */}
      <div
        className="absolute bottom-6 left-6 z-10 pointer-events-none text-[11px] border px-3 py-1 rounded-md hidden md:flex items-center gap-2"
        style={{
          backgroundColor: theme.ui.cardBg,
          borderColor: theme.ui.border,
          color: theme.ui.textSecondary,
        }}
      >
        <span>Rotate: Left Click + Drag</span>
        <span>•</span>
        <span>Pan: Right Click / Shift + Drag</span>
        <span>•</span>
        <span>Zoom: Scroll</span>
      </div>
    </div>
  );
};
