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
    [TILE_TYPES.GRASS]: { 
        color: '#4CAF50',
        gradient: {
            start: '#67BB6A',
            mid: '#43A047',
            end: '#2E7D32'
        }
    },
    [TILE_TYPES.DESERT]: { 
        color: '#F9A825',
        gradient: {
            start: '#FFD54F',
            mid: '#FFC107',
            end: '#FFA000'
        }
    }
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
    
    // Initialize game state if it doesn't exist
    if (!gameState) {
        gameState = {
            map: [],
            player: {
                x: Math.floor(MAP_SIZE / 2),
                y: Math.floor(MAP_SIZE / 2),
                health: 100,
                attack: 10
            },
            resources: {
                wood: 0,
                stone: 0,
                food: 0
            },
            buildings: [],
            enemyBuildings: [],
            soldiers: [],
            soldierTraining: [],
            camera: {
                x: 0,
                y: 0
            },
            enemies: [],
            selectedTile: null,
            lastTick: Date.now(),
            gameYear: 0,
            currentAge: 0,
            buildingAnimations: [],
            debugClicks: [],
            population: {
                current: 1,
                max: 10,
                soldiers: 0
            },
            kingdoms: [],
            combatCooldown: 0 // Add combat cooldown property
        };
    } else {
        // Just add combatCooldown if the gameState already exists
        gameState.combatCooldown = 0;
    }
    
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
    updateMilitaryUI();
    
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
    // Initialize kingdoms array
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
    
    // Generate initial walls for the player kingdom
    generateInitialWalls(playerKingdom);
    
    // Create AI kingdoms (up to MAX_KINGDOMS - 1)
    const maxAIKingdoms = MAX_KINGDOMS - 1;
    
    // Define minimum distances - increased for better kingdom separation
    const MIN_DISTANCE_TO_PLAYER = 40; // Minimum distance from player
    const MIN_DISTANCE_BETWEEN_KINGDOMS = 50; // Minimum distance between AI kingdoms
    
    // Calculate positions in a distributed way around the map
    const mapCenter = Math.floor(MAP_SIZE / 2);
    
    for (let i = 0; i < maxAIKingdoms; i++) {
        // Find a suitable location away from player and other kingdoms
        let kingdomX, kingdomY;
        let validLocation = false;
        let attempts = 0;
        const MAX_ATTEMPTS = 150; // Increased attempt limit for better placement
        
        do {
            // First try to place kingdoms evenly distributed around the map
            if (attempts < 50) {
                // Use an angle-based distribution for initial attempts
                const angle = (2 * Math.PI * i / maxAIKingdoms) + (Math.random() * 0.5);
                const distance = Math.floor(MIN_DISTANCE_TO_PLAYER * 1.2 + Math.random() * 10);
                
                kingdomX = Math.max(15, Math.min(MAP_SIZE - 15, 
                    mapCenter + Math.floor(distance * Math.cos(angle))));
                kingdomY = Math.max(15, Math.min(MAP_SIZE - 15, 
                    mapCenter + Math.floor(distance * Math.sin(angle))));
            } else {
                // Fall back to random placement after initial attempts
                kingdomX = 15 + Math.floor(Math.random() * (MAP_SIZE - 30));
                kingdomY = 15 + Math.floor(Math.random() * (MAP_SIZE - 30));
            }
            
            // Calculate distance to player
            const distToPlayer = Math.sqrt(
                Math.pow(kingdomX - gameState.player.x, 2) + 
                Math.pow(kingdomY - gameState.player.y, 2)
            );
            
            // Check if far enough from player
            if (distToPlayer < MIN_DISTANCE_TO_PLAYER) {
                attempts++;
                continue;
            }
            
            // Check distance to other kingdoms
            let tooClose = false;
            for (let j = 1; j < gameState.kingdoms.length; j++) {
                const otherKingdom = gameState.kingdoms[j];
                const distToKingdom = Math.sqrt(
                    Math.pow(kingdomX - otherKingdom.capitalX, 2) + 
                    Math.pow(kingdomY - otherKingdom.capitalY, 2)
                );
                
                if (distToKingdom < MIN_DISTANCE_BETWEEN_KINGDOMS) {
                    tooClose = true;
                    break;
                }
            }
            
            if (tooClose) {
                attempts++;
                continue;
            }
            
            // Check if the area is suitable (no major obstacles, etc.)
            // For now, we'll just consider it valid if there's no building
            const tile = gameState.map[kingdomY][kingdomX];
            if (tile.building) {
                attempts++;
                continue;
            }
            
            validLocation = true;
            
            // If we've tried too many times, just use the current location
            if (attempts >= MAX_ATTEMPTS) {
                console.log("Max attempts reached when placing kingdom " + (i+1));
                validLocation = true;
            }
            
        } while (!validLocation);
        
        // Create the kingdom
        const kingdomId = gameState.kingdoms.length;
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
    
    // Clear any existing walls
    kingdom.wallPerimeter = [];
    
    // First, clear all resources from potential wall locations and interior
    for (let y = kingdom.capitalY - wallSize / 2; y <= kingdom.capitalY + wallSize / 2; y++) {
        for (let x = kingdom.capitalX - wallSize / 2; x <= kingdom.capitalX + wallSize / 2; x++) {
            // Make sure coordinates are within map bounds
            if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
                // Force clear any resources in the entire kingdom area
                gameState.map[y][x].resource = null;
            }
        }
    }
    
    // Now build the walls
    for (let y = kingdom.capitalY - wallSize / 2; y <= kingdom.capitalY + wallSize / 2; y++) {
        for (let x = kingdom.capitalX - wallSize / 2; x <= kingdom.capitalX + wallSize / 2; x++) {
            // Check if this is the perimeter
            const isPerimeter = 
                x === kingdom.capitalX - wallSize / 2 ||
                x === kingdom.capitalX + wallSize / 2 ||
                y === kingdom.capitalY - wallSize / 2 ||
                y === kingdom.capitalY + wallSize / 2;
            
            if (isPerimeter) {
                // Make sure coordinates are within map bounds
                if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
                    const tile = gameState.map[y][x];
                    
                    // Place wall on this tile
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
    const tileInfo = tileImages[tileType];
    
    if (tileType === TILE_TYPES.GRASS) {
        gradient.addColorStop(0, tileInfo.gradient.start);
        gradient.addColorStop(0.5, tileInfo.gradient.mid);
        gradient.addColorStop(1, tileInfo.gradient.end);
        
        // Add texture to grass
        gameCtx.fillStyle = gradient;
        gameCtx.fill();
        
        // Add grass detail with noise pattern
        const grassDetail = Math.random();
        if (grassDetail > 0.8) {
            // Small flowers or details
            gameCtx.fillStyle = '#FFEB3B';
            gameCtx.beginPath();
            gameCtx.arc(x + (Math.random() * 10 - 5), y + (Math.random() * 10 - 5), 1, 0, Math.PI * 2);
            gameCtx.fill();
        } else if (grassDetail > 0.6) {
            // Grass tuft detail
            gameCtx.strokeStyle = '#388E3C';
            gameCtx.lineWidth = 0.5;
            const grassX = x + (Math.random() * 20 - 10);
            const grassY = y + (Math.random() * 10 - 5);
            gameCtx.beginPath();
            gameCtx.moveTo(grassX, grassY);
            gameCtx.lineTo(grassX - 2, grassY - 3);
            gameCtx.moveTo(grassX, grassY);
            gameCtx.lineTo(grassX + 2, grassY - 3);
            gameCtx.stroke();
        }
    } else {
        gradient.addColorStop(0, tileInfo.gradient.start);
        gradient.addColorStop(0.5, tileInfo.gradient.mid);
        gradient.addColorStop(1, tileInfo.gradient.end);
        
        // Fill with gradient
        gameCtx.fillStyle = gradient;
        gameCtx.fill();
        
        // Add desert details
        if (Math.random() > 0.85) {
            // Small stones or sand detail
            gameCtx.fillStyle = '#E0E0E0';
            gameCtx.beginPath();
            gameCtx.arc(x + (Math.random() * 16 - 8), y + (Math.random() * 8 - 4), 1.5, 0, Math.PI * 2);
            gameCtx.fill();
        }
    }
    
    // Draw subtle outline
    gameCtx.strokeStyle = '#00000033';
    gameCtx.lineWidth = 0.5;
    gameCtx.stroke();
}

// Draw a resource node
function drawResource(x, y, resourceType) {
    switch (resourceType) {
        case 'TREE':
            // Tree with better shading and form
            // Tree trunk with gradient
            const trunkGradient = gameCtx.createLinearGradient(x - 3, y, x + 3, y);
            trunkGradient.addColorStop(0, '#5D4037');
            trunkGradient.addColorStop(0.5, '#795548');
            trunkGradient.addColorStop(1, '#4E342E');
            
            gameCtx.fillStyle = trunkGradient;
            gameCtx.fillRect(x - 3, y - 2, 6, 12);
            
            // Tree shadow
            gameCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            gameCtx.beginPath();
            gameCtx.ellipse(x, y + 10, 10, 4, 0, 0, Math.PI * 2);
            gameCtx.fill();
            
            // Tree foliage with gradient
            const foliageGradient = gameCtx.createRadialGradient(x, y - 15, 0, x, y - 15, 20);
            foliageGradient.addColorStop(0, '#66BB6A');
            foliageGradient.addColorStop(0.7, '#388E3C');
            foliageGradient.addColorStop(1, '#1B5E20');
            
            gameCtx.fillStyle = foliageGradient;
            
            // Draw three levels of foliage for a fuller tree
            gameCtx.beginPath();
            gameCtx.moveTo(x, y - 30);
            gameCtx.lineTo(x + 15, y - 15);
            gameCtx.lineTo(x - 15, y - 15);
            gameCtx.closePath();
            gameCtx.fill();
            
            gameCtx.beginPath();
            gameCtx.moveTo(x, y - 25);
            gameCtx.lineTo(x + 18, y - 8);
            gameCtx.lineTo(x - 18, y - 8);
            gameCtx.closePath();
            gameCtx.fill();
            
            gameCtx.beginPath();
            gameCtx.moveTo(x, y - 20);
            gameCtx.lineTo(x + 20, y);
            gameCtx.lineTo(x - 20, y);
            gameCtx.closePath();
            gameCtx.fill();
            break;
            
        case 'STONE':
            // Stone with 3D effect and shading
            const stoneGradient = gameCtx.createLinearGradient(x - 10, y - 10, x + 10, y + 5);
            stoneGradient.addColorStop(0, '#9E9E9E');
            stoneGradient.addColorStop(0.5, '#757575');
            stoneGradient.addColorStop(1, '#616161');
            
            // Draw main rock
            gameCtx.fillStyle = stoneGradient;
            gameCtx.beginPath();
            gameCtx.moveTo(x - 10, y);
            gameCtx.lineTo(x - 5, y - 8);
            gameCtx.lineTo(x + 8, y - 10);
            gameCtx.lineTo(x + 12, y - 2);
            gameCtx.lineTo(x + 8, y + 5);
            gameCtx.lineTo(x - 5, y + 3);
            gameCtx.closePath();
            gameCtx.fill();
            
            // Highlights
            gameCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            gameCtx.beginPath();
            gameCtx.moveTo(x - 5, y - 8);
            gameCtx.lineTo(x + 2, y - 9);
            gameCtx.lineTo(x - 2, y - 5);
            gameCtx.closePath();
            gameCtx.fill();
            
            // Shadow
            gameCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            gameCtx.beginPath();
            gameCtx.ellipse(x, y + 5, 12, 4, 0, 0, Math.PI * 2);
            gameCtx.fill();
            break;
            
        case 'BERRY':
            // Berry bush with more details
            // Bush base
            const bushGradient = gameCtx.createRadialGradient(x, y - 5, 0, x, y - 5, 12);
            bushGradient.addColorStop(0, '#558B2F');
            bushGradient.addColorStop(1, '#33691E');
            
            gameCtx.fillStyle = bushGradient;
            gameCtx.beginPath();
            gameCtx.arc(x, y - 5, 12, 0, Math.PI * 2);
            gameCtx.fill();
            
            // Draw berries
            for (let i = 0; i < 8; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * 8;
                const berryX = x + Math.cos(angle) * distance;
                const berryY = y - 5 + Math.sin(angle) * distance;
                
                // Berry gradient for 3D effect
                const berryGradient = gameCtx.createRadialGradient(
                    berryX - 1, berryY - 1, 0, 
                    berryX, berryY, 3
                );
                berryGradient.addColorStop(0, '#E91E63');
                berryGradient.addColorStop(1, '#C2185B');
                
                gameCtx.fillStyle = berryGradient;
                gameCtx.beginPath();
                gameCtx.arc(berryX, berryY, 2.5, 0, Math.PI * 2);
                gameCtx.fill();
                
                // Highlight on each berry
                gameCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                gameCtx.beginPath();
                gameCtx.arc(berryX - 0.8, berryY - 0.8, 0.8, 0, Math.PI * 2);
                gameCtx.fill();
            }
            
            // Shadow
            gameCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            gameCtx.beginPath();
            gameCtx.ellipse(x, y + 7, 10, 3, 0, 0, Math.PI * 2);
            gameCtx.fill();
            break;
    }
}

// Draw a building
function drawBuilding(x, y, buildingType, isEnemy = false, isWall = false, kingdomId = null) {
    // Get kingdom color if available
    const kingdomColor = kingdomId !== null ? KINGDOM_COLORS[kingdomId] : (isEnemy ? '#D32F2F' : '#2962FF');
    
    if (isWall) {
        drawWall(x, y, kingdomColor, kingdomId);
    } else {
        // Draw shadow for 3D effect
        gameCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        gameCtx.beginPath();
        gameCtx.ellipse(x, y + 15, 25, 8, 0, 0, Math.PI * 2);
        gameCtx.fill();
        
        switch(buildingType) {
            case 'BARRACKS':
                // Base structure with gradient
                const barracksGradient = gameCtx.createLinearGradient(x - 24, y - 20, x + 24, y + 10);
                barracksGradient.addColorStop(0, isEnemy ? '#C62828' : '#455A64');
                barracksGradient.addColorStop(0.5, isEnemy ? '#B71C1C' : '#37474F');
                barracksGradient.addColorStop(1, isEnemy ? '#7f0000' : '#263238');
                
                gameCtx.fillStyle = barracksGradient;
                gameCtx.fillRect(x - 24, y - 20, 48, 30);
                
                // Roof with kingdom color
                const roofGradient = gameCtx.createLinearGradient(x - 28, y - 25, x + 28, y - 5);
                roofGradient.addColorStop(0, kingdomColor);
                roofGradient.addColorStop(1, shadeColor(kingdomColor, -30));
                
                gameCtx.fillStyle = roofGradient;
                gameCtx.beginPath();
                gameCtx.moveTo(x - 28, y - 20);
                gameCtx.lineTo(x, y - 35);
                gameCtx.lineTo(x + 28, y - 20);
                gameCtx.lineTo(x + 24, y - 15);
                gameCtx.lineTo(x - 24, y - 15);
                gameCtx.closePath();
                gameCtx.fill();
                
                // Window details
                gameCtx.fillStyle = '#90A4AE';
                gameCtx.fillRect(x - 15, y - 10, 5, 5);
                gameCtx.fillRect(x + 10, y - 10, 5, 5);
                
                // Door
                gameCtx.fillStyle = '#5D4037';
                gameCtx.fillRect(x - 5, y, 10, 10);
                
                // Weapon rack
                gameCtx.strokeStyle = '#BDBDBD';
                gameCtx.lineWidth = 1;
                gameCtx.beginPath();
                gameCtx.moveTo(x + 15, y - 5);
                gameCtx.lineTo(x + 15, y + 5);
                gameCtx.moveTo(x + 12, y - 5);
                gameCtx.lineTo(x + 12, y + 5);
                gameCtx.stroke();
                break;
            
            case 'MILL':
                // Main mill structure
                const millGradient = gameCtx.createLinearGradient(x - 18, y - 15, x + 18, y + 10);
                millGradient.addColorStop(0, isEnemy ? '#A1887F' : '#8D6E63');
                millGradient.addColorStop(1, isEnemy ? '#6D4C41' : '#5D4037');
                
                gameCtx.fillStyle = millGradient;
                gameCtx.fillRect(x - 18, y - 15, 36, 25);
                
                // Roof
                const millRoofGradient = gameCtx.createLinearGradient(x - 22, y - 20, x + 22, y - 5);
                millRoofGradient.addColorStop(0, '#795548');
                millRoofGradient.addColorStop(1, '#4E342E');
                
                gameCtx.fillStyle = millRoofGradient;
                gameCtx.beginPath();
                gameCtx.moveTo(x - 22, y - 15);
                gameCtx.lineTo(x, y - 28);
                gameCtx.lineTo(x + 22, y - 15);
                gameCtx.closePath();
                gameCtx.fill();
                
                // Windmill blades
                gameCtx.save();
                gameCtx.translate(x, y - 40);
                gameCtx.rotate(Date.now() / 1000 % (Math.PI * 2)); // Rotating animation
                
                // Draw 4 blades
                for (let i = 0; i < 4; i++) {
                    gameCtx.save();
                    gameCtx.rotate(i * Math.PI / 2);
                    
                    // Blade
                    gameCtx.fillStyle = '#E0E0E0';
                    gameCtx.beginPath();
                    gameCtx.moveTo(0, 0);
                    gameCtx.lineTo(15, -3);
                    gameCtx.lineTo(15, 3);
                    gameCtx.closePath();
                    gameCtx.fill();
                    
                    gameCtx.restore();
                }
                
                // Center of blades
                gameCtx.fillStyle = '#757575';
                gameCtx.beginPath();
                gameCtx.arc(0, 0, 3, 0, Math.PI * 2);
                gameCtx.fill();
                
                gameCtx.restore();
                
                // Pole for windmill
                gameCtx.fillStyle = '#5D4037';
                gameCtx.fillRect(x - 2, y - 40, 4, 25);
                
                // Door
                gameCtx.fillStyle = '#3E2723';
                gameCtx.fillRect(x - 5, y + 5, 10, 10);
                
                // Windows
                gameCtx.fillStyle = '#B3E5FC';
                gameCtx.fillRect(x - 12, y - 8, 6, 6);
                gameCtx.fillRect(x + 6, y - 8, 6, 6);
                break;
                
            case 'TOWER':
                // Main tower structure
                const towerGradient = gameCtx.createLinearGradient(x - 15, y - 30, x + 15, y + 10);
                towerGradient.addColorStop(0, isEnemy ? '#757575' : '#BDBDBD');
                towerGradient.addColorStop(0.6, isEnemy ? '#616161' : '#9E9E9E');
                towerGradient.addColorStop(1, isEnemy ? '#424242' : '#757575');
                
                // Base
                gameCtx.fillStyle = towerGradient;
                gameCtx.fillRect(x - 15, y - 10, 30, 20);
                
                // Tower part
                gameCtx.fillRect(x - 12, y - 40, 24, 30);
                
                // Tower top with crenellations
                gameCtx.fillStyle = shadeColor(kingdomColor, -20);
                gameCtx.fillRect(x - 14, y - 44, 28, 4);
                
                for (let i = 0; i < 4; i++) {
                    gameCtx.fillRect(x - 12 + i * 8, y - 48, 4, 4);
                }
                
                // Windows/archer slots
                gameCtx.fillStyle = '#263238';
                gameCtx.fillRect(x - 8, y - 35, 4, 6);
                gameCtx.fillRect(x + 4, y - 35, 4, 6);
                gameCtx.fillRect(x - 8, y - 25, 4, 6);
                gameCtx.fillRect(x + 4, y - 25, 4, 6);
                
                // Door
                gameCtx.fillStyle = '#5D4037';
                gameCtx.beginPath();
                gameCtx.moveTo(x - 5, y + 10);
                gameCtx.lineTo(x - 5, y);
                gameCtx.lineTo(x + 5, y);
                gameCtx.lineTo(x + 5, y + 10);
                gameCtx.closePath();
                gameCtx.fill();
                
                // Flag on top
                gameCtx.fillStyle = kingdomColor;
                gameCtx.fillRect(x, y - 54, 1, 10);
                
                gameCtx.beginPath();
                gameCtx.moveTo(x + 1, y - 54);
                gameCtx.lineTo(x + 8, y - 52);
                gameCtx.lineTo(x + 1, y - 50);
                gameCtx.closePath();
                gameCtx.fill();
                break;
                
            case 'HOUSE':
            default:
                // House base with gradient
                const wallGradient = gameCtx.createLinearGradient(x - 18, y - 12, x + 18, y + 10);
                wallGradient.addColorStop(0, isEnemy ? '#A1887F' : '#D7CCC8');
                wallGradient.addColorStop(1, isEnemy ? '#6D4C41' : '#A1887F');
                
                gameCtx.fillStyle = wallGradient;
                gameCtx.fillRect(x - 18, y - 12, 36, 22);
                
                // Roof with kingdom color
                const houseRoofGradient = gameCtx.createLinearGradient(x - 22, y - 25, x + 22, y - 5);
                houseRoofGradient.addColorStop(0, kingdomColor);
                houseRoofGradient.addColorStop(1, shadeColor(kingdomColor, -30));
                
                gameCtx.fillStyle = houseRoofGradient;
                gameCtx.beginPath();
                gameCtx.moveTo(x - 22, y - 12);
                gameCtx.lineTo(x, y - 25);
                gameCtx.lineTo(x + 22, y - 12);
                gameCtx.closePath();
                gameCtx.fill();
                
                // Chimney
                gameCtx.fillStyle = '#8D6E63';
                gameCtx.fillRect(x + 10, y - 20, 6, 8);
                
                // Smoke (if active)
                if (Math.random() > 0.7) {
                    gameCtx.fillStyle = 'rgba(200, 200, 200, 0.5)';
                    gameCtx.beginPath();
                    gameCtx.arc(x + 13, y - 24, 2, 0, Math.PI * 2);
                    gameCtx.arc(x + 15, y - 27, 2.5, 0, Math.PI * 2);
                    gameCtx.arc(x + 13, y - 30, 3, 0, Math.PI * 2);
                    gameCtx.fill();
                }
                
                // Door
                gameCtx.fillStyle = '#5D4037';
                gameCtx.fillRect(x - 4, y, 8, 10);
                
                // Door handle
                gameCtx.fillStyle = '#FFD600';
                gameCtx.beginPath();
                gameCtx.arc(x + 2, y + 5, 1, 0, Math.PI * 2);
                gameCtx.fill();
                
                // Windows with shading
                gameCtx.fillStyle = '#B3E5FC';
                gameCtx.fillRect(x + 8, y - 8, 6, 6);
                gameCtx.fillRect(x - 14, y - 8, 6, 6);
                
                // Window frames
                gameCtx.strokeStyle = '#5D4037';
                gameCtx.lineWidth = 0.5;
                gameCtx.strokeRect(x + 8, y - 8, 6, 6);
                gameCtx.strokeRect(x - 14, y - 8, 6, 6);
                
                // Window dividers
                gameCtx.beginPath();
                gameCtx.moveTo(x + 11, y - 8);
                gameCtx.lineTo(x + 11, y - 2);
                gameCtx.moveTo(x + 8, y - 5);
                gameCtx.lineTo(x + 14, y - 5);
                
                gameCtx.moveTo(x - 11, y - 8);
                gameCtx.lineTo(x - 11, y - 2);
                gameCtx.moveTo(x - 14, y - 5);
                gameCtx.lineTo(x - 8, y - 5);
                gameCtx.stroke();
                break;
        }
    }
}

// Helper function to shade a color (positive amount brightens, negative darkens)
function shadeColor(color, percent) {
    let R = parseInt(color.substring(1, 3), 16);
    let G = parseInt(color.substring(3, 5), 16);
    let B = parseInt(color.substring(5, 7), 16);

    R = parseInt(R * (100 + percent) / 100);
    G = parseInt(G * (100 + percent) / 100);
    B = parseInt(B * (100 + percent) / 100);

    R = (R < 255) ? R : 255;
    G = (G < 255) ? G : 255;
    B = (B < 255) ? B : 255;

    R = (R > 0) ? R : 0;
    G = (G > 0) ? G : 0;
    B = (B > 0) ? B : 0;

    const RR = ((R.toString(16).length == 1) ? "0" + R.toString(16) : R.toString(16));
    const GG = ((G.toString(16).length == 1) ? "0" + G.toString(16) : G.toString(16));
    const BB = ((B.toString(16).length == 1) ? "0" + B.toString(16) : B.toString(16));

    return "#" + RR + GG + BB;
}

// Draw a wall segment
function drawWall(x, y, color, kingdomId) {
    // Use kingdom color
    const wallColor = kingdomId !== null ? KINGDOM_COLORS[kingdomId] : color;
    
    // Create shadow for 3D effect
    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    gameCtx.beginPath();
    gameCtx.ellipse(x, y + 8, 16, 5, 0, 0, Math.PI * 2);
    gameCtx.fill();
    
    // Main wall structure with gradient
    const wallGradient = gameCtx.createLinearGradient(x - 15, y - 12, x + 15, y + 6);
    wallGradient.addColorStop(0, '#A7A7A7');
    wallGradient.addColorStop(0.5, '#8c8c8c');
    wallGradient.addColorStop(1, '#6e6e6e');
    
    gameCtx.fillStyle = wallGradient;
    
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
    
    // Highlight on top edge
    gameCtx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    gameCtx.lineWidth = 1;
    gameCtx.beginPath();
    gameCtx.moveTo(x - 10, y - 12);
    gameCtx.lineTo(x + 10, y - 12);
    gameCtx.stroke();
    
    // Draw stone texture pattern
    gameCtx.strokeStyle = '#5a5a5a';
    gameCtx.lineWidth = 0.5;
    
    // Horizontal stone lines with slight irregularity
    for (let i = -8; i <= 4; i += 6) {
        gameCtx.beginPath();
        gameCtx.moveTo(x - 14, y + i);
        
        // Create wavy line effect for stone texture
        for (let j = -14; j <= 14; j += 2) {
            const variation = Math.random() * 0.8 - 0.4;
            gameCtx.lineTo(x + j, y + i + variation);
        }
        
        gameCtx.stroke();
    }
    
    // Draw vertical stone lines with irregularity
    for (let i = -12; i <= 12; i += 6) {
        const offset = (Math.random() * 2 - 1);
        gameCtx.beginPath();
        gameCtx.moveTo(x + i + offset, y - 12);
        
        // Create irregular vertical lines
        for (let j = -12; j <= 6; j += 2) {
            const variation = Math.random() * 0.6 - 0.3;
            gameCtx.lineTo(x + i + offset + variation, y + j);
        }
        
        gameCtx.stroke();
    }
    
    // Draw crenellations with kingdom color and gradient
    const creGradient = gameCtx.createLinearGradient(x - 12, y - 17, x + 12, y - 12);
    creGradient.addColorStop(0, wallColor);
    creGradient.addColorStop(1, shadeColor(wallColor, -30));
    
    gameCtx.fillStyle = creGradient;
    
    // Draw crenellations (battlements) on top of the wall
    for (let i = -9; i <= 9; i += 6) {
        gameCtx.fillRect(x + i - 2, y - 15, 4, 3);
    }
    
    // Slight outline
    gameCtx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    gameCtx.lineWidth = 0.5;
    gameCtx.beginPath();
    gameCtx.moveTo(x - 15, y);         // Left point
    gameCtx.lineTo(x - 10, y - 12);     // Top-left
    gameCtx.lineTo(x + 10, y - 12);     // Top-right
    gameCtx.lineTo(x + 15, y);         // Right point
    gameCtx.lineTo(x + 10, y + 6);     // Bottom-right
    gameCtx.lineTo(x - 10, y + 6);     // Bottom-left
    gameCtx.closePath();
    gameCtx.stroke();
}

// Draw player character
function drawPlayer(x, y) {
    // Draw shadow
    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    gameCtx.beginPath();
    gameCtx.ellipse(x, y + 12, 15, 5, 0, 0, Math.PI * 2);
    gameCtx.fill();
    
    // Body with gradient for depth
    const bodyGradient = gameCtx.createLinearGradient(x - 8, y - 15, x + 8, y + 5);
    bodyGradient.addColorStop(0, '#1976D2');
    bodyGradient.addColorStop(0.7, '#0D47A1');
    bodyGradient.addColorStop(1, '#0D47A1');
    
    gameCtx.fillStyle = bodyGradient;
    gameCtx.beginPath();
    gameCtx.moveTo(x, y - 5);
    gameCtx.lineTo(x + 8, y + 5);
    gameCtx.lineTo(x - 8, y + 5);
    gameCtx.closePath();
    gameCtx.fill();
    
    // Armor plate with metallic gradient
    const armorGradient = gameCtx.createLinearGradient(x - 6, y - 12, x + 6, y - 3);
    armorGradient.addColorStop(0, '#2962FF');
    armorGradient.addColorStop(0.5, '#82B1FF');
    armorGradient.addColorStop(1, '#2962FF');
    
    gameCtx.fillStyle = armorGradient;
    gameCtx.beginPath();
    gameCtx.moveTo(x, y - 15);
    gameCtx.lineTo(x + 6, y - 5);
    gameCtx.lineTo(x - 6, y - 5);
    gameCtx.closePath();
    gameCtx.fill();
    
    // Head
    gameCtx.fillStyle = '#FFD54F';
    gameCtx.beginPath();
    gameCtx.arc(x, y - 20, 6, 0, Math.PI * 2);
    gameCtx.fill();
    
    // Arms
    gameCtx.fillStyle = '#1565C0';
    gameCtx.beginPath();
    gameCtx.moveTo(x - 5, y - 10);
    gameCtx.lineTo(x - 12, y - 5);
    gameCtx.lineTo(x - 10, y - 2);
    gameCtx.lineTo(x - 3, y - 7);
    gameCtx.closePath();
    gameCtx.fill();
    
    gameCtx.beginPath();
    gameCtx.moveTo(x + 5, y - 10);
    gameCtx.lineTo(x + 12, y - 5);
    gameCtx.lineTo(x + 10, y - 2);
    gameCtx.lineTo(x + 3, y - 7);
    gameCtx.closePath();
    gameCtx.fill();
    
    // Shield or weapon based on age/technology
    if (gameState.currentAge >= 1) {
        // Shield
        const shieldGradient = gameCtx.createLinearGradient(x - 15, y - 10, x - 5, y);
        shieldGradient.addColorStop(0, '#EF5350');
        shieldGradient.addColorStop(1, '#B71C1C');
        
        gameCtx.fillStyle = shieldGradient;
        gameCtx.beginPath();
        gameCtx.moveTo(x - 14, y - 10);
        gameCtx.lineTo(x - 16, y - 5);
        gameCtx.lineTo(x - 14, y);
        gameCtx.lineTo(x - 10, y - 2);
        gameCtx.lineTo(x - 10, y - 8);
        gameCtx.closePath();
        gameCtx.fill();
        
        // Shield emblem
        gameCtx.fillStyle = '#FFD54F';
        gameCtx.beginPath();
        gameCtx.arc(x - 13, y - 5, 2, 0, Math.PI * 2);
        gameCtx.fill();
    }
    
    if (gameState.currentAge >= 2) {
        // Sword
        gameCtx.fillStyle = '#BDBDBD';
        gameCtx.beginPath();
        gameCtx.moveTo(x + 14, y - 12);
        gameCtx.lineTo(x + 16, y - 5);
        gameCtx.lineTo(x + 14, y - 3);
        gameCtx.lineTo(x + 12, y - 10);
        gameCtx.closePath();
        gameCtx.fill();
        
        // Sword handle
        gameCtx.fillStyle = '#5D4037';
        gameCtx.fillRect(x + 13, y - 3, 2, 4);
    }
    
    // Add a subtle outline
    gameCtx.strokeStyle = '#000000';
    gameCtx.lineWidth = 0.5;
    
    // Outline body
    gameCtx.beginPath();
    gameCtx.moveTo(x, y - 5);
    gameCtx.lineTo(x + 8, y + 5);
    gameCtx.lineTo(x - 8, y + 5);
    gameCtx.closePath();
    gameCtx.stroke();
    
    // Outline armor
    gameCtx.beginPath();
    gameCtx.moveTo(x, y - 15);
    gameCtx.lineTo(x + 6, y - 5);
    gameCtx.lineTo(x - 6, y - 5);
    gameCtx.closePath();
    gameCtx.stroke();
    
    // Outline head
    gameCtx.beginPath();
    gameCtx.arc(x, y - 20, 6, 0, Math.PI * 2);
    gameCtx.stroke();
    
    // Face features
    gameCtx.fillStyle = '#000';
    gameCtx.beginPath();
    gameCtx.arc(x - 2, y - 21, 1, 0, Math.PI * 2); // Left eye
    gameCtx.arc(x + 2, y - 21, 1, 0, Math.PI * 2); // Right eye
    gameCtx.fill();
    
    // Animation effect - slight up and down bobbing
    if (gameState.playerMoving) {
        const bobAmount = Math.sin(Date.now() / 150) * 2;
        gameCtx.translate(0, bobAmount);
        // Reset translation after drawing
        gameCtx.translate(0, -bobAmount);
    }
    
    // Health bar
    const healthPercent = gameState.player.health / gameState.player.maxHealth;
    const barWidth = 30;
    const barHeight = 4;
    
    // Background
    gameCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    gameCtx.fillRect(x - barWidth / 2, y - 30, barWidth, barHeight);
    
    // Health amount with color based on health percentage
    let healthColor;
    if (healthPercent > 0.7) {
        healthColor = '#4CAF50'; // Green for good health
    } else if (healthPercent > 0.3) {
        healthColor = '#FFC107'; // Yellow for medium health
    } else {
        healthColor = '#F44336'; // Red for low health
    }
    
    gameCtx.fillStyle = healthColor;
    gameCtx.fillRect(x - barWidth / 2, y - 30, barWidth * healthPercent, barHeight);
}

// Draw enemy
function drawEnemy(x, y, enemyType, health, kingdomId) {
    const enemyInfo = ENEMY_TYPES[enemyType];
    
    // Get enemies on this tile
    const enemiesOnTile = gameState.enemies.filter(e => e.x === Math.floor(x) && e.y === Math.floor(y));
    const enemyCount = enemiesOnTile.length;
    
    // If multiple enemies on tile, draw differently
    if (enemyCount > 1) {
        // Calculate total health
        let totalHealth = 0;
        let maxPossibleHealth = 0;
        
        for (const e of enemiesOnTile) {
            totalHealth += e.health;
            maxPossibleHealth += ENEMY_TYPES[e.type].health;
        }
        
        // Draw shadow
        gameCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        gameCtx.beginPath();
        gameCtx.ellipse(x, y + 8, 15, 5, 0, 0, Math.PI * 2);
        gameCtx.fill();
        
        // Draw group indicator with kingdom color
        const kingdomColor = KINGDOM_COLORS[kingdomId] || enemyInfo.color;
        const groupGradient = gameCtx.createRadialGradient(x, y - 5, 0, x, y - 5, 12);
        groupGradient.addColorStop(0, lightenColor(kingdomColor, 20));
        groupGradient.addColorStop(1, darkenColor(kingdomColor, 20));
        
        gameCtx.fillStyle = groupGradient;
        gameCtx.beginPath();
        gameCtx.arc(x, y - 5, 12, 0, Math.PI * 2);
        gameCtx.fill();
        
        // Draw outline
        gameCtx.strokeStyle = '#000000';
        gameCtx.lineWidth = 1;
        gameCtx.stroke();
        
        // Draw count with glow effect
        gameCtx.fillStyle = '#FFFFFF';
        gameCtx.font = 'bold 12px Arial';
        gameCtx.textAlign = 'center';
        gameCtx.textBaseline = 'middle';
        
        // Text shadow for better visibility
        gameCtx.shadowColor = '#000000';
        gameCtx.shadowBlur = 4;
        gameCtx.shadowOffsetX = 0;
        gameCtx.shadowOffsetY = 0;
        
        gameCtx.fillText(enemyCount.toString(), x, y - 5);
        
        // Reset shadow
        gameCtx.shadowBlur = 0;
        
        // Draw health bar
        const healthPercent = totalHealth / maxPossibleHealth;
        const barWidth = 30;
        const barHeight = 4;
        
        // Background
        gameCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        gameCtx.fillRect(x - barWidth/2, y - 22, barWidth, barHeight);
        
        // Health amount
        let healthColor;
        if (healthPercent > 0.7) {
            healthColor = '#4CAF50'; // Green for good health
        } else if (healthPercent > 0.3) {
            healthColor = '#FFC107'; // Yellow for medium health
        } else {
            healthColor = '#F44336'; // Red for low health
        }
        
        gameCtx.fillStyle = healthColor;
        gameCtx.fillRect(x - barWidth/2, y - 22, barWidth * healthPercent, barHeight);
    } else {
        // Draw shadow
        gameCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        gameCtx.beginPath();
        gameCtx.ellipse(x, y + 10, 12, 4, 0, 0, Math.PI * 2);
        gameCtx.fill();
        
        // Kingdom color based on enemy's kingdom
        const kingdomColor = KINGDOM_COLORS[kingdomId] || enemyInfo.color;
        
        // For warriors vs archers, draw differently
        if (enemyType === 'WARRIOR') {
            // Body with gradient
            const bodyGradient = gameCtx.createLinearGradient(x - 8, y - 12, x + 8, y + 5);
            bodyGradient.addColorStop(0, lightenColor(kingdomColor, 10));
            bodyGradient.addColorStop(0.7, kingdomColor);
            bodyGradient.addColorStop(1, darkenColor(kingdomColor, 20));
            
            gameCtx.fillStyle = bodyGradient;
            gameCtx.beginPath();
            gameCtx.moveTo(x, y - 5);
            gameCtx.lineTo(x + 7, y + 5);
            gameCtx.lineTo(x - 7, y + 5);
            gameCtx.closePath();
            gameCtx.fill();
            
            // Chest plate/armor
            const armorGradient = gameCtx.createLinearGradient(x - 6, y - 15, x + 6, y - 3);
            armorGradient.addColorStop(0, lightenColor(kingdomColor, 20));
            armorGradient.addColorStop(0.5, '#AAAAAA');
            armorGradient.addColorStop(1, darkenColor(kingdomColor, 10));
            
            gameCtx.fillStyle = armorGradient;
            gameCtx.beginPath();
            gameCtx.moveTo(x, y - 12);
            gameCtx.lineTo(x + 5, y - 4);
            gameCtx.lineTo(x - 5, y - 4);
            gameCtx.closePath();
            gameCtx.fill();
            
            // Head
            gameCtx.fillStyle = '#FFD54F';
            gameCtx.beginPath();
            gameCtx.arc(x, y - 17, 5, 0, Math.PI * 2);
            gameCtx.fill();
            
            // Helmet
            gameCtx.fillStyle = darkenColor(kingdomColor, 30);
            gameCtx.beginPath();
            gameCtx.arc(x, y - 19, 3, 0, Math.PI, true);
            gameCtx.fill();
            
            // Sword
            gameCtx.fillStyle = '#BDBDBD';
            gameCtx.beginPath();
            gameCtx.moveTo(x + 9, y - 8);
            gameCtx.lineTo(x + 15, y - 15);
            gameCtx.lineTo(x + 13, y - 17);
            gameCtx.lineTo(x + 7, y - 10);
            gameCtx.closePath();
            gameCtx.fill();
            
            // Sword handle
            gameCtx.fillStyle = '#5D4037';
            gameCtx.fillRect(x + 6, y - 6, 3, 4);
            
        } else if (enemyType === 'ARCHER') {
            // Archer body with lighter appearance
            const bodyGradient = gameCtx.createLinearGradient(x - 8, y - 12, x + 8, y + 5);
            bodyGradient.addColorStop(0, lightenColor(kingdomColor, 15));
            bodyGradient.addColorStop(0.7, kingdomColor);
            bodyGradient.addColorStop(1, darkenColor(kingdomColor, 15));
            
            gameCtx.fillStyle = bodyGradient;
            gameCtx.beginPath();
            gameCtx.moveTo(x, y - 5);
            gameCtx.lineTo(x + 6, y + 5);
            gameCtx.lineTo(x - 6, y + 5);
            gameCtx.closePath();
            gameCtx.fill();
            
            // Lighter clothing
            gameCtx.fillStyle = lightenColor(kingdomColor, 30);
            gameCtx.beginPath();
            gameCtx.moveTo(x, y - 12);
            gameCtx.lineTo(x + 4, y - 4);
            gameCtx.lineTo(x - 4, y - 4);
            gameCtx.closePath();
            gameCtx.fill();
            
            // Head
            gameCtx.fillStyle = '#FFD54F';
            gameCtx.beginPath();
            gameCtx.arc(x, y - 17, 5, 0, Math.PI * 2);
            gameCtx.fill();
            
            // Hood
            gameCtx.fillStyle = darkenColor(kingdomColor, 20);
            gameCtx.beginPath();
            gameCtx.arc(x, y - 17, 5, 0, Math.PI, true);
            gameCtx.closePath();
            gameCtx.fill();
            
            // Bow
            gameCtx.strokeStyle = '#5D4037';
            gameCtx.lineWidth = 1.5;
            gameCtx.beginPath();
            gameCtx.arc(x + 10, y - 10, 8, -Math.PI/3, Math.PI/3);
            gameCtx.stroke();
            
            // Bow string
            gameCtx.strokeStyle = '#E0E0E0';
            gameCtx.lineWidth = 0.5;
            gameCtx.beginPath();
            gameCtx.moveTo(x + 10 + 8 * Math.cos(-Math.PI/3), y - 10 + 8 * Math.sin(-Math.PI/3));
            gameCtx.lineTo(x + 10 + 8 * Math.cos(Math.PI/3), y - 10 + 8 * Math.sin(Math.PI/3));
            gameCtx.stroke();
            
            // Arrow
            gameCtx.strokeStyle = '#795548';
            gameCtx.lineWidth = 1;
            gameCtx.beginPath();
            gameCtx.moveTo(x + 6, y - 10);
            gameCtx.lineTo(x + 14, y - 10);
            gameCtx.stroke();
            
            // Arrow head
            gameCtx.fillStyle = '#BDBDBD';
            gameCtx.beginPath();
            gameCtx.moveTo(x + 14, y - 10);
            gameCtx.lineTo(x + 17, y - 12);
            gameCtx.lineTo(x + 17, y - 8);
            gameCtx.closePath();
            gameCtx.fill();
        }
        
        // Face features
        gameCtx.fillStyle = '#000';
        gameCtx.beginPath();
        gameCtx.arc(x - 2, y - 18, 1, 0, Math.PI * 2); // Left eye
        gameCtx.arc(x + 2, y - 18, 1, 0, Math.PI * 2); // Right eye
        gameCtx.fill();
        
        // Add a subtle outline
        gameCtx.strokeStyle = '#000000';
        gameCtx.lineWidth = 0.5;
        gameCtx.beginPath();
        gameCtx.arc(x, y - 17, 5, 0, Math.PI * 2);
        gameCtx.stroke();
        
        // Health bar
        const healthPercent = health / enemyInfo.health;
        const barWidth = 25;
        const barHeight = 3;
        
        // Background
        gameCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        gameCtx.fillRect(x - barWidth/2, y - 27, barWidth, barHeight);
        
        // Health amount
        let healthColor;
        if (healthPercent > 0.7) {
            healthColor = '#4CAF50'; // Green for good health
        } else if (healthPercent > 0.3) {
            healthColor = '#FFC107'; // Yellow for medium health
        } else {
            healthColor = '#F44336'; // Red for low health
        }
        
        gameCtx.fillStyle = healthColor;
        gameCtx.fillRect(x - barWidth/2, y - 27, barWidth * healthPercent, barHeight);
    }
}

// Helper functions for colors
function lightenColor(color, percent) {
    return shadeColor(color, percent);
}

function darkenColor(color, percent) {
    return shadeColor(color, -percent);
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
    
    // Draw background
    const mapBackground = minimapCtx.createLinearGradient(0, 0, minimapCanvas.width, minimapCanvas.height);
    mapBackground.addColorStop(0, '#234723');
    mapBackground.addColorStop(1, '#1B5E20');
    
    minimapCtx.fillStyle = mapBackground;
    minimapCtx.fillRect(0, 0, minimapCanvas.width, minimapCanvas.height);
    
    // Calculate tile size on minimap
    const tileSize = minimapCanvas.width / MAP_SIZE;
    
    // Draw territories with soft borders
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = gameState.map[y][x];
            
            if (tile.territory !== null) {
                const territoryColor = KINGDOM_COLORS[tile.territory];
                
                // Make territory colors semi-transparent for better appearance
                minimapCtx.fillStyle = hexToRgba(territoryColor, 0.4);
                minimapCtx.fillRect(
                    x * tileSize,
                    y * tileSize,
                    tileSize,
                    tileSize
                );
                
                // If it's a capital, mark it with a special indicator
                if (tile.isCapital) {
                    minimapCtx.fillStyle = hexToRgba(territoryColor, 0.9);
                    minimapCtx.beginPath();
                    minimapCtx.arc(
                        x * tileSize + tileSize/2,
                        y * tileSize + tileSize/2,
                        tileSize * 1.5, 0, Math.PI * 2
                    );
                    minimapCtx.fill();
                }
            }
        }
    }
    
    // Draw terrain features with dot patterns
    for (let y = 0; y < MAP_SIZE; y += 2) {
        for (let x = 0; x < MAP_SIZE; x += 2) {
            const tile = gameState.map[y][x];
            
            // Draw resources with distinct colors
            if (tile.resource) {
                let resourceColor;
                switch (tile.resource) {
                    case 'TREE':
                        resourceColor = '#2E7D32';
                        break;
                    case 'STONE':
                        resourceColor = '#78909C';
                        break;
                    case 'BERRY':
                        resourceColor = '#C2185B';
                        break;
                }
                
                minimapCtx.fillStyle = resourceColor;
                minimapCtx.beginPath();
                minimapCtx.rect(
                    x * tileSize,
                    y * tileSize,
                    tileSize,
                    tileSize
                );
                minimapCtx.fill();
            }
            
            // Show buildings with brighter dots
            if (tile.building && !tile.isWall) {
                const buildingColor = tile.territory !== null ? 
                    KINGDOM_COLORS[tile.territory] : '#FFFFFF';
                
                minimapCtx.fillStyle = buildingColor;
                minimapCtx.beginPath();
                minimapCtx.arc(
                    x * tileSize + tileSize/2,
                    y * tileSize + tileSize/2,
                    tileSize * 0.8, 0, Math.PI * 2
                );
                minimapCtx.fill();
            }
        }
    }
    
    // Draw walls with distinct line style
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = gameState.map[y][x];
            
            if (tile.isWall) {
                const wallColor = tile.territory !== null ? 
                    KINGDOM_COLORS[tile.territory] : '#FFFFFF';
                
                minimapCtx.fillStyle = wallColor;
                minimapCtx.fillRect(
                    x * tileSize,
                    y * tileSize,
                    tileSize,
                    tileSize
                );
            }
        }
    }
    
    // Draw enemies on minimap with pulsing effect
    const now = Date.now();
    for (const enemy of gameState.enemies) {
        // Create pulsing effect for enemies
        const pulseSize = 0.7 + Math.sin(now / 300) * 0.3;
        
        minimapCtx.fillStyle = KINGDOM_COLORS[enemy.kingdomId];
        minimapCtx.beginPath();
        minimapCtx.arc(
            enemy.x * tileSize + tileSize/2,
            enemy.y * tileSize + tileSize/2,
            tileSize * pulseSize, 0, Math.PI * 2
        );
        minimapCtx.fill();
        
        // Add enemy outline
        minimapCtx.strokeStyle = '#000';
        minimapCtx.lineWidth = 0.5;
        minimapCtx.stroke();
    }
    
    // Draw soldiers on minimap
    for (const soldier of gameState.soldiers) {
        minimapCtx.fillStyle = '#3F51B5'; // Blue for soldiers
        minimapCtx.beginPath();
        minimapCtx.arc(
            soldier.x * tileSize + tileSize/2,
            soldier.y * tileSize + tileSize/2,
            tileSize * 0.6, 0, Math.PI * 2
        );
        minimapCtx.fill();
    }
    
    // Draw camera viewport rectangle with animated dash effect
    minimapCtx.strokeStyle = '#FFFFFF';
    minimapCtx.lineWidth = 2;
    minimapCtx.setLineDash([4, 2]);
    minimapCtx.lineDashOffset = -now / 100; // Animate the dash pattern
    
    minimapCtx.strokeRect(
        gameState.camera.x * tileSize,
        gameState.camera.y * tileSize,
        VISIBLE_TILES * tileSize,
        VISIBLE_TILES * tileSize
    );
    
    // Reset line dash
    minimapCtx.setLineDash([]);
    
    // Draw player position with glowing effect
    const glowSize = 1.2 + Math.sin(now / 500) * 0.3;
    
    // Outer glow
    const gradient = minimapCtx.createRadialGradient(
        gameState.player.x * tileSize + tileSize/2,
        gameState.player.y * tileSize + tileSize/2,
        0,
        gameState.player.x * tileSize + tileSize/2,
        gameState.player.y * tileSize + tileSize/2,
        tileSize * 2.5 * glowSize
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    
    minimapCtx.fillStyle = gradient;
    minimapCtx.beginPath();
    minimapCtx.arc(
        gameState.player.x * tileSize + tileSize/2,
        gameState.player.y * tileSize + tileSize/2,
        tileSize * 2.5 * glowSize, 0, Math.PI * 2
    );
    minimapCtx.fill();
    
    // Inner player marker
    minimapCtx.fillStyle = '#FF5252';
    minimapCtx.beginPath();
    minimapCtx.arc(
        gameState.player.x * tileSize + tileSize/2,
        gameState.player.y * tileSize + tileSize/2,
        tileSize * 1.2, 0, Math.PI * 2
    );
    minimapCtx.fill();
    
    // Add a white border
    minimapCtx.strokeStyle = '#FFFFFF';
    minimapCtx.lineWidth = 1;
    minimapCtx.stroke();
}

