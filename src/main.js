import * as THREE from 'three';

const root = document.querySelector('#game');
const message = document.querySelector('#message');
const objective = document.querySelector('.objective');
const startOverlay = document.querySelector('#start');
const startButton = document.querySelector('#startButton');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x89958b);
scene.fog = new THREE.FogExp2(0x89958b, 0.019);
const camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.1, 150);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
root.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdce8df, 0x344238, 1.5));
const sun = new THREE.DirectionalLight(0xffe4c3, 2.1);
sun.position.set(-9, 16, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1536, 1536);
scene.add(sun);

const mats = {
  bark: new THREE.MeshStandardMaterial({ color: 0x493b2e, roughness: 1 }),
  leaves: new THREE.MeshStandardMaterial({ color: 0x263d32, roughness: 1 }),
  ground: new THREE.MeshStandardMaterial({ color: 0x465447, roughness: 1 }),
  path: new THREE.MeshStandardMaterial({ color: 0x766e59, roughness: 1 }),
  gold: new THREE.MeshStandardMaterial({ color: 0xc3a35a, metalness: 0.72, roughness: 0.3 }),
  stone: new THREE.MeshStandardMaterial({ color: 0x62665e, roughness: 1 }),
  glow: new THREE.MeshStandardMaterial({ color: 0xd5c48d, emissive: 0x6b5425, emissiveIntensity: 0.6 })
};

const ground = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), mats.ground);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

function addTree(x, z, s = 1) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.13*s, .22*s, 2.5*s, 7), mats.bark);
  trunk.position.set(x, 1.25*s, z);
  trunk.castShadow = true;
  scene.add(trunk);
  for (let i = 0; i < 3; i++) {
    const crown = new THREE.Mesh(new THREE.ConeGeometry((1.05-i*.12)*s, 2.2*s, 7), mats.leaves);
    crown.position.set(x, (2.5+i*.65)*s, z);
    crown.castShadow = true;
    scene.add(crown);
  }
}
for (let i = 0; i < 95; i++) {
  const side = Math.random() < .5 ? -1 : 1;
  addTree(side * (4.6 + Math.random()*18), -30 + Math.random()*45, .65 + Math.random()*.9);
}
for (let i = 0; i < 35; i++) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.2+Math.random()*.55), mats.stone);
  rock.position.set((Math.random()-.5)*32, .18, -25+Math.random()*38);
  rock.scale.y = .65;
  rock.castShadow = true;
  scene.add(rock);
}

// Winding path built from short ground sections.
for (let i = 0; i < 9; i++) {
  const segment = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 5.2), mats.path);
  segment.rotation.x = -Math.PI/2;
  segment.position.set(Math.sin(i*.48)*1.2, .015, 3-i*4.4);
  segment.rotation.z = Math.sin(i*.48)*-.08;
  scene.add(segment);
}

// Player placeholder: a temporary silhouette until the approved character artwork is attached.
const player = new THREE.Group();
const coat = new THREE.Mesh(new THREE.CapsuleGeometry(.32, .82, 4, 9), new THREE.MeshStandardMaterial({ color: 0x303c3a, roughness: .95 }));
coat.position.y = .92;
coat.castShadow = true;
player.add(coat);
const head = new THREE.Mesh(new THREE.SphereGeometry(.23, 16, 12), new THREE.MeshStandardMaterial({ color: 0xb58f73, roughness: .9 }));
head.position.y = 1.68;
player.add(head);
player.position.set(0, 0, 5);
scene.add(player);

// Interaction targets and chapter state.
const targets = [];
function addTarget(mesh, position, title, kind, radius = 2.2) {
  mesh.position.copy(position);
  mesh.castShadow = true;
  scene.add(mesh);
  targets.push({ mesh, title, kind, radius, used: false });
}
const medallion = new THREE.Mesh(new THREE.TorusGeometry(.23, .055, 10, 28), mats.gold);
addTarget(medallion, new THREE.Vector3(.7, .22, -2.4), 'Старый медальон', 'medallion');

const noteBase = new THREE.Mesh(new THREE.BoxGeometry(.75, .08, .52), new THREE.MeshStandardMaterial({ color: 0x9b8868, roughness: 1 }));
const note = new THREE.Group();
note.add(noteBase);
const noteMark = new THREE.Mesh(new THREE.BoxGeometry(.3, .012, .025), new THREE.MeshStandardMaterial({ color: 0x3f3528 }));
noteMark.position.y = .05;
note.add(noteMark);
addTarget(note, new THREE.Vector3(-1.4, .7, -10.5), 'Записка на пне', 'note');

