import * as THREE from 'https://unpkg.com/three@latest/build/three.module.js';

let scene, camera, renderer, cube, raycaster, mouse, outlineCube;

init();
animate();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, -1, 5);

    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xffffff);
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    let loader = new THREE.TextureLoader();
    let texture = loader.load('src/images1.png');

    let materials = [];
    for (let i = 0; i < 6; i++) {
        materials.push(new THREE.MeshBasicMaterial({ map: texture }));
    }

    let geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    cube = new THREE.Mesh(geometry, materials);
    cube.position.set(0, 0, 0);
    scene.add(cube);

    renderer.domElement.addEventListener('click', onDocumentMouseClick, false);
    renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);

    let outlineGeometry = new THREE.BoxGeometry(1.55, 1.55, 1.55); // Slightly larger than the original cube
    let outlineMaterial = new THREE.MeshBasicMaterial({ color: 0x0000, side: THREE.BackSide });
    outlineCube = new THREE.Mesh(outlineGeometry, outlineMaterial);
    outlineCube.visible = false; // Initially invisible
    scene.add(outlineCube);
}

function animate() {
    requestAnimationFrame(animate);

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    outlineCube.rotation.x = cube.rotation.x;
    outlineCube.rotation.y = cube.rotation.y;

    renderer.render(scene, camera);
}

function onDocumentMouseMove(event) {
    event.preventDefault();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
    checkHover();
}

function checkHover() {
    raycaster.setFromCamera(mouse, camera);
    let intersects = raycaster.intersectObjects([cube]);
    if (intersects.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
        outlineCube.visible = true;
    } else {
        renderer.domElement.style.cursor = 'auto';
        outlineCube.visible = false;
    }
}

function onDocumentMouseClick(event) {
    event.preventDefault();
    raycaster.setFromCamera(mouse, camera);
    let intersects = raycaster.intersectObjects([cube]);
    if (intersects.length > 0) {
        window.location.href = 'https://www.last.fm/user/hongnoul/';
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