// Helper function to convert hex color to rgba
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
    
    // Ensure player health is a valid number and capped between 0-100
    if (isNaN(gameState.player.health)) {
        gameState.player.health = 100;
    }
    
    // Ensure player has a maxHealth property
    if (!gameState.player.maxHealth) {
        gameState.player.maxHealth = 100;
    }
    
    // Cap health at maxHealth
    gameState.player.health = Math.max(0, Math.min(gameState.player.maxHealth, gameState.player.health));
    
    // Update health display with actual maxHealth
    document.getElementById('player-health').textContent = `${Math.floor(gameState.player.health)}/${gameState.player.maxHealth}`;
    
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
    
    // Convert screen coordinates to isometric coordinates
    const clickedTile = screenToIso(mouseX, mouseY);
    
    // Add debug click for development
    addDebugClick(mouseX, mouseY, clickedTile.x, clickedTile.y);
    
    if (clickedTile.x < 0 || clickedTile.x >= MAP_SIZE || 
        clickedTile.y < 0 || clickedTile.y >= MAP_SIZE) {
        return;
    }
    
    // Store selected tile
    gameState.selectedTile = clickedTile;
    
    // Get the clicked map tile
    const tile = gameState.map[clickedTile.y][clickedTile.x];
    
    // Check if clicked on own wall with shift key
    const clickedWall = gameState.buildings.find(b => 
        b.x === clickedTile.x && b.y === clickedTile.y && b.type === 'WALL');
        
    if (clickedWall && tile.territory === 0 && event.shiftKey) {
            // Destroy the wall if shift key is pressed
            destroyPlayerWall(clickedWall, clickedTile.x, clickedTile.y);
            return;
    }
    
    // If tile has a building and it's an enemy building, try to attack it
    if (tile.building && tile.territory !== 0) {
        if (tile.isWall) {
            // Check if player is adjacent to the wall
            const dx = Math.abs(gameState.player.x - clickedTile.x);
            const dy = Math.abs(gameState.player.y - clickedTile.y);
            
            if (dx <= 1 && dy <= 1) {
                // Player is adjacent to the wall, can attack
        attackEnemyBuilding(clickedTile.x, clickedTile.y);
        return;
            } else {
                showMessage("You need to be adjacent to a wall to attack it!");
                return;
            }
        } else {
            // For other buildings, check if player is within reasonable range
            const distance = Math.sqrt(
                Math.pow(gameState.player.x - clickedTile.x, 2) + 
                Math.pow(gameState.player.y - clickedTile.y, 2)
            );
            
            if (distance <= 3) { // Allow attacking from 3 tiles away
                attackEnemyBuilding(clickedTile.x, clickedTile.y);
                return;
            } else {
                showMessage("Move closer to attack this building!");
                return;
            }
        }
    }
    
    // Process the click for movement using existing handleCanvasTouch for mobile compatibility
    handleCanvasTouch(mouseX, mouseY);
}

