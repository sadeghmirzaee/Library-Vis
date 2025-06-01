class WorldCreator {
    constructor(group) {
        this.group = group;
        this.anchors = [];
        this.temporalAnchors = [];
        this.initializeAnchors();
        this.setupTemporalAnchorsUI();
    }
    
    initializeAnchors() {
        // Create a simple cube geometry
        const geometry = new THREE.IcosahedronGeometry(1, 0);
        const material = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.8
        });
        
        const earthSphere = new THREE.Mesh(geometry, material);
        earthSphere.position.set(0, 0, 0);
        
        this.anchors.push(earthSphere);
        this.group.add(earthSphere);

        // Add a point light near the cube to make it visible
        const light = new THREE.PointLight(0xffffff, 1, 100);
        light.position.set(30, 20, 30);
        this.group.add(light);
    }

    setupTemporalAnchorsUI() {
        const fileInput = document.getElementById('temporalAnchorsInput');
        const loadButton = document.getElementById('loadTemporalAnchors');

        loadButton.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                if (file.type === "application/json" || file.name.endsWith('.json')) {
                    this.loadTemporalAnchorsFile(file);
                } else {
                    alert('Please select a JSON file.');
                    fileInput.value = '';
                }
            }
        });
    }

    loadTemporalAnchorsFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data['temporal-anchors']) {
                    // Clear existing temporal anchors
                    this.clearTemporalAnchors();
                    // Create new anchors
                    data['temporal-anchors'].forEach(anchorData => {
                        this.createTemporalAnchor(anchorData);
                    });
                } else {
                    throw new Error('Invalid JSON format. Expected { "temporal-anchors": [...] }');
                }
            } catch (error) {
                console.error('Error parsing temporal anchors:', error);
                alert('Error: Invalid JSON file format. Please make sure your file contains a "temporal-anchors" array.');
            }
        };
        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            alert('Error reading file. Please try again.');
        };
        reader.readAsText(file);
    }

    clearTemporalAnchors() {
        // Remove all temporal anchors and their labels from the scene
        this.temporalAnchors.forEach(anchor => {
            this.group.remove(anchor);
            // Remove the associated label if it exists
            if (anchor.label) {
                this.group.remove(anchor.label);
            }
        });
        this.temporalAnchors = [];
    }

    createTemporalAnchor(anchorData) {
        // Create a unique geometry for temporal anchors
        const geometry = new THREE.OctahedronGeometry(2, 0);
        const material = new THREE.MeshPhongMaterial({
            color: 0x4169E1,
            transparent: true,
            opacity: 0.9,
            emissive: 0x0000ff,
            emissiveIntensity: 0.2
        });

        const anchor = new THREE.Mesh(geometry, material);
        
        // Position the anchor based on the date
        // Handle both BC and AD dates
        let year = 0;
        if (anchorData.date.includes('BC')) {
            year = -parseInt(anchorData.date.replace(' BC', ''));
        } else {
            year = parseInt(anchorData.date);
        }
        
        // Simple linear positioning along x-axis
        // Scale down the year to a reasonable range (divide by 100 for centuries)
        anchor.position.set(
            year / 10, // Position along x-axis based on year
            Math.random() * 20 - 10, // Random y between -10 and 10
            Math.random() * 20 - 10  // Random z between -10 and 10
        );

        // Store the anchor data
        anchor.userData = anchorData;

        // Add hover effect
        anchor.onBeforeRender = () => {
            anchor.rotation.y += 0.01;
        };

        this.temporalAnchors.push(anchor);
        this.group.add(anchor);

        // Add text label
        const textSprite = this.createTextSprite(`${anchorData.name} (${anchorData.date})`);
        textSprite.position.copy(anchor.position);
        textSprite.position.y += 3;
        this.group.add(textSprite);
        // Store reference to label for cleanup
        anchor.label = textSprite;
    }

    createTextSprite(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.font = '24px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.fillText(text, 128, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(10, 2.5, 1);
        return sprite;
    }

    // Method to add more anchors in the future
    addAnchor(position, type) {
        // This will be implemented later for different types of anchors
    }

    // Method to remove anchors
    removeAnchor(anchor) {
        const index = this.anchors.indexOf(anchor);
        if (index > -1) {
            this.anchors.splice(index, 1);
            this.group.remove(anchor);
        }
    }
} 