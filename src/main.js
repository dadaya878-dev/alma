import * as THREE from 'three';

const root = document.querySelector('#game');
const message = document.querySelector('#message');
const startOverlay = document.querySelector('#start');
const startButton = document.querySelector('#startButton');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87918b);
scene.fog = new THREE.FogExp2(0x87918b, 0.023);

const camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 120);
camera.position.set(0, 2.3, 6.8);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
root.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdce5df, 0x344039, 1.35));
const sun = new THREE.DirectionalLight(0xffe4c1, 2.2);
sun.position.set(-8, 14, 7);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
scene.add(sun);

const groundMat = new THREE.MeshStandardMaterial({ color: 0x465448, roughness: 1 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

const pathMat = new THREE.MeshStandardMaterial({ color: 0x716b57, roughness: 1 });
const path = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 30), pathMat);
path.rotation.x = -Math.PI / 2;
path.position.set(0, 0.012, -9);
scene.add(path);

function makeTree(x, z, scale = 1) {
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13 * scale, 0.22 * scale, 2.3 * scale, 7),
    new THREE.MeshStandardMaterial({ color: 0x453b30, roughness: 1 })
  );
  trunk.position.set(x, 1.15 * scale, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const crown = new THREE.Mesh(
    new THREE.ConeGeometry(1.05 * scale, 3.1 * scale, 7),
    new THREE.MeshStandardMaterial({ color: 0x263c32, roughness: 1 })
  );
  crown.position.set(x, 3.0 * scale, z);
  crown.castShadow = true;
  scene.add(crown);
}
for (let i = 0; i < 65; i++) {
  const side = Math.random() > 0.5 ? 1 : -1;
  const x = side * (3.8 + Math.random() * 16);
  const z = -22 + Math.random() * 35;
  makeTree(x, z, 0.7 + Math.random() * 0.8);
}

function makeRock(x, z, scale) {
  const rock = new THREE.Mesh(
    new THREE.DodecahedronGeometry(scale, 0),
    new THREE.MeshStandardMaterial({ color: 0x64665e, roughness: 1 })
  );
  rock.position.set(x, scale * 0.55, z);
  rock.scale.y = 0.7;
  rock.castShadow = true;
  rock.receiveShadow = true;
  scene.add(rock);
}
for (let i = 0; i < 22; i++) makeRock((Math.random() - 0.5) * 25, -18 + Math.random() * 30, 0.18 + Math.random() * 0.55);

// Temporary neutral silhouette for the player; this will be replaced with Anya's approved character model.
const player = new THREE.Group();
const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.32, 0.85, 4, 8), new THREE.MeshStandardMaterial({ color: 0x333c3b, roughness: 0.9 }));
body.position.y = 0.95;
body.castShadow = true;
player.add(body);
const head = new THREE.Mesh(new THREE.SphereGeometry(0.23, 12, 10), new THREE.MeshStandardMaterial({ color: 0xb58f73, roughness: 0.9 }));
head.position.y = 1.72;
player.add(head);
player.position.set(0, 0, 4);
scene.add(player);

// A small brass medallion is the first point of interest.
const medallion = new THREE.Mesh(
  new THREE.CylinderGeometry(0.28, 0.28, 0.065, 32),
  new THREE.MeshStandardMaterial({ color: 0xb89548, metalness: 0.78, roughness: 0.28 })
);
medallion.rotation.x = Math.PI / 2;
medallion.position.set(0.65, 0.16, -3.2);
medallion.castShadow = true;
scene.add(medallion);
const ring = new THREE.Mesh(
  new THREE.TorusGeometry(0.19, 0.018, 8, 24),
  new THREE.MeshStandardMaterial({ color: 0xe0c77e, metalness: 0.8, roughness: 0.25 })
);
ring.position.copy(medallion.position);
ring.rotation.x = Math.PI / 2;
scene.add(ring);

const keys = new Set();
let yaw = 0;
let pitch = -0.08;
let locked = false;
let foundClue = false;
let noticeTimer = 0;

function say(text, seconds = 4) {
  message.textContent = text;
  noticeTimer = seconds;
}

startButton.addEventListener('click', () => {
  startOverlay.style.display = 'none';
  renderer.domElement.requestPointerLock?.();
  say('Осмотрись. На земле впереди что-то блестит.', 5);
});

document.addEventListener('pointerlockchange', () => {
  locked = document.pointerLockElement === renderer.domElement;
});
document.addEventListener('mousemove', (event) => {
  if (!locked) return;
  yaw -= event.movementX * 0.0022;
  pitch = THREE.MathUtils.clamp(pitch - event.movementY * 0.0018, -0.65, 0.35);
});
document.addEventListener('keydown', (event) => {
  keys.add(event.code);
  if (event.code === 'KeyE') interact();
  if (event.code === 'Escape') say('Нажми на игру, чтобы снова захватить мышь.', 3);
});
document.addEventListener('keyup', (event) => keys.delete(event.code));
renderer.domElement.addEventListener('click', () => {
  if (startOverlay.style.display === 'none' && !locked) renderer.domElement.requestPointerLock?.();
});

function interact() {
  const distance = player.position.distanceTo(medallion.position);
  if (distance < 2.25 && !foundClue) {
    foundClue = true;
    medallion.material.color.set(0x6f8a70);
    ring.material.color.set(0xb7d2a9);
    say('Аня подняла медальон. На обратной стороне выгравировано имя «АЛЬМА». Похоже, это не случайная находка.', 8);
    document.querySelector('.objective').textContent = 'Подсказка найдена';
  } else if (distance < 2.25 && foundClue) {
    say('Медальон принадлежал Альме. Нужно продолжать поиски.', 5);
  } else {
    say('Подойди ближе к тому, что блестит на земле.', 3);
  }
}

const clock = new THREE.Clock();
const forward = new THREE.Vector3();
const right = new THREE.Vector3();
const move = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const delta = Math.min(clock.getDelta(), 0.04);

  player.rotation.y = yaw;
  forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
  right.set(Math.cos(yaw), 0, -Math.sin(yaw));
  move.set(0, 0, 0);
  if (keys.has('KeyW') || keys.has('ArrowUp')) move.add(forward);
  if (keys.has('KeyS') || keys.has('ArrowDown')) move.sub(forward);
  if (keys.has('KeyD') || keys.has('ArrowRight')) move.add(right);
  if (keys.has('KeyA') || keys.has('ArrowLeft')) move.sub(right);
  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(3.3 * delta);
    player.position.add(move);
    player.position.x = THREE.MathUtils.clamp(player.position.x, -18, 18);
    player.position.z = THREE.MathUtils.clamp(player.position.z, -28, 18);
  }

  const target = player.position.clone().add(new THREE.Vector3(0, 1.45, 0));
  const cameraOffset = new THREE.Vector3(0, 2.1, 5.2);
  cameraOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), pitch);
  cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  camera.position.copy(target).add(cameraOffset);
  camera.lookAt(target);

  if (noticeTimer > 0) noticeTimer -= delta;
  renderer.render(scene, camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
});