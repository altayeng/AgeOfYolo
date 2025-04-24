// Game constants
const TILE_WIDTH = 64;  // Width of isometric tile
const TILE_HEIGHT = 32; // Height of isometric tile
const MAP_SIZE = 50;    // Size of the game map (50x50)
const VISIBLE_TILES = 15; // Number of tiles visible in viewport

// Age progression
const AGES = [
    { name: "Dark Age", buildingReq: 0 },
    { name: "Feudal Age", buildingReq: 3 },
    { name: "Castle Age", buildingReq: 6 },
    { name: "Imperial Age", buildingReq: 10 }
];

// Game state
const gameState = {
    map: [],
    camera: { x: 0, y: 0 },
    resources: {
        wood: 0,
        stone: 0,
        food: 0
    },
    buildings: [],
    buildingAnimations: [], // İnşa animasyonları için dizi
    selectedTile: null,
    player: {
        x: Math.floor(MAP_SIZE / 2),
        y: Math.floor(MAP_SIZE / 2)
    },
    population: {
        current: 0,
        max: 10
    },
    currentAge: 0,
    gameYear: 0,
    lastTick: 0
};

// DOM Elements
const gameCanvas = document.getElementById('game-canvas');
const gameCtx = gameCanvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap');
const minimapCtx = minimapCanvas.getContext('2d');

// Tile types
const TILE_TYPES = {
    GRASS: 0,
    DESERT: 1
};

// Building types
const BUILDING_TYPES = {
    HOUSE: { name: 'Ev', woodCost: 10, stoneCost: 5, foodCost: 0, color: '#795548', population: 5, maxHealth: 100, buildTime: 5 },
    BARRACKS: { name: 'Kışla', woodCost: 20, stoneCost: 10, foodCost: 10, color: '#5D4037', population: 0, maxHealth: 150, buildTime: 8 },
    MILL: { name: 'Değirmen', woodCost: 15, stoneCost: 0, foodCost: 5, color: '#8D6E63', population: 0, maxHealth: 80, buildTime: 6 },
    TOWER: { name: 'Kule', woodCost: 10, stoneCost: 15, foodCost: 0, color: '#616161', population: 0, maxHealth: 200, buildTime: 7 }
};

// Resource nodes
const RESOURCE_NODES = {
    TREE: { type: 'wood', yield: 5 },
    STONE: { type: 'stone', yield: 3 },
    BERRY: { type: 'food', yield: 2 }
};

// Images (would be loaded from actual assets in a full game)
const tileImages = {
    [TILE_TYPES.GRASS]: { color: '#4CAF50' },  // Green for grass
    [TILE_TYPES.DESERT]: { color: '#F9A825' }   // Yellow for desert
};

