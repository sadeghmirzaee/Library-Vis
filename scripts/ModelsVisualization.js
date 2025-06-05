class ModelsVisualization {
    constructor(group) {
        this.group = group;
        this.models = [];
        this.modelMeshes = [];
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.camera = null; // Will be set from outside
        this.currentHighlightedModel = null;
        this.createDefaultVisualization();
    }

    createDefaultVisualization() {
        // Create the axes helper
        const gridHelper = new THREE.AxesHelper(100);
        this.group.add(gridHelper);

        // Add directional cones at the end of each axis
        this.createAxisCone(new THREE.Vector3(100, 0, 0), new THREE.Euler(0, 0, -Math.PI/2), 0xff0000); // X axis - red
        this.createAxisCone(new THREE.Vector3(0, 100, 0), new THREE.Euler(0, 0, 0), 0x00ff00);    // Y axis - green
        this.createAxisCone(new THREE.Vector3(0, 0, 100), new THREE.Euler(Math.PI/2, 0, 0), 0x0000ff);  // Z axis - blue

        // Add axis labels
        this.createAxisLabel('Concreteness', new THREE.Vector3(105, 0, 0), 'x');
        this.createAxisLabel('Mathematicality', new THREE.Vector3(0, 105, 0), 'y');
        this.createAxisLabel('Computationality', new THREE.Vector3(0, 0, 105), 'z');
    }

    createAxisCone(position, rotation, color) {
        const geometry = new THREE.ConeGeometry(2, 6, 32);
        const material = new THREE.MeshBasicMaterial({ color: color });
        const cone = new THREE.Mesh(geometry, material);
        cone.position.copy(position);
        cone.setRotationFromEuler(rotation);
        this.group.add(cone);
    }

    createAxisLabel(text, position, axis) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.font = 'bold 32px Arial';
        context.fillStyle = '#ffffff';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 128, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        // Position and scale the label
        sprite.position.copy(position);
        sprite.scale.set(20, 5, 1);

        // Rotate label based on axis
        if (axis === 'y') {
            sprite.position.y += 10; // Offset for better visibility
        } else if (axis === 'z') {
            sprite.position.z += 10; // Offset for better visibility
        }

        this.group.add(sprite);
    }

    visualizeModels(models) {
        // Clear existing meshes including the default visualization
        while(this.group.children.length > 0) {
            const object = this.group.children[0];
            this.group.remove(object);
        }
        this.modelMeshes = [];
        this.models = models;

        // Recreate the grid and labels
        this.createDefaultVisualization();

        // Create visualization for each model
        this.models.forEach(model => {
            this.createModelMesh(model);
        });
    }

    calculateColorFromAttributes(model) {
        // Convert the 0-1 values to 0-255 range and then to hex
        const r = Math.floor(model.concreteness * 255);
        const g = Math.floor(model.mathematicality * 255);
        const b = Math.floor(model.computationality * 255);
        
        // Combine into a single hex color (0xRRGGBB)
        return (r << 16) | (g << 8) | b;
    }

    createModelMesh(model) {
        const geometry = new THREE.SphereGeometry(2, 32, 32);
        const colorcode = this.calculateColorFromAttributes(model);
        const material = new THREE.MeshPhongMaterial({
            color: colorcode,
            transparent: true,
            opacity: 0.8,
            shininess: 30
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        // Position based on model attributes (scaled by 100 to match grid size)
        mesh.position.set(
            model.concreteness * 100,    // X axis: Concreteness
            model.mathematicality * 100,  // Y axis: Mathematicality
            model.computationality * 100  // Z axis: Computationality
        );
        
        // Store the model data and original color in the mesh
        mesh.userData = {
            ...model,
            originalColor: colorcode
        };
        
        // Add label for the model name
        const label = this.createModelLabel(model.name);
        label.position.copy(mesh.position);
        label.position.y += 5; // Offset label above the sphere
        
        // Add to scene
        this.group.add(mesh);
        this.group.add(label);
        this.modelMeshes.push(mesh);
    }

    createModelLabel(text) {
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
        sprite.scale.set(15, 4, 1);
        return sprite;
    }

    createModelHoverHighlight(renderer, camera, domElement) {
        this.camera = camera;
        
        // Store original colors for restoration
        this.modelMeshes.forEach(mesh => {
            mesh.userData.originalColor = mesh.material.color.getHex();
        });

        // Add mouse move listener
        domElement.addEventListener('mousemove', (event) => {
            // Calculate mouse position in normalized device coordinates (-1 to +1)
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Update the picking ray with the camera and mouse position
            this.raycaster.setFromCamera(this.mouse, camera);

            // Calculate objects intersecting the picking ray
            const intersects = this.raycaster.intersectObjects(this.modelMeshes);

            if (intersects.length > 0) {
                // Mouse is over a model
                const hoveredMesh = intersects[0].object;
                
                // If it's a different model than the one currently highlighted
                if (this.currentHighlightedModel !== hoveredMesh) {
                    // Restore previous highlighted model's color if exists
                    if (this.currentHighlightedModel) {
                        this.currentHighlightedModel.material.color.setHex(
                            this.currentHighlightedModel.userData.originalColor
                        );
                        this.currentHighlightedModel.material.opacity = 0.8;
                    }

                    // Highlight new model
                    this.currentHighlightedModel = hoveredMesh;
                    const originalColor = new THREE.Color(hoveredMesh.userData.originalColor);
                    
                    // Make it brighter and more opaque (increased from 1.5 to 2.0)
                    hoveredMesh.material.color.setRGB(
                        Math.min(originalColor.r * 2.0, 1),
                        Math.min(originalColor.g * 2.0, 1),
                        Math.min(originalColor.b * 2.0, 1)
                    );
                    hoveredMesh.material.opacity = 1.0;
                }
            } else if (this.currentHighlightedModel) {
                // Mouse is not over any model, restore original color
                this.currentHighlightedModel.material.color.setHex(
                    this.currentHighlightedModel.userData.originalColor
                );
                this.currentHighlightedModel.material.opacity = 0.8;
                this.currentHighlightedModel = null;
            }

            // Request render update
            renderer.render(this.group.parent, camera);
        });
    }
} 