// Destroy player's wall when clicked with Shift key
function destroyPlayerWall(wall, x, y) {
    // Remove the wall from buildings array
    const wallIndex = gameState.buildings.indexOf(wall);
    if (wallIndex !== -1) {
        gameState.buildings.splice(wallIndex, 1);
    }
    
    // Clear the wall from the map
    const tile = gameState.map[y][x];
    tile.building = null;
    tile.isWall = false;
    
    // Remove from kingdom wall perimeter
    const playerKingdom = gameState.kingdoms[0];
    const perimeterIndex = playerKingdom.wallPerimeter.findIndex(w => w.x === x && w.y === y);
    if (perimeterIndex !== -1) {
        playerKingdom.wallPerimeter.splice(perimeterIndex, 1);
    }
    
    // Give back some resources (half the cost)
    gameState.resources.wood += Math.floor(BUILDING_TYPES.WALL.woodCost / 2);
    gameState.resources.stone += Math.floor(BUILDING_TYPES.WALL.stoneCost / 2);
    
    // Show message
    showMessage(`Wall at (${x}, ${y}) destroyed. Recovered some resources.`);
    
    // Update UI
    updateUI();
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

// Build a structure
function buildStructure(buildingType, callback) {
    if (!gameState.selectedTile) {
        showMessage('First select a tile where you want to build!');
        return;
    }
    
    const tile = gameState.map[gameState.selectedTile.y][gameState.selectedTile.x];
    const building = BUILDING_TYPES[buildingType];
    
    // Check if there's already a building or resource
    if (tile.building || tile.resource) {
        showMessage('Cannot build here - the area is occupied!');
        return;
    }
    
    // Check if tile is part of player's territory
    if (tile.territory !== 0) {
        showMessage('You can only build within your territory!');
        return;
    }
    
    // NEW: Check if the tile is inside a walled enclosure
    // We'll use a flood fill to see if we can reach the edge of the map
    const isEnclosed = !canReachMapEdge(gameState.selectedTile.x, gameState.selectedTile.y, 0);
    if (!isEnclosed) {
        showMessage('You can only build within your walled territory!');
        return;
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
        // Play build sound
        const buildSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA');
        buildSound.volume = 0.3;
        buildSound.play().catch(() => {});
        
        // Deduct resources
        gameState.resources.wood -= building.woodCost;
        gameState.resources.stone -= building.stoneCost;
        gameState.resources.food -= building.foodCost;
        
        // Place building
        tile.building = buildingType;
        
        // Add to buildings list
        const newBuilding = {
            type: buildingType,
            x: gameState.selectedTile.x,
            y: gameState.selectedTile.y,
            health: building.maxHealth,
            id: Date.now() + Math.floor(Math.random() * 1000)
        };
        
        // Special properties for buildings
        if (buildingType === 'BARRACKS') {
            newBuilding.training = false;
            newBuilding.progress = 0;
        }
        
        // Add building
        gameState.buildings.push(newBuilding);
        
        // If it's a house, increase population cap
        if (buildingType === 'HOUSE') {
            gameState.populationCap += 5;
        }
        
        // Show success message
        showMessage(`${buildingType} built successfully!`);
        
        // Update UI
        updateUI();
        
        // Update military stats for new buildings
        updateMilitaryStats();
        
        // Call the callback if provided (for specific building effects)
        if (callback) callback(newBuilding);
    } else {
        // Calculate what resources are missing
        const missingResources = [];
        if (gameState.resources.wood < building.woodCost) {
            missingResources.push(`${building.woodCost - Math.floor(gameState.resources.wood)} wood`);
        }
        if (gameState.resources.stone < building.stoneCost) {
            missingResources.push(`${building.stoneCost - Math.floor(gameState.resources.stone)} stone`);
        }
        if (gameState.resources.food < building.foodCost) {
            missingResources.push(`${building.foodCost - Math.floor(gameState.resources.food)} food`);
        }
        
        showMessage(`Not enough resources to build ${buildingType}! Need: ${missingResources.join(', ')}.`);
    }
}

// Check if a position can reach the edge of the map (not enclosed by walls)
function canReachMapEdge(startX, startY, kingdomId) {
    const kingdom = gameState.kingdoms[kingdomId];
    
    // Get wall coordinates for the kingdom
    const wallCoords = new Set();
    for (const wall of kingdom.wallPerimeter) {
        wallCoords.add(`${wall.x},${wall.y}`);
    }
    
    // Create a visited set
    const visited = new Set([`${startX},${startY}`]);
    const queue = [{x: startX, y: startY}];
    
    // Directions for flood fill
    const directions = [
        {dx: 1, dy: 0},
        {dx: -1, dy: 0},
        {dx: 0, dy: 1},
        {dx: 0, dy: -1}
    ];
    
    // Flood fill from the starting position
    while (queue.length > 0) {
        const {x, y} = queue.shift();
        
        // Check if reached the edge of the map
        if (x === 0 || x === MAP_SIZE - 1 || y === 0 || y === MAP_SIZE - 1) {
            return true;
        }
        
        for (const {dx, dy} of directions) {
            const nx = x + dx;
            const ny = y + dy;
            const coordKey = `${nx},${ny}`;
            
            // If in bounds, not visited, and not a wall
            if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE && 
                !visited.has(coordKey) && !wallCoords.has(coordKey)) {
                
                visited.add(coordKey);
                queue.push({x: nx, y: ny});
            }
        }
    }
    
    // If we exhausted the queue and never reached the edge, the position is enclosed
    return false;
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

// Move player in a specific direction
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
    
    // Calculate new position
    const newX = gameState.player.x + actualDx;
    const newY = gameState.player.y + actualDy;
    
    // Check if new position is within map bounds
    if (newX >= 0 && newX < MAP_SIZE && newY >= 0 && newY < MAP_SIZE) {
        const targetTile = gameState.map[newY][newX];
        
        // Check for collisions with buildings or enemy walls
        if (targetTile.building) {
            // Check if it's a wall
            if (targetTile.isWall) {
                // If it's an enemy wall, don't allow movement but enable attack
                if (targetTile.territory !== 0) {
                    // Show message to attack the wall
                    showMessage("Enemy wall detected! Click to attack.");
                    
                    // Direction indicator
                    showDirectionIndicator(actualDx, actualDy);
                    
                    // Don't move the player
                    return;
                }
                // Player walls can still be passed through
            } else if (targetTile.territory !== 0) {
                // Other enemy buildings can't be moved onto
                showDirectionIndicator(actualDx, actualDy);
                return;
            }
        }
        
        // Update player position
        gameState.player.x = newX;
        gameState.player.y = newY;
        
        // Update selected tile to match player position
        gameState.selectedTile = {
            x: newX,
            y: newY
        };
        
        // Check for resource gathering
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
        
        // Show movement direction indicator
        showDirectionIndicator(actualDx, actualDy);
        
        // Update soldier positions (they follow the player)
        updateSoldierPositions();
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
    
    // Update enemies
    updateEnemies(deltaTime);
    
    // Update enemy kingdoms (gathering resources, building, expanding)
    updateEnemyKingdoms(deltaTime);
    
    // Decrease combat cooldown if active
    if (gameState.combatCooldown > 0) {
        gameState.combatCooldown = Math.max(0, gameState.combatCooldown - deltaTime);
    }
    
    // Update soldier positions
    updateSoldierPositions();
    
    // Update military stats
    updateMilitaryStats();
    updateMilitaryUI();
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
        // Check if this enemy is in gathering mode, handle separately
        if (enemy.isGathering || enemy.returningToCapital) {
            updateEnemyGathering(enemy, deltaTime);
            continue;
        }
        
        // Add elapsed time to enemy's last moved time
        enemy.lastMoved += deltaTime;
        
        // Only move if enough time has passed
        if (enemy.lastMoved > enemy.moveDelay) {
            enemy.lastMoved = 0;
            
            // Get the enemy's kingdom for territory checking
            const kingdom = gameState.kingdoms[enemy.kingdomId];
            
            // Handle attack path following for enemies targeting the player
            if (enemy.attackPath && enemy.attackPath.length > 0 && enemy.attackPathIndex < enemy.attackPath.length) {
                const nextPos = enemy.attackPath[enemy.attackPathIndex];
                const nextTile = gameState.map[nextPos.y][nextPos.x];
                
                // Only move to next position if it's not blocked by a building
                if (!nextTile.building || (nextTile.territory === enemy.kingdomId)) {
                    enemy.x = nextPos.x;
                    enemy.y = nextPos.y;
                    enemy.attackPathIndex++;
                    
                    // Check if enemy is adjacent to player and can attack
                    const dx = Math.abs(enemy.x - gameState.player.x);
                    const dy = Math.abs(enemy.y - gameState.player.y);
                    
                    if (dx <= 1 && dy <= 1) {
                        // Enemy attacks player
                        enemyAttackPlayer(enemy);
                        
                        // Clear attack path after reaching player
                        enemy.attackPath = null;
                        enemy.attackPathIndex = 0;
                    }
                } else {
                    // Path is blocked, create a new path or default to standard behavior
                    enemy.attackPath = null;
                    enemy.attackPathIndex = 0;
                }
                
                continue; // Skip normal movement logic when following attack path
            }
            
            // Calculate distance to player
            const distToPlayer = Math.sqrt(
                Math.pow(enemy.x - gameState.player.x, 2) + 
                Math.pow(enemy.y - gameState.player.y, 2)
            );
            
            let moveX = 0;
            let moveY = 0;
            
            // Enemy becomes aggressive based on several factors
            const baseAggressionDistance = 15; // Distance at which normal enemies become aggressive
            
            // Make enemies more likely to become aggressive as game progresses
            const gameTime = gameState.gameTime / (60 * 1000);
            const timeBasedAggressionBonus = Math.min(10, gameTime / 2); // Up to 10 bonus tiles of awareness
            
            // Soldiers from barracks are naturally more aggressive (higher awareness range)
            const soldierAwarenessBonus = enemy.type && (enemy.type === 'WARRIOR' || enemy.type === 'ARCHER') ? 10 : 0;
            
            // Calculate final aggression distance
            const finalAggressionDistance = baseAggressionDistance + timeBasedAggressionBonus + soldierAwarenessBonus;
            
            // Check if enemy is significantly weaker than player and should flee
            const shouldFlee = distToPlayer < finalAggressionDistance && calculateRelativeStrength(enemy) < 0.8;
            
            if (shouldFlee) {
                // Enemy is weaker and should flee
                enemy.isFleeing = true;
                enemy.isAggressive = false;
                enemy.attackPath = null;
                
                // Move away from player
                moveX = enemy.x > gameState.player.x ? 1 : (enemy.x < gameState.player.x ? -1 : 0);
                moveY = enemy.y > gameState.player.y ? 1 : (enemy.y < gameState.player.y ? -1 : 0);
                
                // Move faster when fleeing
                if (Math.random() < 0.3) {
                    enemy.lastMoved = -enemy.moveDelay * 0.3;
                }
            } else if (!enemy.isAggressive) {
                // Reset fleeing status if not close to player
                enemy.isFleeing = false;
                
                // Check if player is within aggression range or enemy was set to target player
                if (distToPlayer < finalAggressionDistance || enemy.isTargetingPlayer) {
                    enemy.isAggressive = true;
                    
                    // Soldiers have a chance to create a direct path to player when activated
                    if ((enemy.type === 'WARRIOR' || enemy.type === 'ARCHER') && Math.random() < 0.7) {
                        createEnemyAttackPath(enemy);
                    }
                }
                
                // Also small random chance to become aggressive regardless of distance
                if (Math.random() < 0.01) {
                    enemy.isAggressive = true;
                }
            }
            
            // If aggressive and not fleeing, target player
            if (enemy.isAggressive && !enemy.isFleeing) {
                // If this enemy is targeting player but doesn't have a path, create one sometimes
                if (enemy.isTargetingPlayer && !enemy.attackPath && Math.random() < 0.1) {
                    createEnemyAttackPath(enemy);
                }
                
                // Add some randomness to aggressive enemies to make them less predictable
                const targetingRandomness = enemy.type === 'WARRIOR' ? 0.1 : 0.2; // Warriors more focused
                
                if (Math.random() < targetingRandomness) {
                    // Random movement for unpredictability
                    moveX = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                    moveY = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                } else {
                    // Target player directly
                    moveX = enemy.x < gameState.player.x ? 1 : (enemy.x > gameState.player.x ? -1 : 0);
                    moveY = enemy.y < gameState.player.y ? 1 : (enemy.y > gameState.player.y ? -1 : 0);
                }
                
                // Enemy has higher chance to move faster when aggressive
                if (Math.random() < 0.1) {
                    // Reset movement timer for faster movement
                    enemy.lastMoved = -enemy.moveDelay * 0.5;
                }
            } else if (!enemy.isFleeing) {
                // Non-aggressive behavior - mostly random movement within own territory
                const moveRandomly = Math.random() < 0.7;
                
                if (moveRandomly) {
                    // Random movement within territory
                    moveX = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                    moveY = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                } else {
                    // Sometimes move toward kingdom center (capital)
                    moveX = enemy.x < kingdom.capitalX ? 1 : (enemy.x > kingdom.capitalX ? -1 : 0);
                    moveY = enemy.y < kingdom.capitalY ? 1 : (enemy.y > kingdom.capitalY ? -1 : 0);
                }
            }
            
            // Calculate new position
            const newX = enemy.x + moveX;
            const newY = enemy.y + moveY;
            
            // Check if new position is valid (within map boundaries)
            if (newX >= 0 && newX < MAP_SIZE && newY >= 0 && newY < MAP_SIZE) {
                const tile = gameState.map[newY][newX];
                
                // Only attack buildings if the enemy is aggressive
                if (tile.building && enemy.isAggressive) {
                    // Only attack player's buildings
                    if (tile.territory === 0) {
                        const building = gameState.buildings.find(b => b.x === newX && b.y === newY);
                        
                        if (building) {
                            // Higher damage when attacking player buildings
                            const attackDamage = enemy.attack * 1.5;
                            
                            // Damage the wall/building
                            building.health -= attackDamage;
                            
                            // Show attack effect
                            showMessage(`Enemy attacks ${building.type}! (${Math.floor(building.health)} HP remaining)`);
                            
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
                                
                                showMessage(`${building.type} has been destroyed!`);
                            }
                        }
                    } else {
                        // Don't attack own kingdom's buildings
                        if (tile.territory !== enemy.kingdomId) {
                            enemy.x = newX;
                            enemy.y = newY;
                        }
                    }
                } else {
                    // Don't move onto player's buildings
                    if (!tile.building || tile.territory !== 0) {
                        // Aggressive enemies can wander outside territory
                        if (enemy.isAggressive || enemy.isFleeing || tile.territory === enemy.kingdomId || tile.territory === null) {
                            enemy.x = newX;
                            enemy.y = newY;
                            
                            // Check if enemy is adjacent to player
                            const dx = Math.abs(enemy.x - gameState.player.x);
                            const dy = Math.abs(enemy.y - gameState.player.y);
                            
                            if (dx <= 1 && dy <= 1 && enemy.isAggressive && !enemy.isFleeing) {
                                // Enemy attacks player
                                enemyAttackPlayer(enemy);
                            }
                        }
                    }
                }
            }
        }
    }
}

