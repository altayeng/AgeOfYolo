// buildings.js - Building mechanics, rendering and functionality

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

// Build a structure
function buildStructure(type, callback) {
    // Check if a tile is selected
    if (!gameState.selectedTile) {
        showMessage("Select a tile to build");
        return;
    }
    
    // Get building definition and selected tile
    const buildingDef = BUILDING_TYPES[type];
    const tile = gameState.map[gameState.selectedTile.y][gameState.selectedTile.x];
    
    // Get resource costs
    const woodCost = buildingDef.woodCost;
    const stoneCost = buildingDef.stoneCost;
    const foodCost = buildingDef.foodCost;
    
    // Check if we have enough resources
    if (gameState.resources.wood < woodCost || 
        gameState.resources.stone < stoneCost || 
        gameState.resources.food < foodCost) {
        showMessage(`Not enough resources to build ${buildingDef.name}`);
        return;
    }
    
    // Check if tile is already occupied
    if (tile.building) {
        showMessage("There's already a building on this tile");
        return;
    }
    
    // Deduct resources
    gameState.resources.wood -= woodCost;
    gameState.resources.stone -= stoneCost;
    gameState.resources.food -= foodCost;
    
    // Mark tile as having a building
    tile.building = type;
    
    // Create building record with unique ID
    const building = {
        type: type,
        x: gameState.selectedTile.x,
        y: gameState.selectedTile.y,
        health: buildingDef.maxHealth,
        id: Date.now() + Math.floor(Math.random() * 1000) // Generate unique ID
    };
    
    // Add to buildings array
    gameState.buildings.push(building);
    
    // If it's a house, update population capacity
    if (type === 'HOUSE') {
        gameState.population.max += 5;
    } else if (type === 'TOWER') {
        // Update military stats for towers
        gameState.military.towerCount++;
        updateMilitaryUI();
    } else if (type === 'BARRACKS') {
        // Update military stats for barracks
        gameState.military.barracksCount++;
        updateMilitaryUI();
    }
    
    // Show message
    showMessage(`${buildingDef.name} built`);
    
    // Update UI
    updateUI();
    
    // HATA DÜZELTME: callback fonksiyonu doğru şekilde çağrılmıyor
    // Eğer callback verilmişse çağrılmalı ve yapıya (building) parametre olarak geçilmeli
    if (typeof callback === 'function') {
        callback(building);
    }
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
    let isValidPlacement = tile.territory === 0;
    if (!isValidPlacement) {
        // Check adjacent tiles for player territory or walls
        const directions = [
            {dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0},
            {dx: 1, dy: -1}, {dx: 1, dy: 1}, {dx: -1, dy: 1}, {dx: -1, dy: -1}
        ];
        
        for (const {dx, dy} of directions) {
            const nx = gameState.selectedTile.x + dx;
            const ny = gameState.selectedTile.y + dy;
            
            if (nx >= 0 && nx < MAP_SIZE && ny >= 0 && ny < MAP_SIZE) {
                const adjacentTile = gameState.map[ny][nx];
                if (adjacentTile.territory === 0 || (adjacentTile.isWall && adjacentTile.building === 'WALL')) {
                    isValidPlacement = true;
                    break;
                }
            }
        }
    }
    
    if (!isValidPlacement) {
        showMessage('Walls must be built within or adjacent to your territory or walls!');
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
        
        // Check if we've enclosed an area
        const hasEnclosure = checkForEnclosure(gameState.selectedTile.x, gameState.selectedTile.y, 0);
        
        if (hasEnclosure) {
            // Expand territory within walls
            expandTerritoryWithinWalls(0);
            
            // Only remove interior walls if we have a complete enclosure
            removeInteriorWalls(0);
        }
        
        // Check for and remove redundant walls after a small delay
        // This helps ensure proper rendering and avoids confusing the player
        setTimeout(() => {
            checkRedundantWalls(0);
            // Update UI again after removing redundant walls
            updateUI();
        }, 300);
        
        showMessage('Duvar başarıyla inşa edildi!');
        
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


// Check if a wall placement creates an enclosure
function checkForEnclosure(x, y, kingdomId) {
    const kingdom = gameState.kingdoms[kingdomId];
    
    // Get wall coordinates for the kingdom
    const wallCoords = new Set();
    for (const wall of kingdom.wallPerimeter) {
        wallCoords.add(`${wall.x},${wall.y}`);
    }
    
    // Add the new wall to the set
    wallCoords.add(`${x},${y}`);
    
    // Create a set to track visited tiles
    const visited = new Set();
    
    // Function to check if a tile is within bounds
    const isInBounds = (x, y) => x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE;
    
    // Function to check if a point can reach the map edge
    function canReachEdge(startX, startY) {
        const queue = [{x: startX, y: startY}];
        const localVisited = new Set([`${startX},${startY}`]);
        
        while (queue.length > 0) {
            const {x, y} = queue.shift();
            
            // If we reached the edge, return true
            if (x === 0 || x === MAP_SIZE - 1 || y === 0 || y === MAP_SIZE - 1) {
                return true;
            }
            
            // Check all adjacent tiles (including diagonals)
            const directions = [
                {dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: -1},
                {dx: 1, dy: 1}, {dx: -1, dy: 1}, {dx: 1, dy: -1}, {dx: -1, dy: -1}
            ];
            
            for (const {dx, dy} of directions) {
                const nx = x + dx;
                const ny = y + dy;
                const key = `${nx},${ny}`;
                
                if (isInBounds(nx, ny) && !localVisited.has(key) && !wallCoords.has(key)) {
                    localVisited.add(key);
                    queue.push({x: nx, y: ny});
                }
            }
        }
        
        return false;
    }
    
    // Find a non-wall tile adjacent to the new wall
    const directions = [
        {dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: -1},
        {dx: 1, dy: 1}, {dx: -1, dy: 1}, {dx: 1, dy: -1}, {dx: -1, dy: -1}
    ];
    
    let enclosureFound = false;
    
    for (const {dx, dy} of directions) {
        const nx = x + dx;
        const ny = y + dy;
        const key = `${nx},${ny}`;
        
        if (isInBounds(nx, ny) && !wallCoords.has(key) && !visited.has(key)) {
            if (!canReachEdge(nx, ny)) {
                enclosureFound = true;
                break;
            }
            visited.add(key);
        }
    }
    
    return enclosureFound;
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
        const directions = [
            {dx: 1, dy: 0},
            {dx: -1, dy: 0},
            {dx: 0, dy: 1},
            {dx: 0, dy: -1},
            {dx: 1, dy: 1},  // Diagonal directions
            {dx: -1, dy: 1},
            {dx: 1, dy: -1},
            {dx: -1, dy: -1}
        ];
        
        for (const {dx, dy} of directions) {
            const nx = wall.x + dx;
            const ny = wall.y + dy;
            
            // Check if the adjacent tile is outside the map
            if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) {
                isExterior = true;
                break;
            }
            
            // If adjacent tile is not a wall, this is an exterior wall
            if (!wallCoords.has(`${nx},${ny}`)) {
                const adjacentTile = gameState.map[ny][nx];
                
                // If adjacent tile is not our territory or has no territory, it's exterior
                if (!adjacentTile.territory || adjacentTile.territory !== kingdomId) {
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
        // Find and remove the wall from gameState.buildings if it's a player wall
        if (kingdomId === 0) {
            const wallBuildingIndex = gameState.buildings.findIndex(b => 
                b.x === wall.x && b.y === wall.y && b.type === 'WALL');
            if (wallBuildingIndex !== -1) {
                gameState.buildings.splice(wallBuildingIndex, 1);
            }
        } else {
            // For enemy walls, remove from enemyBuildings
            const wallBuildingIndex = gameState.enemyBuildings.findIndex(b => 
                b.x === wall.x && b.y === wall.y && b.type === 'WALL' && b.kingdomId === kingdomId);
            if (wallBuildingIndex !== -1) {
                gameState.enemyBuildings.splice(wallBuildingIndex, 1);
            }
        }
        
        // Remove from map
        const mapTile = gameState.map[wall.y][wall.x];
        mapTile.building = null;
        mapTile.isWall = false;
        
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


// Expand territory within a kingdom's walls
function expandTerritoryWithinWalls(kingdomId) {
    const kingdom = gameState.kingdoms[kingdomId];
    if (!kingdom) return;
    
    // Get set of wall coordinates for fast lookup
    const wallCoords = new Set();
    for (const wall of kingdom.wallPerimeter) {
        wallCoords.add(`${wall.x},${wall.y}`);
    }
    
    // Identify enclosed areas using the same approach as checkForEnclosure
    // but in reverse - find areas that are NOT reachable from outside
    const visited = new Set();
    
    // Start with tiles from the edge of the map
    const queue = [];
    
    // Add all edge tiles to the queue
    // Top edge
    for (let x = 0; x < MAP_SIZE; x++) {
        queue.push({x, y: 0});
        visited.add(`${x},0`);
    }
    
    // Bottom edge
    for (let x = 0; x < MAP_SIZE; x++) {
        queue.push({x, y: MAP_SIZE-1});
        visited.add(`${x},${MAP_SIZE-1}`);
    }
    
    // Left edge
    for (let y = 0; y < MAP_SIZE; y++) {
        queue.push({x: 0, y});
        visited.add(`0,${y}`);
    }
    
    // Right edge
    for (let y = 0; y < MAP_SIZE; y++) {
        queue.push({x: MAP_SIZE-1, y});
        visited.add(`${MAP_SIZE-1},${y}`);
    }
    
    // Directions for flood fill
    const directions = [
        {dx: 1, dy: 0},
        {dx: -1, dy: 0},
        {dx: 0, dy: 1},
        {dx: 0, dy: -1}
    ];
    
    // Flood fill from the edge - this marks all tiles reachable from outside
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
    
    // Now any tile that is not visited and not a wall is inside an enclosure
    // Claim these tiles for the kingdom
    let claimedTiles = 0;
    
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const coordKey = `${x},${y}`;
            
            // If not visited and not a wall, it's inside an enclosure
            if (!visited.has(coordKey) && !wallCoords.has(coordKey)) {
                // Only claim if not already claimed by another kingdom
                if (gameState.map[y][x].territory === null || gameState.map[y][x].territory === kingdomId) {
                    gameState.map[y][x].territory = kingdomId;
                    claimedTiles++;
                }
            }
        }
    }
    
    if (claimedTiles > 0) {
        console.log(`Claimed ${claimedTiles} tiles within walls for kingdom ${kingdomId}`);
        showMessage(`Expanded your territory by claiming ${claimedTiles} enclosed tiles!`);
    }
}

// Check if a wall has become redundant after a new wall is built
function checkRedundantWalls(kingdomId) {
    // Re-enable the wall removal functionality
    const kingdom = gameState.kingdoms[kingdomId];
    if (!kingdom) return false;
    
    // Get all wall coordinates
    const wallCoords = new Set();
    for (const wall of kingdom.wallPerimeter) {
        wallCoords.add(`${wall.x},${wall.y}`);
    }
    
    // Get territory coordinates
    const territoryCoords = new Set();
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            if (gameState.map[y][x].territory === kingdomId) {
                territoryCoords.add(`${x},${y}`);
            }
        }
    }
    
    // Identify redundant walls - focusing on walls that have territory on both sides
    const redundantWalls = [];
    
    // Define directions for neighbor checking
    const directions = [
        {dx: 1, dy: 0}, {dx: -1, dy: 0}, {dx: 0, dy: 1}, {dx: 0, dy: -1}
    ];
    
    for (const wall of kingdom.wallPerimeter) {
        // Count territories on each side
        let territoriesAround = 0;
        let wallsAround = 0;
        
        for (const {dx, dy} of directions) {
            const nx = wall.x + dx;
            const ny = wall.y + dy;
            
            // Skip if out of bounds
            if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) {
                continue;
            }
            
            // Check if this tile belongs to the same kingdom
            if (gameState.map[ny][nx].territory === kingdomId) {
                territoriesAround++;
            }
            
            // Check if this tile is another wall of the same kingdom
            if (gameState.map[ny][nx].isWall && gameState.map[ny][nx].territory === kingdomId) {
                wallsAround++;
            }
        }
        
        // Wall is likely redundant if surrounded by kingdom territory or other walls
        if (territoriesAround >= 2 || (territoriesAround >= 1 && wallsAround >= 2)) {
            // Additional check: make sure this wall isn't on the outer perimeter
            // A wall is on the outer perimeter if it has at least one non-kingdom tile adjacent
            let isOuterPerimeter = false;
            
            for (const {dx, dy} of directions) {
                const nx = wall.x + dx;
                const ny = wall.y + dy;
                
                // Skip if out of bounds
                if (nx < 0 || nx >= MAP_SIZE || ny < 0 || ny >= MAP_SIZE) {
                    isOuterPerimeter = true;
                    break;
                }
                
                // If adjacent tile is not kingdom's territory or wall, this is outer perimeter
                if (gameState.map[ny][nx].territory !== kingdomId && !gameState.map[ny][nx].isWall) {
                    isOuterPerimeter = true;
                    break;
                }
            }
            
            // Only mark as redundant if not on outer perimeter
            if (!isOuterPerimeter) {
                redundantWalls.push(wall);
            }
        }
    }
    
    // Limit the number of walls we remove at once to prevent large changes
    const wallsToRemove = redundantWalls.slice(0, 5); // Allow removing up to 5 walls at once
    
    // Remove redundant walls
    for (const wall of wallsToRemove) {
        if (kingdomId === 0) {
            // For player walls, remove from buildings array
            const wallBuildingIndex = gameState.buildings.findIndex(b => 
                b.x === wall.x && b.y === wall.y && b.type === 'WALL');
                
            if (wallBuildingIndex !== -1) {
                gameState.buildings.splice(wallBuildingIndex, 1);
            }
            
            // Give back some resources (half the cost) to player only
            gameState.resources.wood += Math.floor(BUILDING_TYPES.WALL.woodCost / 2);
            gameState.resources.stone += Math.floor(BUILDING_TYPES.WALL.stoneCost / 2);
        } else {
            // For enemy walls, remove from enemyBuildings
            const wallBuildingIndex = gameState.enemyBuildings.findIndex(b => 
                b.x === wall.x && b.y === wall.y && b.type === 'WALL' && b.kingdomId === kingdomId);
                
            if (wallBuildingIndex !== -1) {
                gameState.enemyBuildings.splice(wallBuildingIndex, 1);
            }
        }
        
        // Remove from map
        const mapTile = gameState.map[wall.y][wall.x];
        mapTile.building = null;
        mapTile.isWall = false;
        
        // Remove from kingdom walls
        const wallIndex = kingdom.wallPerimeter.findIndex(w => w.x === wall.x && w.y === wall.y);
        if (wallIndex !== -1) {
            kingdom.wallPerimeter.splice(wallIndex, 1);
        }
    }
    
    if (wallsToRemove.length > 0) {
        console.log(`Removed ${wallsToRemove.length} redundant walls from kingdom ${kingdomId}`);
        
        // Only show a message to the player if it's their kingdom
        if (kingdomId === 0) {
            showMessage(`${wallsToRemove.length} adet iç duvar, artık gerekli olmadığı için kaldırıldı.`);
        }
    }
    
    return wallsToRemove.length > 0;
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

// Export functions for other modules
window.drawBuilding = drawBuilding;
window.drawWall = drawWall;
window.buildStructure = buildStructure;
window.buildHouse = buildHouse;
window.buildBarracks = buildBarracks;
window.buildMill = buildMill;
window.buildTower = buildTower;
window.buildWall = buildWall;
window.startSoldierTraining = startSoldierTraining;
window.updateSoldierTraining = updateSoldierTraining;
window.checkRedundantWalls = checkRedundantWalls; 