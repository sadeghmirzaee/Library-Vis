class BookVisualization {
    constructor(group) {
        this.bookGroup = group;
        this.books = [];
        this.bookMeshes = [];
        this.bookAxisLabels = {
            random: [],
            publisher: [],
            year: []
        };
        this.isBook2DView = false;
        this.initBookVisualization();
    }

    initBookVisualization() {
        this.addBookGrid();
        this.addBookXAxis();
        this.setupBookEventListeners();
    }

    addBookGrid() {
        const gridHelper = new THREE.GridHelper(100, 10);
        this.bookGroup.add(gridHelper);
    }

    addBookXAxis() {
        const xAxisGeometry = new THREE.BufferGeometry();
        const xAxisMaterial = new THREE.LineBasicMaterial({ color: 0xff8800, linewidth: 2 });
        const xAxisPoints = [
            new THREE.Vector3(-50, 0, 0),
            new THREE.Vector3(50, 0, 0)
        ];
        xAxisGeometry.setFromPoints(xAxisPoints);
        const xAxis = new THREE.Line(xAxisGeometry, xAxisMaterial);
        this.bookGroup.add(xAxis);  

        // Add X-axis arrow
        const arrowGeometry = new THREE.ConeGeometry(1, 4, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xff8800 });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.x = 52;
        arrow.rotation.z = -Math.PI / 2;
        this.bookGroup.add(arrow);
    }

    createBookTextSprite(text, x) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.font = '24px Arial';
        context.fillStyle = '#ff8800';
        context.textAlign = 'center';
        context.fillText(text, 128, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(x, -5, 0);
        sprite.scale.set(20, 5, 1);
        return sprite;
    }

    updateBookAxisLabels(xAxisType) {
        // Remove all existing labels
        Object.values(this.bookAxisLabels).flat().forEach(label => this.bookGroup.remove(label));
        
        const axisLabelDiv = document.getElementById('axisLabel');
        const publishers = [...new Set(this.books.map(book => book.publisher))];
        const years = this.books.map(book => book.publicationYear);
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        
        switch(xAxisType) {
            case 'publisher':
                axisLabelDiv.textContent = 'X-Axis: Publishers';
                publishers.forEach((publisher, i) => {
                    const x = (i - (publishers.length - 1) / 2) * 20;
                    const label = this.createBookTextSprite(publisher.split(' ')[0], x);
                    this.bookGroup.add(label);
                    this.bookAxisLabels.publisher.push(label);
                });
                break;
            case 'year':
                axisLabelDiv.textContent = 'X-Axis: Publication Year';
                // Create labels for every 10 years between min and max
                const yearStep = 10;
                const yearRange = maxYear - minYear;
                const numLabels = Math.ceil(yearRange / yearStep);
                for (let i = 0; i <= numLabels; i++) {
                    const year = minYear + (i * yearStep);
                    if (year <= maxYear) {
                        const label = this.createBookTextSprite(year.toString(), year);
                        this.bookGroup.add(label);
                        this.bookAxisLabels.year.push(label);
                    }
                }
                break;
            default:
                axisLabelDiv.textContent = 'X-Axis: Random Distribution';
        }
    }

    getBookXPosition(book, xAxisType) {
        switch(xAxisType) {
            case 'publisher':
                const publishers = [...new Set(this.books.map(book => book.publisher))];
                const publisherIndex = publishers.indexOf(book.publisher);
                return (publisherIndex - (publishers.length - 1) / 2) * 20;
            case 'year':
                // Simply use the year as the x-coordinate
                return book.publicationYear/10;
            case 'random':
            default:
                return Math.random() * 100 - 50;
        }
    }

    updateBookPositions(xAxisType, animate = true) {
        this.updateBookAxisLabels(xAxisType);
        
        this.books.forEach((book, index) => {
            const mesh = this.bookMeshes[index];
            const targetX = this.getBookXPosition(book, xAxisType);
            
            if (animate) {
                new TWEEN.Tween(mesh.position)
                    .to({ x: targetX }, 1000)
                    .easing(TWEEN.Easing.Quadratic.InOut)
                    .start();
            } else {
                mesh.position.x = targetX;
            }
        });
    }

    createBookMeshes() {
        // Clear existing meshes
        this.bookMeshes.forEach(mesh => this.bookGroup.remove(mesh));
        this.bookMeshes = [];

        const bookGeometry = new THREE.SphereGeometry(2, 32, 32);
        
        this.books.forEach((book, index) => {
            // Random y and z positions
            const y = Math.random() * 50 - 25;  // Range: -25 to 25
            const z = Math.random() * 50 - 25;  // Range: -25 to 25

            const hue = index / this.books.length;
            const bookMaterial = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(hue, 1, 0.5)
            });

            const bookMesh = new THREE.Mesh(bookGeometry, bookMaterial);
            bookMesh.position.set(0, y, z);
            bookMesh.userData = book;
            this.bookGroup.add(bookMesh);
            this.bookMeshes.push(bookMesh);
        });

        this.updateBookPositions('random', false);
    }

    setupBookEventListeners() {
        // X-axis selection
        document.getElementById('xAxisSelect').addEventListener('change', (event) => {
            this.updateBookPositions(event.target.value, true);
        });

        // View toggle
        const toggleButton = document.getElementById('toggleView');
        toggleButton.addEventListener('click', () => this.toggleBookView());

        // Mouse interaction
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        const bookInfoDiv = document.getElementById('bookInfo');

        // Set initial content
        bookInfoDiv.textContent = '';  // This will trigger the empty state styling

        window.addEventListener('mousemove', (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

            raycaster.setFromCamera(mouse, main.camera);
            const intersects = raycaster.intersectObjects(this.bookMeshes);

            if (intersects.length > 0) {
                const book = intersects[0].object.userData;
                const position = intersects[0].object.position;
                bookInfoDiv.innerHTML = `
                    <strong>${book.title}</strong><br>
                    Author: ${book.author}<br>
                    Year: ${book.publicationYear}<br>
                    Genre: ${book.genre}<br>
                    Publisher: ${book.publisher}<br>
                    ISBN: ${book.isbn}<br>
                    Position: x: ${position.x.toFixed(2)}, y: ${position.y.toFixed(2)}, z: ${position.z.toFixed(2)}
                `;
            } else {
                bookInfoDiv.textContent = '';  // This will trigger the empty state styling
            }
        });
    }

    toggleBookView() {
        this.isBook2DView = !this.isBook2DView;
        const toggleButton = document.getElementById('toggleView');
        
        if (this.isBook2DView) {
            // Switch to 2D view (top-down)
            new TWEEN.Tween(main.camera.position)
                .to({ x: 0, y: 150, z: 0 }, 1000)
                .easing(TWEEN.Easing.Cubic.InOut)
                .start();

            new TWEEN.Tween(main.camera.rotation)
                .to({ x: -Math.PI / 2, y: 0, z: 0 }, 1000)
                .easing(TWEEN.Easing.Cubic.InOut)
                .start();

            // Disable rotation controls
            main.controls.enableRotate = false;
            main.controls.enableZoom = true;
            main.controls.enablePan = true;
            
            toggleButton.textContent = 'Switch to 3D View';
            toggleButton.style.background = '#2196F3';
        } else {
            // Switch back to 3D view
            new TWEEN.Tween(main.camera.position)
                .to({ x: 100, y: 100, z: 100 }, 1000)
                .easing(TWEEN.Easing.Cubic.InOut)
                .start();

            new TWEEN.Tween(main.camera.rotation)
                .to({ x: 0, y: 0, z: 0 }, 1000)
                .easing(TWEEN.Easing.Cubic.InOut)
                .start();

            // Re-enable all controls
            main.controls.enableRotate = true;
            main.controls.enableZoom = true;
            main.controls.enablePan = true;
            
            toggleButton.textContent = 'Switch to 2D View';
            toggleButton.style.background = '#4CAF50';
        }

        // Update controls target
        main.controls.target.set(0, 0, 0);
    }
} 