// SimplexNoise implementation (minimal version for terrain generation)
class SimplexNoise {
    constructor() {
        this.grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
                      [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
                      [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
        this.p = [];
        for (let i = 0; i < 256; i++) {
            this.p[i] = Math.floor(Math.random() * 256);
        }
        
        // To remove the need for index wrapping, double the permutation table length
        this.perm = new Array(512);
        this.gradP = new Array(512);
        
        // Populate perm and gradP arrays
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.gradP[i] = this.grad3[this.perm[i] % 12];
        }
    }
    
    noise2D(x, y) {
        // Find unit grid cell containing point
        let X = Math.floor(x) & 255;
        let Y = Math.floor(y) & 255;
        
        // Get relative xy coordinates of point within that cell
        x = x - Math.floor(x);
        y = y - Math.floor(y);
        
        // Compute fade curves for x and y
        const u = this.fade(x);
        const v = this.fade(y);
        
        // Hash coordinates of the 4 square corners
        const n00 = this.dot(this.gradP[(X + this.perm[Y]) & 511], x, y);
        const n01 = this.dot(this.gradP[(X + this.perm[Y + 1]) & 511], x, y - 1);
        const n10 = this.dot(this.gradP[(X + 1 + this.perm[Y]) & 511], x - 1, y);
        const n11 = this.dot(this.gradP[(X + 1 + this.perm[Y + 1]) & 511], x - 1, y - 1);
        
        // Interpolate the results along y and then along x
        return this.lerp(
            this.lerp(n00, n10, u),
            this.lerp(n01, n11, u),
            v
        );
    }
    
    // Helper functions
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    lerp(a, b, t) {
        return (1 - t) * a + t * b;
    }
    
    dot(g, x, y) {
        return g[0] * x + g[1] * y;
    }
}

// Initialize the game
function initGame() {
    console.log("Initializing game...");
    
    // Set canvas dimensions
    resizeCanvases();
    
    // Generate random map
    generateMap();
    
    // Start with some initial resources
    gameState.resources.wood = 50;
    gameState.resources.stone = 30;
    gameState.resources.food = 40;
    
    // Center camera on player
    centerCameraOnPlayer();
    
    // Create joystick indicator
    createJoystickIndicator();
    
    // Add event listeners
    setupEventListeners();
    
    // Initialize game time
    gameState.lastTick = Date.now();
    
    // Show welcome message
    setTimeout(() => {
        showMessage('Welcome to Age of Empires! Click to select tiles and build structures.');
    }, 500);
    
    console.log("Game initialized with player at:", gameState.player.x, gameState.player.y);
    console.log("Camera position:", gameState.camera.x, gameState.camera.y);
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Create joystick indicator element
function createJoystickIndicator() {
    // Önceden varsa siliyoruz, tekrar oluşturmamak için
    const existingIndicator = document.getElementById('joystick-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }
    
    const joystickIndicator = document.createElement('div');
    joystickIndicator.id = 'joystick-indicator';
    joystickIndicator.className = 'joystick-indicator';
    document.getElementById('game-container').appendChild(joystickIndicator);
}

// Toggle joystick indicator visibility
function toggleJoystickIndicator(active) {
    const indicator = document.getElementById('joystick-indicator');
    if (!indicator) return;
    
    if (active) {
        indicator.classList.add('active');
    } else {
        indicator.classList.remove('active');
    }
}

// Set canvas dimensions for desktop and mobile views
function resizeCanvases() {
    console.log("Resizing canvases...");
    
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const gameContainer = document.getElementById('game-container');
    const containerRect = gameContainer.getBoundingClientRect();
    
    let gameWidth, gameHeight;
    
    // Different sizing for desktop vs mobile
    if (containerWidth >= 768) {
        // Desktop view
        const containerActualWidth = containerRect.width;
        const containerActualHeight = containerRect.height;
        
        // Calculate game dimensions while maintaining aspect ratio
        if (containerActualWidth / containerActualHeight > 16/9) {
            // Container is wider than 16:9
            gameHeight = containerActualHeight - 150;
            gameWidth = gameHeight * (16/9);
        } else {
            // Container is taller than 16:9
            gameWidth = containerActualWidth;
            gameHeight = gameWidth * (9/16);
        }
    } else {
        // Mobile view
        if (containerWidth / containerHeight > 9/16) {
            // Screen is wider than 9:16
            gameHeight = containerHeight - 160;
            gameWidth = gameHeight * (9/16);
        } else {
            // Screen is narrower than 9:16
            gameWidth = containerWidth;
            gameHeight = gameWidth * (16/9);
        }
    }
    
    // Set canvas dimensions
    gameCanvas.width = gameWidth;
    gameCanvas.height = gameHeight;
    gameCanvas.style.marginLeft = ((containerRect.width - gameWidth) / 2) + 'px';
    
    // Set minimap dimensions based on screen size
    if (containerWidth >= 768) {
        minimapCanvas.width = 200;
        minimapCanvas.height = 180;
    } else {
        minimapCanvas.width = containerWidth >= 480 ? 120 : 100;
        minimapCanvas.height = containerWidth >= 480 ? 120 : 100;
    }
    
    // Update button text for mobile
    updateButtonTexts(containerWidth);
    
    console.log("Canvas resized to:", gameWidth, "x", gameHeight);
}

// Update button text based on screen size
function updateButtonTexts(screenWidth) {
    const buttons = document.querySelectorAll('button[data-mobile-text]');
    
    if (screenWidth <= 480) {
        // Use mobile text for small screens
        buttons.forEach(button => {
            // Store original text if not already stored
            if (!button.dataset.originalText) {
                button.dataset.originalText = button.textContent;
            }
            button.textContent = button.dataset.mobileText;
        });
    } else {
        // Restore original text for larger screens
        buttons.forEach(button => {
            if (button.dataset.originalText) {
                button.textContent = button.dataset.originalText;
            }
        });
    }
}

// Generate random terrain map
function generateMap() {
    gameState.map = [];
    
    // Use simplex noise for more natural looking terrain
    const simplex = new SimplexNoise();
    
    for (let y = 0; y < MAP_SIZE; y++) {
        const row = [];
        for (let x = 0; x < MAP_SIZE; x++) {
            // Generate terrain based on noise value
            const noiseValue = (simplex.noise2D(x * 0.05, y * 0.05) + 1) / 2;
            const terrainType = noiseValue < 0.65 ? TILE_TYPES.GRASS : TILE_TYPES.DESERT;
            
            // Add random resource nodes
            let resourceNode = null;
            if (Math.random() < 0.15) { // Increased chance for resources
                // Don't add resources too close to player spawn
                const distToCenter = Math.sqrt(
                    Math.pow(x - Math.floor(MAP_SIZE / 2), 2) + 
                    Math.pow(y - Math.floor(MAP_SIZE / 2), 2)
                );
                
                if (distToCenter > 5) { // Keep area around player spawn clear
                    const resourceRoll = Math.random();
                    if (resourceRoll < 0.5) {
                        resourceNode = 'TREE';
                    } else if (resourceRoll < 0.8) {
                        resourceNode = 'STONE';
                    } else {
                        resourceNode = 'BERRY';
                    }
                }
            }
            
            row.push({
                type: terrainType,
                resource: resourceNode,
                building: null
            });
        }
        gameState.map.push(row);
    }
}

// Center camera on player position
function centerCameraOnPlayer() {
    // Calculate target camera position to center the player
    const targetX = gameState.player.x - Math.floor(VISIBLE_TILES / 2);
    const targetY = gameState.player.y - Math.floor(VISIBLE_TILES / 2);
    
    // Ensure camera doesn't go out of bounds
    gameState.camera.x = Math.max(0, Math.min(targetX, MAP_SIZE - VISIBLE_TILES));
    gameState.camera.y = Math.max(0, Math.min(targetY, MAP_SIZE - VISIBLE_TILES));
    
    console.log("Camera centered at:", gameState.camera.x, gameState.camera.y);
}

// Ensure camera stays within map bounds
function clampCamera() {
    gameState.camera.x = Math.max(0, Math.min(gameState.camera.x, MAP_SIZE - VISIBLE_TILES));
    gameState.camera.y = Math.max(0, Math.min(gameState.camera.y, MAP_SIZE - VISIBLE_TILES));
}

// Convert isometric coordinates to screen coordinates
function isoToScreen(x, y) {
    const screenX = (x - y) * (TILE_WIDTH / 2);
    const screenY = (x + y) * (TILE_HEIGHT / 2);
    return { x: screenX, y: screenY };
}

// Convert screen coordinates to isometric tile coordinates
function screenToIso(screenX, screenY) {
    // Calculate center offset used in drawing
    const centerX = gameCanvas.width / 2;
    const centerY = gameCanvas.height / 3;
    
    // Adjust screen coordinates relative to center offset
    screenX = screenX - centerX;
    screenY = screenY - centerY;
    
    // Improved isometric conversion with better accuracy
    const tileX = Math.floor((screenY / TILE_HEIGHT + screenX / TILE_WIDTH)) + gameState.camera.x;
    const tileY = Math.floor((screenY / TILE_HEIGHT - screenX / TILE_WIDTH)) + gameState.camera.y;
    
    // Ensure coordinates are within map bounds
    const boundedX = Math.max(0, Math.min(tileX, MAP_SIZE - 1));
    const boundedY = Math.max(0, Math.min(tileY, MAP_SIZE - 1));
    
    return { x: boundedX, y: boundedY };
}

// Draw the isometric map
function drawMap() {
    // Clear canvas
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Calculate center offset for drawing
    const centerX = gameCanvas.width / 2;
    const centerY = gameCanvas.height / 3; // Lower the center point to show more of the map
    
    // Determine visible range based on camera position
    const startX = Math.max(0, gameState.camera.x - 2);
    const startY = Math.max(0, gameState.camera.y - 2);
    const endX = Math.min(MAP_SIZE, startX + VISIBLE_TILES + 4); // +4 for partially visible tiles
    const endY = Math.min(MAP_SIZE, startY + VISIBLE_TILES + 4);
    
    // Sort all visible objects for proper depth rendering
    const renderObjects = [];
    
    // First collect all objects to render
    for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
            // Get tile information
            const tile = gameState.map[y][x];
            
            // Calculate screen position
            const isoPos = isoToScreen(x - gameState.camera.x, y - gameState.camera.y);
            const screenX = centerX + isoPos.x;
            const screenY = centerY + isoPos.y;
            
            // Add tile to render list
            renderObjects.push({
                type: 'tile',
                x: screenX,
                y: screenY,
                z: x + y, // For depth sorting
                tileX: x,
                tileY: y,
                tileType: tile.type,
                resource: tile.resource,
                building: tile.building,
                isSelected: gameState.selectedTile && gameState.selectedTile.x === x && gameState.selectedTile.y === y,
                isPlayer: gameState.player.x === x && gameState.player.y === y
            });
        }
    }
    
    // Sort by z-index (depth)
    renderObjects.sort((a, b) => a.z - b.z);
    
    // Then render everything in correct order
    for (const obj of renderObjects) {
        // Draw the base tile
        drawIsometricTile(obj.x, obj.y, obj.tileType);
        
        // Draw resource if present
        if (obj.resource) {
            drawResource(obj.x, obj.y, obj.resource);
        }
        
        // Draw building if present
        if (obj.building) {
            drawBuilding(obj.x, obj.y, obj.building);
        }
        
        // Highlight selected tile
        if (obj.isSelected) {
            drawTileHighlight(obj.x, obj.y);
        }
        
        // Draw player if on this tile
        if (obj.isPlayer) {
            drawPlayer(obj.x, obj.y);
        }
    }
}

// Draw an isometric tile
function drawIsometricTile(x, y, tileType) {
    const tileColor = tileImages[tileType].color;
    
    // Draw isometric diamond shape
    gameCtx.beginPath();
    gameCtx.moveTo(x, y - TILE_HEIGHT / 2);  // Top point
    gameCtx.lineTo(x + TILE_WIDTH / 2, y);   // Right point
    gameCtx.lineTo(x, y + TILE_HEIGHT / 2);  // Bottom point
    gameCtx.lineTo(x - TILE_WIDTH / 2, y);   // Left point
    gameCtx.closePath();
    
    // Create gradient for 3D effect
    const gradient = gameCtx.createLinearGradient(
        x - TILE_WIDTH / 2, 
        y - TILE_HEIGHT / 2,
        x + TILE_WIDTH / 2,
        y + TILE_HEIGHT / 2
    );
    
    // Set gradient colors based on tile type
    if (tileType === TILE_TYPES.GRASS) {
        gradient.addColorStop(0, '#5cb85c');
        gradient.addColorStop(0.5, '#4cae4c');
        gradient.addColorStop(1, '#3d8b3d');
    } else {
        gradient.addColorStop(0, '#f0ad4e');
        gradient.addColorStop(0.5, '#eea236');
        gradient.addColorStop(1, '#ec971f');
    }
    
    // Fill with gradient
    gameCtx.fillStyle = gradient;
    gameCtx.fill();
    
    // Draw outline
    gameCtx.strokeStyle = '#333';
    gameCtx.lineWidth = 0.5;
    gameCtx.stroke();
}

// Draw a resource node
function drawResource(x, y, resourceType) {
    switch (resourceType) {
        case 'TREE':
            // Draw tree trunk
            gameCtx.fillStyle = '#795548';
            gameCtx.fillRect(x - 3, y, 6, 10);
            
            // Draw tree foliage (more detailed)
            gameCtx.fillStyle = '#2E7D32';
            gameCtx.beginPath();
            gameCtx.moveTo(x, y - 25);
            gameCtx.lineTo(x + 12, y - 10);
            gameCtx.lineTo(x + 5, y - 10);
            gameCtx.lineTo(x + 15, y + 2);
            gameCtx.lineTo(x - 15, y + 2);
            gameCtx.lineTo(x - 5, y - 10);
            gameCtx.lineTo(x - 12, y - 10);
            gameCtx.closePath();
            gameCtx.fill();
            break;
            
        case 'STONE':
            // Draw stone formation (more detailed)
            gameCtx.fillStyle = '#9E9E9E';
            gameCtx.beginPath();
            gameCtx.moveTo(x - 10, y + 5);
            gameCtx.lineTo(x - 5, y - 5);
            gameCtx.lineTo(x + 8, y - 2);
            gameCtx.lineTo(x + 10, y + 4);
            gameCtx.closePath();
            gameCtx.fill();
            
            // Add highlights
            gameCtx.fillStyle = '#BDBDBD';
            gameCtx.beginPath();
            gameCtx.ellipse(x + 3, y - 1, 4, 2, 0, 0, Math.PI * 2);
            gameCtx.fill();
            break;
            
        case 'BERRY':
            // Draw berry bush (more detailed)
            // Draw leaves
            gameCtx.fillStyle = '#388E3C';
            gameCtx.beginPath();
            gameCtx.ellipse(x, y, 10, 6, 0, 0, Math.PI * 2);
            gameCtx.fill();
            
            // Draw berries
            gameCtx.fillStyle = '#E91E63';
            gameCtx.beginPath();
            gameCtx.arc(x - 3, y - 2, 3, 0, Math.PI * 2);
            gameCtx.fill();
            gameCtx.beginPath();
            gameCtx.arc(x + 4, y - 1, 3, 0, Math.PI * 2);
            gameCtx.fill();
            gameCtx.beginPath();
            gameCtx.arc(x + 1, y + 3, 3, 0, Math.PI * 2);
            gameCtx.fill();
            break;
    }
}

// Draw a building
function drawBuilding(x, y, buildingType) {
    const building = BUILDING_TYPES[buildingType];
    const baseColor = building?.color || '#795548';
    
    // Different shapes for different buildings
    switch(buildingType) {
        case 'BARRACKS':
            // Draw barracks base
            gameCtx.fillStyle = '#5D4037';
            gameCtx.fillRect(x - 24, y - 20, 48, 30);
            
            // Draw barracks roof
            gameCtx.fillStyle = '#BF360C';
            gameCtx.beginPath();
            gameCtx.moveTo(x - 28, y - 20);
            gameCtx.lineTo(x, y - 40);
            gameCtx.lineTo(x + 28, y - 20);
            gameCtx.closePath();
            gameCtx.fill();
            
            // Draw door
            gameCtx.fillStyle = '#3E2723';
            gameCtx.fillRect(x - 5, y, 10, 10);
            
            // Draw windows
            gameCtx.fillStyle = '#FFF9C4';
            gameCtx.fillRect(x - 15, y - 15, 6, 6);
            gameCtx.fillRect(x + 10, y - 15, 6, 6);
            
            // Add flag
            gameCtx.fillStyle = '#B71C1C';
            gameCtx.fillRect(x + 20, y - 40, 10, 6);
            break;
            
        case 'MILL':
            // Draw mill base
            gameCtx.fillStyle = '#8D6E63';
            gameCtx.fillRect(x - 18, y - 15, 36, 25);
            
            // Draw roof
            gameCtx.fillStyle = '#FFA000';
            gameCtx.beginPath();
            gameCtx.moveTo(x - 22, y - 15);
            gameCtx.lineTo(x, y - 35);
            gameCtx.lineTo(x + 22, y - 15);
            gameCtx.closePath();
            gameCtx.fill();
            
            // Draw windmill
            gameCtx.strokeStyle = '#3E2723';
            gameCtx.lineWidth = 2;
            gameCtx.beginPath();
            
            // Draw central axis
            gameCtx.moveTo(x, y - 50);
            gameCtx.lineTo(x, y - 35);
            
            // Draw blades
            gameCtx.moveTo(x, y - 45);
            gameCtx.lineTo(x + 15, y - 55);
            gameCtx.moveTo(x, y - 45);
            gameCtx.lineTo(x - 15, y - 55);
            gameCtx.moveTo(x, y - 45);
            gameCtx.lineTo(x + 15, y - 35);
            gameCtx.moveTo(x, y - 45);
            gameCtx.lineTo(x - 15, y - 35);
            
            gameCtx.stroke();
            break;
            
        case 'TOWER':
            // Draw tower base
            gameCtx.fillStyle = '#616161';
            gameCtx.fillRect(x - 15, y - 10, 30, 20);
            
            // Draw tower middle
            gameCtx.fillStyle = '#757575';
            gameCtx.fillRect(x - 12, y - 30, 24, 20);
            
            // Draw tower top
            gameCtx.fillStyle = '#9E9E9E';
            gameCtx.beginPath();
            gameCtx.moveTo(x - 15, y - 30);
            gameCtx.lineTo(x, y - 50);
            gameCtx.lineTo(x + 15, y - 30);
            gameCtx.closePath();
            gameCtx.fill();
            
            // Draw windows
            gameCtx.fillStyle = '#263238';
            gameCtx.fillRect(x - 6, y - 25, 4, 6);
            gameCtx.fillRect(x + 2, y - 25, 4, 6);
            
            // Draw flag on top
            gameCtx.fillStyle = '#B71C1C';
            gameCtx.fillRect(x, y - 55, 10, 5);
            break;
            
        case 'HOUSE':
        default:
            // Draw house base (walls)
            gameCtx.fillStyle = '#795548';
            gameCtx.fillRect(x - 18, y - 12, 36, 22);
            
            // Draw roof
            gameCtx.fillStyle = '#D32F2F';
            gameCtx.beginPath();
            gameCtx.moveTo(x - 22, y - 12);
            gameCtx.lineTo(x, y - 25);
            gameCtx.lineTo(x + 22, y - 12);
            gameCtx.closePath();
            gameCtx.fill();
            
            // Draw door
            gameCtx.fillStyle = '#3E2723';
            gameCtx.fillRect(x - 4, y, 8, 10);
            
            // Draw windows
            gameCtx.fillStyle = '#B3E5FC';
            gameCtx.fillRect(x + 8, y - 8, 6, 6);
            gameCtx.fillRect(x - 14, y - 8, 6, 6);
            break;
    }
    
    // Draw building outline
    gameCtx.strokeStyle = '#212121';
    gameCtx.lineWidth = 1;
    
    // The outline depends on the building type
    switch(buildingType) {
        case 'BARRACKS':
            gameCtx.strokeRect(x - 24, y - 20, 48, 30);
            break;
        case 'MILL':
            gameCtx.strokeRect(x - 18, y - 15, 36, 25);
            break;
        case 'TOWER':
            gameCtx.strokeRect(x - 15, y - 10, 30, 20);
            gameCtx.strokeRect(x - 12, y - 30, 24, 20);
            break;
        case 'HOUSE':
        default:
            gameCtx.strokeRect(x - 18, y - 12, 36, 22);
            break;
    }
}

// Draw player character
function drawPlayer(x, y) {
    // Draw player shadow
    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    gameCtx.beginPath();
    gameCtx.ellipse(x, y + 8, 10, 5, 0, 0, Math.PI * 2);
    gameCtx.fill();
    
    // Draw player body
    gameCtx.fillStyle = '#2962FF';
    gameCtx.beginPath();
    gameCtx.arc(x, y - 5, 8, 0, Math.PI * 2);
    gameCtx.fill();
    
    // Draw player head
    gameCtx.fillStyle = '#FFA726';
    gameCtx.beginPath();
    gameCtx.arc(x, y - 12, 5, 0, Math.PI * 2);
    gameCtx.fill();
    
    // Draw outline
    gameCtx.strokeStyle = '#0D47A1';
    gameCtx.lineWidth = 1;
    gameCtx.beginPath();
    gameCtx.arc(x, y - 5, 8, 0, Math.PI * 2);
    gameCtx.stroke();
    gameCtx.beginPath();
    gameCtx.arc(x, y - 12, 5, 0, Math.PI * 2);
    gameCtx.stroke();
}

// Draw highlight around selected tile
function drawTileHighlight(x, y) {
    gameCtx.strokeStyle = '#FFEB3B'; // Yellow highlight
    gameCtx.lineWidth = 3;
    
    // Draw outer glow
    gameCtx.shadowColor = '#FFEB3B';
    gameCtx.shadowBlur = 10;
    
    gameCtx.beginPath();
    gameCtx.moveTo(x, y - TILE_HEIGHT / 2 - 2);  // Top point
    gameCtx.lineTo(x + TILE_WIDTH / 2 + 2, y);   // Right point
    gameCtx.lineTo(x, y + TILE_HEIGHT / 2 + 2);  // Bottom point
    gameCtx.lineTo(x - TILE_WIDTH / 2 - 2, y);   // Left point
    gameCtx.closePath();
    gameCtx.stroke();
    
    // Reset shadow
    gameCtx.shadowBlur = 0;
    
    // Draw inner highlight
    gameCtx.strokeStyle = '#FFF';
    gameCtx.lineWidth = 1;
    
    gameCtx.beginPath();
    gameCtx.moveTo(x, y - TILE_HEIGHT / 2);  // Top point
    gameCtx.lineTo(x + TILE_WIDTH / 2, y);   // Right point
    gameCtx.lineTo(x, y + TILE_HEIGHT / 2);  // Bottom point
    gameCtx.lineTo(x - TILE_WIDTH / 2, y);   // Left point
    gameCtx.closePath();
    gameCtx.stroke();
}

// Draw minimap
function drawMinimap() {
    // Clear minimap
    minimapCtx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    
    // Calculate tile size on minimap
    const tileSize = minimapCanvas.width / MAP_SIZE;
    
    // Draw each tile on minimap
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = gameState.map[y][x];
            
            // Set color based on tile type
            if (tile.type === TILE_TYPES.GRASS) {
                minimapCtx.fillStyle = '#4cae4c';
            } else {
                minimapCtx.fillStyle = '#eea236';
            }
            
            // Draw tile on minimap
            minimapCtx.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            
            // Draw resources with small dots
            if (tile.resource) {
                if (tile.resource === 'TREE') {
                    minimapCtx.fillStyle = '#2E7D32';
                } else if (tile.resource === 'STONE') {
                    minimapCtx.fillStyle = '#757575';
                } else {
                    minimapCtx.fillStyle = '#E91E63';
                }
                minimapCtx.fillRect(x * tileSize + tileSize/4, y * tileSize + tileSize/4, tileSize/2, tileSize/2);
            }
            
            // Draw buildings with small squares
            if (tile.building) {
                minimapCtx.fillStyle = BUILDING_TYPES[tile.building].color;
                minimapCtx.fillRect(x * tileSize + tileSize/4, y * tileSize + tileSize/4, tileSize/2, tileSize/2);
            }
        }
    }
    
    // Draw camera viewport rectangle
    minimapCtx.strokeStyle = '#FFFFFF';
    minimapCtx.lineWidth = 2;
    minimapCtx.strokeRect(
        gameState.camera.x * tileSize,
        gameState.camera.y * tileSize,
        VISIBLE_TILES * tileSize,
        VISIBLE_TILES * tileSize
    );
    
    // Draw player position (with larger, more visible circle)
    minimapCtx.fillStyle = '#FF0000'; // Bright red for better visibility
    minimapCtx.beginPath();
    minimapCtx.arc(
        gameState.player.x * tileSize + tileSize/2,
        gameState.player.y * tileSize + tileSize/2,
        tileSize * 1.5, 0, Math.PI * 2
    );
    minimapCtx.fill();
    
    // Add stroke for better visibility
    minimapCtx.strokeStyle = '#FFFFFF';
    minimapCtx.lineWidth = 1;
    minimapCtx.stroke();
}

