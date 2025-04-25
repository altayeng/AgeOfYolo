// Game constants
const TILE_WIDTH = 64;  // Width of isometric tile
const TILE_HEIGHT = 32; // Height of isometric tile
const MAP_SIZE = 100;    // Size of the game map (100x100)
const VISIBLE_TILES = 15; // Number of tiles visible in viewport
const MAX_KINGDOMS = 5; // Maximum number of kingdoms including player

// Age progression
const AGES = [
    { name: "Dark Age", buildingReq: 0 },
    { name: "Feudal Age", buildingReq: 3 },
    { name: "Castle Age", buildingReq: 6 },
    { name: "Imperial Age", buildingReq: 10 }
];

// Kingdom colors
const KINGDOM_COLORS = [
    '#2962FF', // Player (blue)
    '#D32F2F', // Red
    '#388E3C', // Green
    '#7B1FA2', // Purple
    '#FF6F00'  // Orange
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
    soldierTraining: [], // Asker eğitimi için dizi
    soldiers: [], // Oyuncunun askerleri
    enemies: [], // Düşman birimleri
    enemyBuildings: [], // Düşman binaları
    kingdoms: [], // All kingdoms in the game
    territories: [], // Territory markers for each kingdom
    combatEnabled: true, // Savaş sistemi aktif mi
    combatCooldown: 0, // Saldırı arasındaki bekleme süresi
    selectedTile: null,
    player: {
        x: Math.floor(MAP_SIZE / 2),
        y: Math.floor(MAP_SIZE / 2),
        health: 100,
        attack: 10,
        kingdomId: 0 // Player is kingdom 0
    },
    population: {
        current: 0,
        max: 10,
        soldiers: 0 // Mevcut asker sayısı
    },
    military: {
        attack: 10,          // Base attack power
        defense: 5,          // Base defense
        trainingSpeed: 1.0,  // Training speed multiplier
        range: 1,            // Attack range
        barracksCount: 0,    // Number of barracks
        towerCount: 0,       // Number of towers
        attackBonus: 0,      // Additional attack from buildings
        defenseBonus: 0,     // Additional defense from buildings
        needsBarracks: true, // Whether the player needs more barracks
        needsTowers: true,   // Whether the player needs more towers
    },
    currentAge: 0,
    gameYear: 0,
    lastTick: 0,
    kingdomExpansionCooldown: 0, // Cooldown for kingdom expansion
    lastKingdomUpdate: 0 // Last time kingdoms were updated
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
    'HOUSE': {
        name: 'House',
        woodCost: 20,
        stoneCost: 10,
        foodCost: 5,
        maxHealth: 100,
        color: '#795548',
        soldierTime: 60, // Time in seconds to train a soldier
        description: 'Houses provide shelter and train soldiers.'
    },
    'BARRACKS': {
        name: 'Barracks',
        woodCost: 30,
        stoneCost: 15,
        foodCost: 10,
        maxHealth: 150,
        color: '#5D4037',
        description: 'Barracks train soldiers faster and improve defenses.'
    },
    'MILL': {
        name: 'Mill',
        woodCost: 25,
        stoneCost: 5,
        foodCost: 0,
        maxHealth: 80,
        color: '#8D6E63',
        description: 'Mills generate food over time.'
    },
    'TOWER': {
        name: 'Tower',
        woodCost: 15,
        stoneCost: 30,
        foodCost: 0,
        maxHealth: 200,
        color: '#757575',
        description: 'Towers improve defense and provide vision.'
    },
    'WALL': {
        name: 'Wall',
        woodCost: 5,
        stoneCost: 15,
        foodCost: 0,
        maxHealth: 250,
        color: '#9E9E9E',
        description: 'Walls define your territory and provide protection.'
    }
};

// Enemy types
const ENEMY_TYPES = {
    WARRIOR: { health: 50, attack: 8, color: '#D32F2F', speed: 0.5 },
    ARCHER: { health: 30, attack: 12, color: '#7B1FA2', speed: 0.7 }
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
    
    // Initialize kingdoms
    initializeKingdoms();
    
    // Start with some initial resources
    gameState.resources.wood = 100;
    gameState.resources.stone = 80;
    gameState.resources.food = 60;
    
    // Center camera on player
    centerCameraOnPlayer();
    
    // Create joystick indicator
    createJoystickIndicator();
    
    // Add event listeners
    setupEventListeners();
    
    // Initialize game time
    gameState.lastTick = Date.now();
    
    // Add attack button to UI
    addAttackButton();
    
    // Add wall button to UI
    addWallButton();
    
    // Initialize military stats
    updateMilitaryStats();
    
    // Show welcome message
    setTimeout(() => {
        showMessage('Welcome to Age of Empires! Build walls to establish your kingdom territory.');
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
                building: null,
                territory: null, // Which kingdom's territory this is
                isWall: false,   // Is this a wall tile
                isCapital: false // Is this a kingdom capital
            });
        }
        gameState.map.push(row);
    }
}

// Initialize kingdoms across the map
function initializeKingdoms() {
    // Clear existing kingdoms
    gameState.kingdoms = [];
    gameState.enemies = [];
    gameState.enemyBuildings = [];
    
    // Add player's kingdom
    const playerKingdom = {
        id: 0,
        name: "Player's Kingdom",
        color: KINGDOM_COLORS[0],
        capitalX: gameState.player.x,
        capitalY: gameState.player.y,
        buildings: [],
        soldiers: [],
        resources: {
            wood: 100,
            stone: 80,
            food: 60
        },
        expansionRate: 1.0, // Baseline expansion rate
        lastExpansion: 0,
        wallPerimeter: []   // Coordinates of wall perimeter
    };
    gameState.kingdoms.push(playerKingdom);
    
    // Mark player's starting location as capital and territory
    gameState.map[gameState.player.y][gameState.player.x].territory = 0;
    gameState.map[gameState.player.y][gameState.player.x].isCapital = true;
    
    // Establish initial territory for player (3x3 area)
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            const x = gameState.player.x + dx;
            const y = gameState.player.y + dy;
            
            if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
                gameState.map[y][x].territory = 0;
            }
        }
    }
    
    // Create AI kingdoms (up to MAX_KINGDOMS - 1)
    const maxAIKingdoms = MAX_KINGDOMS - 1;
    
    for (let i = 0; i < maxAIKingdoms; i++) {
        // Find a suitable location away from player and other kingdoms
        let kingdomX, kingdomY;
        let validLocation = false;
        let attempts = 0;
        
        do {
            // Place kingdoms at increasing distances from center
            const angle = (i * (2 * Math.PI / maxAIKingdoms)) + (Math.random() * 0.5);
            const distance = 15 + Math.random() * 10;
            
            kingdomX = Math.floor(MAP_SIZE / 2 + distance * Math.cos(angle));
            kingdomY = Math.floor(MAP_SIZE / 2 + distance * Math.sin(angle));
            
            // Ensure within map bounds
            kingdomX = Math.max(5, Math.min(MAP_SIZE - 5, kingdomX));
            kingdomY = Math.max(5, Math.min(MAP_SIZE - 5, kingdomY));
            
            // Check if far enough from other kingdoms
            validLocation = true;
            for (const kingdom of gameState.kingdoms) {
                const distToKingdom = Math.sqrt(
                    Math.pow(kingdomX - kingdom.capitalX, 2) + 
                    Math.pow(kingdomY - kingdom.capitalY, 2)
                );
                
                if (distToKingdom < 15) {
                    validLocation = false;
                    break;
                }
            }
            
            attempts++;
        } while (!validLocation && attempts < 50);
        
        if (!validLocation) {
            console.log("Could not place kingdom, skipping");
            continue;
        }
        
        // Create the kingdom
        const kingdomId = i + 1;
        const kingdom = {
            id: kingdomId,
            name: `Kingdom ${kingdomId}`,
            color: KINGDOM_COLORS[kingdomId],
            capitalX: kingdomX,
            capitalY: kingdomY,
            buildings: [],
            soldiers: [],
            resources: {
                wood: 50 + Math.random() * 50,
                stone: 40 + Math.random() * 40,
                food: 30 + Math.random() * 30
            },
            expansionRate: 0.3 + Math.random() * 0.3, // Random expansion rate, slower than player
            lastExpansion: 0,
            wallPerimeter: []
        };
        
        gameState.kingdoms.push(kingdom);
        
        // Mark kingdom's starting location as capital and territory
        gameState.map[kingdomY][kingdomX].territory = kingdomId;
        gameState.map[kingdomY][kingdomX].isCapital = true;
        
        // Establish initial territory (3x3 area)
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const x = kingdomX + dx;
                const y = kingdomY + dy;
                
                if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
                    gameState.map[y][x].territory = kingdomId;
                }
            }
        }
        
        // Create enemy character for this kingdom
        const enemyType = Math.random() < 0.7 ? 'WARRIOR' : 'ARCHER';
        const enemyInfo = ENEMY_TYPES[enemyType];
        
        const enemy = {
            x: kingdomX,
            y: kingdomY,
            type: enemyType,
            health: enemyInfo.health,
            attack: enemyInfo.attack,
            lastMoved: 0,
            moveDelay: 1000 / enemyInfo.speed,
            kingdomId: kingdomId
        };
        
        gameState.enemies.push(enemy);
        
        // Build initial capital building
        const capitalTile = gameState.map[kingdomY][kingdomX];
        capitalTile.building = 'HOUSE';
        
        // Track enemy building
        gameState.enemyBuildings.push({
            type: 'HOUSE',
            x: kingdomX,
            y: kingdomY,
            owner: 'enemy',
            kingdomId: kingdomId,
            health: BUILDING_TYPES['HOUSE'].maxHealth,
            isCapital: true
        });
        
        // Generate initial walls around the kingdom
        generateInitialWalls(kingdom);
    }
    
    console.log(`Initialized ${gameState.kingdoms.length} kingdoms`);
}