// Calculate the relative strength of an enemy compared to the player
function calculateRelativeStrength(enemy) {
    // Count nearby soldiers for player strength
    const playerSoldiers = gameState.soldiers.filter(soldier => {
        const dx = Math.abs(soldier.x - gameState.player.x);
        const dy = Math.abs(soldier.y - gameState.player.y);
        return dx <= 3 && dy <= 3; // Soldiers within 3 tiles of player
    });
    
    // Count nearby enemies for enemy strength
    const nearbyEnemies = gameState.enemies.filter(e => {
        if (e.kingdomId !== enemy.kingdomId) return false;
        
        const dx = Math.abs(e.x - enemy.x);
        const dy = Math.abs(e.y - enemy.y);
        return dx <= 3 && dy <= 3; // Enemies within 3 tiles of this enemy
    });
    
    // Calculate strengths (player health + # of soldiers vs. enemy health + # of allies)
    const playerStrength = gameState.player.health + (playerSoldiers.length * 10);
    const enemyStrength = enemy.health + (nearbyEnemies.length * 10);
    
    // Return ratio of enemy strength to player strength
    return enemyStrength / playerStrength;
}

// Create a direct attack path for an enemy to reach the player
function createEnemyAttackPath(enemy) {
    // Create a path to the player's current location
    const pathToPlayer = [];
    let currentX = enemy.x;
    let currentY = enemy.y;
    
    const playerX = gameState.player.x;
    const playerY = gameState.player.y;
    
    // Simple direct path (could be improved with pathfinding)
    while (currentX !== playerX || currentY !== playerY) {
        if (currentX < playerX) currentX++;
        else if (currentX > playerX) currentX--;
        
        if (currentY < playerY) currentY++;
        else if (currentY > playerY) currentY--;
        
        pathToPlayer.push({x: currentX, y: currentY});
        
        // Limit path length
        if (pathToPlayer.length > 30) break;
    }
    
    enemy.attackPath = pathToPlayer;
    enemy.attackPathIndex = 0;
}