// Update UI elements
function updateUI() {
    // Update resource counts
    document.getElementById('wood-count').textContent = Math.floor(gameState.resources.wood);
    document.getElementById('stone-count').textContent = Math.floor(gameState.resources.stone);
    document.getElementById('food-count').textContent = Math.floor(gameState.resources.food);
    document.getElementById('population-count').textContent = `${gameState.population.current}/${gameState.population.max}`;
    
    // Update age display
    document.getElementById('current-age').textContent = AGES[gameState.currentAge].name;
    
    // Set building costs as tooltips
    document.getElementById('build-house').setAttribute('data-cost', 
        `Wood: ${BUILDING_TYPES.HOUSE.woodCost} Stone: ${BUILDING_TYPES.HOUSE.stoneCost}`);
    document.getElementById('build-barracks').setAttribute('data-cost', 
        `Wood: ${BUILDING_TYPES.BARRACKS.woodCost} Stone: ${BUILDING_TYPES.BARRACKS.stoneCost} Food: ${BUILDING_TYPES.BARRACKS.foodCost}`);
    document.getElementById('build-mill').setAttribute('data-cost', 
        `Wood: ${BUILDING_TYPES.MILL.woodCost} Food: ${BUILDING_TYPES.MILL.foodCost}`);
    document.getElementById('build-tower').setAttribute('data-cost', 
        `Wood: ${BUILDING_TYPES.TOWER.woodCost} Stone: ${BUILDING_TYPES.TOWER.stoneCost}`);
    
    // Update advance age button tooltip
    const nextAgeIdx = gameState.currentAge + 1;
    if (nextAgeIdx < AGES.length) {
        const buildingsNeeded = AGES[nextAgeIdx].buildingReq - gameState.buildings.length;
        document.getElementById('advance-age').setAttribute('data-cost', 
            `Need ${Math.max(0, buildingsNeeded)} more buildings`);
    } else {
        document.getElementById('advance-age').setAttribute('data-cost', `Max age reached`);
    }
}

