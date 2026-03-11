// --- 1. Basic Scene Setup ---
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

// Camera setup
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 15; // Move camera back so Earth is visible

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Add OrbitControls (Allows user to drag/rotate the earth with mouse)
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.minDistance = 6;
controls.maxDistance = 50;

// Lighting (So the Earth isn't just a black silhouette)
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 3, 5);
scene.add(directionalLight);

// --- 2. Create the Earth ---
const earthRadius = 5;
// A group holds both Earth and satellites so they rotate together
const earthGroup = new THREE.Group(); 
scene.add(earthGroup);

const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
const textureLoader = new THREE.TextureLoader();

// Load the local texture file
const earthMaterial = new THREE.MeshPhongMaterial({
    map: textureLoader.load('earth_texture.png'),
    specular: new THREE.Color('grey'),
});

const earthMesh = new THREE.Mesh(earthGeometry, earthMaterial);
earthGroup.add(earthMesh);

// --- 3. Math Helper: Lat/Lon to 3D Cartesian ---
function calcPosFromLatLonRad(lat, lon, radius) {
    // Convert degrees to radians
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    // Spherical to Cartesian coordinate conversion
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = (radius * Math.sin(phi) * Math.sin(theta));
    const y = (radius * Math.cos(phi));

    return new THREE.Vector3(x, y, z);
}

// --- 4. Fetch and Render Satellites ---
async function fetchSatellites() {
    try {
        // Fetch from local FastAPI backend
        const response = await fetch('http://localhost:8000/satellites');
        const json = await response.json();
        
        const satellites = json.data;
        const satGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const satMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // Glowing yellow dots

        satellites.forEach(sat => {
            const satMesh = new THREE.Mesh(satGeometry, satMaterial);
            
            // Position slightly above the earth's surface
            // Real scaling would place them closer to 5.2, but 5.5 makes them easier to see
            const orbitRadius = earthRadius + 0.3; 
            const position = calcPosFromLatLonRad(sat.lat, sat.lon, orbitRadius);
            
            satMesh.position.copy(position);
            earthGroup.add(satMesh);
        });

        console.log(`Loaded ${satellites.length} satellites.`);
    } catch (error) {
        console.error("Error fetching satellite data:", error);
    }
}

fetchSatellites();

// --- 5. Animation Loop & Resize Handler ---
function animate() {
    requestAnimationFrame(animate);

    // Rotate the Earth and Satellites slowly
    earthGroup.rotation.y += 0.001;
    
    controls.update();
    renderer.render(scene, camera);
}
animate();

// Handle window resizing
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});
