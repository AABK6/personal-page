import * as THREE from 'https://unpkg.com/three@0.156.1/build/three.module.js';
import { GLTFLoader } from 'https://unpkg.com/three@0.156.1/examples/jsm/loaders/GLTFLoader.js';

const enterBtn = document.getElementById('enter-btn');
const gameSection = document.getElementById('game');
const introSection = document.getElementById('intro');
let renderer, scene, camera, player;
const speed = 5;
const keys = {};

function init() {
  const canvas = document.getElementById('game-canvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 2, 5);

  const light = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  scene.add(light);

  const floorGeom = new THREE.PlaneGeometry(20, 20);
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x999999 });
  const floor = new THREE.Mesh(floorGeom, floorMat);
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const room1 = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), new THREE.MeshStandardMaterial({ color: 0x3399ff }));
  room1.position.set(5, 1, 0);
  room1.userData.url = 'aid_report.html';
  scene.add(room1);

  const room2 = room1.clone();
  room2.material = room1.material.clone();
  room2.material.color.set(0xff9933);
  room2.position.set(-5, 1, 0);
  room2.userData.url = 'full_report.html';
  scene.add(room2);

  const loader = new GLTFLoader();
  // TODO: Replace the sample model URL below with a young human character of your choice.
  // The model must be in GLTF/GLB format and accessible via URL.
  loader.load(
    'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMan/glTF/CesiumMan.gltf',
    gltf => {
      player = gltf.scene;
      player.position.set(0, 0, 0);
      scene.add(player);
    },
    undefined,
    err => console.error(err)
  );

  window.addEventListener('resize', onResize);
  document.addEventListener('keydown', e => (keys[e.code] = true));
  document.addEventListener('keyup', e => (keys[e.code] = false));
  onResize();
  animate();
}

function onResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function animate() {
  requestAnimationFrame(animate);
  const delta = 0.016;
  if (player) {
    if (keys['ArrowUp'] || keys['KeyW']) player.position.z -= speed * delta;
    if (keys['ArrowDown'] || keys['KeyS']) player.position.z += speed * delta;
    if (keys['ArrowLeft'] || keys['KeyA']) player.position.x -= speed * delta;
    if (keys['ArrowRight'] || keys['KeyD']) player.position.x += speed * delta;

    camera.position.x = player.position.x;
    camera.position.z = player.position.z + 5;
    camera.lookAt(player.position);

    scene.traverse(obj => {
      if (obj.userData.url) {
        const dist = obj.position.distanceTo(player.position);
        if (dist < 1.5) {
          window.location.href = obj.userData.url;
        }
      }
    });
  }
  renderer.render(scene, camera);
}

enterBtn.addEventListener('click', () => {
  introSection.style.display = 'none';
  gameSection.classList.add('active');
  init();
});

