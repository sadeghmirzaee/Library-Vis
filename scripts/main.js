class Main {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;

        // Group for organizing the scene
        this.modelsGroup = new THREE.Group();

        // Components
        this.modelsVisualization = null;
        this.fileHandler = null;

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

        // Add group to scene
        this.scene.add(this.modelsGroup);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);
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
        this.renderer.setPixelRatio(window.devicePixelRatio);
    }

    initControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    setupComponents() {
        // Initialize model visualization
        this.modelsVisualization = new ModelsVisualization(this.modelsGroup);

        // Initialize file handler
        this.fileHandler = new FileHandler(this.modelsVisualization);
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





