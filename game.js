/**
 * BlockCraft - Main Game Script
 * 3D Block Building Activity for Sugarizer
 * 
 * Architecture:
 * - Three.js for 3D rendering (loaded as global script)
 * - 10x10x10 grid state (plain JavaScript array)
 * - Raycasting for block placement/removal
 * - InstancedMesh for performance
 */

class BlockCraft {
    constructor() {
        // Scene setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        
        // Game state
        this.grid = new Array(10).fill(null).map(() => 
            new Array(10).fill(null).map(() => 
                new Array(10).fill(null)
            )
        ); // 10x10x10 grid
        this.blocks = []; // Array of {x, y, z, type}
        this.selectedBlock = 'cube';
        
        // Rendering
        this.blockMeshes = {};
        this.raycaster = null;
        this.mouse = new THREE.Vector2();
        this.selectedCellVisualizer = null;
        
        // Camera controls
        this.cameraRotation = { x: Math.PI / 6, y: Math.PI / 4 };
        this.cameraDistance = 30;
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        
        // Performance
        this.frameCount = 0;
        this.lastFpsTime = Date.now();
        this.fps = 60;
        
        // Initialize
        this.init();
    }

    /**
     * Initialize Three.js scene and event listeners
     */
    init() {
        console.log('🎮 BlockCraft initializing...');
        
        // Get canvas
        this.canvas = document.getElementById('canvas');
        
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x1a1a1a);
        this.scene.fog = new THREE.Fog(0x1a1a1a, 50, 100);