// Add debugging function to visualize click positions
function addDebugClick(x, y, isoX, isoY) {
    const debugEl = document.createElement('div');
    debugEl.className = 'debug-click';
    debugEl.style.left = x + 'px';
    debugEl.style.top = y + 'px';
    debugEl.setAttribute('data-iso', `${isoX},${isoY}`);
    document.getElementById('game-container').appendChild(debugEl);
    
    setTimeout(() => {
        debugEl.remove();
    }, 3000);
}

// Handle mouse click on game canvas
function handleCanvasClick(event) {
    event.preventDefault();
    const rect = gameCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    const clickedTile = screenToIso(mouseX, mouseY);
    
    // Add visual debug marker
    addDebugClick(mouseX, mouseY, clickedTile.x, clickedTile.y);
    
    // Process the click
    handleCanvasTouch(mouseX, mouseY);
}

// Handle minimap click - improved to accurately position the camera
function handleMinimapClick(event) {
    const rect = minimapCanvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    
    // Calculate tile size on minimap
    const tileSize = minimapCanvas.width / MAP_SIZE;
    
    // Convert click to map coordinates
    const mapX = Math.floor(mouseX / tileSize);
    const mapY = Math.floor(mouseY / tileSize);
    
    // Center camera on clicked position
    gameState.camera.x = Math.max(0, Math.min(mapX - Math.floor(VISIBLE_TILES / 2), MAP_SIZE - VISIBLE_TILES));
    gameState.camera.y = Math.max(0, Math.min(mapY - Math.floor(VISIBLE_TILES / 2), MAP_SIZE - VISIBLE_TILES));
    
    // If shift key is pressed, also move the player
    if (event.shiftKey && mapX >= 0 && mapX < MAP_SIZE && mapY >= 0 && mapY < MAP_SIZE) {
        gameState.player.x = mapX;
        gameState.player.y = mapY;
        gameState.selectedTile = { x: mapX, y: mapY };
        showMessage("Teleported to selected location");
    }
}