// Generate initial walls around a kingdom
function generateInitialWalls(kingdom) {
    const wallSize = 8; // 8x8 territory size
    const centerX = kingdom.capitalX;
    const centerY = kingdom.capitalY;
    
    // Clear any existing walls
    kingdom.wallPerimeter = [];
    
    // Calculate territory bounds
    const startX = centerX - Math.floor(wallSize / 2);
    const startY = centerY - Math.floor(wallSize / 2);
    const endX = startX + wallSize;
    const endY = startY + wallSize;
    
    // Generate walls around the perimeter
    for (let x = startX; x < endX; x++) {
        for (let y = startY; y < endY; y++) {
            // Only place walls on the perimeter
            if (x === startX || x === endX - 1 || y === startY || y === endY - 1) {
                // Ensure within map bounds
                if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
                    const tile = gameState.map[y][x];
                    
                    // Place a wall if there's no building or resource
                    if (!tile.building && !tile.resource) {
                        tile.building = 'WALL';
                        tile.isWall = true;
                        tile.territory = kingdom.id;
                        
                        // Add to wall perimeter for tracking
                        kingdom.wallPerimeter.push({x: x, y: y});
                        
                        // If this is an enemy kingdom, add to enemy buildings
                        if (kingdom.id !== 0) {
                            gameState.enemyBuildings.push({
                                type: 'WALL',
                                x: x,
                                y: y,
                                owner: 'enemy',
                                kingdomId: kingdom.id,
                                health: BUILDING_TYPES['WALL'].maxHealth
                            });
                        } else {
                            // Player's wall
                            gameState.buildings.push({
                                type: 'WALL',
                                x: x,
                                y: y,
                                health: BUILDING_TYPES['WALL'].maxHealth,
                                id: Date.now() + Math.floor(Math.random() * 1000)
                            });
                        }
                    }
                }
            } else {
                // Mark interior tiles as territory
                if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
                    gameState.map[y][x].territory = kingdom.id;
                }
            }
        }
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
                territory: tile.territory,
                isWall: tile.isWall,
                isCapital: tile.isCapital,
                isSelected: gameState.selectedTile && gameState.selectedTile.x === x && gameState.selectedTile.y === y,
                isPlayer: gameState.player.x === x && gameState.player.y === y
            });
            
            // Check if there are any enemies on this tile
            const enemyOnTile = gameState.enemies.find(enemy => enemy.x === x && enemy.y === y);
            if (enemyOnTile) {
                renderObjects.push({
                    type: 'enemy',
                    x: screenX,
                    y: screenY,
                    z: x + y + 0.1, // Slightly above tile
                    enemyType: enemyOnTile.type,
                    health: enemyOnTile.health,
                    kingdomId: enemyOnTile.kingdomId
                });
            }
            
            // Check for soldiers on this tile
            const soldiersOnTile = gameState.soldiers.filter(soldier => soldier.x === x && soldier.y === y);
            if (soldiersOnTile.length > 0) {
                renderObjects.push({
                    type: 'soldiers',
                    x: screenX,
                    y: screenY,
                    z: x + y + 0.2, // Above enemies
                    count: soldiersOnTile.length
                });
            }
            
            // Add training indicators for houses
            const buildingOnTile = gameState.buildings.find(b => b.x === x && b.y === y);
            if (buildingOnTile && buildingOnTile.type === 'HOUSE') {
                const trainingInfo = gameState.soldierTraining.find(t => t.buildingId === buildingOnTile.id);
                if (trainingInfo) {
                    renderObjects.push({
                        type: 'training',
                        x: screenX,
                        y: screenY,
                        z: x + y + 0.3, // Above soldiers
                        progress: trainingInfo.progress
                    });
                }
            }
        }
    }
    
    // Sort by z-index (depth)
    renderObjects.sort((a, b) => a.z - b.z);
    
    // Then render everything in correct order
    for (const obj of renderObjects) {
        switch (obj.type) {
            case 'tile':
                // Draw the base tile
                drawIsometricTile(obj.x, obj.y, obj.tileType);
                
                // Draw territory overlay
                if (obj.territory !== null) {
                    drawTerritoryOverlay(obj.x, obj.y, obj.territory, obj.isCapital);
                }
                
                // Draw resource if present
                if (obj.resource) {
                    drawResource(obj.x, obj.y, obj.resource);
                }
                
                // Draw building if present
                if (obj.building) {
                    // Check if it's an enemy building
                    const isEnemyBuilding = obj.territory !== null && obj.territory !== 0;
                    
                    drawBuilding(obj.x, obj.y, obj.building, isEnemyBuilding, obj.isWall, obj.territory);
                }
                
                // Highlight selected tile
                if (obj.isSelected) {
                    drawTileHighlight(obj.x, obj.y);
                }
                
                // Draw player if on this tile
                if (obj.isPlayer) {
                    drawPlayer(obj.x, obj.y);
                }
                break;
                
            case 'enemy':
                drawEnemy(obj.x, obj.y, obj.enemyType, obj.health, obj.kingdomId);
                break;
                
            case 'soldiers':
                drawSoldiers(obj.x, obj.y, obj.count);
                break;
                
            case 'training':
                drawTrainingIndicator(obj.x, obj.y, obj.progress);
                break;
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
function drawBuilding(x, y, buildingType, isEnemy = false, isWall = false, kingdomId = null) {
    const building = BUILDING_TYPES[buildingType];
    let baseColor = building?.color || '#795548';
    
    // Adjust color based on kingdom
    if (kingdomId !== null) {
        if (isWall) {
            // Walls use kingdom colors
            baseColor = KINGDOM_COLORS[kingdomId];
        } else if (isEnemy) {
            // Enemy buildings have reddish tint but maintain kingdom color influence
            const kingdomColor = KINGDOM_COLORS[kingdomId];
            // Mix colors (simple average for now)
            baseColor = '#B71C1C';
        }
    }
    
    // Different shapes for different buildings
    if (isWall) {
        // Draw wall (special case for walls)
        drawWall(x, y, baseColor, kingdomId);
    } else {
        switch(buildingType) {
            case 'BARRACKS':
                // Draw barracks base
                gameCtx.fillStyle = isEnemy ? '#8E0000' : '#5D4037';
                gameCtx.fillRect(x - 24, y - 20, 48, 30);
                
                // Draw barracks roof
                gameCtx.fillStyle = isEnemy ? '#D50000' : '#BF360C';
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
                
                // Add flag with kingdom color
                gameCtx.fillStyle = kingdomId !== null ? KINGDOM_COLORS[kingdomId] : '#B71C1C';
                gameCtx.fillRect(x + 20, y - 40, 10, 6);
                break;
                
            case 'MILL':
                // Draw mill base
                gameCtx.fillStyle = isEnemy ? '#8E0000' : '#8D6E63';
                gameCtx.fillRect(x - 18, y - 15, 36, 25);
                
                // Draw roof
                gameCtx.fillStyle = isEnemy ? '#D50000' : '#FFA000';
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
                gameCtx.fillStyle = isEnemy ? '#8E0000' : '#616161';
                gameCtx.fillRect(x - 15, y - 10, 30, 20);
                
                // Draw tower middle
                gameCtx.fillStyle = isEnemy ? '#B71C1C' : '#757575';
                gameCtx.fillRect(x - 12, y - 30, 24, 20);
                
                // Draw tower top
                gameCtx.fillStyle = isEnemy ? '#D50000' : '#9E9E9E';
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
                
                // Draw flag with kingdom color
                gameCtx.fillStyle = kingdomId !== null ? KINGDOM_COLORS[kingdomId] : '#B71C1C';
                gameCtx.fillRect(x, y - 55, 10, 5);
                break;
                
            case 'HOUSE':
            default:
                // Draw house base (walls)
                gameCtx.fillStyle = isEnemy ? '#8E0000' : '#795548';
                gameCtx.fillRect(x - 18, y - 12, 36, 22);
                
                // Draw roof
                gameCtx.fillStyle = isEnemy ? '#D50000' : '#D32F2F';
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
    }
    
    // Draw building outline
    gameCtx.strokeStyle = '#212121';
    gameCtx.lineWidth = 1;
    
    // The outline depends on the building type
    if (!isWall) {
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
}

// Draw a wall segment
function drawWall(x, y, color, kingdomId) {
    // Use kingdom color
    const wallColor = kingdomId !== null ? KINGDOM_COLORS[kingdomId] : color;
    const stoneColor = '#8c8c8c'; // Stone-like color
    
    // Draw wall base (stone texture)
    gameCtx.fillStyle = stoneColor;
    
    // Main wall structure (wider and more wall-like)
    gameCtx.beginPath();
    gameCtx.moveTo(x - 15, y);         // Left point
    gameCtx.lineTo(x - 10, y - 12);     // Top-left
    gameCtx.lineTo(x + 10, y - 12);     // Top-right
    gameCtx.lineTo(x + 15, y);         // Right point
    gameCtx.lineTo(x + 10, y + 6);     // Bottom-right
    gameCtx.lineTo(x - 10, y + 6);     // Bottom-left
    gameCtx.closePath();
    gameCtx.fill();
    
    // Add stone texture pattern
    gameCtx.strokeStyle = '#6e6e6e';
    gameCtx.lineWidth = 0.5;
    
    // Horizontal stone lines
    gameCtx.beginPath();
    gameCtx.moveTo(x - 14, y - 4);
    gameCtx.lineTo(x + 14, y - 4);
    gameCtx.stroke();
    
    gameCtx.beginPath();
    gameCtx.moveTo(x - 12, y + 2);
    gameCtx.lineTo(x + 12, y + 2);
    gameCtx.stroke();
    
    // Vertical stone lines
    for (let i = -12; i <= 12; i += 6) {
        gameCtx.beginPath();
        gameCtx.moveTo(x + i, y - 12);
        gameCtx.lineTo(x + i, y + 6);
        gameCtx.stroke();
    }
    
    // Draw crenellations (in kingdom color)
    gameCtx.fillStyle = wallColor;
    
    // Top of wall with crenellations
    // Left merlon
    gameCtx.fillRect(x - 14, y - 18, 6, 6);
    
    // Center merlon
    gameCtx.fillRect(x - 3, y - 18, 6, 6);
    
    // Right merlon
    gameCtx.fillRect(x + 8, y - 18, 6, 6);
    
    // Draw outlines
    gameCtx.strokeStyle = '#000000';
    gameCtx.lineWidth = 1;
    
    // Main wall outline
    gameCtx.beginPath();
    gameCtx.moveTo(x - 15, y);
    gameCtx.lineTo(x - 10, y - 12);
    gameCtx.lineTo(x + 10, y - 12);
    gameCtx.lineTo(x + 15, y);
    gameCtx.lineTo(x + 10, y + 6);
    gameCtx.lineTo(x - 10, y + 6);
    gameCtx.closePath();
    gameCtx.stroke();
    
    // Crenellation outlines
    gameCtx.strokeRect(x - 14, y - 18, 6, 6);
    gameCtx.strokeRect(x - 3, y - 18, 6, 6);
    gameCtx.strokeRect(x + 8, y - 18, 6, 6);
    
    // Add kingdom emblem
    if (kingdomId !== null) {
        gameCtx.fillStyle = '#FFFFFF';
        gameCtx.beginPath();
        gameCtx.arc(x, y - 8, 3, 0, Math.PI * 2);
        gameCtx.fill();
        gameCtx.strokeStyle = '#000000';
        gameCtx.lineWidth = 0.5;
        gameCtx.stroke();
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
    
    // Draw health bar
    const healthPercent = gameState.player.health / 100;
    const barWidth = 20;
    
    // Background
    gameCtx.fillStyle = '#333333';
    gameCtx.fillRect(x - barWidth/2, y - 25, barWidth, 3);
    
    // Health amount
    gameCtx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
    gameCtx.fillRect(x - barWidth/2, y - 25, barWidth * healthPercent, 3);
}

// Draw enemy character
function drawEnemy(x, y, enemyType, health, kingdomId) {
    const enemyInfo = ENEMY_TYPES[enemyType];
    
    // Draw enemy shadow
    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    gameCtx.beginPath();
    gameCtx.ellipse(x, y + 8, 10, 5, 0, 0, Math.PI * 2);
    gameCtx.fill();
    
    // Draw enemy body
    gameCtx.fillStyle = enemyInfo.color;
    gameCtx.beginPath();
    gameCtx.arc(x, y - 5, 8, 0, Math.PI * 2);
    gameCtx.fill();
    
    // Draw enemy head
    gameCtx.fillStyle = '#333333';
    gameCtx.beginPath();
    gameCtx.arc(x, y - 12, 5, 0, Math.PI * 2);
    gameCtx.fill();
    
    // Draw outline
    gameCtx.strokeStyle = '#000000';
    gameCtx.lineWidth = 1;
    gameCtx.beginPath();
    gameCtx.arc(x, y - 5, 8, 0, Math.PI * 2);
    gameCtx.stroke();
    gameCtx.beginPath();
    gameCtx.arc(x, y - 12, 5, 0, Math.PI * 2);
    gameCtx.stroke();
    
    // Draw health bar
    const maxHealth = ENEMY_TYPES[enemyType].health;
    const healthPercent = health / maxHealth;
    const barWidth = 20;
    
    // Background
    gameCtx.fillStyle = '#333333';
    gameCtx.fillRect(x - barWidth/2, y - 25, barWidth, 3);
    
    // Health amount
    gameCtx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FFC107' : '#F44336';
    gameCtx.fillRect(x - barWidth/2, y - 25, barWidth * healthPercent, 3);
}

// Draw soldiers
function drawSoldiers(x, y, count) {
    // Draw shadow for all soldiers
    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    gameCtx.beginPath();
    gameCtx.ellipse(x, y + 10, 12, 6, 0, 0, Math.PI * 2);
    gameCtx.fill();
    
    // Offset positions based on count
    let positions;
    if (count === 1) {
        positions = [{x: 0, y: 0}];
    } else if (count === 2) {
        positions = [{x: -5, y: 0}, {x: 5, y: 0}];
    } else if (count === 3) {
        positions = [{x: 0, y: -4}, {x: -6, y: 4}, {x: 6, y: 4}];
    } else {
        positions = [{x: -5, y: -3}, {x: 5, y: -3}, {x: -5, y: 3}, {x: 5, y: 3}];
        // If more than 4, just show 4 and a number
    }
    
    // Draw each soldier (up to 4)
    for (let i = 0; i < Math.min(positions.length, count); i++) {
        const pos = positions[i];
        
        // Draw body
        gameCtx.fillStyle = '#3F51B5'; // Blue for soldiers
        gameCtx.beginPath();
        gameCtx.arc(x + pos.x, y + pos.y - 3, 6, 0, Math.PI * 2);
        gameCtx.fill();
        
        // Draw head
        gameCtx.fillStyle = '#FFA726';
        gameCtx.beginPath();
        gameCtx.arc(x + pos.x, y + pos.y - 9, 3, 0, Math.PI * 2);
        gameCtx.fill();
        
        // Draw outline
        gameCtx.strokeStyle = '#1A237E';
        gameCtx.lineWidth = 1;
        gameCtx.beginPath();
        gameCtx.arc(x + pos.x, y + pos.y - 3, 6, 0, Math.PI * 2);
        gameCtx.stroke();
        gameCtx.beginPath();
        gameCtx.arc(x + pos.x, y + pos.y - 9, 3, 0, Math.PI * 2);
        gameCtx.stroke();
    }
    
    // If more than shown soldiers, display a count
    if (count > positions.length) {
        gameCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        gameCtx.beginPath();
        gameCtx.arc(x, y - 20, 8, 0, Math.PI * 2);
        gameCtx.fill();
        
        gameCtx.fillStyle = '#FFFFFF';
        gameCtx.font = '10px Arial';
        gameCtx.textAlign = 'center';
        gameCtx.textBaseline = 'middle';
        gameCtx.fillText(count.toString(), x, y - 20);
    }
}

// Draw training indicator for houses generating soldiers
function drawTrainingIndicator(x, y, progress) {
    // Draw progress bar above house
    const barWidth = 30;
    const barHeight = 5;
    
    // Background
    gameCtx.fillStyle = '#333333';
    gameCtx.fillRect(x - barWidth/2, y - 35, barWidth, barHeight);
    
    // Progress
    gameCtx.fillStyle = '#4CAF50';
    gameCtx.fillRect(x - barWidth/2, y - 35, barWidth * (progress / 100), barHeight);
    
    // Draw soldier icon
    gameCtx.fillStyle = '#3F51B5';
    gameCtx.beginPath();
    gameCtx.arc(x, y - 45, 4, 0, Math.PI * 2);
    gameCtx.fill();
    
    gameCtx.fillStyle = '#FFA726';
    gameCtx.beginPath();
    gameCtx.arc(x, y - 48, 2, 0, Math.PI * 2);
    gameCtx.fill();
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
                // Check if it's an enemy building
                const isEnemyBuilding = gameState.enemyBuildings.some(b => b.x === x && b.y === y);
                
                minimapCtx.fillStyle = isEnemyBuilding ? '#B71C1C' : BUILDING_TYPES[tile.building].color;
                minimapCtx.fillRect(x * tileSize + tileSize/4, y * tileSize + tileSize/4, tileSize/2, tileSize/2);
            }
        }
    }
    
    // Draw enemies on minimap
    for (const enemy of gameState.enemies) {
        minimapCtx.fillStyle = '#D32F2F'; // Red for enemies
        minimapCtx.beginPath();
        minimapCtx.arc(
            enemy.x * tileSize + tileSize/2,
            enemy.y * tileSize + tileSize/2,
            tileSize * 0.7, 0, Math.PI * 2
        );
        minimapCtx.fill();
    }
    
    // Draw soldiers on minimap
    for (const soldier of gameState.soldiers) {
        minimapCtx.fillStyle = '#3F51B5'; // Blue for soldiers
        minimapCtx.beginPath();
        minimapCtx.arc(
            soldier.x * tileSize + tileSize/2,
            soldier.y * tileSize + tileSize/2,
            tileSize * 0.5, 0, Math.PI * 2
        );
        minimapCtx.fill();
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
    
    // Update military stats
    updateMilitaryStats();
    
    // Update player health (check if element exists)
    if (!document.getElementById('player-health')) {
        // Create health display elements
        const healthContainer = document.createElement('div');
        healthContainer.className = 'resource';
        
        const healthIcon = document.createElement('span');
        healthIcon.className = 'resource-icon';
        healthIcon.textContent = '❤️';
        
        const healthCount = document.createElement('span');
        healthCount.className = 'resource-count';
        healthCount.id = 'player-health';
        
        healthContainer.appendChild(healthIcon);
        healthContainer.appendChild(healthCount);
        
        // Insert after population count
        const resourcesDiv = document.getElementById('resources');
        resourcesDiv.appendChild(healthContainer);
        
        // Create soldiers count element
        const soldiersContainer = document.createElement('div');
        soldiersContainer.className = 'resource';
        
        const soldiersIcon = document.createElement('span');
        soldiersIcon.className = 'resource-icon';
        soldiersIcon.textContent = '⚔️';
        
        const soldiersCount = document.createElement('span');
        soldiersCount.className = 'resource-count';
        soldiersCount.id = 'soldiers-count';
        
        soldiersContainer.appendChild(soldiersIcon);
        soldiersContainer.appendChild(soldiersCount);
        
        resourcesDiv.appendChild(soldiersContainer);
    }
    
    // Update health display
    document.getElementById('player-health').textContent = `${gameState.player.health}/100`;
    
    // Update soldiers count
    document.getElementById('soldiers-count').textContent = gameState.population.soldiers;
    
    // Set building costs as tooltips
    document.getElementById('build-house').setAttribute('data-cost', 
        `Wood: ${BUILDING_TYPES.HOUSE.woodCost} Stone: ${BUILDING_TYPES.HOUSE.stoneCost}`);
    document.getElementById('build-barracks').setAttribute('data-cost', 
        `Wood: ${BUILDING_TYPES.BARRACKS.woodCost} Stone: ${BUILDING_TYPES.BARRACKS.stoneCost} Food: ${BUILDING_TYPES.BARRACKS.foodCost}`);
    document.getElementById('build-mill').setAttribute('data-cost', 
        `Wood: ${BUILDING_TYPES.MILL.woodCost} Food: ${BUILDING_TYPES.MILL.foodCost}`);
    document.getElementById('build-tower').setAttribute('data-cost', 
        `Wood: ${BUILDING_TYPES.TOWER.woodCost} Stone: ${BUILDING_TYPES.TOWER.stoneCost}`);
    
    // Update attack button tooltip
    document.getElementById('attack').setAttribute('data-cost', 
        `Attack nearby enemies (Soldiers: ${gameState.population.soldiers})`);
    
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
    
    // Check if clicked on enemy building
    const clickedEnemyBuilding = gameState.enemyBuildings.find(b => 
        b.x === clickedTile.x && b.y === clickedTile.y);
    
    if (clickedEnemyBuilding) {
        // Attack the enemy building
        attackEnemyBuilding(clickedTile.x, clickedTile.y);
        return;
    }
    
    // Process the click for movement
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
function buildStructure(buildingType, callback) {
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
        
        // Create new building object with unique ID
        const newBuilding = {
            type: buildingType,
            x: gameState.selectedTile.x,
            y: gameState.selectedTile.y,
            health: 100, // Bina sağlığı eklendi
            id: Date.now() + Math.floor(Math.random() * 1000) // Unique ID
        };
        
        // Binayı ekle
        tile.building = buildingType;
        gameState.buildings.push(newBuilding);
        
        // Nüfus kapasitesini güncelle
        if (building.population > 0) {
            gameState.population.max += building.population;
            showMessage(`Ev inşa edildi! Nüfus limiti ${gameState.population.max} oldu.`);
        } else {
            showMessage(`${building.name} başarıyla inşa edildi!`);
        }
        
        // If it's a house, start soldier training
        if (buildingType === 'HOUSE' && callback) {
            callback(newBuilding);
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
    buildStructure('HOUSE', startSoldierTraining);
}

// Build a barracks on the selected tile
function buildBarracks() {
    buildStructure('BARRACKS', () => {
        showMessage("Barracks built. Military attack power increased!");
        updateMilitaryStats();
    });
}

// Build a mill on the selected tile
function buildMill() {
    buildStructure('MILL', () => {
        showMessage("Mill built. Food production started.");
    });
}

// Build a tower on the selected tile
function buildTower() {
    buildStructure('TOWER', () => {
        showMessage("Tower built. Defense capability increased!");
        updateMilitaryStats();
    });
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
    
    // Update soldier training
    updateSoldierTraining(deltaTime);
    
    // Update soldier positions to follow player
    updateSoldierPositions();
    
    // Update enemy movement and behavior
    updateEnemies(deltaTime);
    
    // Reduce combat cooldown
    if (gameState.combatCooldown > 0) {
        gameState.combatCooldown = Math.max(0, gameState.combatCooldown - deltaTime);
    }
    
    // Update debug info
    updateDebugInfo();
}

// Update soldier training for houses
function updateSoldierTraining(deltaTime) {
    // Process training for each entry
    for (let i = gameState.soldierTraining.length - 1; i >= 0; i--) {
        const training = gameState.soldierTraining[i];
        
        // Update progress (deltaTime is in milliseconds)
        const progressIncrement = (deltaTime / (BUILDING_TYPES.HOUSE.soldierTime * 1000)) * 100;
        training.progress = Math.min(100, training.progress + progressIncrement);
        
        // Check if training is complete
        if (training.progress >= 100) {
            const building = gameState.buildings.find(b => b.id === training.buildingId);
            
            if (building) {
                // Create a new soldier
                gameState.soldiers.push({
                    x: building.x,
                    y: building.y,
                    health: 50,
                    attack: 5
                });
                
                // Update population
                gameState.population.current += 1;
                gameState.population.soldiers += 1;
                
                // Show message
                showMessage(`A new soldier has been trained at (${building.x}, ${building.y})!`);
                
                // Update UI
                updateUI();
            }
            
            // Remove training from list
            gameState.soldierTraining.splice(i, 1);
        }
    }
}

// Update enemy movement and behavior
function updateEnemies(deltaTime) {
    for (const enemy of gameState.enemies) {
        // Add elapsed time to enemy's last moved time
        enemy.lastMoved += deltaTime;
        
        // Only move if enough time has passed
        if (enemy.lastMoved > enemy.moveDelay) {
            enemy.lastMoved = 0;
            
            // Simple AI: enemies move toward player if near, otherwise random movement
            const distToPlayer = Math.sqrt(
                Math.pow(enemy.x - gameState.player.x, 2) + 
                Math.pow(enemy.y - gameState.player.y, 2)
            );
            
            let moveX = 0;
            let moveY = 0;
            
            if (distToPlayer < 10) {
                // Move toward player
                if (enemy.x < gameState.player.x) moveX = 1;
                else if (enemy.x > gameState.player.x) moveX = -1;
                
                if (enemy.y < gameState.player.y) moveY = 1;
                else if (enemy.y > gameState.player.y) moveY = -1;
                
                // Only move in one direction at a time
                if (moveX !== 0 && moveY !== 0) {
                    if (Math.random() < 0.5) moveX = 0;
                    else moveY = 0;
                }
            } else {
                // Random movement
                const randomDir = Math.floor(Math.random() * 4);
                switch (randomDir) {
                    case 0: moveX = 1; break;  // Right
                    case 1: moveX = -1; break; // Left
                    case 2: moveY = 1; break;  // Down
                    case 3: moveY = -1; break; // Up
                }
            }
            
            // Calculate new position
            const newX = enemy.x + moveX;
            const newY = enemy.y + moveY;
            
            // Check if new position is valid
            if (newX >= 0 && newX < MAP_SIZE && newY >= 0 && newY < MAP_SIZE) {
                const tile = gameState.map[newY][newX];
                
                if (tile.building) {
                    // Attack walls and buildings
                    if (tile.isWall || tile.building) {
                        const building = gameState.buildings.find(b => b.x === newX && b.y === newY) ||
                                       gameState.enemyBuildings.find(b => b.x === newX && b.y === newY);
                        
                        if (building) {
                            // Damage the wall/building
                            building.health -= enemy.attack;
                            
                            // Show attack effect
                            showMessage(`Enemy attacks ${building.type}! (${building.health} HP remaining)`);
                            
                            // Check if wall/building is destroyed
                            if (building.health <= 0) {
                                // Remove the building from the map
                                tile.building = null;
                                tile.isWall = false;
                                
                                // Remove from buildings array
                                const buildingIndex = gameState.buildings.findIndex(b => b.x === newX && b.y === newY);
                                if (buildingIndex !== -1) {
                                    gameState.buildings.splice(buildingIndex, 1);
                                }
                                
                                // Remove from enemy buildings if applicable
                                const enemyBuildingIndex = gameState.enemyBuildings.findIndex(b => b.x === newX && b.y === newY);
                                if (enemyBuildingIndex !== -1) {
                                    gameState.enemyBuildings.splice(enemyBuildingIndex, 1);
                                }
                                
                                showMessage(`${building.type} has been destroyed!`);
                            }
                        }
                    }
                } else {
                    // Move to empty tile
                    enemy.x = newX;
                    enemy.y = newY;
                    
                    // Check if enemy is adjacent to player
                    const dx = Math.abs(enemy.x - gameState.player.x);
                    const dy = Math.abs(enemy.y - gameState.player.y);
                    
                    if (dx <= 1 && dy <= 1) {
                        // Enemy attacks player
                        enemyAttackPlayer(enemy);
                    }
                }
            }
        }
    }
    
    // No longer automatically spawn random enemies
    // This ensures MAX_KINGDOMS limit is respected
}

// Enemy attacks player
function enemyAttackPlayer(enemy) {
    const enemyAttack = ENEMY_TYPES[enemy.type].attack;
    
    // Apply damage to player
    gameState.player.health -= enemyAttack;
    
    // Show message
    showMessage(`Enemy attacked you for ${enemyAttack} damage!`);
    
    // Check if player is defeated
    if (gameState.player.health <= 0) {
        gameState.player.health = 0;
        showMessage("You have been defeated! Game over.");
        // Could add game over logic here
    }
}

// Start soldier training after a house is built
function startSoldierTraining(building) {
    // Ensure building has a unique ID
    if (!building.id) {
        building.id = Date.now() + Math.floor(Math.random() * 1000);
    }
    
    // Add new training entry
    gameState.soldierTraining.push({
        buildingId: building.id,
        progress: 0
    });
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

// Spawn enemies on the map
function spawnEnemies(count) {
    // Check if we've reached the MAX_KINGDOMS limit 
    if (gameState.kingdoms.length >= MAX_KINGDOMS) {
        console.log(`Cannot spawn more enemies. MAX_KINGDOMS (${MAX_KINGDOMS}) reached.`);
        return;
    }
    
    for (let i = 0; i < count; i++) {
        // Check kingdom limit again for each new enemy kingdom
        if (gameState.kingdoms.length >= MAX_KINGDOMS) {
            console.log(`Cannot spawn more enemies. MAX_KINGDOMS (${MAX_KINGDOMS}) reached.`);
            break;
        }
        
        // Find a suitable location away from player
        let enemyX, enemyY;
        let distanceToPlayer;
        
        do {
            enemyX = Math.floor(Math.random() * MAP_SIZE);
            enemyY = Math.floor(Math.random() * MAP_SIZE);
            
            distanceToPlayer = Math.sqrt(
                Math.pow(enemyX - gameState.player.x, 2) + 
                Math.pow(enemyY - gameState.player.y, 2)
            );
        } while (distanceToPlayer < 20); // Keep enemies at least 20 tiles away (increased distance)
        
        // Randomly choose enemy type
        const enemyType = Math.random() < 0.7 ? 'WARRIOR' : 'ARCHER';
        const enemyInfo = ENEMY_TYPES[enemyType];
        
        // Create a new kingdom for this enemy
        const kingdomId = gameState.kingdoms.length;
        
        // Create a new kingdom
        const kingdom = {
            id: kingdomId,
            name: `Kingdom ${kingdomId}`,
            color: KINGDOM_COLORS[kingdomId % KINGDOM_COLORS.length],
            capitalX: enemyX,
            capitalY: enemyY,
            buildings: [],
            soldiers: [],
            resources: {
                wood: 50 + Math.random() * 50,
                stone: 40 + Math.random() * 40,
                food: 30 + Math.random() * 30
            },
            expansionRate: 0.3 + Math.random() * 0.3,
            lastExpansion: 0,
            wallPerimeter: []
        };
        
        gameState.kingdoms.push(kingdom);
        
        // Mark kingdom's starting location as capital and territory
        gameState.map[enemyY][enemyX].territory = kingdomId;
        gameState.map[enemyY][enemyX].isCapital = true;
        
        // Establish initial territory (3x3 area)
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                const x = enemyX + dx;
                const y = enemyY + dy;
                
                if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
                    gameState.map[y][x].territory = kingdomId;
                }
            }
        }
        
        // Create the enemy
        const enemy = {
            x: enemyX,
            y: enemyY,
            type: enemyType,
            health: enemyInfo.health,
            attack: enemyInfo.attack,
            lastMoved: 0,
            moveDelay: 1000 / enemyInfo.speed,
            kingdomId: kingdomId
        };
        
        gameState.enemies.push(enemy);
        
        // Add capital building
        const capitalTile = gameState.map[enemyY][enemyX];
        capitalTile.building = 'HOUSE';
        
        // Track enemy capital building
        gameState.enemyBuildings.push({
            type: 'HOUSE',
            x: enemyX,
            y: enemyY,
            owner: 'enemy',
            kingdomId: kingdomId,
            health: BUILDING_TYPES['HOUSE'].maxHealth,
            isCapital: true
        });
        
        // Generate initial walls around the kingdom
        generateInitialWalls(kingdom);
    }
    
    console.log(`Spawned ${Math.min(count, MAX_KINGDOMS - (gameState.kingdoms.length - count))} enemies. Total kingdoms: ${gameState.kingdoms.length}`);
}

// Add attack button to UI
function addAttackButton() {
    const actionsGroup = document.querySelector('.action-group:nth-child(2)');
    const buttonsRow = actionsGroup.querySelector('.buttons-row');
    
    const attackButton = document.createElement('button');
    attackButton.id = 'attack';
    attackButton.className = 'action-button';
    attackButton.textContent = 'Attack';
    attackButton.setAttribute('data-mobile-text', 'Atk');
    
    attackButton.addEventListener('click', attackNearbyEnemies);
    
    buttonsRow.appendChild(attackButton);
}

// Attack nearby enemies
function attackNearbyEnemies() {
    // Check if player is in combat cooldown
    if (gameState.combatCooldown > 0) {
        showMessage(`Cooldown: You need to wait ${Math.ceil(gameState.combatCooldown / 1000)}s to attack again`);
        return;
    }
    
    // Find enemies in adjacent tiles
    const nearbyEnemies = gameState.enemies.filter(enemy => {
        const dx = Math.abs(enemy.x - gameState.player.x);
        const dy = Math.abs(enemy.y - gameState.player.y);
        return dx <= 1 && dy <= 1;
    });
    
    if (nearbyEnemies.length === 0) {
        showMessage("No enemies nearby to attack!");
        return;
    }
    
    // Calculate total attack power (player + soldiers)
    const playerAttack = gameState.player.attack;
    let totalAttack = playerAttack;
    
    // Get soldiers at the same position as player
    const playerSoldiers = gameState.soldiers.filter(soldier => 
        soldier.x === gameState.player.x && soldier.y === gameState.player.y);
    
    // Add soldier attack power
    totalAttack += playerSoldiers.length * 5; // Each soldier adds 5 attack power
    
    // Attack the first nearby enemy
    const targetEnemy = nearbyEnemies[0];
    targetEnemy.health -= totalAttack;
    
    // Show attack message
    showMessage(`Attacked enemy for ${totalAttack} damage! (Player: ${playerAttack}, Soldiers: ${playerSoldiers.length * 5})`);
    
    // Play attack sound
    const attackSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA');
    attackSound.volume = 0.3;
    attackSound.play().catch(() => {});
    
    // Set combat cooldown (2 seconds)
    gameState.combatCooldown = 2000;
    
    // Check if enemy is defeated
    if (targetEnemy.health <= 0) {
        // Remove enemy from game
        const enemyIndex = gameState.enemies.indexOf(targetEnemy);
        gameState.enemies.splice(enemyIndex, 1);
        
        // Give player resources as reward
        gameState.resources.wood += 10;
        gameState.resources.stone += 5;
        gameState.resources.food += 8;
        
        showMessage("Enemy defeated! Received resources as reward.");
        updateUI();
    } else {
        // Enemy counterattack
        enemyCounterattack(targetEnemy);
    }
}

// Enemy counterattack
function enemyCounterattack(enemy) {
    // Calculate enemy attack power
    const enemyAttack = ENEMY_TYPES[enemy.type].attack;
    
    // Damage player
    gameState.player.health -= enemyAttack;
    
    // Show damage message
    showMessage(`Enemy counterattacked for ${enemyAttack} damage!`);
    
    // Check if player is defeated
    if (gameState.player.health <= 0) {
        gameState.player.health = 0;
        showMessage("You have been defeated! Game over.");
        // Could add game over logic here
    }
}

// Attack enemy building
function attackEnemyBuilding(buildingX, buildingY) {
    // Find enemy building at the given coordinates
    const enemyBuilding = gameState.enemyBuildings.find(b => 
        b.x === buildingX && b.y === buildingY);
    
    if (!enemyBuilding) return;
    
    // Check if player is near the building
    const dx = Math.abs(buildingX - gameState.player.x);
    const dy = Math.abs(buildingY - gameState.player.y);
    
    if (dx > 1 || dy > 1) {
        showMessage("You must be adjacent to the building to attack it!");
        return;
    }
    
    // Calculate attack damage (player + soldiers)
    const playerAttack = gameState.player.attack / 2; // Reduced damage to buildings
    let totalAttack = playerAttack;
    
    // Get soldiers at the same position as player
    const playerSoldiers = gameState.soldiers.filter(soldier => 
        soldier.x === gameState.player.x && soldier.y === gameState.player.y);
    
    // Add soldier attack power
    totalAttack += playerSoldiers.length * 3; // Each soldier adds 3 attack power against buildings
    
    // Damage building
    enemyBuilding.health -= totalAttack;
    
    // Show attack message
    showMessage(`Attacked enemy building for ${totalAttack} damage!`);
    
    // Check if building is destroyed
    if (enemyBuilding.health <= 0) {
        // Remove building from enemy buildings list
        const buildingIndex = gameState.enemyBuildings.indexOf(enemyBuilding);
        gameState.enemyBuildings.splice(buildingIndex, 1);
        
        // Remove building from map
        const tile = gameState.map[buildingY][buildingX];
        tile.building = null;
        
        // Give player resources as reward
        gameState.resources.wood += 20;
        gameState.resources.stone += 15;
        
        showMessage("Enemy building destroyed! Received resources as reward.");
        updateUI();
    }
}

// Have soldiers follow the player
function updateSoldierPositions() {
    // Max soldiers that can be at the same position as player
    const maxSoldiersWithPlayer = 8;
    
    // Count soldiers already with player
    const soldiersWithPlayer = gameState.soldiers.filter(soldier => 
        soldier.x === gameState.player.x && soldier.y === gameState.player.y).length;
    
    // Only update positions for soldiers not already with the player
    const soldiersToMove = gameState.soldiers.filter(soldier => 
        soldier.x !== gameState.player.x || soldier.y !== gameState.player.y);
    
    // Calculate how many more soldiers can be with the player
    const availableSpots = Math.max(0, maxSoldiersWithPlayer - soldiersWithPlayer);
    
    // Move up to that many soldiers to the player's position
    for (let i = 0; i < Math.min(availableSpots, soldiersToMove.length); i++) {
        const soldier = soldiersToMove[i];
        soldier.x = gameState.player.x;
        soldier.y = gameState.player.y;
    }
    
    // For remaining soldiers, position them in adjacent tiles
    for (let i = availableSpots; i < soldiersToMove.length; i++) {
        const soldier = soldiersToMove[i];
        
        // Find an available adjacent tile
        const adjacentPositions = [
            {dx: 0, dy: -1}, // Up
            {dx: 1, dy: 0},  // Right
            {dx: 0, dy: 1},  // Down
            {dx: -1, dy: 0}, // Left
            {dx: 1, dy: -1}, // Up-Right
            {dx: 1, dy: 1},  // Down-Right
            {dx: -1, dy: 1}, // Down-Left
            {dx: -1, dy: -1} // Up-Left
        ];
        
        // Shuffle adjacent positions randomly
        for (let j = adjacentPositions.length - 1; j > 0; j--) {
            const k = Math.floor(Math.random() * (j + 1));
            [adjacentPositions[j], adjacentPositions[k]] = [adjacentPositions[k], adjacentPositions[j]];
        }
        
        // Try each adjacent position
        let positioned = false;
        for (const {dx, dy} of adjacentPositions) {
            const newX = gameState.player.x + dx;
            const newY = gameState.player.y + dy;
            
            // Check if position is valid
            if (newX >= 0 && newX < MAP_SIZE && newY >= 0 && newY < MAP_SIZE) {
                // Check if the tile doesn't have a building
                const tile = gameState.map[newY][newX];
                if (!tile.building) {
                    // Count soldiers already at this position
                    const soldiersAtPos = gameState.soldiers.filter(s => 
                        s.x === newX && s.y === newY).length;
                    
                    // Limit to 4 soldiers per adjacent tile
                    if (soldiersAtPos < 4) {
                        soldier.x = newX;
                        soldier.y = newY;
                        positioned = true;
                        break;
                    }
                }
            }
        }
        
        // If no adjacent tile is available, just keep current position
        if (!positioned) {
            // Keep current position
        }
    }
}

// Add wall button to UI
function addWallButton() {
    const actionsGroup = document.querySelector('.action-group:nth-child(1)');
    const buttonsRow = actionsGroup.querySelector('.buttons-row');
    
    const wallButton = document.createElement('button');
    wallButton.id = 'build-wall';
    wallButton.className = 'building-button';
    wallButton.textContent = 'Wall';
    wallButton.setAttribute('data-mobile-text', 'Wall');
    
    wallButton.addEventListener('click', buildWall);
    
    buttonsRow.appendChild(wallButton);
}

// Build a wall on the selected tile
function buildWall() {
    if (!gameState.selectedTile) {
        showMessage('First select a tile where you want to build a wall!');
        return;
    }
    
    const tile = gameState.map[gameState.selectedTile.y][gameState.selectedTile.x];
    const building = BUILDING_TYPES['WALL'];
    
    // Check if tile already has a building or resource
    if (tile.resource || tile.building) {
        showMessage('Cannot build a wall here - the area is occupied!');
        return;
    }
    
    // Check if tile is within player's territory or adjacent to it
    if (tile.territory !== 0) {
        let isAdjacentToTerritory = false;
        
        // Check adjacent tiles for player territory
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue; // Skip the tile itself
                
                const nx = gameState.selectedTile.x + dx;
                const ny = gameState.selectedTile.y + dy;
                
                if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
                    if (gameState.map[ny][nx].territory === 0) {
                        isAdjacentToTerritory = true;
                        break;
                    }
                }
            }
            if (isAdjacentToTerritory) break;
        }
        
        if (!isAdjacentToTerritory) {
            showMessage('Walls must be built within or adjacent to your territory!');
            return;
        }
    }
    
    // Check proximity to player
    const dx = Math.abs(gameState.selectedTile.x - gameState.player.x);
    const dy = Math.abs(gameState.selectedTile.y - gameState.player.y);
    if (dx > 3 || dy > 3) {
        showMessage('You must be closer to build here!');
        return;
    }
    
    // Check if player has enough resources
    const canAfford = gameState.resources.wood >= building.woodCost && 
                     gameState.resources.stone >= building.stoneCost &&
                     gameState.resources.food >= building.foodCost;
    
    if (canAfford) {
        // Deduct resources
        gameState.resources.wood -= building.woodCost;
        gameState.resources.stone -= building.stoneCost;
        gameState.resources.food -= building.foodCost;
        
        // Create new wall building
        const newWall = {
            type: 'WALL',
            x: gameState.selectedTile.x,
            y: gameState.selectedTile.y,
            health: building.maxHealth,
            id: Date.now() + Math.floor(Math.random() * 1000)
        };
        
        // Add wall to map and building list
        tile.building = 'WALL';
        tile.isWall = true;
        gameState.buildings.push(newWall);
        
        // If tile wasn't already in player territory, claim it
        if (tile.territory !== 0) {
            tile.territory = 0;
            
            // Add this tile to the player's kingdom wall perimeter
            const playerKingdom = gameState.kingdoms[0];
            playerKingdom.wallPerimeter.push({
                x: gameState.selectedTile.x,
                y: gameState.selectedTile.y
            });
            
            // Expand territory within the walls
            expandTerritoryWithinWalls(0);
        }
        
        showMessage('Wall built successfully!');
        
        // Play build sound
        const buildSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA');
        buildSound.volume = 0.3;
        buildSound.play().catch(() => {});
        
        // Update UI
        updateUI();
    } else {
        // Calculate and show missing resources
        const missingResources = [];
        if (gameState.resources.wood < building.woodCost) {
            missingResources.push(`${building.woodCost - Math.floor(gameState.resources.wood)} wood`);
        }
        if (gameState.resources.stone < building.stoneCost) {
            missingResources.push(`${building.stoneCost - Math.floor(gameState.resources.stone)} stone`);
        }
        
        showMessage(`Not enough resources! Need: ${missingResources.join(', ')}.`);
    }
}

