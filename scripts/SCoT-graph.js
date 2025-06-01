class SCoTGraph {
    constructor(group) {
        this.group = group;
        this.nodes = [];
        this.nodeMeshes = [];
        this.edges = [];
        this.setupFileUpload();
    }

    setupFileUpload() {
        const fileInput = document.getElementById('scotGraphInput');
        const loadButton = document.getElementById('loadScoTGraph');
        const fileNameSpan = document.getElementById('scotFileName');

        loadButton.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                if (file.type === "application/json" || file.name.endsWith('.json')) {
                    fileNameSpan.textContent = file.name;
                    this.loadSCoTFile(file);
                } else {
                    alert('Please select a JSON file.');
                    fileInput.value = '';
                    fileNameSpan.textContent = '';
                }
            }
        });
    }

    loadSCoTFile(file) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data && data.nodes && Array.isArray(data.nodes)) {
                    this.nodes = data.nodes;
                    this.createNodeMeshes();
                } else {
                    throw new Error('Invalid JSON format. Expected { nodes: [...] }');
                }
            } catch (error) {
                console.error('Error parsing JSON file:', error);
                alert('Error: Invalid JSON file format. Please make sure your file contains a "nodes" array.');
            }
        };

        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            alert('Error reading file. Please try again.');
        };

        reader.readAsText(file);
    }

    createNodeMeshes() {
        // Clear existing meshes and edges
        this.nodeMeshes.forEach(mesh => {
            if (mesh.label) {
                this.group.remove(mesh.label);
            }
            this.group.remove(mesh);
        });
        this.edges.forEach(edge => {
            this.group.remove(edge);
        });
        this.nodeMeshes = [];
        this.edges = [];

        // Find min and max weights for normalization
        const weights = this.nodes
            .filter(node => node.weight !== null && node.x !== null && node.y !== null)
            .map(node => node.weight);
        
        const minWeight = Math.min(...weights);
        const maxWeight = Math.max(...weights);
        const weightRange = maxWeight - minWeight;

        // Create a map to store node id to mesh mapping
        const nodeMeshMap = new Map();

        this.nodes.forEach((node, index) => {
            // Skip nodes without valid coordinates or weight
            if (node.x === null || node.y === null || node.weight === null) return;

            // Normalize weight to 0-50 range for z-position
            const normalizedWeight = weightRange === 0 ? 
                50 : // If all weights are the same, put them in the middle
                ((node.weight - minWeight) / weightRange) * 50;

            // Scale node size based on normalized weight (0.5 to 2.5 size range)
            const nodeSize = 0.5 + (normalizedWeight / 50) * 2;
            const nodeGeometry = new THREE.SphereGeometry(nodeSize, 16, 16);

            // Create material with node's color or default
            const nodeMaterial = new THREE.MeshBasicMaterial({
                color: node.colour || 0x808080,
                opacity: node.opacity || 1,
                transparent: true
            });

            const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
            
            // Position the node using its x, y coordinates and normalized weight for z
            nodeMesh.position.set(
                node.x / 10,        // Scale down x coordinate
                node.y / 10,        // Scale down y coordinate
                normalizedWeight    // Use normalized weight for z position
            );

            // Store the node data in the mesh for later use
            nodeMesh.userData = node;

            this.group.add(nodeMesh);
            this.nodeMeshes.push(nodeMesh);
            nodeMeshMap.set(node.id, nodeMesh);

            // Add text label if node has target_text
            if (node.target_text) {
                const label = this.createTextSprite(node.target_text);
                label.position.copy(nodeMesh.position);
                label.position.y += 2 + nodeSize; // Position label above node, adjusted for node size
                this.group.add(label);
                // Store reference to label for cleanup
                nodeMesh.label = label;
            }
        });

        // Create edges after all nodes are created
        this.createEdges(nodeMeshMap);
    }

    createEdges(nodeMeshMap) {
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0xaaaaaa,
            transparent: true,
            opacity: 0.3
        });

        this.nodes.forEach(node => {
            if (node.neighbours_by_cluster) {
                Object.values(node.neighbours_by_cluster).flat().forEach(neighbourId => {
                    const sourceMesh = nodeMeshMap.get(node.id);
                    const targetMesh = nodeMeshMap.get(neighbourId);

                    if (sourceMesh && targetMesh) {
                        const points = [
                            sourceMesh.position,
                            targetMesh.position
                        ];

                        const geometry = new THREE.BufferGeometry().setFromPoints(points);
                        const line = new THREE.Line(geometry, lineMaterial);
                        
                        this.group.add(line);
                        this.edges.push(line);
                    }
                });
            }
        });
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
} 