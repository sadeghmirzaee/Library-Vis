/**
 * @type {typeof import('three')}
 */
var THREE = window.THREE;

class Main {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Groups for organizing the scene
        this.worldAnchorsGroup = new THREE.Group();
        this.scotGraphGroup = new THREE.Group();

        // Components
        this.worldCreator = null;
        this.scotGraph = null;

        this.init();
    }

    init() {
        this.initScene();
        this.initCamera();
        this.initRenderer();
        this.initControls();
        this.setupComponents();
        this.setupMouseInteraction();
        this.animate();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x363636);

        // Add groups to scene
        this.scene.add(this.worldAnchorsGroup);
        this.scene.add(this.scotGraphGroup);

        // Add ambient light to the scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Add axes helper (red = X, green = Y, blue = Z)
        const axesHelper = new THREE.AxesHelper(100); // Size of the axes (length of each axis)
        axesHelper.position.set(0, 0, 0); // Position at the center
        this.scene.add(axesHelper);
        
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(100, 100, 200);
    }

    initRenderer() {
        const canvas = document.getElementById('visualization-canvas');
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio); // Add support for high DPI displays
    }

    initControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);

        // Enable damping for smooth camera movement
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Set distance limits
        this.controls.minDistance = 10;  // Minimum zoom distance
        this.controls.maxDistance = 500; // Maximum zoom distance

        // Limit vertical rotation (in radians)
        this.controls.minPolarAngle = Math.PI / 12;  // 30 degrees from top
        this.controls.maxPolarAngle = Math.PI / 2; // ~72 degrees from top

        // Limit horizontal rotation (optional, comment out to allow full rotation)
        // this.controls.minAzimuthAngle = -Math.PI / 4; // -45 degrees
        // this.controls.maxAzimuthAngle = Math.PI / 4;  // 45 degrees

        // Enable panning and add panning limits
        this.controls.enablePan = true;

        // Add panning limits for x and y axes
        const panLimits = {
            minX: -500,
            maxX: 500,
            minY: -500,
            maxY: 500
        };

        // // Save reference to controls for use in event
        // const controls = this.controls;

        // // Listen to controls change and clamp target position
        // controls.addEventListener('change', function () {
        //     const t = controls.target;
        //     t.x = Math.max(panLimits.minX, Math.min(panLimits.maxX, t.x));
        //     t.y = Math.max(panLimits.minY, Math.min(panLimits.maxY, t.y));
        // });

        // Set the target to the center of our scene
        this.controls.target.set(30, 30, 0);

        // Enable smooth camera movements
        this.controls.enableZoom = true;
        this.controls.zoomSpeed = 0.8;  // Make zooming smoother


        // Update the controls
        this.controls.update();
    }

    setupComponents() {
        // Initialize world creator
        this.worldCreator = new WorldCreator(this.worldAnchorsGroup);

        // Initialize SCoT graph
        this.scotGraph = new SCoTGraph(this.scotGraphGroup);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        const deltaTime = 0.016; // Approximately 60 FPS
        TWEEN.update();
        this.controls.update();

        // Update world animations
        if (this.worldCreator) {
            this.worldCreator.update(deltaTime);
        }

        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    setupMouseInteraction() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();

        window.addEventListener('click', (event) => {
            // Calculate mouse position in normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Update the picking ray with the camera and mouse position
            raycaster.setFromCamera(mouse, this.camera);

            // Get all objects that might be clickable
            const clickableObjects = [
                ...this.worldCreator.anchors,
                ...this.worldCreator.temporalAnchors
            ];

            // Calculate objects intersecting the picking ray
            const intersects = raycaster.intersectObjects(clickableObjects);

            if (intersects.length > 0) {
                const clickedObject = intersects[0].object;
                if (clickedObject.userData.clickable && clickedObject.userData.onClick) {
                    clickedObject.userData.onClick();
                }
            }
        });
    }
}

// Initialize the application
let main;
document.addEventListener('DOMContentLoaded', () => {
    main = new Main();
    window.addEventListener('resize', () => main.onWindowResize());
});