// Gather resource from a tile
function gatherResource(tile) {
    if (!tile.resource) return;
    
    const resourceInfo = RESOURCE_NODES[tile.resource];
    gameState.resources[resourceInfo.type] += resourceInfo.yield;
    
    // Remove resource from tile
    tile.resource = null;
    
    // Update UI
    updateUI();
}

// Build a structure on the selected tile
function buildStructure(buildingType) {
    if (!gameState.selectedTile) {
        showMessage('Önce inşa edilecek bir alan seçin!');
        return;
    }
    
    const tile = gameState.map[gameState.selectedTile.y][gameState.selectedTile.x];
    const building = BUILDING_TYPES[buildingType];
    
    // Seçilen alanın uygunluğunu kontrol et
    if (tile.resource || tile.building) {
        showMessage('Bu alana inşa edilemez - alan dolu!');
        return;
    }
    
    // Oyuncuya yakınlık kontrolü (3 kare mesafede)
    const dx = Math.abs(gameState.selectedTile.x - gameState.player.x);
    const dy = Math.abs(gameState.selectedTile.y - gameState.player.y);
    if (dx > 3 || dy > 3) {
        showMessage('İnşa etmek için daha yakında olmalısınız!');
        return;
    }
    
    // Kaynak yeterliliği kontrolü
    const canAfford = gameState.resources.wood >= building.woodCost && 
                     gameState.resources.stone >= building.stoneCost &&
                     gameState.resources.food >= building.foodCost;
    
    if (canAfford) {
        // İnşa animasyonu başlat
        const buildingAnimation = {
            progress: 0,
            x: gameState.selectedTile.x,
            y: gameState.selectedTile.y,
            type: buildingType
        };
        
        // Kaynakları düş
        gameState.resources.wood -= building.woodCost;
        gameState.resources.stone -= building.stoneCost;
        gameState.resources.food -= building.foodCost;
        
        // Binayı ekle
        tile.building = buildingType;
        gameState.buildings.push({
            type: buildingType,
            x: gameState.selectedTile.x,
            y: gameState.selectedTile.y,
            health: 100 // Bina sağlığı eklendi
        });
        
        // Nüfus kapasitesini güncelle
        if (building.population > 0) {
            gameState.population.max += building.population;
            showMessage(`Ev inşa edildi! Nüfus limiti ${gameState.population.max} oldu.`);
        } else {
            showMessage(`${building.name} başarıyla inşa edildi!`);
        }
        
        // Arayüzü güncelle
        updateUI();
        
        // İnşa sesini çal
        const buildSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA');
        buildSound.volume = 0.3;
        buildSound.play().catch(() => {}); // Ses hatalarını görmezden gel
    } else {
        // Eksik kaynakları hesapla ve göster
        const missingResources = [];
        if (gameState.resources.wood < building.woodCost) {
            missingResources.push(`${building.woodCost - Math.floor(gameState.resources.wood)} odun`);
        }
        if (gameState.resources.stone < building.stoneCost) {
            missingResources.push(`${building.stoneCost - Math.floor(gameState.resources.stone)} taş`);
        }
        if (gameState.resources.food < building.foodCost) {
            missingResources.push(`${building.foodCost - Math.floor(gameState.resources.food)} yemek`);
        }
        
        showMessage(`Yetersiz kaynak! Gereken: ${missingResources.join(', ')}.`);
    }
}