// Enemy attacks player
function enemyAttackPlayer(enemy) {
    // Get base attack from enemy type
    const baseAttack = ENEMY_TYPES[enemy.type].attack;
    
    // Scale attack based on in-game progression (enemies get stronger as time passes)
    const gameTimeMinutes = gameState.gameTime / (60 * 1000);
    const timeFactor = Math.min(2, 1 + (gameTimeMinutes / 20)); // Up to 2x damage after 20 minutes
    
    // Calculate final attack damage with some randomness
    const attackVariance = 0.3; // 30% variance
    const varianceFactor = 1 - attackVariance + (Math.random() * attackVariance * 2);
    const rawAttack = Math.floor(baseAttack * timeFactor * varianceFactor);
    
    // Get soldiers near player for defense bonus
    const nearbyDefenders = gameState.soldiers.filter(soldier => {
        const dx = Math.abs(soldier.x - gameState.player.x);
        const dy = Math.abs(soldier.y - gameState.player.y);
        return dx <= 1 && dy <= 1; // Soldiers in adjacent tiles help defend
    });
    
    // Each soldier reduces damage by 5% (up to 70% reduction)
    const maxDefenseReduction = 0.7; // 70% max reduction
    const soldierDefenseReduction = Math.min(maxDefenseReduction, nearbyDefenders.length * 0.05);
    
    // Apply defense reduction
    let finalAttack = Math.floor(rawAttack * (1 - soldierDefenseReduction));
    
    // Ensure minimum damage of 1
    finalAttack = Math.max(1, finalAttack);
    
    // Critical hit chance (15% chance)
    let criticalHit = Math.random() < 0.15;
    let criticalDamage = 0;
    
    if (criticalHit) {
        // Additional damage on critical hit
        criticalDamage = Math.floor(finalAttack * 0.5);
        finalAttack += criticalDamage;
        showMessage(`CRITICAL HIT! Enemy attacked you for ${finalAttack} damage!`);
        
        if (nearbyDefenders.length > 0) {
            showMessage(`Your soldiers reduced damage by ${Math.round(soldierDefenseReduction * 100)}%`);
        }
    } else {
        // Regular attack message
        showMessage(`Enemy attacked you for ${finalAttack} damage!`);
        
        if (nearbyDefenders.length > 0) {
            showMessage(`Your soldiers reduced damage by ${Math.round(soldierDefenseReduction * 100)}%`);
        }
    }
    
    // Ensure player health is a number
    if (isNaN(gameState.player.health)) {
        gameState.player.health = 100;
    }
    
    // Apply damage to player
    gameState.player.health = Math.max(0, gameState.player.health - finalAttack);
    
    // Play attack sound
    const attackSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA');
    attackSound.volume = 0.3;
    attackSound.play().catch(() => {});
    
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
        // Store the kingdom ID before removing the enemy
        const defeatedKingdomId = targetEnemy.kingdomId;
        
        // Check if this was the main enemy of the kingdom (leader)
        const isKingdomLeader = isKingdomMainEnemy(targetEnemy);
        
        // Remove enemy from game
        const enemyIndex = gameState.enemies.indexOf(targetEnemy);
        gameState.enemies.splice(enemyIndex, 1);
        
        // Give player resources as reward
        gameState.resources.wood += 10;
        gameState.resources.stone += 5;
        gameState.resources.food += 8;
        
        showMessage("Enemy defeated! Received resources as reward.");
        
        // If this was the kingdom leader, claim the entire territory
        if (isKingdomLeader) {
            // Claim the whole territory
            claimEnemyKingdomTerritory(defeatedKingdomId);
        }
        
        updateUI();
    } else {
        // Enemy counterattack
        enemyCounterattack(targetEnemy);
    }
}

// Check if an enemy is the main enemy (leader) of a kingdom
function isKingdomMainEnemy(enemy) {
    // Get the enemy's kingdom
    const kingdom = gameState.kingdoms[enemy.kingdomId];
    
    // Count enemies in this kingdom
    const kingdomEnemies = gameState.enemies.filter(e => e.kingdomId === enemy.kingdomId);
    
    // If this is the last or only enemy in the kingdom, it's the leader
    if (kingdomEnemies.length <= 1) {
        return true;
    }
    
    // Check if this enemy is at the kingdom's capital
    if (enemy.x === kingdom.capitalX && enemy.y === kingdom.capitalY) {
        return true;
    }
    
    // Otherwise, not the leader
    return false;
}

// Claim all territory of an enemy kingdom
function claimEnemyKingdomTerritory(kingdomId) {
    let territoryTiles = 0;
    let capturedBuildings = 0;
    
    // Iterate through the map
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = gameState.map[y][x];
            
            // If this tile belongs to the defeated kingdom
            if (tile.territory === kingdomId) {
                // Convert territory to player's
                tile.territory = 0; // 0 is player's kingdom ID
                territoryTiles++;
                
                // Handle buildings
                if (tile.building) {
                    capturedBuildings++;
                    
                    // If it's a wall, convert or destroy it
                    if (tile.isWall) {
                        // 50% chance to convert walls to player's walls
                        if (Math.random() < 0.5) {
                            // Find enemy wall in buildings array
                            const wallIndex = gameState.enemyBuildings.findIndex(
                                b => b.x === x && b.y === y && b.kingdomId === kingdomId
                            );
                            
                            // Remove from enemy buildings if found
                            if (wallIndex !== -1) {
                                gameState.enemyBuildings.splice(wallIndex, 1);
                            }
                            
                            // Add as player wall
                            gameState.buildings.push({
                                type: 'WALL',
                                x: x,
                                y: y,
                                owner: 'player',
                                health: BUILDING_TYPES['WALL'].maxHealth
                            });
                        } else {
                            // Destroy wall
                            tile.building = null;
                            tile.isWall = false;
                        }
                    } else {
                        // For non-wall buildings, capture them
                        // Remove from enemy buildings
                        const buildingIndex = gameState.enemyBuildings.findIndex(
                            b => b.x === x && b.y === y && b.kingdomId === kingdomId
                        );
                        
                        if (buildingIndex !== -1) {
                            const capturedBuilding = gameState.enemyBuildings[buildingIndex];
                            gameState.enemyBuildings.splice(buildingIndex, 1);
                            
                            // Add to player buildings
                            gameState.buildings.push({
                                type: capturedBuilding.type,
                                x: x,
                                y: y,
                                owner: 'player',
                                health: BUILDING_TYPES[capturedBuilding.type].maxHealth
                            });
                        }
                    }
                }
            }
        }
    }
    
    // Award bonus resources for conquest
    const woodBonus = 30 + Math.floor(Math.random() * 30);
    const stoneBonus = 20 + Math.floor(Math.random() * 20);
    const foodBonus = 25 + Math.floor(Math.random() * 25);
    
    gameState.resources.wood += woodBonus;
    gameState.resources.stone += stoneBonus;
    gameState.resources.food += foodBonus;
    
    // Show conquest message
    showMessage(`You've conquered Kingdom ${kingdomId}! Claimed ${territoryTiles} territory tiles and ${capturedBuildings} buildings.`);
    showMessage(`Conquest reward: +${woodBonus} wood, +${stoneBonus} stone, +${foodBonus} food`);
}

// Enemy counterattack
function enemyCounterattack(enemy) {
    // Calculate base enemy attack power
    const baseAttack = ENEMY_TYPES[enemy.type].attack;
    
    // Counterattacks are more powerful (50% more damage)
    const counterAttackBonus = 1.5;
    
    // Add some randomness to the attack
    const minDamage = baseAttack * counterAttackBonus * 0.8;
    const maxDamage = baseAttack * counterAttackBonus * 1.2;
    const totalDamage = Math.floor(minDamage + Math.random() * (maxDamage - minDamage));
    
    // Critical hit chance (25% chance - higher than normal attacks)
    const criticalHit = Math.random() < 0.25;
    let finalDamage = totalDamage;
    
    if (criticalHit) {
        const criticalBonus = Math.floor(totalDamage * 0.7); // 70% extra damage on critical
        finalDamage += criticalBonus;
        showMessage(`CRITICAL COUNTERATTACK! Enemy dealt ${finalDamage} damage!`);
    } else {
        showMessage(`Enemy counterattacked for ${finalDamage} damage!`);
    }
    
    // Apply damage to player
    gameState.player.health -= finalDamage;
    
    // Play stronger attack sound
    const attackSound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA');
    attackSound.volume = 0.5; // Louder than normal attack
    attackSound.play().catch(() => {});
    
    // Rally nearby enemies to attack after a counterattack
    setTimeout(() => {
        // Find nearby enemies of the same kingdom
        const nearbyEnemies = gameState.enemies.filter(otherEnemy => {
            if (otherEnemy === enemy || otherEnemy.kingdomId !== enemy.kingdomId) {
                return false;
            }
            
            // Calculate distance between enemies
            const distance = Math.sqrt(
                Math.pow(otherEnemy.x - enemy.x, 2) + 
                Math.pow(otherEnemy.y - enemy.y, 2)
            );
            
            return distance < 8; // Enemies within 8 tiles will join the attack
        });
        
        // Make these enemies aggressive and target the player
        for (const rallyEnemy of nearbyEnemies) {
            rallyEnemy.isAggressive = true;
            rallyEnemy.isTargetingPlayer = true;
            rallyEnemy.lastMoved = 0; // Reset movement timer
        }
        
        // Show rally message if enemies joined
        if (nearbyEnemies.length > 0) {
            showMessage(`${nearbyEnemies.length} enemies have been alerted and are attacking!`);
        }
    }, 1000); // 1 second delay
    
    // Check if player is defeated
    if (gameState.player.health <= 0) {
        gameState.player.health = 0;
        showMessage("You have been defeated! Game over.");
        // Could add game over logic here
    }
}

