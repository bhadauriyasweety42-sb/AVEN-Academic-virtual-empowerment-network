
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

export default function Avatar3DViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState(
    "Upload a 3D model (.glb or .gltf) to preview it."
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f5f0ff");

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1, 4);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xb8a5d8, 2));

    const light = new THREE.DirectionalLight(0xffffff, 2);
    light.position.set(3, 5, 5);
    scene.add(light);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1, 0);
    controls.update();

    let currentModel: THREE.Object3D | null = null;
    let active = true;

    const loader = new GLTFLoader();

    const handleResize = () => {
      if (!container.clientWidth || !container.clientHeight) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener("resize", handleResize);

    const animate = () => {
      if (!active) return;
      controls.update();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    const handleFile = (event: Event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      if (!/\.(glb|gltf)$/i.test(file.name)) {
        setMessage("Please choose a .glb or .gltf 3D model.");
        target.value = "";
        return;
      }

      const url = URL.createObjectURL(file);
      setMessage("Loading your 3D model...");

      loader.load(
        url,
        (gltf) => {
          URL.revokeObjectURL(url);

          if (!active) {
            gltf.scene.traverse((obj) => {
              if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose();
                const materials = Array.isArray(obj.material)
                  ? obj.material
                  : [obj.material];
                materials.forEach((material) => material.dispose());
              }
            });
            return;
          }

          if (currentModel) {
            scene.remove(currentModel);
          }

          currentModel = gltf.scene;
          scene.add(currentModel);

          const box = new THREE.Box3().setFromObject(currentModel);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          currentModel.position.sub(center);

          const maxDimension = Math.max(size.x, size.y, size.z);
          if (maxDimension > 0) {
            currentModel.scale.setScalar(2.2 / maxDimension);
          }

          camera.position.set(0, 0.5, 4);
          controls.target.set(0, 0, 0);
          controls.update();

          setMessage("Model loaded! Drag to rotate and scroll to zoom.");
        },
        undefined,
        () => {
          URL.revokeObjectURL(url);
          setMessage("Could not load this model. Try another .glb file.");
        }
      );

      target.value = "";
    };

    const input = inputRef.current;
    input?.addEventListener("change", handleFile);

    return () => {
      active = false;
      window.removeEventListener("resize", handleResize);
      input?.removeEventListener("change", handleFile);
      controls.dispose();
      renderer.dispose();
      currentModel?.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const materials = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.domElement.remove();
    };
  }, []);

  return (
    <section
      style={{
        maxWidth: 720,
        margin: "24px auto",
        padding: 20,
        borderRadius: 24,
        background: "#ffffff",
        boxShadow: "0 8px 30px rgba(90, 65, 140, 0.12)",
      }}
    >
      <h2 style={{ color: "#6b4ca5" }}>Your 3D Avatar</h2>

      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: 420,
          overflow: "hidden",
          borderRadius: 18,
        }}
      />

      <p>{message}</p>

      <input
        ref={inputRef}
        type="file"
        accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
      />

      <p style={{ color: "#777", fontSize: 13 }}>
        Choose a 3D model file. Photo-to-3D generation will be added separately.
      </p>
    </section>
  );
}
