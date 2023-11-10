import * as THREE from 'https://unpkg.com/three@latest/build/three.module.js';

let scene, camera, renderer, cube, raycaster, mouse;

init();
animate();

function init() {
    // Create the scene
    scene = new THREE.Scene();

    // Create the camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);

    // Initialize raycaster and mouse
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // Create the renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xf94847); // Set the background color
    document.getElementById('canvas-container').appendChild(renderer.domElement);

    // Texture loader
    let loader = new THREE.TextureLoader();
    let texture = loader.load('src/images1.png'); // Load the texture

    // Create materials with the loaded texture
    let materials = [];
    for (let i = 0; i < 6; i++) {
        materials.push(new THREE.MeshBasicMaterial({ map: texture }));
    }

    // Create the geometry and the cube
    let geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5); // Size of the cube (width, height, depth)
    cube = new THREE.Mesh(geometry, materials);
    cube.position.set(0, 0, 0); // Center the cube
    scene.add(cube);

    // Add event listeners
    renderer.domElement.addEventListener('click', onDocumentMouseClick, false);
    renderer.domElement.addEventListener('mousemove', onDocumentMouseMove, false);
    window.addEventListener('resize', onWindowResize, false);
}

function animate() {
    requestAnimationFrame(animate);

    // Cube rotation
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    // Render the scene
    renderer.render(scene, camera);
}

function onDocumentMouseMove(event) {
    event.preventDefault();

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // Check for hover
    checkHover();
}

function checkHover() {
    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    let intersects = raycaster.intersectObjects([cube]);

    if (intersects.length > 0) {
        renderer.domElement.style.cursor = 'pointer';
    } else {
        renderer.domElement.style.cursor = 'auto';
    }
}

function onDocumentMouseClick(event) {
    event.preventDefault();

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    let intersects = raycaster.intersectObjects([cube]);

    if (intersects.length > 0) {
        // Navigate to the URL if the cube was clicked
        window.location.href = 'https://wmbr.org/cgi-bin/show?id=8066';
    }
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