const stump = new THREE.Mesh(new THREE.CylinderGeometry(.45, .55, .72, 9), mats.bark);
stump.position.set(-1.4, .36, -10.5);
stump.castShadow = true;
scene.add(stump);

// Three rune stones. The clue tells the player the correct order: leaf, moon, star.
const runeData = [
  { name: 'Лист', symbol: '✦', pos: new THREE.Vector3(-3.1, .65, -17), color: 0x8da77c },
  { name: 'Луна', symbol: '☾', pos: new THREE.Vector3(0, .65, -18.4), color: 0xb4c1c8 },
  { name: 'Звезда', symbol: '✧', pos: new THREE.Vector3(3.1, .65, -17), color: 0xd5bc78 }
];
const runes = runeData.map((data, index) => {
  const group = new THREE.Group();
  const stone = new THREE.Mesh(new THREE.CylinderGeometry(.55, .68, 1.3, 7), mats.stone);
  stone.castShadow = true;
  group.add(stone);
  const glyph = new THREE.Mesh(new THREE.TorusGeometry(.2, .035, 8, 20), new THREE.MeshStandardMaterial({ color: data.color, emissive: data.color, emissiveIntensity: .25 }));
  glyph.position.y = .69;
  group.add(glyph);
  addTarget(group, data.pos, data.name, 'rune', 2.5);
  return targets[targets.length-1];
});

// A sealed wooden arch blocks the path until the riddle is solved.
const gate = new THREE.Group();
for (const x of [-2.1, 2.1]) {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.18, .25, 3.8, 8), mats.bark);
  post.position.set(x, 1.9, 0);
  post.castShadow = true;
  gate.add(post);
}
const beam = new THREE.Mesh(new THREE.BoxGeometry(4.5, .35, .45), mats.bark);
beam.position.y = 3.65;
gate.add(beam);
for (let i=0;i<7;i++) {
  const bar = new THREE.Mesh(new THREE.BoxGeometry(.13, 2.5, .18), mats.bark);
  bar.position.set(-1.5+i*.5, 1.35, 0);
  gate.add(bar);
}
gate.position.set(0, 0, -23);
scene.add(gate);

const keys = new Set();
let yaw = 0, pitch = -.08, locked = false;
let stage = 0, runeStep = 0, noticeTimer = 0, ended = false;
const correctOrder = ['Лист', 'Луна', 'Звезда'];
const messageText = (text, seconds = 5) => { message.textContent = text; noticeTimer = seconds; };
function setObjective(text) { objective.textContent = text; }
function begin() {
  startOverlay.style.display = 'none';
  renderer.domElement.requestPointerLock?.();
  messageText('Аня остановилась на лесной опушке. Нужно понять, куда исчезла Альма.', 7);
}
startButton.addEventListener('click', begin);
document.addEventListener('pointerlockchange', () => { locked = document.pointerLockElement === renderer.domElement; });
document.addEventListener('mousemove', e => {
  if (!locked) return;
  yaw -= e.movementX*.0022;
  pitch = THREE.MathUtils.clamp(pitch-e.movementY*.0018, -.58, .28);
});
document.addEventListener('keydown', e => {
  keys.add(e.code);
  if (e.code === 'KeyE' && !e.repeat) interact();
  if (e.code === 'Escape' && !ended) messageText('Нажми на игровое поле, чтобы вернуть управление мышью.', 3);
});
document.addEventListener('keyup', e => keys.delete(e.code));
renderer.domElement.addEventListener('click', () => {
  if (startOverlay.style.display === 'none' && !locked) renderer.domElement.requestPointerLock?.();
});