// Expand territory within a kingdom's walls
function expandTerritoryWithinWalls(kingdomId) {
    const kingdom = gameState.kingdoms[kingdomId];
    
    // Get set of wall coordinates for fast lookup
    const wallCoords = new Set();
    for (const wall of kingdom.wallPerimeter) {
        wallCoords.add(`${wall.x},${wall.y}`);
    }
    
    // Start flood fill from kingdom capital
    const queue = [{x: kingdom.capitalX, y: kingdom.capitalY}];
    const visited = new Set([`${kingdom.capitalX},${kingdom.capitalY}`]);
    
    while (queue.length > 0) {
        const {x, y} = queue.shift();
        
        // Set territory
        if (gameState.map[y][x].territory !== kingdomId) {
            gameState.map[y][x].territory = kingdomId;
        }
        
        // Try to expand in 4 directions
        const directions = [
            {dx: 1, dy: 0},
            {dx: -1, dy: 0},
            {dx: 0, dy: 1},
            {dx: 0, dy: -1}
        ];
        
        for (const {dx, dy} of directions) {
            const nx = x + dx;
            const ny = y + dy;
            const coordKey = `${nx},${ny}`;
            
            // Check if in bounds and not visited
            if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE && !visited.has(coordKey)) {
                visited.add(coordKey);
                
                const tile = gameState.map[ny][nx];
                
                // If this is a wall tile of our kingdom, don't go beyond it
                if (wallCoords.has(coordKey)) {
                    continue;
                }
                
                // If this tile already belongs to another kingdom, don't claim it
                if (tile.territory !== null && tile.territory !== kingdomId) {
                    continue;
                }
                
                // Add to queue to continue expanding
                queue.push({x: nx, y: ny});
            }
        }
    }
}

