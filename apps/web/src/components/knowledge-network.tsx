'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Sparkles } from 'lucide-react';

interface NodeData {
  pos: THREE.Vector3;
  baseY: number;
  decayRate: number;
  isBeingRescued: boolean;
  offset: number;
}

export default function KnowledgeNetwork() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Keep isDarkMode in sync with the document theme
  useEffect(() => {
    const update = () =>
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    update();
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // --- Scene ---
    const scene = new THREE.Scene();
    scene.background = null;
    const fogColor = isDarkMode ? 0x0f1115 : 0xf9f8f6;
    scene.fog = new THREE.Fog(fogColor, 10, 30);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 4, 20);
    camera.lookAt(0, -3, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);
    if (window.innerWidth > 768) group.position.x = 3;
    group.rotation.x = 0.2;

    // --- Theme colors ---
    const themeGreen = new THREE.Color(isDarkMode ? 0x4ade80 : 0x3b6e4f);
    const themeAI = new THREE.Color(0x0ea5e9);
    const themeFaded = new THREE.Color(isDarkMode ? 0x1a1d24 : 0xd1d5db);

    // --- Instanced nodes ---
    const numNodes = 120;
    const nodeGeo = new THREE.IcosahedronGeometry(0.18, 0);
    const nodeMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1,
      clearcoat: 0.5,
    });
    const instancedNodes = new THREE.InstancedMesh(nodeGeo, nodeMat, numNodes);
    group.add(instancedNodes);

    const nodes: NodeData[] = [];
    const radius = 12;
    for (let i = 0; i < numNodes; i++) {
      const r = Math.sqrt(Math.random()) * radius;
      const theta = Math.random() * 2 * Math.PI;
      const x = r * Math.cos(theta);
      const z = r * Math.sin(theta);
      const baseY = -(Math.pow(Math.random(), 3) * 3);
      nodes.push({
        pos: new THREE.Vector3(x, baseY, z),
        baseY,
        decayRate: 0.0005 + Math.random() * 0.002,
        isBeingRescued: false,
        offset: Math.random() * 100,
      });
    }

    // --- Edges ---
    const edges: { a: NodeData; b: NodeData }[] = [];
    for (let i = 0; i < numNodes; i++) {
      for (let j = i + 1; j < numNodes; j++) {
        if (nodes[i].pos.distanceTo(nodes[j].pos) < 3.2) {
          edges.push({ a: nodes[i], b: nodes[j] });
        }
      }
    }
    const edgePositions = new Float32Array(edges.length * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute(
      'position',
      new THREE.BufferAttribute(edgePositions, 3)
    );
    const lineMat = new THREE.LineBasicMaterial({
      color: isDarkMode ? 0x3b6e4f : 0x9ca3af,
      transparent: true,
      opacity: 0.3,
    });
    group.add(new THREE.LineSegments(lineGeo, lineMat));

    // --- AI Orb ---
    const aiGroup = new THREE.Group();
    group.add(aiGroup);

    const aiCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.3, 32, 32),
      new THREE.MeshBasicMaterial({ color: themeAI })
    );
    aiGroup.add(aiCore);

    const aiHaloMat = new THREE.MeshBasicMaterial({
      color: themeAI,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
    });
    const aiHalo = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 32, 32),
      aiHaloMat
    );
    aiGroup.add(aiHalo);
    aiGroup.add(new THREE.PointLight(0x0ea5e9, 3, 15));

    const beamGeo = new THREE.CylinderGeometry(0.05, 0.4, 1, 16, 1, true);
    beamGeo.translate(0, -0.5, 0);
    const beamMat = new THREE.MeshBasicMaterial({
      color: themeAI,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    aiGroup.add(beam);

    // --- Lighting ---
    scene.add(new THREE.AmbientLight(0xffffff, isDarkMode ? 0.4 : 0.8));
    const dirLight = new THREE.DirectionalLight(
      0xffffff,
      isDarkMode ? 0.6 : 0.4
    );
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // --- State ---
    const dummy = new THREE.Object3D();
    const colorHelper = new THREE.Color();
    let time = 0;
    let aiState: 'SCANNING' | 'MOVING' | 'LIFTING' = 'SCANNING';
    let aiTarget: NodeData | null = null;
    let aiTimer = 60;
    const currentOrbTarget = new THREE.Vector3(0, 4, 0);

    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener('mousemove', onMouseMove);

    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      group.position.x = window.innerWidth > 768 ? 3 : 0;
    };
    window.addEventListener('resize', handleResize);

    // --- Animation loop ---
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      time += 0.015;

      group.rotation.y += (mouseX * 0.1 - group.rotation.y) * 0.05;
      group.rotation.x += (0.2 + mouseY * 0.1 - group.rotation.x) * 0.05;

      aiHalo.rotation.x += 0.02;
      aiHalo.rotation.y += 0.02;

      if (aiState === 'SCANNING') {
        aiTimer--;
        beamMat.opacity += (0 - beamMat.opacity) * 0.1;
        currentOrbTarget.set(
          Math.sin(time * 0.4) * 6,
          4 + Math.sin(time * 0.7) * 0.8,
          Math.cos(time * 0.3) * 5
        );
        if (aiTimer <= 0) {
          let lowestNode: NodeData | null = null;
          let lowestY = 0;
          nodes.forEach((n) => {
            if (!n.isBeingRescued && n.baseY < lowestY) {
              lowestY = n.baseY;
              lowestNode = n;
            }
          });
          if (lowestNode && lowestY < -1.5) {
            aiTarget = lowestNode as NodeData;
            aiTarget.isBeingRescued = true;
            aiState = 'MOVING';
          } else {
            aiTimer = 60;
          }
        }
      } else if (aiState === 'MOVING' && aiTarget) {
        currentOrbTarget.set(
          aiTarget.pos.x,
          Math.max(3, aiTarget.pos.y + 3),
          aiTarget.pos.z
        );
        if (aiGroup.position.distanceTo(currentOrbTarget) < 0.8) {
          aiState = 'LIFTING';
        }
      } else if (aiState === 'LIFTING' && aiTarget) {
        currentOrbTarget.set(aiTarget.pos.x, 3.5, aiTarget.pos.z);
        beamMat.opacity += (0.6 - beamMat.opacity) * 0.1;
        aiTarget.baseY += (0 - aiTarget.baseY) * 0.03;
        const dist = Math.max(
          0.01,
          Math.abs(aiGroup.position.y - aiTarget.pos.y)
        );
        beam.scale.set(1, dist, 1);
        if (Math.abs(aiTarget.baseY) < 0.1) {
          aiTarget.baseY = 0;
          aiTarget.isBeingRescued = false;
          aiTarget.decayRate *= 0.5;
          aiTarget = null;
          aiState = 'SCANNING';
          aiTimer = 90;
        }
      }

      aiGroup.position.lerp(currentOrbTarget, 0.03);

      nodes.forEach((n, i) => {
        if (!n.isBeingRescued) {
          n.baseY -= n.decayRate;
          if (n.baseY < -10) n.baseY = -10;
        }
        n.pos.y = n.baseY + Math.sin(time * 2 + n.offset) * 0.15;

        dummy.position.copy(n.pos);
        dummy.rotation.x = time + n.offset;
        dummy.rotation.y = time * 0.5 + n.offset;
        dummy.updateMatrix();
        instancedNodes.setMatrixAt(i, dummy.matrix);

        const depthFactor = Math.max(0, Math.min(1, Math.abs(n.baseY) / 8));
        colorHelper.lerpColors(themeGreen, themeFaded, depthFactor);
        if (n.isBeingRescued) colorHelper.lerp(themeAI, 0.6);
        instancedNodes.setColorAt(i, colorHelper);
      });

      instancedNodes.instanceMatrix.needsUpdate = true;
      if (instancedNodes.instanceColor)
        instancedNodes.instanceColor.needsUpdate = true;

      let pIdx = 0;
      edges.forEach((e) => {
        edgePositions[pIdx++] = e.a.pos.x;
        edgePositions[pIdx++] = e.a.pos.y;
        edgePositions[pIdx++] = e.a.pos.z;
        edgePositions[pIdx++] = e.b.pos.x;
        edgePositions[pIdx++] = e.b.pos.y;
        edgePositions[pIdx++] = e.b.pos.z;
      });
      lineGeo.attributes.position.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', handleResize);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [isDarkMode]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <div ref={mountRef} className="absolute inset-0 z-0" />
      <div className="absolute bottom-6 right-6 bg-white/90 dark:bg-[#1a1d24]/80 backdrop-blur-md border border-gray-200 dark:border-[#2a2f3a] px-4 py-2.5 rounded-xl shadow-lg z-10 transition-colors duration-300">
        <div className="flex items-center space-x-3">
          <Sparkles className="w-4 h-4 text-sky-500 animate-pulse" />
          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
            AI Orb navigating the knowledge mesh to restore sinking chunks
          </span>
        </div>
      </div>
    </div>
  );
}
