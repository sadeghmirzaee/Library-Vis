/// <reference types="three" />

/* global THREE */
/* global TWEEN */

class Main {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.directionalLight = null;
        this.lightHelper = null;
        this.dragControls = null;

        // Group for organizing the scene
        this.modelsGroup = new THREE.Group();

        // Components
        this.modelsVisualization = null;
        this.fileHandler = null;

        this.init();
        this.setupDialogs();
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

        this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        this.directionalLight.position.set(50, 50, 50);
        this.scene.add(this.directionalLight);

        // Create a small sphere to represent the light position
        const sphereGeometry = new THREE.SphereGeometry(2, 8, 8);
        const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
        this.lightControl = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.lightControl.position.copy(this.directionalLight.position);
        this.scene.add(this.lightControl);

        // Add light helper
        this.lightHelper = new THREE.DirectionalLightHelper(this.directionalLight, 5);
        this.scene.add(this.lightHelper);
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

        // Setup drag controls for the light control sphere
        this.dragControls = new THREE.DragControls([this.lightControl], this.camera, this.renderer.domElement);
        
        // Update light position when control sphere is dragged
        this.dragControls.addEventListener('drag', (event) => {
            // Update both directional light and helper positions
            this.directionalLight.position.copy(this.lightControl.position);
            this.lightHelper.position.copy(this.lightControl.position);
            this.lightHelper.update();
        });

        // Disable orbit controls while dragging
        this.dragControls.addEventListener('dragstart', () => {
            this.controls.enabled = false;
        });

        this.dragControls.addEventListener('dragend', () => {
            this.controls.enabled = true;
        });
    }

    setupComponents() {
        // Initialize model visualization
        this.modelsVisualization = new ModelsVisualization(this.modelsGroup);

        // Initialize file handler
        this.fileHandler = new FileHandler(this.modelsVisualization);

        // Initialize hover highlight
        this.modelsVisualization.createModelHoverHighlight(
            this.renderer,
            this.camera,
            this.renderer.domElement
        );
    }

    setupDialogs() {
        const aboutDialog = document.getElementById('aboutDialog');
        const aboutButton = document.getElementById('aboutButton');
        const closeButton = aboutDialog.querySelector('.close-button');

        // Open dialog
        aboutButton.addEventListener('click', () => {
            aboutDialog.style.display = 'block';
        });

        // Close dialog when clicking X
        closeButton.addEventListener('click', () => {
            aboutDialog.style.display = 'none';
        });

        // Close dialog when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === aboutDialog) {
                aboutDialog.style.display = 'none';
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        TWEEN.update();
        this.controls.update();
        // Update the light helper position
        if (this.lightHelper) {
            this.lightHelper.update();
        }
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