// Show a message to the player
function showMessage(message) {
    // Create message element if it doesn't exist
    let messageEl = document.getElementById('game-message');
    if (!messageEl) {
        messageEl = document.createElement('div');
        messageEl.id = 'game-message';
        document.getElementById('game-container').appendChild(messageEl);
    }
    
    // Set message text and show
    messageEl.textContent = message;
    messageEl.classList.add('show');
    
    // Hide message after 3 seconds
    setTimeout(() => {
        messageEl.classList.remove('show');
    }, 3000);
}

// Build a house on the selected tile
function buildHouse() {
    buildStructure('HOUSE');
}

// Build a barracks on the selected tile
function buildBarracks() {
    buildStructure('BARRACKS');
}

// Build a mill on the selected tile
function buildMill() {
    buildStructure('MILL');
}

// Build a tower on the selected tile
function buildTower() {
    buildStructure('TOWER');
}

// Advance to the next age
function advanceAge() {
    const nextAgeIdx = gameState.currentAge + 1;
    
    // Check if maximum age has been reached
    if (nextAgeIdx >= AGES.length) {
        showMessage('You have reached the maximum age!');
        return;
    }
    
    // Check if enough buildings have been built
    if (gameState.buildings.length >= AGES[nextAgeIdx].buildingReq) {
        // Age advancement costs (different for each age)
        let woodCost = 100 * nextAgeIdx;
        let foodCost = 75 * nextAgeIdx;
        let stoneCost = 50 * nextAgeIdx;
        
        // Check if player has enough resources
        if (gameState.resources.wood >= woodCost && 
            gameState.resources.food >= foodCost &&
            gameState.resources.stone >= stoneCost) {
            
            // Deduct resources
            gameState.resources.wood -= woodCost;
            gameState.resources.food -= foodCost;
            gameState.resources.stone -= stoneCost;
            
            // Advance age
            gameState.currentAge = nextAgeIdx;
            
            // Increase gathering efficiency with each age
            for (const nodeType in RESOURCE_NODES) {
                RESOURCE_NODES[nodeType].yield += 2;
            }
            
            // Show message
            showMessage(`Advanced to ${AGES[nextAgeIdx].name}!`);
            
            // Update UI
            updateUI();
            
            // Flash the screen to indicate age advancement
            const flash = document.createElement('div');
            flash.className = 'age-advancement-flash';
            document.getElementById('game-container').appendChild(flash);
            
            // Remove flash after animation
            setTimeout(() => {
                flash.remove();
            }, 1000);
        } else {
            let missingResources = [];
            if (gameState.resources.wood < woodCost) {
                missingResources.push(`${woodCost - Math.floor(gameState.resources.wood)} more wood`);
            }
            if (gameState.resources.food < foodCost) {
                missingResources.push(`${foodCost - Math.floor(gameState.resources.food)} more food`);
            }
            if (gameState.resources.stone < stoneCost) {
                missingResources.push(`${stoneCost - Math.floor(gameState.resources.stone)} more stone`);
            }
            
            showMessage(`Not enough resources to advance! Need ${missingResources.join(', ')}.`);
        }
    } else {
        const buildingsNeeded = AGES[nextAgeIdx].buildingReq - gameState.buildings.length;
        showMessage(`Need ${buildingsNeeded} more building(s) to advance to ${AGES[nextAgeIdx].name}`);
    }
}

// Handle touch events for mobile
function handleTouchStart(event) {
    event.preventDefault(); // Prevent scrolling
    
    if (event.touches.length > 0) {
        const touch = event.touches[0];
        const rect = gameCanvas.getBoundingClientRect();
        const touchX = touch.clientX - rect.left;
        const touchY = touch.clientY - rect.top;
        
        // Use the same logic as mouse clicks
        handleCanvasTouch(touchX, touchY);
    }
}