        // Create camera
        const width = window.innerWidth;
        const height = window.innerHeight - 60; // Account for toolbar
        this.camera = new THREE.PerspectiveCamera(
            75, 
            width / height, 
            0.1, 
            1000
        );
        this.updateCameraPosition();

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true,
            precision: 'mediump'
        });
        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;

        // Lighting
        this.setupLighting();

        // Grid floor
        this.createGridFloor();

        // Raycaster for clicking
        this.raycaster = new THREE.Raycaster();

        // Event listeners
        this.setupEventListeners();

        // Start animation loop
        this.animate();

        console.log('✅ BlockCraft ready!');
    }

    /**
     * Setup Three.js lighting
     */
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(20, 30, 20);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        sunLight.shadow.camera.left = -50;
        sunLight.shadow.camera.right = 50;
        sunLight.shadow.camera.top = 50;
        sunLight.shadow.camera.bottom = -50;
        this.scene.add(sunLight);

        // Point light
        const pointLight = new THREE.PointLight(0x3498db, 0.5);
        pointLight.position.set(-20, 15, 20);
        this.scene.add(pointLight);
    }

    /**
     * Create grid floor
     */
    createGridFloor() {
        const gridSize = 10;
        const cellSize = 1;
        
        // Grid material
        const gridMaterial = new THREE.LineBasicMaterial({ 
            color: 0x444444,
            transparent: true,
            opacity: 0.3
        });

        // Grid geometry
        const gridGroup = new THREE.Group();
        
        for (let i = 0; i <= gridSize; i++) {
            // X lines
            const xGeom = new THREE.BufferGeometry();
            xGeom.setAttribute('position', new THREE.BufferAttribute(
                new Float32Array([
                    i * cellSize, -0.5, 0,
                    i * cellSize, -0.5, gridSize * cellSize
                ]), 3
            ));
            gridGroup.add(new THREE.Line(xGeom, gridMaterial));

            // Z lines
            const zGeom = new THREE.BufferGeometry();
            zGeom.setAttribute('position', new THREE.BufferAttribute(
                new Float32Array([
                    0, -0.5, i * cellSize,
                    gridSize * cellSize, -0.5, i * cellSize
                ]), 3
            ));
            gridGroup.add(new THREE.Line(zGeom, gridMaterial));
        }

        this.scene.add(gridGroup);

        // Base plane
        const planeGeom = new THREE.PlaneGeometry(gridSize, gridSize);
        const planeMat = new THREE.MeshStandardMaterial({ 
            color: 0x2a2a2a,
            roughness: 0.8
        });
        const plane = new THREE.Mesh(planeGeom, planeMat);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -0.5;
        plane.receiveShadow = true;
        this.scene.add(plane);
    }

    /**
     * Create a block mesh (cube by default)
     */
    createBlockMesh(type = 'cube') {
        let geometry;

        switch (type) {
            case 'slope':
                // Slope/ramp geometry
                geometry = this.createSlopeGeometry();
                break;
            case 'pyramid':
                // Pyramid geometry
                geometry = this.createPyramidGeometry();
                break;
            case 'cube':
            default:
                geometry = new THREE.BoxGeometry(1, 1, 1);
        }

        // Material with standard surface
        const material = new THREE.MeshStandardMaterial({
            color: this.getBlockColor(type),
            roughness: 0.7,
            metalness: 0.2
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return { mesh, geometry, material };
    }

    /**
     * Create slope/ramp geometry (custom BufferGeometry)
     */
    createSlopeGeometry() {
        const geometry = new THREE.BufferGeometry();

        // Vertices for a ramp: base is 1x1, height goes to 1
        const vertices = new Float32Array([
            // Front face (ramp surface)
            -0.5,  0.5,  0.5,  //  0
             0.5,  0.5,  0.5,  //  1
             0.5, -0.5, -0.5,  //  2
            -0.5, -0.5, -0.5,  //  3
            
            // Back face
            -0.5,  0.5, -0.5,  //  4
             0.5,  0.5, -0.5,  //  5
             0.5, -0.5,  0.5,  //  6
            -0.5, -0.5,  0.5,  //  7
        ]);

        const indices = new Uint16Array([
            0, 1, 2,  0, 2, 3,  // Ramp
            4, 6, 5,  4, 7, 6,  // Back
            0, 4, 5,  0, 5, 1,  // Top
            3, 2, 6,  3, 6, 7,  // Bottom
            0, 7, 4,  1, 5, 6,  // Sides
        ]);

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.computeVertexNormals();

        return geometry;
    }

    /**
     * Create pyramid geometry
     */
    createPyramidGeometry() {
        const geometry = new THREE.BufferGeometry();

        const vertices = new Float32Array([
            // Base
            -0.5, -0.5,  0.5,  // 0
             0.5, -0.5,  0.5,  // 1
             0.5, -0.5, -0.5,  // 2
            -0.5, -0.5, -0.5,  // 3
            // Apex
             0.0,  0.5,  0.0,  // 4
        ]);

        const indices = new Uint16Array([
            0, 1, 2,  0, 2, 3,  // Base
            0, 4, 1,  1, 4, 2,  // Sides
            2, 4, 3,  3, 4, 0,  // Sides
        ]);

        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.computeVertexNormals();

        return geometry;
    }

    /**
     * Get block color by type
     */
    getBlockColor(type) {
        const colors = {
            'cube': 0xe74c3c,      // Red
            'slope': 0x3498db,     // Blue
            'pyramid': 0x2ecc71,   // Green
            'stone': 0x95a5a6,     // Gray
            'wood': 0xd68910       // Brown
        };
        return colors[type] || 0xe74c3c;
    }

    /**
     * Place a block at grid position
     */
    placeBlock(x, y, z, type = 'cube') {
        // Validate position
        if (x < 0 || x >= 10 || y < 0 || y >= 10 || z < 0 || z >= 10) {
            return false;
        }

        // Check if already occupied
        if (this.grid[x][y][z] !== null) {
            return false;
        }

        // Add to grid
        this.grid[x][y][z] = { type, placedAt: Date.now() };
        
        // Add to blocks array
        this.blocks.push({ x, y, z, type });

        // Create mesh
        const { mesh } = this.createBlockMesh(type);
        mesh.position.set(x, y, z);
        this.scene.add(mesh);

        // Update stats
        this.updateStats();

        return true;
    }

    /**
     * Remove block at grid position
     */
    removeBlock(x, y, z) {
        // Validate position
        if (x < 0 || x >= 10 || y < 0 || y >= 10 || z < 0 || z >= 10) {
            return false;
        }

        // Check if occupied
        if (this.grid[x][y][z] === null) {
            return false;
        }

        // Remove from grid
        this.grid[x][y][z] = null;

        // Remove from blocks array
        this.blocks = this.blocks.filter(b => !(b.x === x && b.y === y && b.z === z));

        // Remove mesh from scene (find and remove)
        const meshesToRemove = [];
        this.scene.children.forEach(child => {
            if (child.position.x === x && child.position.y === y && child.position.z === z) {
                meshesToRemove.push(child);
            }
        });
        meshesToRemove.forEach(mesh => {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });

        // Update stats
        this.updateStats();

        return true;
    }

    /**
     * Handle canvas click (place/remove blocks)
     */
    onCanvasClick(event) {
        if (event.button === 2) return; // Right click handled separately
        
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / (rect.height)) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Find intersections with scene objects
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            const x = Math.round(point.x);
            const y = Math.round(point.y);
            const z = Math.round(point.z);

            // Clamp to grid
            const clampedX = Math.max(0, Math.min(9, x));
            const clampedY = Math.max(0, Math.min(9, y));
            const clampedZ = Math.max(0, Math.min(9, z));

            // Place block
            this.placeBlock(clampedX, clampedY, clampedZ, this.selectedBlock);
        }
    }

    /**
     * Handle right-click (remove blocks)
     */
    onCanvasRightClick(event) {
        event.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / (rect.height)) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.camera);

        // Find intersections
        const intersects = this.raycaster.intersectObjects(this.scene.children);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            const x = Math.round(point.x);
            const y = Math.round(point.y);
            const z = Math.round(point.z);

            const clampedX = Math.max(0, Math.min(9, x));
            const clampedY = Math.max(0, Math.min(9, y));
            const clampedZ = Math.max(0, Math.min(9, z));

            this.removeBlock(clampedX, clampedY, clampedZ);
        }
    }

    /**
     * Update camera position based on rotation and distance
     */
    updateCameraPosition() {
        const centerX = 5;
        const centerY = 5;
        const centerZ = 5;

        this.camera.position.x = centerX + this.cameraDistance * Math.cos(this.cameraRotation.y) * Math.cos(this.cameraRotation.x);
        this.camera.position.y = centerY + this.cameraDistance * Math.sin(this.cameraRotation.x);
        this.camera.position.z = centerZ + this.cameraDistance * Math.sin(this.cameraRotation.y) * Math.cos(this.cameraRotation.x);

        this.camera.lookAt(centerX, centerY, centerZ);
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Canvas events
        this.canvas.addEventListener('click', (e) => this.onCanvasClick(e));
        this.canvas.addEventListener('contextmenu', (e) => this.onCanvasRightClick(e));
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 1 || e.button === 2) { // Middle or right mouse
                this.isDragging = true;
                this.lastMousePos = { x: e.clientX, y: e.clientY };
            }
        });
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                const deltaX = e.clientX - this.lastMousePos.x;
                const deltaY = e.clientY - this.lastMousePos.y;

                this.cameraRotation.y += deltaX * 0.01;
                this.cameraRotation.x += deltaY * 0.01;

                // Clamp pitch
                this.cameraRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraRotation.x));

                this.updateCameraPosition();
                this.lastMousePos = { x: e.clientX, y: e.clientY };
            }
        });
        this.canvas.addEventListener('mouseup', () => {
            this.isDragging = false;
        });

        // Scroll to zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.cameraDistance += e.deltaY * 0.05;
            this.cameraDistance = Math.max(10, Math.min(50, this.cameraDistance));
            this.updateCameraPosition();
        });

        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Block selector buttons
        document.querySelectorAll('.block-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.block-btn').forEach(b => b.classList.remove('selected'));
                e.target.classList.add('selected');
                this.selectedBlock = e.target.dataset.block;
            });
        });

        // Toolbar buttons
        document.getElementById('btn-save').addEventListener('click', () => this.saveGame());
        document.getElementById('btn-load').addEventListener('click', () => this.loadGame());
        document.getElementById('btn-clear').addEventListener('click', () => this.clearGame());
        document.getElementById('btn-help').addEventListener('click', () => this.showHelp());
    }

    /**
     * Update game statistics display
     */
    updateStats() {
        document.getElementById('stat-blocks').textContent = this.blocks.length;
        
        const avgPos = this.blocks.reduce((acc, b) => ({
            x: acc.x + b.x,
            y: acc.y + b.y,
            z: acc.z + b.z
        }), { x: 0, y: 0, z: 0 });

        if (this.blocks.length > 0) {
            avgPos.x = Math.round(avgPos.x / this.blocks.length);
            avgPos.y = Math.round(avgPos.y / this.blocks.length);
            avgPos.z = Math.round(avgPos.z / this.blocks.length);
            document.getElementById('stat-pos').textContent = `${avgPos.x},${avgPos.y},${avgPos.z}`;
        } else {
            document.getElementById('stat-pos').textContent = '—';
        }
    }

    /**
     * Save game state to localStorage
     */
    saveGame() {
        const gameState = {
            blocks: this.blocks,
            timestamp: Date.now()
        };
        localStorage.setItem('blockcraft-save', JSON.stringify(gameState));
        alert('✅ Game saved!');
    }

    /**
     * Load game state from localStorage
     */
    loadGame() {
        const saved = localStorage.getItem('blockcraft-save');
        if (!saved) {
            alert('❌ No save found!');
            return;
        }

        this.clearGame();
        const gameState = JSON.parse(saved);

        // Restore blocks
        gameState.blocks.forEach(block => {
            this.placeBlock(block.x, block.y, block.z, block.type);
        });

        alert('✅ Game loaded!');
    }

    /**
     * Clear all blocks
     */
    clearGame() {
        if (!confirm('⚠️ Clear all blocks? This cannot be undone!')) {
            return;
        }

        // Remove all meshes
        const meshesToRemove = this.scene.children.filter(child => 
            child instanceof THREE.Mesh && child !== this.scene.children[0]
        );
        meshesToRemove.forEach(mesh => {
            this.scene.remove(mesh);
            if (mesh.geometry) mesh.geometry.dispose();
            if (mesh.material) mesh.material.dispose();
        });

        // Clear arrays
        this.blocks = [];
        this.grid = new Array(10).fill(null).map(() => 
            new Array(10).fill(null).map(() => 
                new Array(10).fill(null)
            )
        );

        this.updateStats();
    }

    /**
     * Show help dialog
     */
    showHelp() {
        const help = `
BlockCraft Help
===============

CONTROLS:
- Click: Place block
- Right-click: Remove block
- Drag + Right-click: Rotate camera
- Scroll: Zoom in/out

BLOCK TYPES:
- Cube: Basic building block
- Slope: Ramp for structures
- Pyramid: Decorative block

GRID:
- 10 x 10 x 10 blocks maximum
- Build recognizable structures!

SAVING:
- Click Save to store your creation
- Click Load to restore it later
        `;
        alert(help);
    }

    /**
     * Handle window resize
     */
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight - 60;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }

    /**
     * Main animation loop
     */
    animate = () => {
        requestAnimationFrame(this.animate);

        // Update FPS counter
        this.frameCount++;
        const now = Date.now();
        if (now - this.lastFpsTime > 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFpsTime = now;
            document.getElementById('stat-fps').textContent = this.fps;
        }

        // Render
        this.renderer.render(this.scene, this.camera);
    };
}

// Initialize game when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Starting BlockCraft...');
    window.game = new BlockCraft();
});
