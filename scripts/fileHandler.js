class FileHandler {
    constructor(visualization) {
        this.visualization = visualization;
        this.setupFileUpload();
    }

    loadBooks(file) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result);
                if (data && data.books && Array.isArray(data.books)) {
                    this.visualization.books = data.books;
                    this.visualization.createBookMeshes();
                } else {
                    throw new Error('Invalid JSON format. Expected { books: [...] }');
                }
            } catch (error) {
                console.error('Error parsing JSON file:', error);
                alert('Error: Invalid JSON file format. Please make sure your file contains a "books" array.');
            }
        };

        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            alert('Error reading file. Please try again.');
        };

        reader.readAsText(file);
    }

    setupFileUpload() {
        const fileInput = document.getElementById('fileInput');
        const loadButton = document.getElementById('loadBooks');
        const fileNameSpan = document.getElementById('fileName');

        loadButton.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                if (file.type === "application/json" || file.name.endsWith('.json')) {
                    fileNameSpan.textContent = file.name;
                    this.loadBooks(file);
                } else {
                    alert('Please select a JSON file.');
                    fileInput.value = '';
                    fileNameSpan.textContent = '';
                }
            }
        });
    }
} 