// Attack enemy building
function attackEnemyBuilding(buildingX, buildingY) {
    // Check if player has military capability
    if (gameState.soldiers.length === 0) {
        showMessage("You need soldiers to attack enemy buildings!");
        return false;
    }
    
    // Check if coordinates are valid and there's an enemy building there
    if (buildingX < 0 || buildingX >= MAP_SIZE || buildingY < 0 || buildingY >= MAP_SIZE) {
        return false;
    }
    
    const tile = gameState.map[buildingY][buildingX];
    
    // Check if there's a building and it's an enemy building (not player's)
    if (!tile.building) {
        showMessage("No building to attack here!");
        return false;
    }
    
    if (tile.territory === 0) {
        showMessage("You can't attack your own buildings!");
        return false;
    }
    
    // Find the enemy building
    let enemyBuilding = gameState.enemyBuildings.find(b => 
        b.x === buildingX && b.y === buildingY);
    
    if (!enemyBuilding) {
        // If not found directly, this might be a wall
        if (tile.isWall) {
            // Look for any wall at this position
            const kingdom = gameState.kingdoms.find(k => k.id === tile.territory);
            if (kingdom) {
                // Create a representation of the enemy wall for attack purposes
                enemyBuilding = {
                    type: 'WALL',
                    x: buildingX,
                    y: buildingY,
                    kingdomId: tile.territory,
                    health: BUILDING_TYPES['WALL'].maxHealth
                };
                // Add to enemy buildings array for future reference
                gameState.enemyBuildings.push(enemyBuilding);
            }
        }
    }
    
    if (!enemyBuilding) {
        showMessage("No enemy building found to attack!");
        return false;
    }
    
    // Calculate attack damage based on player's military power and nearby soldiers
    const baseAttack = gameState.military.attack;
    
    // Count nearby soldiers for additional attack power
    const nearbySoldiers = gameState.soldiers.filter(soldier => {
        const dx = Math.abs(soldier.x - gameState.player.x);
        const dy = Math.abs(soldier.y - gameState.player.y);
        return dx <= 2 && dy <= 2; // Soldiers within 2 tiles will help
    });
    
    const soldierAttack = nearbySoldiers.length * 5; // Each soldier adds 5 attack
    const totalAttack = baseAttack + soldierAttack;
    
    // Apply damage to enemy building
    enemyBuilding.health -= totalAttack;
    
    // Show attack message
    showMessage(`Attacked enemy ${enemyBuilding.type} for ${totalAttack} damage!`);
    
    // Check if building is destroyed
    if (enemyBuilding.health <= 0) {
        // Remove the enemy building
        destroyEnemyBuilding(enemyBuilding, buildingX, buildingY);
        return true;
    }
    
    // Building was attacked but not destroyed
    return false;
}

// Have soldiers follow the player
function updateSoldierPositions() {
    // Assign each soldier a unique adjacent tile around the player (no stacking)
    const adjacentOffsets = [
        {dx: 0, dy: -1}, // Up
        {dx: 1, dy: 0},  // Right
        {dx: 0, dy: 1},  // Down
        {dx: -1, dy: 0}, // Left
        {dx: 1, dy: -1}, // Up-Right
        {dx: 1, dy: 1},  // Down-Right
        {dx: -1, dy: 1}, // Down-Left
        {dx: -1, dy: -1} // Up-Left
    ];
    for (let i = 0; i < gameState.soldiers.length; i++) {
        const soldier = gameState.soldiers[i];
        const offset = adjacentOffsets[i % adjacentOffsets.length];
        const newX = gameState.player.x + offset.dx;
        const newY = gameState.player.y + offset.dy;
        if (newX >= 0 && newX < MAP_SIZE && newY >= 0 && newY < MAP_SIZE) {
            const tile = gameState.map[newY][newX];
            // Only move if no building and no other soldier occupies
            const occupied = gameState.soldiers.some(s => s !== soldier && s.x === newX && s.y === newY);
            if (!tile.building && !occupied) {
                soldier.x = newX;
                soldier.y = newY;
            }
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
    
    // Check if tile is within player's territory or adjacent to it or adjacent to existing wall
    if (tile.territory !== 0) {
        let isAdjacentToTerritory = false;
        let isAdjacentToWall = false;
        
        // Check adjacent tiles for player territory or walls
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue; // Skip the tile itself
                
                const nx = gameState.selectedTile.x + dx;
                const ny = gameState.selectedTile.y + dy;
                
                if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
                    if (gameState.map[ny][nx].territory === 0) {
                        isAdjacentToTerritory = true;
                    }
                    // Check if adjacent to existing wall
                    if (gameState.map[ny][nx].isWall && gameState.map[ny][nx].territory === 0) {
                        isAdjacentToWall = true;
                    }
                }
            }
        }
        
        if (!isAdjacentToTerritory && !isAdjacentToWall) {
            showMessage('Walls must be built within or adjacent to your territory or walls!');
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
        }
        
        // Add this tile to the player's kingdom wall perimeter
        const playerKingdom = gameState.kingdoms[0];
        playerKingdom.wallPerimeter.push({
            x: gameState.selectedTile.x,
            y: gameState.selectedTile.y
        });
        
        // Check if we've enclosed an area and expand territory within the walls
        if (checkForEnclosure(gameState.selectedTile.x, gameState.selectedTile.y, 0)) {
            // Identify and remove interior walls
            removeInteriorWalls(0);
            // Expand territory within walls
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

// Check if a wall placement creates an enclosure
function checkForEnclosure(x, y, kingdomId) {
    // This is a simplified flood fill algorithm to check if we've created an enclosure
    const kingdom = gameState.kingdoms[kingdomId];
    
    // Get wall coordinates for the kingdom
    const wallCoords = new Set();
    for (const wall of kingdom.wallPerimeter) {
        wallCoords.add(`${wall.x},${wall.y}`);
    }
    
    // Add the new wall to the set
    wallCoords.add(`${x},${y}`);
    
    // Create a temporary set of visited tiles
    const visited = new Set();
    
    // Start with a known empty tile at the edge of the map
    const startPoints = [];
    
    // Check all 4 edges of the map for empty tiles
    // Top edge
    for (let x = 0; x < MAP_SIZE; x++) {
        if (!wallCoords.has(`${x},0`)) {
            startPoints.push({x, y: 0});
        }
    }
    
    // Bottom edge
    for (let x = 0; x < MAP_SIZE; x++) {
        if (!wallCoords.has(`${x},${MAP_SIZE-1}`)) {
            startPoints.push({x, y: MAP_SIZE-1});
        }
    }
    
    // Left edge
    for (let y = 0; y < MAP_SIZE; y++) {
        if (!wallCoords.has(`0,${y}`)) {
            startPoints.push({x: 0, y});
        }
    }
    
    // Right edge
    for (let y = 0; y < MAP_SIZE; y++) {
        if (!wallCoords.has(`${MAP_SIZE-1},${y}`)) {
            startPoints.push({x: MAP_SIZE-1, y});
        }
    }
    
    // If we don't have any starting points, the whole map is enclosed (unlikely)
    if (startPoints.length === 0) {
        return true;
    }
    
    // Use the first empty edge tile as a starting point
    const queue = [startPoints[0]];
    visited.add(`${startPoints[0].x},${startPoints[0].y}`);
    
    // Directions for flood fill
    const directions = [
        {dx: 1, dy: 0},
        {dx: -1, dy: 0},
        {dx: 0, dy: 1},
        {dx: 0, dy: -1}
    ];
    
    // Flood fill from the edge
    while (queue.length > 0) {
        const {x, y} = queue.shift();
        
        for (const {dx, dy} of directions) {
            const nx = x + dx;
            const ny = y + dy;
            const coordKey = `${nx},${ny}`;
            
            // If in bounds and not visited and not a wall
            if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE && 
                !visited.has(coordKey) && !wallCoords.has(coordKey)) {
                
                visited.add(coordKey);
                queue.push({x: nx, y: ny});
            }
        }
    }
    
    // Now check if there are any unvisited tiles that aren't walls
    // Those would be enclosed areas
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const coordKey = `${x},${y}`;
            
            if (!visited.has(coordKey) && !wallCoords.has(coordKey)) {
                // Found an enclosed area
                return true;
            }
        }
    }
    
    return false;
}

// Identify and remove interior walls
function removeInteriorWalls(kingdomId) {
    const kingdom = gameState.kingdoms[kingdomId];
    
    // First, we need to identify which walls are on the perimeter and which are interior
    const wallCoords = new Set();
    for (const wall of kingdom.wallPerimeter) {
        wallCoords.add(`${wall.x},${wall.y}`);
    }
    
    // Identify interior walls
    const interiorWalls = [];
    
    for (const wall of kingdom.wallPerimeter) {
        let isExterior = false;
        
        // A wall is exterior if it has at least one adjacent non-wall tile
        // that's outside (not enclosed)
        const directions = [
            {dx: 1, dy: 0},
            {dx: -1, dy: 0},
            {dx: 0, dy: 1},
            {dx: 0, dy: -1}
        ];
        
        for (const {dx, dy} of directions) {
            const nx = wall.x + dx;
            const ny = wall.y + dy;
            
            // Check if the adjacent tile is outside the map or not a wall
            if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE || 
                !wallCoords.has(`${nx},${ny}`)) {
                
                // Now we need to check if this non-wall is part of the outside
                // or part of an enclosed area
                if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
                    // If this is a territory of another kingdom, it's exterior
                    if (gameState.map[ny][nx].territory !== null && 
                        gameState.map[ny][nx].territory !== kingdomId) {
                        isExterior = true;
                        break;
                    }
                } else {
                    // If it's outside the map bounds, it's exterior
                    isExterior = true;
                    break;
                }
            }
        }
        
        if (!isExterior) {
            interiorWalls.push(wall);
        }
    }
    
    // Remove interior walls
    for (const wall of interiorWalls) {
        // Find the wall in the game buildings
        const wallBuilding = gameState.buildings.find(b => 
            b.x === wall.x && b.y === wall.y && b.type === 'WALL');
        
        if (wallBuilding) {
            destroyPlayerWall(wallBuilding, wall.x, wall.y);
        }
    }
    
    if (interiorWalls.length > 0) {
        showMessage(`Removed ${interiorWalls.length} interior walls.`);
    }
}

// Expand territory within a kingdom's walls
function expandTerritoryWithinWalls(kingdomId) {
    const kingdom = gameState.kingdoms[kingdomId];
    if (!kingdom) return;
    
    // Get set of wall coordinates for fast lookup
    const wallCoords = new Set();
    for (const wall of kingdom.wallPerimeter) {
        wallCoords.add(`${wall.x},${wall.y}`);
    }
    
    // For each wall, try to flood fill inward
    const floodPoints = [];
    
    for (const wall of kingdom.wallPerimeter) {
        const directions = [
            {dx: 1, dy: 0},
            {dx: -1, dy: 0},
            {dx: 0, dy: 1},
            {dx: 0, dy: -1}
        ];
        
        for (const {dx, dy} of directions) {
            const nx = wall.x + dx;
            const ny = wall.y + dy;
            
            // If in bounds and not a wall
            if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE && 
                !wallCoords.has(`${nx},${ny}`)) {
                
                // Check if the tile is not part of another kingdom's walls
                const tile = gameState.map[ny][nx];
                if (!tile.isWall || tile.territory === kingdomId) {
                // Mark this as a potential flood fill starting point
                floodPoints.push({x: nx, y: ny});
                }
            }
        }
    }
    
    // We'll also always include the capital as a starting point
    floodPoints.push({x: kingdom.capitalX, y: kingdom.capitalY});
    
    // Create a visited set for the flood fill
    const visited = new Set();
    
    // For each potential flood point, try a flood fill
    for (const point of floodPoints) {
        const coordKey = `${point.x},${point.y}`;
        
        if (visited.has(coordKey)) continue;
        
        // Check if this is another kingdom's territory
        const startTile = gameState.map[point.y][point.x];
        if (startTile.territory !== null && startTile.territory !== kingdomId) {
            continue; // Don't claim other kingdoms' territory
        }
        
        // Do a flood fill from this point
        const queue = [point];
        visited.add(coordKey);
        
        while (queue.length > 0) {
            const {x, y} = queue.shift();
            
            // Set territory only if not already claimed by another kingdom
            if (gameState.map[y][x].territory === null || gameState.map[y][x].territory === kingdomId) {
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
                const nextCoordKey = `${nx},${ny}`;
                
                // Check if in bounds and not visited
                if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE && 
                    !visited.has(nextCoordKey)) {
                    
                    visited.add(nextCoordKey);
                    
                    // If this is a wall tile of our kingdom, don't go beyond it
                    if (wallCoords.has(nextCoordKey) || gameState.map[ny][nx].isWall) {
                        continue;
                    }
                    
                    // If this tile already belongs to another kingdom, don't claim it
                    if (gameState.map[ny][nx].territory !== null && 
                        gameState.map[ny][nx].territory !== kingdomId) {
                        continue;
                    }
                    
                    // Add to queue to continue expanding
                    queue.push({x: nx, y: ny});
                }
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
    gameCtx.globalAlpha = territoryId === 0 ? 0.35 : 0.2; // Player territory more visible
    
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

// Update military stats based on buildings and soldiers
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
    
    // Calculate building bonuses
    gameState.military.attackBonus = gameState.military.barracksCount * 5; // Each barracks adds +5 attack
    gameState.military.defenseBonus = gameState.military.towerCount * 7;   // Each tower adds +7 defense
    
    // Calculate soldier bonuses (each soldier adds +1 attack, +1 defense)
    const soldierCount = gameState.soldiers.length;
    const soldierAttackBonus = soldierCount * 1;
    const soldierDefenseBonus = soldierCount * 1;
    
    // Update total stats
    gameState.military.attack = 10 + gameState.military.attackBonus + soldierAttackBonus; // Base + building bonus + soldier bonus
    gameState.military.defense = 5 + gameState.military.defenseBonus + soldierDefenseBonus; // Base + building bonus + soldier bonus
    
    // Training speed increases with barracks (10% per barracks)
    gameState.military.trainingSpeed = 1.0 + (gameState.military.barracksCount * 0.1);
    
    // Range increases with towers (1 base + 0.5 per tower, up to +2)
    gameState.military.range = 1 + Math.min(2, gameState.military.towerCount * 0.5);
    
    // Update player's health based on soldier count (base 100 + 10 per soldier)
    gameState.player.maxHealth = 100 + (soldierCount * 10);
    
    // Ensure current health doesn't exceed max health
    gameState.player.health = Math.min(gameState.player.health, gameState.player.maxHealth);
    
    // Update player's attack power based on military stats
    gameState.player.attack = gameState.military.attack;
    
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

// Update enemy kingdoms (gather resources and expand)
function updateEnemyKingdoms(deltaTime) {
    // Only update every few seconds to save performance
    if (!gameState.lastKingdomUpdate) {
        gameState.lastKingdomUpdate = 0;
    }
    
    gameState.lastKingdomUpdate += deltaTime;
    
    // Update enemy kingdoms every 2 seconds (reduced from 5 seconds for faster updates)
    if (gameState.lastKingdomUpdate > 2000) {
        gameState.lastKingdomUpdate = 0;
        
        // Skip player kingdom (id 0)
        for (let i = 1; i < gameState.kingdoms.length; i++) {
            const kingdom = gameState.kingdoms[i];
            
            // Repair broken walls first (highest priority when under attack)
            repairWalls(kingdom);
            
            // Send enemies to gather resources with higher chance
            if (Math.random() < 0.85) { // Increased from 0.7 to 0.85
                enemyGatherResources(kingdom);
            }
            
            // Attempt to expand territory more frequently
            if (Math.random() < 0.4) { // Increased from 0.2 to 0.4
                expandEnemyKingdom(kingdom);
            }
            
            // Build new buildings more frequently
            if (Math.random() < 0.15) { // Increased from 0.05 to 0.15
                buildEnemyBuilding(kingdom);
            }
            
            // Give AI kingdoms bonus resources for faster development
            kingdom.resources.wood += 2;
            kingdom.resources.stone += 1;
            kingdom.resources.food += 1;
        }
    }
}

// Repair walls that have been broken
function repairWalls(kingdom) {
    // Skip if no walls to repair
    if (!kingdom.wallsToRepair || kingdom.wallsToRepair.length === 0) {
        return;
    }
    
    // Check if kingdom has resources for repairs
    if (kingdom.resources.stone < 5) {
        return; // Not enough stone to repair
    }
    
    // Sort walls by repair time (repair oldest damages first)
    kingdom.wallsToRepair.sort((a, b) => a.time - b.time);
    
    // Try to repair one wall per update
    const wallToRepair = kingdom.wallsToRepair[0];
    
    // Check if wall can be repaired (must be at least 5 seconds since it was broken)
    const currentTime = Date.now();
    if (currentTime - wallToRepair.time < 5000) {
        return; // Too soon to repair
    }
    
    // Check if territory is still claimed by player or if it's neutral
    const {x, y} = wallToRepair;
    const tile = gameState.map[y][x];
    
    // If the tile is not in player territory, it can be reclaimed and repaired
    if (tile.territory !== 0 || Math.random() < 0.3) { // 30% chance to try to reclaim from player
        // Attempt to rebuild the wall
        kingdom.resources.stone -= 5;
        
        // Reclaim territory
        tile.territory = kingdom.id;
        
        // Rebuild wall
        tile.building = 'WALL';
        tile.isWall = true;
        
        // Add wall back to kingdom's wallPerimeter
        kingdom.wallPerimeter.push({x, y});
        
        // Add to enemy buildings
        gameState.enemyBuildings.push({
            type: 'WALL',
            x: x,
            y: y,
            owner: 'enemy',
            kingdomId: kingdom.id,
            health: BUILDING_TYPES['WALL'].maxHealth
        });
        
        // Show message if player is nearby
        const distToPlayer = Math.sqrt(
            Math.pow(x - gameState.player.x, 2) + 
            Math.pow(y - gameState.player.y, 2)
        );
        
        if (distToPlayer < 15) {
            showMessage(`Kingdom ${kingdom.id} has rebuilt their wall!`);
        }
        
        // Remove from repair list
        kingdom.wallsToRepair.shift();
    }
}

// Enemy kingdoms go out to gather resources
function enemyGatherResources(kingdom) {
    // Find enemies that belong to this kingdom
    const kingdomEnemies = gameState.enemies.filter(enemy => enemy.kingdomId === kingdom.id);
    
    if (kingdomEnemies.length === 0) return;
    
    // Randomly select one enemy to go foraging
    const forager = kingdomEnemies[Math.floor(Math.random() * kingdomEnemies.length)];
    
    // Skip if this enemy is already gathering or returning to capital
    if (forager.isGathering || forager.returningToCapital) return;
    
    // Set this enemy in gathering mode (non-aggressive)
    forager.isGathering = true;
    forager.isAggressive = false;
    
    // Find all resource nodes on the map
    let nearestResource = null;
    let shortestDistance = Infinity;
    
    // Search for the nearest resource
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = gameState.map[y][x];
            
            if (tile.resource) {
                const distance = Math.sqrt(
                    Math.pow(x - forager.x, 2) + 
                    Math.pow(y - forager.y, 2)
                );
                
                // Find the closest resource
                if (distance < shortestDistance && distance > 0) {
                    shortestDistance = distance;
                    nearestResource = {x, y, type: tile.resource};
                }
            }
        }
    }
    
    // If a resource was found, set it as target
    if (nearestResource) {
        forager.gatheringTarget = nearestResource;
        forager.returningToCapital = false;
        
        // Set up path to resource
        const pathToResource = [];
        const targetX = nearestResource.x;
        const targetY = nearestResource.y;
        
        // Simple path calculation (can be improved later)
        let currentX = forager.x;
        let currentY = forager.y;
        
        while (currentX !== targetX || currentY !== targetY) {
            if (currentX < targetX) currentX++;
            else if (currentX > targetX) currentX--;
            
            if (currentY < targetY) currentY++;
            else if (currentY > targetY) currentY--;
            
            pathToResource.push({x: currentX, y: currentY});
        }
        
        forager.gatheringPath = pathToResource;
        forager.pathIndex = 0;
        forager.lastMoved = 0;
        
        // Slow down movement during gathering
        forager.gatheringMoveDelay = forager.moveDelay * 1.5;
    }
}

