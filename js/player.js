// player.js - Player movement, controls and interactions
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
    
    // Add soldier attack power with morale and formation bonuses
    let soldierAttackTotal = 0;
    playerSoldiers.forEach(soldier => {
        let soldierAttack = soldier.attack;
        
        // Apply morale bonus if exists
        if (gameState.military && soldier.moraleBonus) {
            soldierAttack *= soldier.moraleBonus;
        }
        
        soldierAttackTotal += soldierAttack;
    });
    
    totalAttack += soldierAttackTotal;
    
    // Attack the first nearby enemy
    const targetEnemy = nearbyEnemies[0];
    targetEnemy.health -= totalAttack;
    
    // Show attack message
    showMessage(`Attacked enemy for ${Math.floor(totalAttack)} damage! (Player: ${playerAttack}, Soldiers: ${Math.floor(soldierAttackTotal)})`);
    
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
        
        // Update military system if it exists
        if (militarySystem) {
            militarySystem.enemyKilled();
        }
        
        showMessage("Enemy defeated! Received resources as reward.");
        
        // If this was the kingdom leader, claim the entire territory
        if (isKingdomLeader) {
            // Claim the whole territory
            claimEnemyKingdomTerritory(defeatedKingdomId);
            
            // Additional reputation bonus in diplomacy system
            if (diplomacySystem) {
                diplomacySystem.changeReputation(10);
            }
        }
        
        updateUI();
    } else {
        // Enemy counterattack
        enemyCounterattack(targetEnemy);
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


// Export functions for other modules
window.drawPlayer = drawPlayer;
window.handleCanvasClick = handleCanvasClick;
window.handleTouchStart = handleTouchStart;
window.handleCanvasTouch = handleCanvasTouch;
window.movePlayer = movePlayer;
window.gatherResource = gatherResource;
window.craftTool = craftTool;
window.attackNearbyEnemies = attackNearbyEnemies; 