// Draw territory overlay on a tile
function drawTerritoryOverlay(screenX, screenY, territoryId, isCapital = false) {
    if (territoryId === null) return;
    
    // Get territory color
    const territoryColor = KINGDOM_COLORS[territoryId];
    
    // Draw territory overlay
    gameCtx.globalAlpha = 0.2; // Subtle transparency
    
    gameCtx.fillStyle = territoryColor;
    gameCtx.beginPath();
    gameCtx.moveTo(screenX, screenY - TILE_HEIGHT / 2);  // Top point
    gameCtx.lineTo(screenX + TILE_WIDTH / 2, screenY);   // Right point
    gameCtx.lineTo(screenX, screenY + TILE_HEIGHT / 2);  // Bottom point
    gameCtx.lineTo(screenX - TILE_WIDTH / 2, screenY);   // Left point
    gameCtx.closePath();
    gameCtx.fill();
    
    // If this is a capital, add a special marker
    if (isCapital) {
        gameCtx.globalAlpha = 0.8;
        gameCtx.fillStyle = territoryColor;
        gameCtx.beginPath();
        gameCtx.arc(screenX, screenY, 6, 0, Math.PI * 2);
        gameCtx.fill();
        
        gameCtx.fillStyle = '#FFFFFF';
        gameCtx.beginPath();
        gameCtx.arc(screenX, screenY, 3, 0, Math.PI * 2);
        gameCtx.fill();
    }
    
    // Reset alpha
    gameCtx.globalAlpha = 1.0;
}