// Process touch/click on canvas - Fixed for better movement
function handleCanvasTouch(x, y) {
    try {
        // Convert screen coordinates to isometric coordinates
        const clickedTile = screenToIso(x, y);
        
        console.log("Clicked on tile: ", clickedTile);
        
        // Check if clicked coordinates are within map bounds
        if (clickedTile.x >= 0 && clickedTile.x < MAP_SIZE && 
            clickedTile.y >= 0 && clickedTile.y < MAP_SIZE) {
            
            // Set as selected tile
            gameState.selectedTile = {
                x: clickedTile.x,
                y: clickedTile.y
            };
            
            console.log("Player position: ", gameState.player.x, gameState.player.y);
            console.log("Selected tile: ", gameState.selectedTile.x, gameState.selectedTile.y);
            
            // If tile is adjacent to player, move player there
            const dx = Math.abs(gameState.selectedTile.x - gameState.player.x);
            const dy = Math.abs(gameState.selectedTile.y - gameState.player.y);
            
            console.log("Distance: dx =", dx, "dy =", dy);
            
            if (dx <= 1 && dy <= 1) { // Adjacent or diagonal
                console.log("Moving player");
                // Move player to the selected tile
                gameState.player.x = gameState.selectedTile.x;
                gameState.player.y = gameState.selectedTile.y;
                
                // Check for resources on the tile
                const tile = gameState.map[gameState.player.y][gameState.player.x];
                if (tile.resource) {
                    gatherResource(tile);
                }
                
                // Center camera on player
                centerCameraOnPlayer();
            } else {
                // For longer distances, show a message or hint about pathfinding
                const distanceMsg = `Tile too far (${dx},${dy}). You can only move to adjacent tiles.`;
                showMessage(distanceMsg);
            }
        }
    } catch (error) {
        console.error("Error in handleCanvasTouch:", error);
    }
}

// Hareketi daha anlaşılır yapmak için görsel geri bildirim
function showDirectionIndicator(dx, dy) {
    // Hareket yönünü göster
    let direction = "";
    if (dx > 0) direction = "→";
    else if (dx < 0) direction = "←";
    else if (dy > 0) direction = "↓";
    else if (dy < 0) direction = "↑";
    
    if (direction) {
        // Hareket yönünü gösteren küçük bir animasyon
        const indicator = document.createElement('div');
        indicator.className = 'direction-indicator';
        indicator.textContent = direction;
        indicator.style.left = `${gameCanvas.width / 2}px`;
        indicator.style.top = `${gameCanvas.height / 2}px`;
        document.getElementById('game-container').appendChild(indicator);
        
        // Kısa bir süre sonra göstergeyi kaldır
        setTimeout(() => {
            indicator.remove();
        }, 300);
    }
}

// Move player in the specified direction
function movePlayer(dx, dy) {
    // İzometrik harita için yön düzeltmesi
    let actualDx = dx;
    let actualDy = dy;
    
    // İzometrik haritada çapraz hareket kontrolü
    if (dx !== 0 && dy !== 0) {
        // Tek eksende hareket etmeyi zorla
        if (Math.abs(dx) > Math.abs(dy)) {
            actualDy = 0; // Yatay hareket öncelikli
        } else {
            actualDx = 0; // Dikey hareket öncelikli
        }
    }
    
    const newX = gameState.player.x + actualDx;
    const newY = gameState.player.y + actualDy;
    
    // Check if the new position is within map bounds
    if (newX >= 0 && newX < MAP_SIZE && newY >= 0 && newY < MAP_SIZE) {
        // Update player position
        gameState.player.x = newX;
        gameState.player.y = newY;
        
        // Update selected tile to match player position
        gameState.selectedTile = {
            x: newX,
            y: newY
        };
        
        // Check for resources on the tile
        const tile = gameState.map[newY][newX];
        if (tile.resource) {
            gatherResource(tile);
        }
        
        // Center camera on player if they move near the edge of the viewport
        const cameraMinX = gameState.camera.x + 2;
        const cameraMaxX = gameState.camera.x + VISIBLE_TILES - 3;
        const cameraMinY = gameState.camera.y + 2;
        const cameraMaxY = gameState.camera.y + VISIBLE_TILES - 3;
        
        if (newX < cameraMinX || newX > cameraMaxX || newY < cameraMinY || newY > cameraMaxY) {
            centerCameraOnPlayer();
        }
        
        // Hareketi göster
        showDirectionIndicator(actualDx, actualDy);
    } else {
        showMessage("Cannot move outside the map!");
    }
}

