// enemies.js - Enemy AI, enemy kingdoms, combat mechanics

// Initialize variable to track the latest enemy ID
let lastEnemyId = 0;

// Function to generate a unique enemy ID
function generateEnemyId() {
    lastEnemyId++;
    return lastEnemyId;
}

// Initialize kingdoms across the map
function initializeKingdoms() {
    // Initialize kingdoms array
    gameState.kingdoms = [];
    gameState.enemies = [];
    gameState.enemyBuildings = [];
    
    // Reset enemy ID counter when initializing kingdoms
    lastEnemyId = 0;
    
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
        
        // Create the enemy
        const enemyType = Math.random() < 0.7 ? 'WARRIOR' : 'ARCHER';
        const enemyInfo = ENEMY_TYPES[enemyType];
        
        const enemy = {
            id: generateEnemyId(),
            x: kingdomX,
            y: kingdomY,
            type: enemyType,
            health: enemyInfo.health,
            attack: enemyInfo.attack,
            lastMoved: 0,
            moveDelay: enemyInfo.speed * 1000, // FIX: Replace 1000 / enemyInfo.speed with enemyInfo.speed * 1000
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

// Update enemy movement and behavior
function updateEnemies(deltaTime) {
    for (const enemy of gameState.enemies) {
        // Check if this enemy is in gathering mode, handle separately
        if (enemy.isGathering || enemy.returningToCapital) {
            updateEnemyGathering(enemy, deltaTime);
            continue;
        }
        
        // Add elapsed time to enemy's last moved time
        enemy.lastMoved += deltaTime * 1000; // FIX: Multiply deltaTime by 1000 to convert to milliseconds
        
        // Only move if enough time has passed
        if (enemy.lastMoved > enemy.moveDelay) {
            enemy.lastMoved = 0;
            
            // Get the enemy's kingdom for territory checking
            const kingdom = gameState.kingdoms[enemy.kingdomId];
            
            // Check diplomatic relations - only enemies should attack
            const kingdomFactionId = getKingdomFactionId(enemy.kingdomId);
            const isEnemyFaction = !kingdomFactionId || 
                (diplomacySystem && diplomacySystem.factions[kingdomFactionId] && 
                 diplomacySystem.factions[kingdomFactionId].relation === 'enemy');
            
            // Check for nearby enemies from other kingdoms to potentially attack
            const nearbyEnemies = findNearbyEnemies(enemy);
            const targetEnemy = selectEnemyTarget(enemy, nearbyEnemies);
            
            // If there's a valid enemy kingdom target, potentially engage
            if (targetEnemy && !enemy.attackPath) {
                if (Math.random() < 0.6) { // 60% chance to engage in inter-kingdom combat
                    createEnemyAttackPathToTarget(enemy, targetEnemy);
                }
            }
            
            // If enemy has an attack path to another enemy, follow it
            if (enemy.targetEnemyPath && enemy.targetEnemyPath.length > 0 && enemy.targetEnemyPathIndex < enemy.targetEnemyPath.length) {
                const nextPos = enemy.targetEnemyPath[enemy.targetEnemyPathIndex];
                const nextTile = gameState.map[nextPos.y][nextPos.x];
                
                // Only move to next position if it's not blocked by a building
                if (!nextTile.building || (nextTile.territory === enemy.kingdomId)) {
                    enemy.x = nextPos.x;
                    enemy.y = nextPos.y;
                    enemy.targetEnemyPathIndex++;
                    
                    // Check if enemy is adjacent to target enemy and can attack
                    const targetEnemyStillExists = gameState.enemies.find(e => e.id === enemy.targetEnemyId);
                    if (targetEnemyStillExists) {
                        const dx = Math.abs(enemy.x - targetEnemyStillExists.x);
                        const dy = Math.abs(enemy.y - targetEnemyStillExists.y);
                        
                        if (dx <= 1 && dy <= 1) {
                            // Enemy attacks other enemy
                            attackEnemyKingdom(enemy, targetEnemyStillExists);
                            
                            // Clear attack path after reaching target enemy
                            enemy.targetEnemyPath = null;
                            enemy.targetEnemyPathIndex = 0;
                            enemy.targetEnemyId = null;
                        }
                    } else {
                        // Target enemy no longer exists, clear the path
                        enemy.targetEnemyPath = null;
                        enemy.targetEnemyPathIndex = 0;
                        enemy.targetEnemyId = null;
                    }
                    
                    continue; // Skip other movement logic
                } else {
                    // Path is blocked, clear and continue with normal behavior
                    enemy.targetEnemyPath = null;
                    enemy.targetEnemyPathIndex = 0;
                    enemy.targetEnemyId = null;
                }
            }
            
            // Handle attack path following for enemies targeting the player, only if they're from enemy factions
            if (isEnemyFaction && enemy.attackPath && enemy.attackPath.length > 0 && enemy.attackPathIndex < enemy.attackPath.length) {
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
            const baseAggressionDistance = 25; // Arttırıldı: 15 -> 25 (düşmanların daha uzaktan saldırgan olması)
            
            // Make enemies more likely to become aggressive as game progresses
            const gameTime = gameState.gameYear / 10; // Her 10 yıl 1 dakika olarak hesaplanıyor
            const timeBasedAggressionBonus = Math.min(15, gameTime / 1.5); // Arttırıldı: 10 -> 15 (zaman geçtikçe daha agresif)
            
            // Soldiers from barracks are naturally more aggressive (higher awareness range)
            const soldierAwarenessBonus = enemy.type && (enemy.type === 'WARRIOR' || enemy.type === 'ARCHER') ? 15 : 0; // Arttırıldı: 10 -> 15
            
            // Calculate final aggression distance
            const finalAggressionDistance = baseAggressionDistance + timeBasedAggressionBonus + soldierAwarenessBonus;
            
            // Check if enemy is significantly weaker than player and should flee
            const shouldFlee = isEnemyFaction && distToPlayer < finalAggressionDistance && calculateRelativeStrength(enemy) < 0.6; // Değiştirildi: 0.8 -> 0.6 (düşmanlar daha az kaçacak)
            
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
                // Only enemy factions become aggressive toward player
                if (isEnemyFaction && (distToPlayer < finalAggressionDistance || enemy.isTargetingPlayer)) {
                    enemy.isAggressive = true;
                    
                    // Soldiers have a chance to create a direct path to player when activated
                    if ((enemy.type === 'WARRIOR' || enemy.type === 'ARCHER') && Math.random() < 0.9) { // Arttırıldı: 0.7 -> 0.9
                        createEnemyAttackPath(enemy);
                    }
                }
                
                // Also small random chance to become aggressive regardless of distance, only for enemy factions
                if (isEnemyFaction && Math.random() < 0.05) { // Arttırıldı: 0.01 -> 0.05
                    enemy.isAggressive = true;
                }
            }
            
            // If aggressive and not fleeing, target player
            if (enemy.isAggressive && !enemy.isFleeing) {
                // If this enemy is targeting player but doesn't have a path, create one sometimes
                if (enemy.isTargetingPlayer && !enemy.attackPath && Math.random() < 0.3) { // Arttırıldı: 0.1 -> 0.3
                    createEnemyAttackPath(enemy);
                }
                
                // Add some randomness to aggressive enemies to make them less predictable
                const targetingRandomness = enemy.type === 'WARRIOR' ? 0.05 : 0.1; // Azaltıldı: 0.1/0.2 -> 0.05/0.1 (daha az rastgele hareket)
                
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
                if (Math.random() < 0.25) { // Arttırıldı: 0.1 -> 0.25
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
                    // Only attack player's buildings if from enemy faction
                    if (tile.territory === 0 && isEnemyFaction) {
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
                    } else if (tile.territory !== enemy.kingdomId) {
                        // Enemy is attacking another enemy kingdom's building
                        const enemyBuilding = gameState.enemyBuildings.find(b => b.x === newX && b.y === newY);
                        
                        if (enemyBuilding && areKingdomsHostile(enemy.kingdomId, enemyBuilding.kingdomId)) {
                            // Attack the enemy building
                            attackEnemyBuilding(enemy, enemyBuilding);
                        } else {
                            // Move to this tile (neutral building or ally)
                            enemy.x = newX;
                            enemy.y = newY;
                        }
                    }
                } else {
                    // Check if moving to player's position without a building
                    if (newX === gameState.player.x && newY === gameState.player.y && isEnemyFaction) {
                        // Enemy attacks player directly
                        enemyAttackPlayer(enemy);
                    } else {
                        // Check if moving onto another enemy's position
                        const enemyOnTile = gameState.enemies.find(e => 
                            e.id !== enemy.id && 
                            e.x === newX && 
                            e.y === newY
                        );
                        
                        if (enemyOnTile && areKingdomsHostile(enemy.kingdomId, enemyOnTile.kingdomId)) {
                            // Attack the enemy
                            attackEnemyKingdom(enemy, enemyOnTile);
                        } else {
                            // Safe to move
                            enemy.x = newX;
                            enemy.y = newY;
                        }
                    }
                }
            }
        }
    }
}

// Find nearby enemies from other kingdoms
function findNearbyEnemies(enemy) {
    const searchRadius = 15; // How far to look for other enemies
    
    return gameState.enemies.filter(e => {
        // Don't include self or allies
        if (e.id === enemy.id || e.kingdomId === enemy.kingdomId) {
            return false;
        }
        
        // Check if kingdoms are hostile to each other
        if (!areKingdomsHostile(enemy.kingdomId, e.kingdomId)) {
            return false;
        }
        
        // Check distance
        const dx = Math.abs(e.x - enemy.x);
        const dy = Math.abs(e.y - enemy.y);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= searchRadius;
    });
}

// Select an enemy to target based on proximity, strength, etc.
function selectEnemyTarget(enemy, nearbyEnemies) {
    if (nearbyEnemies.length === 0) {
        return null;
    }
    
    // If there are nearby enemies, choose one based on proximity and strength
    nearbyEnemies.sort((a, b) => {
        // Calculate distance
        const distA = Math.sqrt(Math.pow(a.x - enemy.x, 2) + Math.pow(a.y - enemy.y, 2));
        const distB = Math.sqrt(Math.pow(b.x - enemy.x, 2) + Math.pow(b.y - enemy.y, 2));
        
        // Prioritize closer enemies
        return distA - distB;
    });
    
    return nearbyEnemies[0];
}

// Create a path to attack another enemy
function createEnemyAttackPathToTarget(enemy, targetEnemy) {
    // Create a path to the target enemy's current location
    const pathToEnemy = [];
    let currentX = enemy.x;
    let currentY = enemy.y;
    
    const targetX = targetEnemy.x;
    const targetY = targetEnemy.y;
    
    // Simple direct path (could be improved with pathfinding)
    while (currentX !== targetX || currentY !== targetY) {
        if (currentX < targetX) currentX++;
        else if (currentX > targetX) currentX--;
        
        if (currentY < targetY) currentY++;
        else if (currentY > targetY) currentY--;
        
        pathToEnemy.push({x: currentX, y: currentY});
        
        // Limit path length
        if (pathToEnemy.length > 20) break;
    }
    
    // Store target enemy ID for later reference
    enemy.targetEnemyId = targetEnemy.id;
    enemy.targetEnemyPath = pathToEnemy;
    enemy.targetEnemyPathIndex = 0;
}

// Attack an enemy from another kingdom
function attackEnemyKingdom(attacker, defender) {
    // Don't attack allies
    if (!areKingdomsHostile(attacker.kingdomId, defender.kingdomId)) {
        return;
    }
    
    // Calculate attack damage based on attacker's type
    const attackerInfo = ENEMY_TYPES[attacker.type];
    const attackDamage = attackerInfo.attack;
    
    // Add some randomness to damage
    const finalDamage = Math.floor(attackDamage * (0.8 + Math.random() * 0.4));
    
    // Apply damage to defender
    defender.health -= finalDamage;
    
    // Show message if player is nearby
    const playerIsNearby = Math.abs(gameState.player.x - attacker.x) <= 15 && 
                           Math.abs(gameState.player.y - attacker.y) <= 15;
    
    if (playerIsNearby) {
        const attackerKingdom = getKingdomFactionId(attacker.kingdomId) || `Kingdom ${attacker.kingdomId}`;
        const defenderKingdom = getKingdomFactionId(defender.kingdomId) || `Kingdom ${defender.kingdomId}`;
        
        showMessage(`${attackerKingdom} attacks ${defenderKingdom}!`);
    }
    
    // Check if defender is defeated
    if (defender.health <= 0) {
        // Remove the defender from the game
        const defenderIndex = gameState.enemies.findIndex(e => e.id === defender.id);
        if (defenderIndex !== -1) {
            gameState.enemies.splice(defenderIndex, 1);
        }
        
        // Show message if player is nearby
        if (playerIsNearby) {
            const attackerKingdom = getKingdomFactionId(attacker.kingdomId) || `Kingdom ${attacker.kingdomId}`;
            const defenderKingdom = getKingdomFactionId(defender.kingdomId) || `Kingdom ${defender.kingdomId}`;
            
            showMessage(`${attackerKingdom} defeated a soldier from ${defenderKingdom}!`);
        }
    }
}

// Attack an enemy kingdom's building
function attackEnemyBuilding(enemy, building) {
    // Don't attack allies
    if (!areKingdomsHostile(enemy.kingdomId, building.kingdomId)) {
        return;
    }
    
    // Calculate damage
    const attackDamage = ENEMY_TYPES[enemy.type].attack;
    
    // Apply damage
    building.health -= attackDamage;
    
    // Show message if player is nearby
    const playerIsNearby = Math.abs(gameState.player.x - enemy.x) <= 15 && 
                           Math.abs(gameState.player.y - enemy.y) <= 15;
    
    if (playerIsNearby) {
        const attackerKingdom = getKingdomFactionId(enemy.kingdomId) || `Kingdom ${enemy.kingdomId}`;
        const defenderKingdom = getKingdomFactionId(building.kingdomId) || `Kingdom ${building.kingdomId}`;
        
        showMessage(`${attackerKingdom} attacks a building of ${defenderKingdom}!`);
    }
    
    // Check if building is destroyed
    if (building.health <= 0) {
        // Remove building from map
        const tile = gameState.map[building.y][building.x];
        tile.building = null;
        
        // Remove from enemy buildings array
        const buildingIndex = gameState.enemyBuildings.findIndex(b => 
            b.x === building.x && b.y === building.y && b.kingdomId === building.kingdomId
        );
        
        if (buildingIndex !== -1) {
            gameState.enemyBuildings.splice(buildingIndex, 1);
        }
        
        // Show message if player is nearby
        if (playerIsNearby) {
            const attackerKingdom = getKingdomFactionId(enemy.kingdomId) || `Kingdom ${enemy.kingdomId}`;
            const defenderKingdom = getKingdomFactionId(building.kingdomId) || `Kingdom ${building.kingdomId}`;
            
            showMessage(`${attackerKingdom} destroyed a building of ${defenderKingdom}!`);
        }
    }
}

// Check if two kingdoms are hostile to each other
function areKingdomsHostile(kingdomId1, kingdomId2) {
    // Get faction IDs for the kingdoms
    const factionId1 = getKingdomFactionId(kingdomId1);
    const factionId2 = getKingdomFactionId(kingdomId2);
    
    // If either faction doesn't exist or isn't mapped, assume neutral (not hostile)
    if (!factionId1 || !factionId2 || !diplomacySystem) {
        // Default chance of hostility for unmapped kingdoms (30%)
        return Math.random() < 0.3;
    }
    
    // Get faction data
    const faction1 = diplomacySystem.factions[factionId1];
    const faction2 = diplomacySystem.factions[factionId2];
    
    if (!faction1 || !faction2) {
        // Default chance if faction data is missing
        return Math.random() < 0.3;
    }
    
    // HATA DÜZELTME: Müttefikler (allies) birbirlerine saldırmamalı
    // İki krallık da müttefik ise, asla düşmanca olmamalılar
    if (faction1.relation === 'ally' && faction2.relation === 'ally') {
        return false;
    }
    
    // Check relations - enemies are hostile to each other
    if (faction1.relation === 'enemy' && faction2.relation === 'enemy') {
        // Two enemy factions have a high chance of being hostile to each other
        return Math.random() < 0.7;
    }
    
    // If one is an ally and one is an enemy, they should be hostile
    if ((faction1.relation === 'ally' && faction2.relation === 'enemy') ||
        (faction1.relation === 'enemy' && faction2.relation === 'ally')) {
        return true;
    }
    
    // Check for direct war declaration in treaties
    const warTreaty = diplomacySystem.treaties.find(treaty => 
        treaty.type === 'war' && 
        ((treaty.parties.includes(factionId1) && treaty.parties.includes(factionId2)) ||
         (treaty.parties.includes(factionId1) && treaty.targetFaction === factionId2) ||
         (treaty.parties.includes(factionId2) && treaty.targetFaction === factionId1))
    );
    
    if (warTreaty) {
        return true;
    }
    
    // Allies or neutrals have a small chance of conflict
    // HATA DÜZELTME: Tarafsızlar (neutral) arasında düşük olasılık çatışma olabilir
    if (faction1.relation === 'neutral' && faction2.relation === 'neutral') {
        return Math.random() < 0.1;
    }
    
    // Varsayılan olarak krallıklar düşmanca değil
    return false;
}

// Helper function to map kingdom ID to faction ID
function getKingdomFactionId(kingdomId) {
    // Map kingdom IDs to faction IDs
    const kingdomToFaction = {
        1: 'northern-tribe',
        2: 'eastern-empire',
        3: 'western-kingdom'
    };
    
    return kingdomToFaction[kingdomId] || null;
}

// Enemy attacks player
function enemyAttackPlayer(enemy) {
    // Get base attack from enemy type
    const baseAttack = ENEMY_TYPES[enemy.type].attack;
    
    // Scale attack based on in-game progression (enemies get stronger as time passes)
    // HATA DÜZELTME: gameState.gameTime değişkeni tanımlı değil, bunun yerine gameState.gameYear kullanılmalı
    // const gameTimeMinutes = gameState.gameTime / (60 * 1000);
    const gameTimeMinutes = gameState.gameYear / 10; // Her 10 yıl 1 dakika sayılsın
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
    
    // Each soldier reduces
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
            id: generateEnemyId(),
            x: enemyX,
            y: enemyY,
            type: enemyType,
            health: enemyInfo.health,
            attack: enemyInfo.attack,
            lastMoved: 0,
            moveDelay: enemyInfo.speed * 1000, // FIX: Replace 1000 / enemyInfo.speed with enemyInfo.speed * 1000
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

// Update enemy kingdoms (gather resources and expand)
function updateEnemyKingdoms(deltaTime) {
    // Only update every few seconds to save performance
    if (!gameState.lastKingdomUpdate) {
        gameState.lastKingdomUpdate = 0;
    }
    
    gameState.lastKingdomUpdate += deltaTime * 1000; // Convert deltaTime to milliseconds
    
    // Update enemy kingdoms every 1 second
    if (gameState.lastKingdomUpdate > 1000) {
        gameState.lastKingdomUpdate = 0;
        
        // Skip player kingdom (id 0)
        for (let i = 1; i < gameState.kingdoms.length; i++) {
            const kingdom = gameState.kingdoms[i];
            
            // First, decide kingdom priorities for this update cycle
            const kingdomEnemies = gameState.enemies.filter(e => e.kingdomId === kingdom.id);
            const gatherers = kingdomEnemies.filter(e => e.isGathering || e.returningToCapital);
            
            // Get resource info
            const lowOnWood = kingdom.resources.wood < 40;
            const lowOnStone = kingdom.resources.stone < 30;
            const lowOnFood = kingdom.resources.food < 25;
            
            // Check if any kingdom walls are broken
            const hasWallDamage = kingdom.wallsToRepair && kingdom.wallsToRepair.length > 0;
            
            // Resource gathering priority
            let resourceGatheringChance = 0.4; // Base chance
            
            // Increase chance if low on resources
            if (lowOnWood || lowOnStone || lowOnFood) {
                resourceGatheringChance = 0.7;
            }
            
            // Increase further if very low on multiple resources
            if ((lowOnWood && lowOnStone) || (lowOnWood && lowOnFood) || (lowOnStone && lowOnFood)) {
                resourceGatheringChance = 0.9;
            }
            
            // First priority: Repair walls if under attack
            if (hasWallDamage) {
                repairWalls(kingdom);
            }
            
            // Second priority: Gather resources if needed
            // Calculate how many gatherers to dispatch
            const desiredGatherers = Math.min(
                Math.max(1, Math.floor(kingdomEnemies.length * 0.4)), // Up to 40% of kingdom population
                3 // Maximum 3 gatherers at once
            );
            
            // Find how many more gatherers we need
            const neededGatherers = Math.max(0, desiredGatherers - gatherers.length);
            
            // Send enemies to gather resources based on need
            for (let g = 0; g < neededGatherers; g++) {
                if (Math.random() < resourceGatheringChance) {
                    enemyGatherResources(kingdom);
                }
            }
            
            // Third priority: Build and expand
            // Calculate resource-based chance for construction activities
            const hasGoodResources = kingdom.resources.wood >= 40 && kingdom.resources.stone >= 30;
            
            if (hasGoodResources) {
                // Try to build new buildings
                if (Math.random() < 0.4) { // 40% chance to try building
                    buildEnemyBuilding(kingdom);
                }
                
                // Try to expand territory
                if (Math.random() < 0.3) { // 30% chance to try expanding
                    expandEnemyKingdom(kingdom);
                }
            }
            
            // Passive resource gain (small amount)
            // This represents natural gathering by civilians not shown in-game
            kingdom.resources.wood += 1;
            kingdom.resources.stone += 1;
            kingdom.resources.food += 1;
            
            // Track data for debugging
            if (!kingdom.stats) {
                kingdom.stats = {
                    lastResourceCheck: Date.now(),
                    resourceHistory: []
                };
            }
            
            // Record resource statistics every minute for debugging
            if (Date.now() - kingdom.stats.lastResourceCheck > 60000) {
                kingdom.stats.lastResourceCheck = Date.now();
                kingdom.stats.resourceHistory.push({
                    time: Date.now(),
                    wood: kingdom.resources.wood,
                    stone: kingdom.resources.stone,
                    food: kingdom.resources.food,
                    buildings: gameState.enemyBuildings.filter(b => b.kingdomId === kingdom.id).length,
                    soldiers: kingdomEnemies.filter(e => e.type === 'WARRIOR' || e.type === 'ARCHER').length
                });
                
                // Keep history limited to prevent memory issues
                if (kingdom.stats.resourceHistory.length > 10) {
                    kingdom.stats.resourceHistory.shift();
                }
            }
        }
    }
}

// Function to update enemy gathering behavior
function updateEnemyGathering(enemy, deltaTime) {
    if (!enemy.isGathering && !enemy.returningToCapital) return;
    
    // Track the time since last move
    enemy.lastMoved += deltaTime * 1000; // Convert deltaTime to milliseconds for consistent movement
    
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
                    const gatherAmount = 8 + Math.floor(Math.random() * 7); // 8-15 resources per gather
                    
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
                    if (Math.random() < 0.3) { // 30% chance to deplete resource
                        tile.resource = null;
                    }
                    
                    // Switch to returning mode
                    enemy.isGathering = false;
                    enemy.returningToCapital = true;
                    
                    // Set up return path to capital
                    const homeKingdom = gameState.kingdoms[enemy.kingdomId];
                    
                    // Safety check for valid kingdom
                    if (!homeKingdom) {
                        // Kingdom not found, reset gathering state
                        enemy.isGathering = false;
                        enemy.returningToCapital = false;
                        enemy.gatheringTarget = null;
                        enemy.gatheringPath = null;
                        return;
                    }
                    
                    const pathBackHome = [];
                    const capitalX = homeKingdom.capitalX;
                    const capitalY = homeKingdom.capitalY;
                    
                    // Safety check for valid capital coordinates
                    if (typeof capitalX !== 'number' || typeof capitalY !== 'number' || 
                        isNaN(capitalX) || isNaN(capitalY)) {
                        // Invalid capital coordinates, reset gathering state
                        enemy.isGathering = false;
                        enemy.returningToCapital = false;
                        enemy.gatheringTarget = null;
                        enemy.gatheringPath = null;
                        return;
                    }
                    
                    // Simple path calculation for returning
                    let currentX = enemy.x;
                    let currentY = enemy.y;
                    
                    // Add safety limits to prevent infinite loops
                    const MAX_PATH_LENGTH = 1000;
                    let steps = 0;
                    
                    while ((currentX !== capitalX || currentY !== capitalY) && steps < MAX_PATH_LENGTH) {
                        if (currentX < capitalX) currentX++;
                        else if (currentX > capitalX) currentX--;
                        
                        if (currentY < capitalY) currentY++;
                        else if (currentY > capitalY) currentY--;
                        
                        pathBackHome.push({x: currentX, y: currentY});
                        steps++;
                    }
                    
                    // Safety check for path length
                    if (steps >= MAX_PATH_LENGTH) {
                        console.warn("Enemy path generation exceeded maximum steps, possible invalid capital coordinates:", 
                            {enemyId: enemy.id, enemyPos: {x: enemy.x, y: enemy.y}, capitalPos: {x: capitalX, y: capitalY}});
                        
                        // Reset gathering state
                        enemy.isGathering = false;
                        enemy.returningToCapital = false;
                        enemy.gatheringTarget = null;
                        enemy.gatheringPath = null;
                        return;
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
                
                // Chance to immediately go gather again
                if (Math.random() < 0.7) { // 70% chance to gather again
                    // Get enemy's kingdom
                    const kingdom = gameState.kingdoms[enemy.kingdomId];
                    
                    // Send back to gather again after a short delay
                    setTimeout(() => {
                        enemyGatherResources(kingdom);
                    }, 500);
                }
            }
        }
    }
}

// Build a new building in enemy kingdom
function buildEnemyBuilding(kingdom) {
    // Make sure kingdom has enough resources
    if (kingdom.resources.wood < 30 || kingdom.resources.stone < 20) {
        return; // Not enough resources
    }
    
    // First determine what type of building to construct based on kingdom needs
    let buildingType = '';
    
    // Count existing building types
    const kingdomBuildings = gameState.enemyBuildings.filter(b => b.kingdomId === kingdom.id);
    const houses = kingdomBuildings.filter(b => b.type === 'HOUSE').length;
    const barracks = kingdomBuildings.filter(b => b.type === 'BARRACKS').length;
    const farms = kingdomBuildings.filter(b => b.type === 'MILL').length;
    
    // Calculate current soldier count for this kingdom
    const kingdomSoldierCount = gameState.enemies.filter(e => 
        e.kingdomId === kingdom.id && (e.type === 'WARRIOR' || e.type === 'ARCHER')
    ).length;
    
    // Base soldier limit is 5 + 2 per house
    const soldierLimit = 5 + (houses * 2);
    
    // Prioritize based on needs
    if (houses < 3) {
        // Early game - focus on houses
        buildingType = 'HOUSE';
    } else if (barracks < 1) {
        // Need at least one barracks
        buildingType = 'BARRACKS';
    } else if (kingdom.resources.food < 30 && farms < 2) {
        // Low on food, need farms
        buildingType = 'MILL';
    } else if (kingdomSoldierCount >= soldierLimit * 0.8 && houses < 6) {
        // Need more houses to support population
        buildingType = 'HOUSE';
    } else if (barracks < 2 && kingdom.resources.wood > 60 && kingdom.resources.stone > 40) {
        // Add another barracks if rich in resources
        buildingType = 'BARRACKS';
    } else {
        // Default weighted selection
        const options = [];
        
        // Add options with weighting
        options.push(...Array(3).fill('HOUSE'));
        options.push(...Array(2).fill('BARRACKS'));
        options.push(...Array(2).fill('MILL'));
        
        // Random selection from weighted options
        buildingType = options[Math.floor(Math.random() * options.length)];
    }
    
    // Now find a suitable location for the building
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
                    // Check if this tile is adjacent to existing kingdom territory
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
    
    // If no suitable location found
    if (possibleLocations.length === 0) {
        return;
    }
    
    // Sort locations by distance to capital (prefer closer tiles)
    possibleLocations.sort((a, b) => a.distanceToCapital - b.distanceToCapital);
    
    // Get building location (prefer closer to capital)
    const buildingLocation = possibleLocations[0];
    
    // Check if building type exists in BUILDING_TYPES
    if (!BUILDING_TYPES[buildingType]) {
        console.warn(`Invalid building type: ${buildingType}. Using HOUSE instead.`);
        buildingType = 'HOUSE'; // Fallback to a valid building type
    }
    
    // Get building cost
    const buildingCost = {
        wood: BUILDING_TYPES[buildingType].woodCost,
        stone: BUILDING_TYPES[buildingType].stoneCost
    };
    
    // Check if kingdom has resources for this specific building
    if (kingdom.resources.wood >= buildingCost.wood && 
        kingdom.resources.stone >= buildingCost.stone) {
        
        // Deduct resources
        kingdom.resources.wood -= buildingCost.wood;
        kingdom.resources.stone -= buildingCost.stone;
        
        // Add building to map
        gameState.map[buildingLocation.y][buildingLocation.x].building = buildingType;
        
        // Add to enemy buildings
        const newBuilding = {
            type: buildingType,
            x: buildingLocation.x,
            y: buildingLocation.y,
            owner: 'enemy',
            kingdomId: kingdom.id,
            health: BUILDING_TYPES[buildingType].maxHealth
        };
        
        gameState.enemyBuildings.push(newBuilding);
        
        // If this is a barracks, start training soldiers
        if (buildingType === 'BARRACKS') {
            // Start training after a short delay
            setTimeout(() => {
                startEnemySoldierTraining(kingdom, buildingLocation.x, buildingLocation.y);
            }, 5000);
        }
        
        // Notify if close to player
        const distanceToPlayer = Math.sqrt(
            Math.pow(buildingLocation.x - gameState.player.x, 2) + 
            Math.pow(buildingLocation.y - gameState.player.y, 2)
        );
        
        if (distanceToPlayer < 20) {
            showMessage(`Kingdom ${kingdom.id} has built a ${buildingType}!`);
        }
        
        // Log building activity
        console.log(`Kingdom ${kingdom.id} built a ${buildingType} at (${buildingLocation.x}, ${buildingLocation.y})`);
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
    
    // Define resource priority based on kingdom needs
    let resourcePriority = {};
    
    // Check kingdom resources to determine priority
    if (kingdom.resources.wood < 30) {
        resourcePriority.TREE = 3;
    } else {
        resourcePriority.TREE = 1;
    }
    
    if (kingdom.resources.stone < 20) {
        resourcePriority.STONE = 3;
    } else {
        resourcePriority.STONE = 1;
    }
    
    if (kingdom.resources.food < 25) {
        resourcePriority.BERRY = 3;
    } else {
        resourcePriority.BERRY = 1;
    }
    
    // Search for the nearest resource with priority weighting
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = gameState.map[y][x];
            
            if (tile.resource) {
                // Calculate base distance
                const distance = Math.sqrt(
                    Math.pow(x - forager.x, 2) + 
                    Math.pow(y - forager.y, 2)
                );
                
                // Apply priority weighting (lower priority-adjusted distance means higher chance to gather)
                const priorityWeight = resourcePriority[tile.resource] || 1;
                const adjustedDistance = distance / priorityWeight;
                
                // Find the closest priority-adjusted resource
                if (adjustedDistance < shortestDistance && distance > 0) {
                    shortestDistance = adjustedDistance;
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
        
        // Safety check for valid target coordinates
        if (typeof targetX !== 'number' || typeof targetY !== 'number' || 
            isNaN(targetX) || isNaN(targetY)) {
            console.warn("Invalid target coordinates for resource gathering:", 
                {enemyId: forager.id, target: nearestResource});
            // Reset gathering mode
            forager.isGathering = false;
            forager.gatheringTarget = null;
            return;
        }
        
        // Simple path calculation (can be improved later)
        let currentX = forager.x;
        let currentY = forager.y;
        
        // Add safety limits to prevent infinite loops
        const MAX_PATH_LENGTH = 1000;
        let steps = 0;
        
        while ((currentX !== targetX || currentY !== targetY) && steps < MAX_PATH_LENGTH) {
            if (currentX < targetX) currentX++;
            else if (currentX > targetX) currentX--;
            
            if (currentY < targetY) currentY++;
            else if (currentY > targetY) currentY--;
            
            pathToResource.push({x: currentX, y: currentY});
            steps++;
        }
        
        // Safety check for path length
        if (steps >= MAX_PATH_LENGTH) {
            console.warn("Enemy resource gathering path generation exceeded maximum steps:", 
                {enemyId: forager.id, enemyPos: {x: forager.x, y: forager.y}, targetPos: {x: targetX, y: targetY}});
            
            // Reset gathering mode
            forager.isGathering = false;
            forager.gatheringTarget = null;
            return;
        }
        
        forager.gatheringPath = pathToResource;
        forager.pathIndex = 0;
        forager.lastMoved = 0;
        
        // Slow down movement during gathering
        forager.gatheringMoveDelay = forager.moveDelay * 1.1;
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
    // HATA DÜZELTME: gameState.gameTime değişkeni tanımlı değil, bunun yerine gameState.gameYear kullanılmalı
    // const gameTimeMinutes = gameState.gameTime / (60 * 1000);
    const gameTimeMinutes = gameState.gameYear / 10; // Her 10 yıl 1 dakika olarak hesaplanıyor
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
                    id: generateEnemyId(),
                    x: spawnX,
                    y: spawnY,
                    type: soldierType,
                    health: enemyInfo.health,
                    attack: enemyInfo.attack,
                    lastMoved: 0,
                    moveDelay: enemyInfo.speed * 1000, // FIX: Replace 1000 / enemyInfo.speed with enemyInfo.speed * 1000
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
    
    // Ensure player health is a number
    if (isNaN(gameState.player.health)) {
        gameState.player.health = 100;
    }
    
    // Apply damage to player
    gameState.player.health = Math.max(0, gameState.player.health - finalDamage);
    
    // Update UI
    updateUI();
    
    // Check if player is defeated
    if (gameState.player.health <= 0) {
        showMessage("You have been defeated! Game over.");
        // Game over logic would go here
    }
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

// Expand enemy kingdom territory by adding new walls
function expandEnemyKingdom(kingdom) {
    // Validate kingdom object
    if (!kingdom || typeof kingdom !== 'object') {
        console.warn("Invalid kingdom object passed to expandEnemyKingdom:", kingdom);
        return;
    }

    // Ensure all required properties exist
    if (!kingdom.resources) {
        kingdom.resources = { wood: 50, stone: 40, food: 30 };
    }
    
    if (!kingdom.wallPerimeter) {
        kingdom.wallPerimeter = [];
    }
    
    if (typeof kingdom.lastExpansion !== 'number') {
        kingdom.lastExpansion = Date.now();
    }
    
    if (typeof kingdom.capitalX !== 'number' || typeof kingdom.capitalY !== 'number' ||
        isNaN(kingdom.capitalX) || isNaN(kingdom.capitalY)) {
        console.warn("Kingdom has invalid capital coordinates:", kingdom);
        return; // Cannot expand without valid capital coordinates
    }
    
    if (typeof kingdom.expansionRate !== 'number' || isNaN(kingdom.expansionRate)) {
        kingdom.expansionRate = 0.3 + Math.random() * 0.3; // Default expansion rate
    }

    // Check if enough time has passed since last expansion
    const currentTime = Date.now();
    // Daha hızlı genişleme için gecikmeyi azalt
    if (currentTime - kingdom.lastExpansion < 3000 / kingdom.expansionRate) { // 6000'den 3000'e düşürüldü
        return; // Not enough time has passed
    }
    
    // Kaynak kontrolü yaparak genişleme için yeterli kaynak olduğundan emin ol
    if (kingdom.resources.wood < 30 || kingdom.resources.stone < 20) {
        return; // Genişleme için yeterli kaynak yok, loot yapılmalı
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
            
            // Allow expansion further from capital
            if (distToCapital > 45) continue; // 35'ten 45'e çıkarıldı - daha geniş genişleme
            
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
    const gameTimeMinutes = gameState.gameYear / 10; // Her 10 yıl 1 dakika olarak hesaplanıyor
    // More aggressive expansion in later game
    const baseExpansionSize = 3 + Math.floor(gameTimeMinutes / 4); // Daha yavaş büyüme
    const maxExpansion = Math.min(10, baseExpansionSize); // 20'den 10'a düşürüldü - daha küçük genişlemeler
    
    // Select random expansion size based on kingdom's expansionRate
    const expansionSize = Math.max(3, Math.floor(Math.random() * maxExpansion * kingdom.expansionRate)); // 5'ten 3'e düşürüldü
    
    // Get expansion tiles (up to expansionSize or all available)
    const expansionTiles = outerTiles.slice(0, Math.min(expansionSize, outerTiles.length));
    
    // Kaynak ihtiyacını genişleme için zorunlu yap
    
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
            
            // Make sure kingdom.wallPerimeter exists
            if (!kingdom.wallPerimeter) {
                kingdom.wallPerimeter = [];
            }
            
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
    }
}

// Export functions for other modules
window.initializeKingdoms = initializeKingdoms;
window.drawEnemy = drawEnemy;
window.updateEnemies = updateEnemies;
window.spawnEnemies = spawnEnemies;
window.updateEnemyKingdoms = updateEnemyKingdoms; 