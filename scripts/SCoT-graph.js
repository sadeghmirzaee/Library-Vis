class SCoTGraph {
    constructor(group) {
        this.group = group;
        this.nodes = [];
        this.nodeMeshes = [];
        this.edges = [];
        this.setupFileUpload();
        this.setupMouseInteraction();
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
            // Use OctahedronGeometry for a diamond-like shape
            // Parameters: radius, detail level (0 for basic shape)
            const nodeGeometry = new THREE.OctahedronGeometry(nodeSize, 0);

            // Convert the color string to a THREE.js color value
            let nodeColor;
            if (node.colour) {
                // Remove any spaces and ensure it's a proper hex color
                const colorStr = node.colour.trim();
                if (colorStr.startsWith('#')) {
                    nodeColor = new THREE.Color(colorStr);
                } else {
                    // If it doesn't start with #, assume it's a CSS color name
                    nodeColor = new THREE.Color(colorStr);
                }
            } else {
                nodeColor = new THREE.Color(0x808080); // Default gray color
            }

            // Create material with node's color
            const nodeMaterial = new THREE.MeshPhysicalMaterial({
                color: nodeColor,
                opacity: node.opacity || 1,
                transparent: true,
                roughness: 0.6,
                metalness: 0.262,
                ior: 1.84087,
                reflectivity: 0.22600,
                // iridescence: 0.619,
            });

            const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
            
            // Position the node using its x, y coordinates and normalized weight for z
            nodeMesh.position.set(
                node.x / 10,        // Scale down x coordinate
                node.y / 10,        // Scale down y coordinate
                normalizedWeight    // Use normalized weight for z position
            );

            // Store both the node data and original color for highlighting
            nodeMesh.userData = {
                ...node,
                originalColor: nodeColor
            };

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

    setupMouseInteraction() {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const nodeInfoDiv = document.getElementById('nodeInfo');

        // Set initial content
        nodeInfoDiv.textContent = '';

        window.addEventListener('mousemove', (event) => {
            // Calculate mouse position in normalized device coordinates
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            // Update the picking ray with the camera and mouse position
            raycaster.setFromCamera(mouse, main.camera);

            // Calculate objects intersecting the picking ray
            const intersects = raycaster.intersectObjects(this.nodeMeshes);

            if (intersects.length > 0) {
                const node = intersects[0].object.userData;
                const position = intersects[0].object.position;
                
                // Format the node data
                let infoHTML = `
                    <strong>${node.target_text || node.id}</strong><br>
                    Weight: ${node.weight}<br>
                    Cluster ID: ${node.cluster_id}<br>
                    Position: x: ${position.x.toFixed(2)}, y: ${position.y.toFixed(2)}, z: ${position.z.toFixed(2)}<br>
                `;

                // Add centrality score if available
                if (node.centrality_score !== null) {
                    infoHTML += `Centrality Score: ${node.centrality_score.toFixed(4)}<br>`;
                }

                // Add neighbors information if available
                if (node.neighbours_by_cluster) {
                    infoHTML += '<br><strong>Neighbors by Cluster:</strong><br>';
                    Object.entries(node.neighbours_by_cluster).forEach(([clusterId, neighbors]) => {
                        infoHTML += `Cluster ${clusterId}: ${neighbors.length} neighbors<br>`;
                    });
                }

                // Add time-based information if available
                if (node.time_ids && node.weights) {
                    infoHTML += '<br><strong>Weights over Time:</strong><br>';
                    node.time_ids.forEach((timeId, index) => {
                        infoHTML += `Time ${timeId}: ${node.weights[index]}<br>`;
                    });
                }

                nodeInfoDiv.innerHTML = infoHTML;

                // Highlight the node and its edges
                this.highlightNode(node.id);
            } else {
                nodeInfoDiv.textContent = '';
                this.resetHighlights();
            }
        });
    }

    highlightNode(nodeId) {
        // Reset all nodes and edges to normal
        this.resetHighlights();

        // Find the node mesh
        const nodeMesh = this.nodeMeshes.find(mesh => mesh.userData.id === nodeId);
        if (!nodeMesh) return;

        // Highlight the node
        nodeMesh.material.opacity = 1;
        nodeMesh.material.color.setHex(0xffff00);

        // Highlight connected edges
        this.edges.forEach(edge => {
            const points = edge.geometry.attributes.position.array;
            const start = new THREE.Vector3(points[0], points[1], points[2]);
            const end = new THREE.Vector3(points[3], points[4], points[5]);
            
            if (start.equals(nodeMesh.position) || end.equals(nodeMesh.position)) {
                edge.material.opacity = 0.8;
                edge.material.color.setHex(0xffff00);
            }
        });
    }

    resetHighlights() {
        // Reset nodes to their original appearance
        this.nodeMeshes.forEach(mesh => {
            mesh.material.opacity = mesh.userData.opacity || 1;
            // Use the stored original color
            mesh.material.color.copy(mesh.userData.originalColor);
        });

        // Reset edges to their original appearance
        this.edges.forEach(edge => {
            edge.material.opacity = 0.3;
            edge.material.color.setHex(0xaaaaaa);
        });
    }
} 