// Function to update enemy gathering behavior
function updateEnemyGathering(enemy, deltaTime) {
    if (!enemy.isGathering && !enemy.returningToCapital) return;
    
    // Track the time since last move
    enemy.lastMoved += deltaTime;
    
    // Only move if enough time has passed
    if (enemy.lastMoved <= (enemy.gatheringMoveDelay || enemy.moveDelay)) return;
    
    enemy.lastMoved = 0;
    
    if (enemy.isGathering && !enemy.returningToCapital) {
        // Moving to resource
        if (enemy.gatheringPath && enemy.pathIndex < enemy.gatheringPath.length) {
            // Follow path to resource
            const nextPosition = enemy.gatheringPath[enemy.pathIndex];
            enemy.x = nextPosition.x;
            enemy.y = nextPosition.y;
            enemy.pathIndex++;
            
            // Check if reached the resource
            if (enemy.pathIndex >= enemy.gatheringPath.length) {
                // At resource location - gather it
                const tile = gameState.map[enemy.y][enemy.x];
                if (tile.resource === enemy.gatheringTarget.type) {
                    // Gather resource with a chance based on tool quality
                    const gatherAmount = 5 + Math.floor(Math.random() * 5);
                    
                    // Find enemy's kingdom
                    const enemyKingdom = gameState.kingdoms[enemy.kingdomId];
                    
                    // Add resources to kingdom based on type
                    switch (tile.resource) {
                    case 'TREE':
                            enemyKingdom.resources.wood += gatherAmount;
                        break;
                    case 'STONE':
                            enemyKingdom.resources.stone += gatherAmount;
                        break;
                        case 'BERRY':
                            enemyKingdom.resources.food += gatherAmount;
                        break;
                }
                
                    // Clear resource with a chance
                    if (Math.random() < 0.6) {
                        tile.resource = null;
                    }
                    
                    // Switch to returning mode
                    enemy.isGathering = false;
                    enemy.returningToCapital = true;
                    
                    // Set up return path to capital
                    const homeKingdom = gameState.kingdoms[enemy.kingdomId];
                    const pathBackHome = [];
                    const capitalX = homeKingdom.capitalX;
                    const capitalY = homeKingdom.capitalY;
                    
                    // Simple path calculation for returning
                    let currentX = enemy.x;
                    let currentY = enemy.y;
                    
                    while (currentX !== capitalX || currentY !== capitalY) {
                        if (currentX < capitalX) currentX++;
                        else if (currentX > capitalX) currentX--;
                        
                        if (currentY < capitalY) currentY++;
                        else if (currentY > capitalY) currentY--;
                        
                        pathBackHome.push({x: currentX, y: currentY});
                    }
                    
                    enemy.gatheringPath = pathBackHome;
                    enemy.pathIndex = 0;
                }
            }
        }
    } else if (enemy.returningToCapital) {
        // Returning to capital
        if (enemy.gatheringPath && enemy.pathIndex < enemy.gatheringPath.length) {
            // Follow path back home
            const nextPosition = enemy.gatheringPath[enemy.pathIndex];
            enemy.x = nextPosition.x;
            enemy.y = nextPosition.y;
            enemy.pathIndex++;
            
            // Check if reached the capital
            if (enemy.pathIndex >= enemy.gatheringPath.length) {
                // Reset gathering state
                enemy.isGathering = false;
                enemy.returningToCapital = false;
                enemy.gatheringTarget = null;
                enemy.gatheringPath = null;
                
                // Show a resource gathering message for the kingdom
                if (Math.random() < 0.3) { // Only show it sometimes to reduce spam
                    showMessage(`Kingdom ${enemy.kingdomId} has gathered resources!`);
                }
            }
        }
    }
}

// Expand enemy kingdom territory by adding new walls
function expandEnemyKingdom(kingdom) {
    // Check if enough time has passed since last expansion
    const currentTime = Date.now();
    // Faster expansion rate (reduced cooldown by 40%)
    if (currentTime - kingdom.lastExpansion < 6000 / kingdom.expansionRate) {
        return; // Not enough time has passed
    }
    
    // Update last expansion time
    kingdom.lastExpansion = currentTime;
    
    // Get the outer boundary of the kingdom
    const outerTiles = [];
    
    // Find all outer tiles near kingdom territory
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            // Skip if this is not within reasonable distance of kingdom
            const distToCapital = Math.sqrt(
                Math.pow(x - kingdom.capitalX, 2) + 
                Math.pow(y - kingdom.capitalY, 2)
            );
            
            // Allow expansion further from capital (35 tiles instead of 30)
            if (distToCapital > 35) continue;
            
            // Skip if this tile already has a wall or building
            const tile = gameState.map[y][x];
            if (tile.building || tile.isWall) continue;
            
            // Check if this tile is adjacent to the kingdom but not part of it
            let adjacentToKingdom = false;
            let adjacentToTerritory = false;
            
            // Check all 8 surrounding tiles
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue; // Skip self
                    
                    const nx = x + dx;
                    const ny = y + dy;
                    
                    // Check bounds
                    if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
                        const neighbor = gameState.map[ny][nx];
                        
                        // If neighbor is part of this kingdom
                        if (neighbor.territory === kingdom.id) {
                            adjacentToTerritory = true;
                        }
                        
                        // If neighbor has a wall of this kingdom
                        if (neighbor.isWall && neighbor.territory === kingdom.id) {
                            adjacentToKingdom = true;
                        }
                    }
                }
            }
            
            // Add to candidates if it's adjacent to kingdom territory but not already part of it
            if (adjacentToTerritory && (tile.territory === null || tile.territory !== kingdom.id)) {
                // If it's a potential expansion tile
                outerTiles.push({x, y, distanceToCapital: distToCapital});
            }
        }
    }
    
    // If no candidates found
    if (outerTiles.length === 0) {
        return;
    }
    
    // Sort by distance to capital (prefer closer tiles)
    outerTiles.sort((a, b) => a.distanceToCapital - b.distanceToCapital);
    
    // Determine expansion size based on game progress
    const gameTimeMinutes = gameState.gameTime / (60 * 1000);
    // More aggressive expansion in later game
    const baseExpansionSize = 3 + Math.floor(gameTimeMinutes / 5);
    const maxExpansion = Math.min(10, baseExpansionSize); // Cap at 10 tiles
    
    // Select random expansion size based on kingdom's expansionRate
    const expansionSize = Math.max(3, Math.floor(Math.random() * maxExpansion * kingdom.expansionRate));
    
    // Get expansion tiles (up to expansionSize or all available)
    const expansionTiles = outerTiles.slice(0, Math.min(expansionSize, outerTiles.length));
    
    // Calculate resource cost
    const totalWallCost = {
        wood: expansionTiles.length * 2,  // 2 wood per wall
        stone: expansionTiles.length * 3   // 3 stone per wall
    };
    
    // Check if kingdom has resources
    if (kingdom.resources.wood >= totalWallCost.wood && 
        kingdom.resources.stone >= totalWallCost.stone) {
        
        // Deduct resources
        kingdom.resources.wood -= totalWallCost.wood;
        kingdom.resources.stone -= totalWallCost.stone;
        
        // Apply expansion - add walls and territory
        for (const tile of expansionTiles) {
            // Check if there's any building or wall already
            if (gameState.map[tile.y][tile.x].building || 
                gameState.map[tile.y][tile.x].isWall) {
                continue;
            }
            
            // Ensure no other kingdom already claimed this tile
            if (gameState.map[tile.y][tile.x].territory !== null && 
                gameState.map[tile.y][tile.x].territory !== kingdom.id) {
                continue;
            }
            
            // Add a wall
            gameState.map[tile.y][tile.x].building = 'WALL';
            gameState.map[tile.y][tile.x].isWall = true;
            gameState.map[tile.y][tile.x].territory = kingdom.id;
            
            // Track this wall in kingdom
            kingdom.wallPerimeter.push({x: tile.x, y: tile.y});
            
            // Add to enemy buildings
            gameState.enemyBuildings.push({
                type: 'WALL',
                x: tile.x,
                y: tile.y,
                owner: 'enemy',
                kingdomId: kingdom.id,
                health: BUILDING_TYPES['WALL'].maxHealth
            });
        }
        
        // Check if player is nearby to see the expansion
        const distanceToPlayer = Math.sqrt(
            Math.pow(kingdom.capitalX - gameState.player.x, 2) + 
            Math.pow(kingdom.capitalY - gameState.player.y, 2)
        );
        
        // Only show message if player is close enough to notice
        if (distanceToPlayer < 30) {
            showMessage(`Kingdom ${kingdom.id} is expanding its territory!`);
        }
        
        // After expanding, identify and remove interior walls
        removeInteriorWalls(kingdom.id);
        
        // Expand territory within the walls
        expandTerritoryWithinWalls(kingdom.id);
    }
}

// Identify and remove interior walls
function removeInteriorWalls(kingdomId) {
    const kingdom = gameState.kingdoms[kingdomId];
    
    // First, we need to identify which walls are on the perimeter and which are interior
    const wallCoords = new Set();
    for (const wall of kingdom.wallPerimeter) {
        wallCoords.add(`${wall.x},${wall.y}`);
    }
    
    // Identify interior walls
    const interiorWalls = [];
    
    for (const wall of kingdom.wallPerimeter) {
        let isExterior = false;
        
        // A wall is exterior if it has at least one adjacent non-wall tile
        // that's outside (not enclosed)
                const directions = [
                    {dx: 1, dy: 0},
                    {dx: -1, dy: 0},
                    {dx: 0, dy: 1},
                    {dx: 0, dy: -1}
                ];
                
                for (const {dx, dy} of directions) {
            const nx = wall.x + dx;
            const ny = wall.y + dy;
            
            // Check if the adjacent tile is outside the map or not a wall
            if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE || 
                !wallCoords.has(`${nx},${ny}`)) {
                
                // Now we need to check if this non-wall is part of the outside
                // or part of an enclosed area
                    if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
                    // If this is a territory of another kingdom, it's exterior
                    if (gameState.map[ny][nx].territory !== null && 
                        gameState.map[ny][nx].territory !== kingdomId) {
                        isExterior = true;
                        break;
                    }
                    
                    // If this tile doesn't have a territory, it's exterior
                    if (gameState.map[ny][nx].territory === null) {
                        isExterior = true;
                            break;
                        }
                } else {
                    // If it's outside the map bounds, it's exterior
                    isExterior = true;
                    break;
                }
            }
        }
        
        if (!isExterior) {
            interiorWalls.push(wall);
        }
    }
    
    // Remove interior walls
    for (const wall of interiorWalls) {
        // Find the wall in the enemy buildings list
        const wallBuilding = gameState.enemyBuildings.find(b => 
            b.x === wall.x && b.y === wall.y && b.type === 'WALL' && b.kingdomId === kingdomId);
        
        if (wallBuilding) {
            // Remove from enemy buildings
            const wallBuildingIndex = gameState.enemyBuildings.indexOf(wallBuilding);
            if (wallBuildingIndex !== -1) {
                gameState.enemyBuildings.splice(wallBuildingIndex, 1);
            }
        }
        
        // Remove from map
        const mapTile = gameState.map[wall.y][wall.x];
        mapTile.building = null;
        mapTile.isWall = false;
        
        // Keep the territory assignment
        
        // Remove from kingdom walls
        const wallIndex = kingdom.wallPerimeter.findIndex(w => w.x === wall.x && w.y === wall.y);
        if (wallIndex !== -1) {
            kingdom.wallPerimeter.splice(wallIndex, 1);
        }
    }
    
    if (interiorWalls.length > 0) {
        console.log(`Removed ${interiorWalls.length} interior walls for kingdom ${kingdomId}`);
    }
}