// Update military stats based on buildings
function updateMilitaryStats() {
    // Reset counters
    gameState.military.barracksCount = 0;
    gameState.military.towerCount = 0;
    
    // Count buildings
    for (const building of gameState.buildings) {
        if (building.type === 'BARRACKS') {
            gameState.military.barracksCount++;
        } else if (building.type === 'TOWER') {
            gameState.military.towerCount++;
        }
    }
    
    // Calculate bonuses
    gameState.military.attackBonus = gameState.military.barracksCount * 5; // Each barracks adds +5 attack
    gameState.military.defenseBonus = gameState.military.towerCount * 7;   // Each tower adds +7 defense
    
    // Update total stats
    gameState.military.attack = 10 + gameState.military.attackBonus; // Base attack + bonus
    gameState.military.defense = 5 + gameState.military.defenseBonus; // Base defense + bonus
    
    // Training speed increases with barracks (10% per barracks)
    gameState.military.trainingSpeed = 1.0 + (gameState.military.barracksCount * 0.1);
    
    // Range increases with towers (1 base + 0.5 per tower, up to +2)
    gameState.military.range = 1 + Math.min(2, gameState.military.towerCount * 0.5);
    
    // Update needs based on current age and buildings
    updateMilitaryNeeds();
    
    // Update UI for military stats
    updateMilitaryUI();
}

