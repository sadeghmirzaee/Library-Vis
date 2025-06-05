class ModelsVisualization {
    constructor(group) {
        this.group = group;
        this.models = [];
        this.modelMeshes = [];
        this.createDefaultVisualization();
    }

    createDefaultVisualization() {
        // Create a grid for each plane
        const gridHelperXY = new THREE.GridHelper(100, 10, 0x888888, 0x444444);
        gridHelperXY.rotation.x = Math.PI / 2;
        this.group.add(gridHelperXY);

        const gridHelperXZ = new THREE.GridHelper(100, 10, 0x888888, 0x444444);
        this.group.add(gridHelperXZ);

        const gridHelperYZ = new THREE.GridHelper(100, 10, 0x888888, 0x444444);
        gridHelperYZ.rotation.z = Math.PI / 2;
        this.group.add(gridHelperYZ);

        // Add axis labels
        this.createAxisLabel('Concreteness', new THREE.Vector3(100, 0, 0), 'x');
        this.createAxisLabel('Mathematicality', new THREE.Vector3(0, 100, 0), 'y');
        this.createAxisLabel('Computationality', new THREE.Vector3(0, 0, 100), 'z');
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

    createModelMesh(model) {
        const geometry = new THREE.SphereGeometry(2, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0x4169E1,
            transparent: true,
            opacity: 0.8,
            shininess: 30
        });

        const mesh = new THREE.Mesh(geometry, material);
        
        // Position based on model attributes (scaled by 100 to match grid size)
        mesh.position.set(
            model.concreteness * 100 - 50,    // X axis: Concreteness
            model.mathematicality * 100 - 50,  // Y axis: Mathematicality
            model.computationality * 100 - 50  // Z axis: Computationality
        );
        
        // Store the model data in the mesh
        mesh.userData = model;
        
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
} 