// Build a new building in enemy kingdom
function buildEnemyBuilding(kingdom) {
    // Check resource availability 
    if (kingdom.resources.wood < 50 || kingdom.resources.stone < 30) {
        return; // Not enough resources
    }
    
    // Find a suitable location within kingdom's territory
    const possibleLocations = [];
    
    // Scan for suitable tiles within kingdom territory
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = gameState.map[y][x];
            
            // Only build on kingdom's territory that doesn't already have buildings
            if (tile.territory === kingdom.id && !tile.building && !tile.isWall && !tile.resource) {
                const distanceToCapital = Math.sqrt(
                    Math.pow(x - kingdom.capitalX, 2) + 
                    Math.pow(y - kingdom.capitalY, 2)
                );
                
                // Only build within reasonable distance of capital
                if (distanceToCapital < 20) {
                    // Important: Ensure this tile is adjacent to existing kingdom territory
                    // to prevent "remote building"
                    let isAdjacentToTerritory = false;
                    
                    // Check adjacent tiles
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            if (dx === 0 && dy === 0) continue; // Skip self
                            
                            const nx = x + dx;
                            const ny = y + dy;
                            
                            // Check bounds
                            if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
                                // If adjacent tile is of same kingdom, this is a valid location
                                if (gameState.map[ny][nx].territory === kingdom.id) {
                                    isAdjacentToTerritory = true;
                                    break;
                                }
                            }
                        }
                        if (isAdjacentToTerritory) break;
                    }
                    
                    if (isAdjacentToTerritory) {
                        possibleLocations.push({x, y, distanceToCapital});
                    }
                }
            }
        }
    }
    
    // If no suitable locations, give up
    if (possibleLocations.length === 0) {
        return;
    }
    
    // Sort locations by distance to capital (prefer building closer to center)
    possibleLocations.sort((a, b) => a.distanceToCapital - b.distanceToCapital);
    
    // Choose one of the best locations (top 30%)
    const bestLocationsCount = Math.max(1, Math.floor(possibleLocations.length * 0.3));
    const chosenIndex = Math.floor(Math.random() * bestLocationsCount);
    const {x, y} = possibleLocations[chosenIndex];
    
    // Decide what to build based on kingdom needs and game progression
    
    // First, get counts of existing buildings
    const buildingCounts = {};
    for (const building of gameState.enemyBuildings) {
        if (building.kingdomId === kingdom.id) {
            buildingCounts[building.type] = (buildingCounts[building.type] || 0) + 1;
        }
    }
    
    // Count total kingdom enemies (soldiers)
    const kingdomEnemies = gameState.enemies.filter(enemy => enemy.kingdomId === kingdom.id);
    
    // Get time-based progression factor
    const gameTimeMinutes = gameState.gameTime / (60 * 1000);
    const isMidGame = gameTimeMinutes > 5; // Past 5 minutes
    const isLateGame = gameTimeMinutes > 15; // Past 15 minutes
    
    // Military focus increases as game progresses or if kingdom has few enemies
    const baseMilitaryFocus = 0.4 + (gameTimeMinutes / 30); // 40% chance at start, increasing over time
    
    // Increase focus if kingdom has few enemies
    const enemyCountBonus = kingdomEnemies.length < 3 ? 0.3 : 0;
    
    // Calculate final military focus probability
    const militaryFocus = Math.min(0.9, baseMilitaryFocus + enemyCountBonus);
    
    let buildingType = null;
    
    // Prioritize military buildings if attack focus is high or being attacked
    if (Math.random() < militaryFocus || kingdom.beingAttacked) {
        // Military buildings
        if (!buildingCounts['BARRACKS'] || buildingCounts['BARRACKS'] < 2 + Math.floor(gameTimeMinutes / 5)) {
            buildingType = 'BARRACKS'; // Build more barracks over time
        } else if (!buildingCounts['TOWER'] || buildingCounts['TOWER'] < 3) {
            buildingType = 'TOWER';
        } else {
            // Add more military buildings in later game
            buildingType = Math.random() < 0.7 ? 'BARRACKS' : 'TOWER';
        }
    } else {
        // Economic buildings
        if (!buildingCounts['HOUSE'] || buildingCounts['HOUSE'] < 3) {
            buildingType = 'HOUSE';
        } else if (!buildingCounts['MILL'] || buildingCounts['MILL'] < 2) {
            buildingType = 'MILL';
        } else if (isMidGame && (!buildingCounts['MARKET'] || buildingCounts['MARKET'] < 1)) {
            buildingType = 'MARKET'; // Add mid-game economic building
        } else {
            // Random economic building
            const options = ['HOUSE', 'MILL'];
            buildingType = options[Math.floor(Math.random() * options.length)];
        }
    }
    
    // Get building info
    const buildingInfo = BUILDING_TYPES[buildingType];
    
    // Deduct resources
    kingdom.resources.wood -= buildingInfo.woodCost || 0;
    kingdom.resources.stone -= buildingInfo.stoneCost || 0;
    
    // Place building on map
    gameState.map[y][x].building = buildingType;
    
    // Add a message about enemy building if close enough to player to be visible
    const distanceToPlayer = Math.sqrt(
        Math.pow(x - gameState.player.x, 2) + 
        Math.pow(y - gameState.player.y, 2)
    );
    
    if (distanceToPlayer < 20) {
        showMessage(`Kingdom ${kingdom.id} has built a ${buildingType}!`);
    }
    
    // Add to enemy buildings
    gameState.enemyBuildings.push({
        type: buildingType,
        x: x,
        y: y,
        owner: 'enemy',
        kingdomId: kingdom.id,
        health: buildingInfo.maxHealth
    });
    
    // Train military units if this is a barracks
    if (buildingType === 'BARRACKS') {
        // Start training soldiers immediately
        startEnemySoldierTraining(kingdom, x, y);
    }
    
    // Each house increases kingdom's enemy capacity
    if (buildingType === 'HOUSE') {
        // Add a new enemy near the house if kingdom has capacity
        const houseEnemyChance = 0.6; // 60% chance to add enemy per house
        
        // Calculate kingdom's current soldier count
        const kingdomSoldierCount = gameState.enemies.filter(e => 
            e.kingdomId === kingdom.id && (e.type === 'WARRIOR' || e.type === 'ARCHER')
        ).length;
        
        // Calculate soldier limit (5 base + 2 per house)
        const kingdomHouseCount = buildingCounts['HOUSE'] || 0;
        const kingdomSoldierLimit = 5 + (kingdomHouseCount * 2);
        
        // Only spawn if under the limit
        if (kingdomSoldierCount < kingdomSoldierLimit && Math.random() < houseEnemyChance) {
            // Choose a random enemy type
            const enemyType = Math.random() < 0.7 ? 'WARRIOR' : 'ARCHER';
            const enemyInfo = ENEMY_TYPES[enemyType];
            
            // Find a valid position near the house
            let validPosFound = false;
            let spawnX = x;
            let spawnY = y;
            
            // Try to find a valid position in a 3x3 area around the house
            for (let dy = -1; dy <= 1 && !validPosFound; dy++) {
                for (let dx = -1; dx <= 1 && !validPosFound; dx++) {
                    if (dx === 0 && dy === 0) continue; // Skip the house tile
                    
                    const newX = x + dx;
                    const newY = y + dy;
                    
                    // Check bounds and if tile is empty
                    if (newX >= 0 && newX < MAP_SIZE && newY >= 0 && newY < MAP_SIZE) {
                        const tile = gameState.map[newY][newX];
                        if (!tile.building && tile.territory === kingdom.id) {
                            spawnX = newX;
                            spawnY = newY;
                            validPosFound = true;
                            break;
                        }
                    }
                }
            }
            
            // Add a new enemy if we found a valid position
            if (validPosFound) {
                const newEnemy = {
                    x: spawnX,
                    y: spawnY,
                    type: enemyType,
                    health: enemyInfo.health,
                    attack: enemyInfo.attack,
                    lastMoved: 0,
                    moveDelay: 1000 / enemyInfo.speed,
                    kingdomId: kingdom.id,
                    isAggressive: Math.random() < 0.3 // 30% chance to be aggressive from start
                };
                
                gameState.enemies.push(newEnemy);
                
                if (distanceToPlayer < 20) {
                    showMessage(`Kingdom ${kingdom.id} has recruited a new ${enemyType}!`);
                }
            }
        }
    }
}

// Start training soldiers at enemy barracks
function startEnemySoldierTraining(kingdom, barrackX, barrackY) {
    // Calculate kingdom's soldier limit based on houses
    const kingdomHouseCount = gameState.enemyBuildings.filter(b => 
        b.kingdomId === kingdom.id && b.type === 'HOUSE'
    ).length;
    
    // Calculate current soldier count for this kingdom
    const kingdomSoldierCount = gameState.enemies.filter(e => 
        e.kingdomId === kingdom.id && (e.type === 'WARRIOR' || e.type === 'ARCHER')
    ).length;
    
    // Base limit is 5 soldiers + 2 per house
    const kingdomSoldierLimit = 5 + (kingdomHouseCount * 2);
    
    // Don't train more soldiers if at or over the limit
    if (kingdomSoldierCount >= kingdomSoldierLimit) {
        // Try again later if kingdom is under attack (emergency training)
        if (kingdom.beingAttacked) {
            setTimeout(() => {
                startEnemySoldierTraining(kingdom, barrackX, barrackY);
            }, 30000); // Try again in 30 seconds if under attack
        }
        return;
    }
    
    // Set training delay based on game time (faster training as game progresses)
    const gameTimeMinutes = gameState.gameTime / (60 * 1000);
    const trainingTime = Math.max(8000, 15000 - (gameTimeMinutes * 300)); // 15s at start, down to 8s in late game
    
    // Set flag to track training in progress
    if (!kingdom.trainingInProgress) {
        kingdom.trainingInProgress = {};
    }
    
    const barracksId = `${barrackX},${barrackY}`;
    kingdom.trainingInProgress[barracksId] = true;
    
    // Train a soldier after the delay
    setTimeout(() => {
        // Check if barracks still exists
        const barracks = gameState.enemyBuildings.find(
            b => b.x === barrackX && b.y === barrackY && b.type === 'BARRACKS'
        );
        
        if (barracks) {
            // Recheck soldier count to ensure we're not over the limit
            const currentSoldierCount = gameState.enemies.filter(e => 
                e.kingdomId === kingdom.id && (e.type === 'WARRIOR' || e.type === 'ARCHER')
            ).length;
            
            if (currentSoldierCount >= kingdomSoldierLimit) {
                // Cancel training if over limit
                delete kingdom.trainingInProgress[barracksId];
                
                // Try again later
                setTimeout(() => {
                    startEnemySoldierTraining(kingdom, barrackX, barrackY);
                }, 20000); // Check again in 20 seconds
                return;
            }
            
            // Choose soldier type (archer or warrior)
            const soldierType = Math.random() < 0.3 ? 'ARCHER' : 'WARRIOR';
            const enemyInfo = ENEMY_TYPES[soldierType];
            
            // Find a valid position near the barracks
            let spawnX = barrackX;
            let spawnY = barrackY;
            let validPosFound = false;
            
            // Search 5x5 area around barracks
            for (let dy = -2; dy <= 2 && !validPosFound; dy++) {
                for (let dx = -2; dx <= 2 && !validPosFound; dx++) {
                    if (dx === 0 && dy === 0) continue; // Skip the barracks tile
                    
                    const newX = barrackX + dx;
                    const newY = barrackY + dy;
                    
                    // Check if tile is valid for spawning
                    if (newX >= 0 && newX < MAP_SIZE && newY >= 0 && newY < MAP_SIZE) {
                        const tile = gameState.map[newY][newX];
                        if (!tile.building && tile.territory === kingdom.id) {
                            spawnX = newX;
                            spawnY = newY;
                            validPosFound = true;
                            break;
                        }
                    }
                }
            }
            
            if (validPosFound) {
                // Create a new enemy soldier
                const newSoldier = {
                    x: spawnX,
                    y: spawnY,
                    type: soldierType,
                    health: enemyInfo.health,
                    attack: enemyInfo.attack,
                    lastMoved: 0,
                    moveDelay: 1000 / enemyInfo.speed,
                    kingdomId: kingdom.id,
                    isAggressive: true, // Soldiers are always aggressive
                    isTargetingPlayer: Math.random() < 0.5 // 50% chance to directly target player
                };
                
                gameState.enemies.push(newSoldier);
                
                // Notify if close to player
                const distanceToPlayer = Math.sqrt(
                    Math.pow(spawnX - gameState.player.x, 2) + 
                    Math.pow(spawnY - gameState.player.y, 2)
                );
                
                if (distanceToPlayer < 20) {
                    showMessage(`Kingdom ${kingdom.id} has trained a new ${soldierType}!`);
                }
                
                // Queue next soldier training with delay based on how close to limit
                delete kingdom.trainingInProgress[barracksId];
                
                // Calculate remaining capacity
                const remainingCapacity = kingdomSoldierLimit - (currentSoldierCount + 1);
                
                // Delay time increases as kingdom approaches its unit cap
                const nextTrainingDelay = remainingCapacity <= 1 ? 30000 : // Nearly at limit - 30s
                                         remainingCapacity <= 3 ? 20000 : // Getting close - 20s 
                                         10000; // Normal training - 10s
                
                // Schedule next training
                setTimeout(() => {
                    startEnemySoldierTraining(kingdom, barrackX, barrackY);
                }, nextTrainingDelay);
            } else {
                // No space to spawn, try again later
                delete kingdom.trainingInProgress[barracksId];
                
                setTimeout(() => {
                    startEnemySoldierTraining(kingdom, barrackX, barrackY);
                }, 5000);
            }
        } else {
            // Barracks was destroyed, remove training flag
            delete kingdom.trainingInProgress[barracksId];
        }
    }, trainingTime);
}

// Start the game when page loads
window.addEventListener('load', initGame);

// Destroy enemy building function
function destroyEnemyBuilding(building, x, y) {
    // Remove the building from enemyBuildings array
    const buildingIndex = gameState.enemyBuildings.indexOf(building);
    if (buildingIndex !== -1) {
        gameState.enemyBuildings.splice(buildingIndex, 1);
    }
    
    // Clear the building from the map
    const tile = gameState.map[y][x];
    tile.building = null;
    
    // If it's a wall, also clear wall flag
    if (building.type === 'WALL') {
        tile.isWall = false;
        
        // Get the kingdom that owned the wall
        const kingdomId = building.kingdomId;
        const kingdom = gameState.kingdoms[kingdomId];
        
        // Set this kingdom as being attacked (for defense priority)
        kingdom.beingAttacked = true;
        
        // Remove wall from kingdom's wallPerimeter
        const wallIndex = kingdom.wallPerimeter.findIndex(w => w.x === x && w.y === y);
        if (wallIndex !== -1) {
            kingdom.wallPerimeter.splice(wallIndex, 1);
        }
        
        // Check if this was a conquest (convert territory)
        tile.territory = 0; // Claim for player
        
        // Show message about wall conquest
        showMessage(`You've broken through Kingdom ${kingdomId}'s defenses!`);
        
        // Force ALL enemies in this kingdom to become aggressive and target player
        const kingdomEnemies = gameState.enemies.filter(enemy => 
            enemy.kingdomId === kingdomId);
        
        // Make all enemies in this kingdom aggressive and target player
        for (const enemy of kingdomEnemies) {
            enemy.isAggressive = true;
            enemy.isTargetingPlayer = true;
            enemy.lastMoved = 0; // Reset movement timer for immediate action
            
            // Speed up enemy movement to create immediate threat
            enemy.moveDelay = Math.max(enemy.moveDelay * 0.5, 100); // Significant speed boost
            
            // Calculate distance to broken wall
            const distToWall = Math.sqrt(
                Math.pow(enemy.x - x, 2) + 
                Math.pow(enemy.y - y, 2)
            );
            
            // Make close enemies immediately move toward player
            if (distToWall < 20) {
                // Find path to player
                const pathToPlayer = [];
                let currentX = enemy.x;
                let currentY = enemy.y;
                
                const playerX = gameState.player.x;
                const playerY = gameState.player.y;
                
                while (currentX !== playerX || currentY !== playerY) {
                    if (currentX < playerX) currentX++;
                    else if (currentX > playerX) currentX--;
                    
                    if (currentY < playerY) currentY++;
                    else if (currentY > playerY) currentY--;
                    
                    pathToPlayer.push({x: currentX, y: currentY});
                }
                
                enemy.attackPath = pathToPlayer;
                enemy.attackPathIndex = 0;
                
                // The closest enemy will immediately attack
                if (distToWall <= 5) {
                    enemyCounterattack(enemy);
                }
            }
        }
        
        // Mark wall location for repair
        if (!kingdom.wallsToRepair) {
            kingdom.wallsToRepair = [];
        }
        kingdom.wallsToRepair.push({x, y, time: Date.now()});
    } else {
        // If this was a capital building, it's a major conquest
        if (building.isCapital) {
            const kingdomId = building.kingdomId;
            showMessage(`You've conquered a major building of Kingdom ${kingdomId}!`);
            
            // Give player resources as plunder
            const plunderResources = {
                wood: 20 + Math.floor(Math.random() * 30),
                stone: 15 + Math.floor(Math.random() * 20),
                food: 10 + Math.floor(Math.random() * 15)
            };
            
            gameState.resources.wood += plunderResources.wood;
            gameState.resources.stone += plunderResources.stone;
            gameState.resources.food += plunderResources.food;
            
            showMessage(`You plundered ${plunderResources.wood} wood, ${plunderResources.stone} stone, and ${plunderResources.food} food!`);
            
            // Claim territory for player
            tile.territory = 0;
        }
    }
    
    // Play destruction sound
    const destroySound = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgA');
    destroySound.volume = 0.3;
    destroySound.play().catch(() => {});
    
    // Update UI
    updateUI();
}
