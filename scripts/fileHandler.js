class FileHandler {
    constructor(modelsVisualization) {
        this.modelsVisualization = modelsVisualization;
        this.setupFileInput();
    }

    setupFileInput() {
        const fileInput = document.getElementById('modelDatabaseInput');
        const loadButton = document.getElementById('loadModels');

        loadButton.addEventListener('click', () => {
            fileInput.click();
        });

        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                if (file.type === "application/json" || file.name.endsWith('.json')) {
                    this.loadModelDatabase(file);
                } else {
                    alert('Please select a JSON file.');
                    fileInput.value = '';
                }
            }
        });
    }

    loadModelDatabase(file) {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const models = JSON.parse(event.target.result);
                if (Array.isArray(models)) {
                    this.modelsVisualization.visualizeModels(models);
                } else {
                    throw new Error('Invalid JSON format. Expected an array of models.');
                }
            } catch (error) {
                console.error('Error parsing JSON file:', error);
                alert('Error: Invalid JSON file format. Please make sure your file contains an array of models.');
            }
        };

        reader.onerror = (error) => {
            console.error('Error reading file:', error);
            alert('Error reading file. Please try again.');
        };

        reader.readAsText(file);
    }
} 