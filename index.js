
import * as THREE from 'three';
let camera, scene, renderer;
let nodes = [];
let RayCastNodes = [];

// number of rows and columns in node grid
const rows = 100;
const columns = 100;
// node size
const nodeSize = 0.02;
// size of hidden nodes in the background
const largerNodeSize = 0.05; 
// distance between each node
const distance = 0.2;
// distance of hidden nodes in the background
const largerDistance  =0.1;
// distance of edges appearing around the mouse
const threshold = 0.5;
// node scale multiplier
const scaleAdjust = 1.8;
// Create a map to store precalculated distances
const distanceMap = new Map();
// Hidden raycast nodes -> visible nodes mapping
const nodeMap = new Map();
init();
animate();

function init() {
    // Camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.position.z = 5;

    // Scene
    scene = new THREE.Scene();

    // Renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    const canvas = renderer.domElement;
    document.querySelector('#canvasWrapper').appendChild(canvas);

    // Create nodes

    const nodeGeometry = new THREE.CircleGeometry(nodeSize, 8);
    const nodeMaterial = new THREE.MeshBasicMaterial({
        color: 0xB2B0B1,
        transparent: true,
        opacity: 0.5,
    });
    const largerNodeGeometry = new THREE.CircleGeometry(largerNodeSize, 8);
    const largerNodeMaterial = new THREE.MeshBasicMaterial({
        color: 0xB2B0B1,
        transparent: true,
        opacity: 0,
    });
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < columns; j++) {
            const smallerNode = new THREE.Mesh(nodeGeometry, nodeMaterial);
            // Adjust the position calculation and scale of the smaller nodes
            smallerNode.position.x = (j - columns / 2) * (nodeSize * 2 + distance);
            smallerNode.position.y = -(i - rows / 2) * (nodeSize * 2 + distance);
            scene.add(smallerNode);
            nodes.push(smallerNode);
    
            const largerNode = new THREE.Mesh(largerNodeGeometry, largerNodeMaterial);
            // Adjust the position calculation and scale of the larger nodes
            largerNode.position.x = (j - columns / 2) * (largerNodeSize * 2 + largerDistance);
            largerNode.position.y = -(i - rows / 2) * (largerNodeSize * 2 + largerDistance);
            scene.add(largerNode);
            RayCastNodes.push(largerNode);
    
            // Associate the larger node with the smaller node using the map
            nodeMap.set(largerNode , smallerNode);
        }
    }
    

    // Calculate and store the distances between all pairs of nodes
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const nearbyNodes = [];

        for (let j = 0; j < nodes.length; j++) {
            const otherNode = nodes[j];
            if (i !== j && node.position.distanceTo(otherNode.position) <= threshold) {
                nearbyNodes.push(otherNode);
            }
        }

        distanceMap.set(node, nearbyNodes);
    }
    // Event listeners
    window.addEventListener('resize', onWindowResize);
}

function animate() {
    requestAnimationFrame(animate);

    // Update nodes positions
    updateNodes();

    renderer.render(scene, camera);
}

function updateNodes() {
    // You can update nodes' positions or colors here if needed
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
document.addEventListener('mousemove', onMouseMove);
//  setup raycaster
const raycaster = new THREE.Raycaster();
function onMouseMove(event) {
    // Get the mouse coordinates
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    // Raycasting to find intersected nodes using a sphere intersection
    const intersects = raycaster.intersectObjects(RayCastNodes);
    console.log(intersects)
    // Check if there's a node under the mouse
    if (intersects.length > 0) {
        const hoveredNode = nodeMap.get(intersects[0].object);

        // Clear previous edges
        nodes.forEach((node=>{
            node.scale.x=1;
            node.scale.y=1;
        }))
        scene.children.filter(child => child.userData && child.userData.isEdge).forEach(child => scene.remove(child));

        // Create edges between the hovered node and nearby nodes
        // Create edges between the hovered node and nearby nodes using the precalculated distances
        const nearbyNodes = distanceMap.get(hoveredNode);

        if (nearbyNodes) {
            nearbyNodes.forEach(node => {
                if (node !== hoveredNode) {
                    node.scale.x=scaleAdjust;
                    node.scale.y=scaleAdjust;
                    const edgeGeometry = new THREE.BufferGeometry().setFromPoints([hoveredNode.position, node.position]);
                    const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xB2B0B1, transparent: true, opacity: 0.25 });
                    const edge = new THREE.Line(edgeGeometry, edgeMaterial);
                    edge.userData.isEdge = true; // Custom property to identify edges
                    scene.add(edge);
                }
            });
        }
    } else {
        // If no node is under the mouse, clear previous edges
        // scene.children.filter(child => child.userData && child.userData.isEdge).forEach(child => scene.remove(child));
    }
}