function interact() {
  if (ended) return;
  let nearest = null, best = Infinity;
  for (const target of targets) {
    if (target.used && target.kind !== 'rune') continue;
    const d = player.position.distanceTo(target.mesh.position);
    if (d < target.radius && d < best) { nearest = target; best = d; }
  }
  if (!nearest) { messageText('Здесь пока нечего исследовать. Осмотрись и найди следы.', 3); return; }

  if (nearest.kind === 'medallion' && stage === 0) {
    nearest.used = true;
    nearest.mesh.material.color.set(0x8ba68c);
    stage = 1;
    setObjective('Осмотри записку у старого пня');
    messageText('Аня подняла медальон. На обратной стороне выгравировано: «АЛЬМА». Рядом видны следы, ведущие вглубь леса.', 8);
  } else if (nearest.kind === 'note' && stage === 1) {
    nearest.used = true;
    stage = 2;
    setObjective('Реши загадку у каменных знаков');
    messageText('На записке выведены три знака: ЛИСТ → ЛУНА → ЗВЕЗДА. Похоже, это порядок для камней впереди.', 8);
  } else if (nearest.kind === 'rune' && stage === 2) {
    const expected = correctOrder[runeStep];
    if (nearest.title === expected) {
      runeStep++;
      nearest.mesh.children[1].material.emissiveIntensity = .95;
      messageText(runeStep === 3 ? 'Все три знака загорелись. Замок старой арки щёлкнул.' : 'Знак откликнулся. Продолжай в правильном порядке.', 4);
      if (runeStep === 3) {
        stage = 3;
        gate.visible = false;
        setObjective('Пройди через арку и найди следы Альмы');
      }
    } else {
      runeStep = 0;
      for (const t of runes) t.mesh.children[1].material.emissiveIntensity = .25;
      messageText('Камни погасли. Порядок неверный. Вспомни записку: лист, луна, звезда.', 5);
    }
  } else if (nearest.kind === 'rune' && stage > 2) {
    messageText('Каменные знаки уже активированы.', 3);
  }
}

const pawprints = [];
for (let i=0;i<9;i++) {
  const print = new THREE.Mesh(new THREE.SphereGeometry(.11, 8, 6), new THREE.MeshStandardMaterial({ color: 0x292d28, roughness: 1 }));
  print.scale.set(1.3, .12, .8);
  print.position.set(Math.sin(i*.6)*.8, .04, -27-i*1.2);
  scene.add(print);
  pawprints.push(print);
}
const clearing = new THREE.Mesh(new THREE.CircleGeometry(5.5, 32), new THREE.MeshStandardMaterial({ color: 0x59634e, roughness: 1 }));
clearing.rotation.x = -Math.PI/2;
clearing.position.set(0, .025, -39);
scene.add(clearing);

// Distant warm lights give the clearing a focal point.
for (let i=0;i<12;i++) {
  const orb = new THREE.Mesh(new THREE.SphereGeometry(.055, 8, 8), mats.glow);
  orb.position.set((Math.random()-.5)*9, .5+Math.random()*2, -37-Math.random()*5);
  scene.add(orb);
}

const clock = new THREE.Clock();
const forward = new THREE.Vector3(), right = new THREE.Vector3(), movement = new THREE.Vector3();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), .04);
  player.rotation.y = yaw;
  forward.set(-Math.sin(yaw), 0, -Math.cos(yaw));
  right.set(Math.cos(yaw), 0, -Math.sin(yaw));
  movement.set(0,0,0);
  if (keys.has('KeyW') || keys.has('ArrowUp')) movement.add(forward);
  if (keys.has('KeyS') || keys.has('ArrowDown')) movement.sub(forward);
  if (keys.has('KeyD') || keys.has('ArrowRight')) movement.add(right);
  if (keys.has('KeyA') || keys.has('ArrowLeft')) movement.sub(right);
  if (movement.lengthSq() > 0) {
    movement.normalize().multiplyScalar(3.25*dt);
    const next = player.position.clone().add(movement);
    // Keep the player inside the playable forest corridor.
    if (Math.abs(next.x) < 8.5 && next.z < 8 && next.z > -47) player.position.copy(next);
    if (stage < 3 && player.position.z < -20.5) player.position.z = -20.5;
    if (stage >= 3 && player.position.z < -47) player.position.z = -47;
  }

  if (stage === 3 && player.position.z < -35 && !ended) {
    ended = true;
    setObjective('Глава I завершена');
    messageText('За аркой следы становятся отчётливее. Из глубины леса доносится знакомый лай… Аня ускоряет шаг. ПРОДОЛЖЕНИЕ СЛЕДУЕТ.', 999);
    document.exitPointerLock?.();
  }

  const target = player.position.clone().add(new THREE.Vector3(0,1.35,0));
  const offset = new THREE.Vector3(0,2.15,5.4).applyAxisAngle(new THREE.Vector3(1,0,0),pitch).applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
  camera.position.copy(target).add(offset);
  camera.lookAt(target);
  if (noticeTimer > 0) noticeTimer -= dt;
  renderer.render(scene,camera);
}
animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
});