// Update the military needs indicators
function updateMilitaryNeeds() {
    const age = gameState.currentAge;
    
    // Age-based requirements
    const minBarracks = age > 0 ? age : 0; // Need at least 1 barracks in Feudal Age, 2 in Castle, etc.
    const minTowers = Math.max(0, age - 1);  // Need towers from Castle Age onwards
    
    // Set needs flags
    gameState.military.needsBarracks = gameState.military.barracksCount < minBarracks;
    gameState.military.needsTowers = gameState.military.towerCount < minTowers;
}

// Update the UI for military stats
function updateMilitaryUI() {
    // Update attack and defense values
    document.getElementById('attack-value').textContent = gameState.military.attack;
    document.getElementById('defense-value').textContent = gameState.military.defense;
    
    // Update needs indicators
    const needsContainer = document.getElementById('military-needs');
    needsContainer.innerHTML = '';
    
    if (gameState.military.needsBarracks) {
        const needBarracks = document.createElement('div');
        needBarracks.className = 'military-need';
        needBarracks.textContent = 'Need Barracks';
        needsContainer.appendChild(needBarracks);
    }
    
    if (gameState.military.needsTowers) {
        const needTowers = document.createElement('div');
        needTowers.className = 'military-need';
        needTowers.textContent = 'Need Towers';
        needsContainer.appendChild(needTowers);
    }
}

// Start the game when page loads
window.addEventListener('load', initGame);
