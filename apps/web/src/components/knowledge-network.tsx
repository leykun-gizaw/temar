'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function KnowledgeNetwork() {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const mount = mountRef.current;
    const width = mount.clientWidth;
    const height = mount.clientHeight;

    // Modern Chrome returns oklch() strings from getComputedStyle, which
    // Three.js cannot parse. Use a 1×1 canvas to normalise any CSS color
    // (oklch, lch, lab, etc.) to a guaranteed sRGB pixel value instead.
    const primaryCss =
      getComputedStyle(document.documentElement)
        .getPropertyValue('--primary')
        .trim() || 'oklch(0.45 0.08 150)';

    const canvas2d = document.createElement('canvas');
    canvas2d.width = 1;
    canvas2d.height = 1;
    const ctx2d = canvas2d.getContext('2d');
    let nodeColor: THREE.Color;
    if (ctx2d) {
      ctx2d.fillStyle = primaryCss;
      ctx2d.fillRect(0, 0, 1, 1);
      const [r, g, b] = ctx2d.getImageData(0, 0, 1, 1).data;
      nodeColor = new THREE.Color(r / 255, g / 255, b / 255);
    } else {
      nodeColor = new THREE.Color('#3B6E4F');
    }
    const lineColor = nodeColor.clone();

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000);
    camera.position.z = 7;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mount.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // Nodes
    const nodeGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const nodeMat = new THREE.MeshBasicMaterial({ color: nodeColor });

    const nodes: { mesh: THREE.Mesh; velocity: THREE.Vector3 }[] = [];
    const numNodes = 80;

    for (let i = 0; i < numNodes; i++) {
      const mesh = new THREE.Mesh(nodeGeo, nodeMat);
      const phi = Math.acos(-1 + (2 * i) / numNodes);
      const theta = Math.sqrt(numNodes * Math.PI) * phi;
      const r = 4 + (Math.random() - 0.5) * 1.5;
      mesh.position.setFromSphericalCoords(r, phi, theta);
      group.add(mesh);
      nodes.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01,
          (Math.random() - 0.5) * 0.01
        ),
      });
    }

    // Lines
    const lineMat = new THREE.LineBasicMaterial({
      color: lineColor,
      transparent: true,
      opacity: 0.25,
    });

    const lines: { line: THREE.Line; p1: THREE.Mesh; p2: THREE.Mesh }[] = [];

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].mesh.position.distanceTo(nodes[j].mesh.position) < 3.0) {
          const lineGeo = new THREE.BufferGeometry().setFromPoints([
            nodes[i].mesh.position,
            nodes[j].mesh.position,
          ]);
          const line = new THREE.Line(lineGeo, lineMat);
          group.add(line);
          lines.push({ line, p1: nodes[i].mesh, p2: nodes[j].mesh });
        }
      }
    }

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;

    const onMouseMove = (event: MouseEvent) => {
      const rect = mount.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };
    mount.addEventListener('mousemove', onMouseMove);

    // Resize
    const handleResize = () => {
      if (!mount) return;
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Animate
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      group.rotation.x += (mouseY * 0.1 - group.rotation.x) * 0.05;
      group.rotation.y += (mouseX * 0.1 - group.rotation.y) * 0.05;
      group.rotation.y += 0.001;
      group.rotation.x += 0.0005;

      nodes.forEach((node) => {
        node.mesh.position.add(node.velocity);
        if (node.mesh.position.length() > 5.5) {
          node.velocity.multiplyScalar(-1);
        }
      });

      lines.forEach((link) => {
        const positions = link.line.geometry.attributes.position
          .array as Float32Array;
        positions[0] = link.p1.position.x;
        positions[1] = link.p1.position.y;
        positions[2] = link.p1.position.z;
        positions[3] = link.p2.position.x;
        positions[4] = link.p2.position.y;
        positions[5] = link.p2.position.z;
        link.line.geometry.attributes.position.needsUpdate = true;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      mount.removeEventListener('mousemove', onMouseMove);
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full min-h-[400px] md:min-h-[500px]">
      <div ref={mountRef} className="absolute inset-0 cursor-crosshair" />
    </div>
  );
}
