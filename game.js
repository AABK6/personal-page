import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.160.0/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, mixer, character;
const clock = new THREE.Clock();

window.initThree = function initThree() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 3);

  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('three-canvas'), antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 1.0);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshPhongMaterial({ color: 0x999999 })
  );
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const loader = new GLTFLoader();
  loader.load(
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF-Binary/CesiumMan.glb',
    gltf => {
      character = gltf.scene;
      character.scale.set(1.5, 1.5, 1.5);
      scene.add(character);
      if (gltf.animations && gltf.animations.length) {
        mixer = new THREE.AnimationMixer(character);
        mixer.clipAction(gltf.animations[0]).play();
      }
      animate();
    },
    undefined,
    err => console.error('Model loading error', err)
  );

  window.addEventListener('resize', onWindowResize);
  document.addEventListener('keydown', onKeyDown);
};

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(e) {
  if (!character) return;
  const speed = 0.1;
  switch (e.code) {
    case 'ArrowUp':
    case 'KeyW':
      character.position.z -= speed;
      break;
    case 'ArrowDown':
    case 'KeyS':
      character.position.z += speed;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      character.position.x -= speed;
      break;
    case 'ArrowRight':
    case 'KeyD':
      character.position.x += speed;
      break;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  if (mixer) mixer.update(delta);
  renderer.render(scene, camera);
}
