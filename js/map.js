// map.js - Map generation, rendering and coordinate conversion

// Add debug logging at the top of the file
console.log('Map.js loaded');

// Map data structure
let map = [];


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
    
    // Fix for the 6-unit offset issue reported by the user (6 units left and 6 units up)
    const correctedX = tileX + 6;
    const correctedY = tileY + 6;
    
    // Ensure coordinates are within map bounds
    const boundedX = Math.max(0, Math.min(correctedX, MAP_SIZE - 1));
    const boundedY = Math.max(0, Math.min(correctedY, MAP_SIZE - 1));
    
    return { x: boundedX, y: boundedY };
}

// Draw the isometric map
function drawMap() {
    // Clear canvas
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Calculate center offset for drawing
    const centerX = gameCanvas.width / 2;
    const centerY = gameCanvas.height / 6; // Lower the center point to show more of the map
    
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
    
    // Apply the same correction as in screenToIso
    const correctedX = mapX + 6;
    const correctedY = mapY + 6;
    
    // Use corrected coordinates with bounds checking
    const boundedX = Math.max(0, Math.min(correctedX, MAP_SIZE - 1));
    const boundedY = Math.max(0, Math.min(correctedY, MAP_SIZE - 1));
    
    // Center camera on clicked position
    gameState.camera.x = Math.max(0, Math.min(boundedX - Math.floor(VISIBLE_TILES / 2), MAP_SIZE - VISIBLE_TILES));
    gameState.camera.y = Math.max(0, Math.min(boundedY - Math.floor(VISIBLE_TILES / 2), MAP_SIZE - VISIBLE_TILES));
    
    // If shift key is pressed, also move the player
    if (event.shiftKey && boundedX >= 0 && boundedX < MAP_SIZE && boundedY >= 0 && boundedY < MAP_SIZE) {
        gameState.player.x = boundedX;
        gameState.player.y = boundedY;
        gameState.selectedTile = { x: boundedX, y: boundedY };
        showMessage("Teleported to selected location");
    }
}


// Export functions for other modules
window.generateMap = generateMap;
window.isoToScreen = isoToScreen;
window.screenToIso = screenToIso;
window.drawMap = drawMap;
window.drawMinimap = drawMinimap;
window.centerCameraOnPlayer = centerCameraOnPlayer;
window.map = map; 