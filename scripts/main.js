class Main {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Groups for organizing the scene
        this.bookVisualizationGroup = new THREE.Group();
        this.worldAnchorsGroup = new THREE.Group();
        this.scotGraphGroup = new THREE.Group();

        // Components
        this.bookVisualization = null;
        this.worldCreator = null;
        this.fileHandler = null;
        this.scotGraph = null;

        this.init();
    }

    init() {
        this.initScene();
        this.initCamera();
        this.initRenderer();
        this.initControls();
        this.setupComponents();
        this.animate();
    }

    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x363636);

        // Add groups to scene
        this.scene.add(this.bookVisualizationGroup);
        this.scene.add(this.worldAnchorsGroup);
        this.scene.add(this.scotGraphGroup);

        // Add ambient light to the scene
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Add axes helper (red = X, green = Y, blue = Z)
        const axesHelper = new THREE.AxesHelper(2000); // Size of the axes (length of each axis)
        axesHelper.position.set(0, 0, 0); // Position at the center
        this.scene.add(axesHelper);
    }

    initCamera() {
        this.camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(100, 100, 100);
        this.camera.lookAt(0, 0, 0);
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
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    setupComponents() {
        // Initialize book visualization
        this.bookVisualization = new BookVisualization(this.bookVisualizationGroup);

        // Initialize world creator
        this.worldCreator = new WorldCreator(this.worldAnchorsGroup);

        // Initialize file handler
        this.fileHandler = new FileHandler(this.bookVisualization);

        // Initialize SCoT graph
        this.scotGraph = new SCoTGraph(this.scotGraphGroup);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        TWEEN.update();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Initialize the application
let main;
document.addEventListener('DOMContentLoaded', () => {
    main = new Main();
    window.addEventListener('resize', () => main.onWindowResize());
});





