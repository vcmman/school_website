import { useEffect, useRef } from "react";
import * as THREE from "three";

export type PathPoint = { x: number; y: number; z: number };

type Props = {
  points: Float32Array;
  path: PathPoint[];
  robotPosition?: PathPoint;
};

export default function ThreeView({ points, path, robotPosition }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const cloudRef = useRef<THREE.Points | null>(null);
  const pathRef = useRef<THREE.Line | null>(null);
  const robotRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b0f14");

    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(8, -8, 6);
    camera.up.set(0, 0, 1);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const grid = new THREE.GridHelper(50, 50, "#374151", "#1f2937");
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.5;
    grid.rotateX(Math.PI / 2);
    scene.add(grid);

    const axes = new THREE.AxesHelper(2);
    scene.add(axes);

    const light = new THREE.DirectionalLight("#ffffff", 0.8);
    light.position.set(10, 10, 10);
    scene.add(light);

    const ambient = new THREE.AmbientLight("#6b7280", 0.6);
    scene.add(ambient);

    const animate = () => {
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    rendererRef.current = renderer;
    sceneRef.current = scene;
    cameraRef.current = camera;

    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.dispose();
      container.removeChild(renderer.domElement);
      scene.clear();
    };
  }, []);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (cloudRef.current) {
      scene.remove(cloudRef.current);
      cloudRef.current.geometry.dispose();
    }

    if (points.length === 0) return;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(points, 3));

    const material = new THREE.PointsMaterial({
      size: 0.04,
      color: "#93c5fd"
    });

    const cloud = new THREE.Points(geometry, material);
    cloudRef.current = cloud;
    scene.add(cloud);
  }, [points]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (pathRef.current) {
      scene.remove(pathRef.current);
      pathRef.current.geometry.dispose();
    }

    if (path.length === 0) return;

    const geometry = new THREE.BufferGeometry();
    const vertices = new Float32Array(path.length * 3);
    path.forEach((p, i) => {
      vertices[i * 3] = p.x;
      vertices[i * 3 + 1] = p.y;
      vertices[i * 3 + 2] = p.z;
    });
    geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));

    const material = new THREE.LineBasicMaterial({ color: "#34d399" });
    const line = new THREE.Line(geometry, material);
    pathRef.current = line;
    scene.add(line);
  }, [path]);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    if (!robotRef.current) {
      const geometry = new THREE.SphereGeometry(0.2, 16, 16);
      const material = new THREE.MeshStandardMaterial({ color: "#f97316" });
      const mesh = new THREE.Mesh(geometry, material);
      robotRef.current = mesh;
      scene.add(mesh);
    }

    if (robotPosition) {
      robotRef.current.position.set(robotPosition.x, robotPosition.y, robotPosition.z);
    }
  }, [robotPosition]);

  return <div ref={containerRef} className="three-view" />;
}