// Setup event listeners
function setupEventListeners() {
    let touchStartX = 0;
    let touchStartY = 0;
    let isTouching = false;
    let lastTouchTime = 0;
    let lastTapTime = 0;
    let moveTimeout = null;
    let lastMoveDirection = { dx: 0, dy: 0 };
    let continuousMovementActive = false;
    
    // Sürekli hareket fonksiyonu - joystick modu
    function continuousMovement() {
        if (isTouching && continuousMovementActive) {
            // Son hareketi tekrarla
            if (lastMoveDirection.dx !== 0 || lastMoveDirection.dy !== 0) {
                movePlayer(lastMoveDirection.dx, lastMoveDirection.dy);
            }
            
            // Döngüyü devam ettir
            moveTimeout = setTimeout(continuousMovement, 200);
        }
    }
    
    gameCanvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        isTouching = true;
        lastTouchTime = Date.now();
        
        // Çift dokunma kontrolü
        const currentTime = Date.now();
        if (currentTime - lastTapTime < 300) {
            // Çift dokunma algılandı - tile seçimi için handleCanvasClick'i çağır
            handleCanvasClick({
                clientX: touch.clientX,
                clientY: touch.clientY,
                preventDefault: () => {}
            });
        }
        lastTapTime = currentTime;
        
        // Hareket süregeliyor ise iptal et
        if (moveTimeout) {
            clearTimeout(moveTimeout);
            moveTimeout = null;
        }
        
        // Sürekli hareket özelliğini durdur
        continuousMovementActive = false;
        toggleJoystickIndicator(false);
    });
    
    gameCanvas.addEventListener('touchmove', (e) => {
        if (!isTouching) return;
        e.preventDefault();
        
        const currentTime = Date.now();
        // Hareket hızını sınırla - en az 200ms bekle (daha yavaş hareket için)
        if (currentTime - lastTouchTime < 200) {
            return;
        }
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX;
        const deltaY = touch.clientY - touchStartY;
        
        // Hareket yönünü ve mesafesini hesapla
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Minimum hareket mesafesini artır
        if (distance > 40) { // Daha yüksek başlangıç eşiği
            let moveX = 0;
            let moveY = 0;
            
            // Hareketi ölçekle - daha belirgin hareket gerekli
            if (Math.abs(deltaX) > 25) {
                moveX = deltaX > 0 ? 1 : -1;
            }
            
            if (Math.abs(deltaY) > 25) {
                moveY = deltaY > 0 ? 1 : -1;
            }
            
            // Çapraz hareket kontrolü - tek yönde hareket tercih et
            if (moveX !== 0 && moveY !== 0) {
                if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
                    moveY = 0; // Yatay hareket çok daha baskın
                } else if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
                    moveX = 0; // Dikey hareket çok daha baskın
                } else {
                    // Eğer yönler benzer kuvvette ise son kullanılan yönün tersine hareketi engelle
                    // Bu savrulma hissini azaltır
                    if (lastMoveDirection.dx !== 0 && Math.sign(moveX) !== Math.sign(lastMoveDirection.dx)) {
                        moveX = 0;
                    }
                    if (lastMoveDirection.dy !== 0 && Math.sign(moveY) !== Math.sign(lastMoveDirection.dy)) {
                        moveY = 0;
                    }
                }
            }
            
            // Sadece hareket varsa ilerle
            if (moveX !== 0 || moveY !== 0) {
                // Oyuncuyu hareket ettir
                movePlayer(moveX, moveY);
                
                // Son hareket yönünü kaydet
                lastMoveDirection.dx = moveX;
                lastMoveDirection.dy = moveY;
                
                // Başlangıç noktasını güncelle
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
                lastTouchTime = currentTime;
                
                // Sürekli hareket modunu etkinleştir
                if (!continuousMovementActive) {
                    continuousMovementActive = true;
                    // Sürekli hareket döngüsünü başlat
                    if (moveTimeout) clearTimeout(moveTimeout);
                    moveTimeout = setTimeout(continuousMovement, 200);
                     
                    // Joystick modu etkin mesajı göster
                }
            }
        }
    });
    
    gameCanvas.addEventListener('touchend', () => {
        isTouching = false;
        
        // Sürekli hareket özelliğini durdur
        continuousMovementActive = false;
        toggleJoystickIndicator(false);
        
        // Hareket bittiğinde yön bilgisini sıfırla
        lastMoveDirection.dx = 0;
        lastMoveDirection.dy = 0;
        
        if (moveTimeout) {
            clearTimeout(moveTimeout);
            moveTimeout = null;
        }
    });
    
    gameCanvas.addEventListener('touchcancel', () => {
        isTouching = false;
        
        // Sürekli hareket özelliğini durdur
        continuousMovementActive = false;
        toggleJoystickIndicator(false);
        
        lastMoveDirection.dx = 0;
        lastMoveDirection.dy = 0;
        
        if (moveTimeout) {
            clearTimeout(moveTimeout);
            moveTimeout = null;
        }
    });
    
    // Mouse click handler for canvas
    gameCanvas.addEventListener('click', handleCanvasClick);
    
    // Klavye kontrolleri
    window.addEventListener('keydown', (event) => {
        switch (event.key) {
            case 'ArrowUp':
                movePlayer(0, -1);
                break;
            case 'ArrowDown':
                movePlayer(0, 1);
                break;
            case 'ArrowLeft':
                movePlayer(-1, 0);
                break;
            case 'ArrowRight':
                movePlayer(1, 0);
                break;
        }
    });
    
    // Window resize handler
    window.addEventListener('resize', () => {
        resizeCanvases();
        updateButtonTexts(window.innerWidth);
    });
    
    // UI butonları
    document.getElementById('build-house').addEventListener('click', buildHouse);
    document.getElementById('build-barracks').addEventListener('click', buildBarracks);
    document.getElementById('build-mill').addEventListener('click', buildMill);
    document.getElementById('build-tower').addEventListener('click', buildTower);
    document.getElementById('craft-tool').addEventListener('click', craftTool);
    document.getElementById('advance-age').addEventListener('click', advanceAge);
    document.getElementById('gather').addEventListener('click', () => {
        // Gather resources from adjacent tiles
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const x = gameState.player.x + dx;
                const y = gameState.player.y + dy;
                
                // Check if coordinates are within map bounds
                if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
                    const tile = gameState.map[y][x];
                    if (tile.resource) {
                        gatherResource(tile);
                    }
                }
            }
        }
        
        showMessage("Gathered resources from surrounding tiles!");
    });
    
    // Minimap tıklama
    minimapCanvas.addEventListener('click', handleMinimapClick);
    
    // Initialize button texts on load
    updateButtonTexts(window.innerWidth);
}

// Game loop
function gameLoop() {
    const currentTime = Date.now();
    const deltaTime = currentTime - gameState.lastTick;
    
    // Update game state
    updateGameState(deltaTime);
    
    // Draw game elements
    drawMap();
    drawMinimap();
    updateUI();
    
    // Save the current time
    gameState.lastTick = currentTime;
    
    // Continue game loop
    requestAnimationFrame(gameLoop);
}

// Update game state
function updateGameState(deltaTime) {
    // Increment game year (1 year every 500ms)
    gameState.gameYear += deltaTime / 500;
    
    // Update UI
    document.getElementById('game-time').textContent = `Year: ${Math.floor(gameState.gameYear)}`;
    
    // Update building animations
    if (gameState.buildingAnimations.length > 0) {
        for (let i = gameState.buildingAnimations.length - 1; i >= 0; i--) {
            const anim = gameState.buildingAnimations[i];
            anim.progress += (deltaTime / (BUILDING_TYPES[anim.type].buildTime * 1000)) * 100;
            
            if (anim.progress >= 100) {
                gameState.buildingAnimations.splice(i, 1);
            }
        }
    }
    
    // Update debug info
    updateDebugInfo();
}

// Update debug information
function updateDebugInfo() {
    const debugElement = document.getElementById('debug-info');
    if (!debugElement) return;
    
    debugElement.innerHTML = `
        <div>Player: (${gameState.player.x}, ${gameState.player.y})</div>
        <div>Camera: (${gameState.camera.x}, ${gameState.camera.y})</div>
        <div>Selected: ${gameState.selectedTile ? `(${gameState.selectedTile.x}, ${gameState.selectedTile.y})` : 'None'}</div>
        <div>Canvas: ${gameCanvas.width}x${gameCanvas.height}</div>
    `;
}

// Craft a tool
function craftTool() {
    // Check if player has enough resources
    if (gameState.resources.wood >= 5 && gameState.resources.stone >= 3) {
        // Deduct resources
        gameState.resources.wood -= 5;
        gameState.resources.stone -= 3;
        
        // Increase resource gathering efficiency (simplified)
        for (const nodeType in RESOURCE_NODES) {
            RESOURCE_NODES[nodeType].yield += 1;
        }
        
        showMessage('Tool crafted! Resource gathering is now more efficient.');
        
        // Update UI
        updateUI();
    } else {
        showMessage('Not enough resources! Need 5 wood and 3 stone to craft a tool.');
    }
}

// Start the game when page loads
window.addEventListener('load', initGame);