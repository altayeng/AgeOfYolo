// ui.js - UI handling, updates and interactions

// Update UI elements
function updateUI() {
    try {
    // Update resource counts
    document.getElementById('wood-count').textContent = Math.floor(gameState.resources.wood);
    document.getElementById('stone-count').textContent = Math.floor(gameState.resources.stone);
    document.getElementById('food-count').textContent = Math.floor(gameState.resources.food);
    document.getElementById('population-count').textContent = `${gameState.population.current}/${gameState.population.max}`;
    
        // Update age display with error handling
        try {
            // Check if AGES array exists and currentAge is a valid index
            if (AGES && typeof gameState.currentAge === 'number' && AGES[gameState.currentAge]) {
    const ageText = translate(AGES[gameState.currentAge].name);
                const currentAgeElement = document.getElementById('current-age');
                if (currentAgeElement && currentAgeElement.querySelector('span')) {
                    currentAgeElement.querySelector('span').textContent = ageText;
                }
            } else {
                console.warn("Could not update age display: AGES array or currentAge invalid", 
                    { AGES: typeof AGES, currentAge: gameState.currentAge });
            }
        } catch (ageError) {
            console.error("Error updating age display:", ageError);
        }
    
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
    
        // Update advance age button tooltip with error handling
        try {
            if (AGES && typeof gameState.currentAge === 'number') {
    const nextAgeIdx = gameState.currentAge + 1;
    if (nextAgeIdx < AGES.length) {
        const buildingsNeeded = AGES[nextAgeIdx].buildingReq - gameState.buildings.length;
        document.getElementById('advance-age').setAttribute('data-cost', 
            `Need ${Math.max(0, buildingsNeeded)} more buildings`);
    } else {
        document.getElementById('advance-age').setAttribute('data-cost', `Max age reached`);
                }
            }
        } catch (advanceAgeError) {
            console.error("Error updating advance age button:", advanceAgeError);
    }

    // If economy system exists, update it with error handling
    if (window.economySystem) {
        try {
            // Ensure the economy object exists in gameState
            if (!gameState.economy) {
                gameState.economy = {
                    gold: 100,
                    taxRate: 5,
                    marketPrices: {
                        wood: 1.0,
                        stone: 1.5,
                        food: 0.8
                    },
                    lastTaxCollection: 0,
                    researchPoints: 0,
                    researching: null,
                    researchProgress: 0,
                    technologies: [],
                    marketTrades: []
                };
            }
        economySystem.updateEconomyUI();
        } catch (economyError) {
            console.error("Error updating economy UI:", economyError);
        }
    }
    
    } catch (error) {
        console.error("Error in updateUI:", error);
    }
}

// Alias for updateUI for compatibility with older code
function updateResourceUI() {
    updateUI();
}

// Show a message to the player
function showMessage(message) {
    // Translate the message
    const translatedMessage = translate(message);
    
    // Get message element
    const messageEl = document.getElementById('game-message');
    
    // Set message text
    messageEl.textContent = translatedMessage;
    
    // Add highlight animation class
    messageEl.classList.add('message-highlight');
    
    // Remove highlight after animation completes
    setTimeout(() => {
        messageEl.classList.remove('message-highlight');
    }, 3000);
    
    // Log message for debugging
    console.log("Message shown:", message, "Translated:", translatedMessage);
}

// Alias for diplomacy.js and other modules that use showGameMessage
function showGameMessage(message) {
    showMessage(message);
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

// Add attack button to UI
function addAttackButton() {
    // No longer needed as attack button is now part of the HTML
    // The button is already in the HTML with the new UI system
}

// Add wall button to UI
function addWallButton() {
    // No longer needed as wall button is now part of the HTML
    // The button is already in the HTML with the new UI system
}

// Initialize expandable menu system
function initializeMenuSystem() {
    // Get menu elements
    const buildingsButton = document.getElementById('buildings-button');
    const actionsButton = document.getElementById('actions-button');
    const buildingsMenu = document.getElementById('buildings-menu');
    const actionsMenu = document.getElementById('actions-menu');
    
    // Economy button
    const economyButton = document.getElementById('economy-button');
    const economyPanel = document.getElementById('economy-panel');
    const closeEconomyButton = document.getElementById('close-economy');
    
    // Diplomacy button
    const diplomacyButton = document.getElementById('diplomacy-button');
    const diplomacyPanel = document.getElementById('diplomacy-panel');
    const closeDiplomacyButton = document.getElementById('close-diplomacy');
    
    // Buildings button click handler
    buildingsButton.addEventListener('click', function() {
        // Toggle buildings menu
        const isActive = buildingsMenu.classList.contains('active');
        
        // Close all menus first
        document.querySelectorAll('.expandable-menu').forEach(menu => {
            menu.classList.remove('active');
        });
        
        // Toggle this menu (only open if it was closed)
        if (!isActive) {
            buildingsMenu.classList.add('active');
        }
    });
    
    // Actions button click handler
    actionsButton.addEventListener('click', function() {
        // Toggle actions menu
        const isActive = actionsMenu.classList.contains('active');
        
        // Close all menus first
        document.querySelectorAll('.expandable-menu').forEach(menu => {
            menu.classList.remove('active');
        });
        
        // Toggle this menu (only open if it was closed)
        if (!isActive) {
            actionsMenu.classList.add('active');
        }
    });

    // Economy button click handler
    economyButton.addEventListener('click', function() {
        // Close any expandable menus
        document.querySelectorAll('.expandable-menu').forEach(menu => {
            menu.classList.remove('active');
        });
        
        // Close diplomacy panel if open
        diplomacyPanel.classList.remove('show');
        
        // Check if economy panel exists
        if (!economyPanel) {
            console.error("Economy panel is not defined in UI.js");
            return;
        }
        
        // Toggle economy panel and make sure it's visible
        economyPanel.classList.toggle('show');
        
        // Ekonomi paneli açıldı mı kontrol et ve log ile bildir
        console.log("Economy panel toggle:", economyPanel.classList.contains('show') ? "opened" : "closed");
        
        // Kaydırma sorununu çözmek için panelin içeriğini seçip stil özelliğini ayarla
        if (economyPanel.classList.contains('show')) {
            const panelContent = economyPanel.querySelector('.panel-content');
            if (panelContent) {
                // Kaydırma davranışını açıkça ayarla
                panelContent.style.overflowY = 'auto';
                panelContent.style.webkitOverflowScrolling = 'touch';
                panelContent.style.touchAction = 'pan-y';
                
                // Dokunmatik kaydırma ayarla
                setupTouchScrolling(economyPanel);
            }
            
            // Update economy UI if panel is visible and economy system exists
            if (window.economySystem && typeof window.economySystem.updateEconomyUI === 'function') {
                console.log("Updating economy UI via window.economySystem");
                window.economySystem.updateEconomyUI();
            } else {
                // Initialize economy system if it's not available
                console.log("Economy system not available, trying to initialize it");
                if (typeof economySystem !== 'undefined') {
                    window.economySystem = economySystem;
                    economySystem.init();
                    economySystem.updateEconomyUI();
                } else {
                    console.error("Economy system not available or updateEconomyUI method missing");
                }
            }
        }
    });
    
    // Close economy panel button
    if (closeEconomyButton) {
        closeEconomyButton.addEventListener('click', function() {
            economyPanel.classList.remove('show');
        });
    }
    
    // Diplomacy button click handler
    diplomacyButton.addEventListener('click', function() {
        // Close any expandable menus
        document.querySelectorAll('.expandable-menu').forEach(menu => {
            menu.classList.remove('active');
        });
        
        // Close economy panel if open
        economyPanel.classList.remove('show');
        
        // Toggle diplomacy panel
        diplomacyPanel.classList.toggle('show');
        
        // Kaydırma sorununu çözmek için panelin içeriğini seçip stil özelliğini ayarla
        if (diplomacyPanel.classList.contains('show')) {
            const panelContent = diplomacyPanel.querySelector('.panel-content');
            if (panelContent) {
                // Kaydırma davranışını açıkça ayarla
                panelContent.style.overflowY = 'auto';
                panelContent.style.webkitOverflowScrolling = 'touch';
                panelContent.style.touchAction = 'pan-y';
                
                // Dokunmatik kaydırma ayarla
                setupTouchScrolling(diplomacyPanel);
            }
            
            // Update diplomacy UI if panel is visible
            if (window.diplomacySystem) {
                diplomacySystem.updateDiplomacyUI();
            }
        }
    });
    
    // Close diplomacy panel button
    if (closeDiplomacyButton) {
        closeDiplomacyButton.addEventListener('click', function() {
            diplomacyPanel.classList.remove('show');
        });
    }
    
    // Click outside to close menus (for mobile)
    document.addEventListener('click', function(event) {
        // Only handle clicks outside menus and buttons
        if (!event.target.closest('.expandable-menu') && 
            !event.target.closest('#buildings-button') && 
            !event.target.closest('#actions-button')) {
            
            // Close all expandable menus
            document.querySelectorAll('.expandable-menu').forEach(menu => {
                menu.classList.remove('active');
            });
        }
    });
    
    // Add click handlers for building buttons
    document.getElementById('build-house').addEventListener('click', () => buildStructure('HOUSE'));
    document.getElementById('build-barracks').addEventListener('click', () => buildStructure('BARRACKS'));
    document.getElementById('build-mill').addEventListener('click', () => buildStructure('MILL'));
    document.getElementById('build-tower').addEventListener('click', () => buildStructure('TOWER'));
    document.getElementById('build-wall').addEventListener('click', buildWall);
    
    // Add click handlers for action buttons
    document.getElementById('gather').addEventListener('click', toggleGatherMode);
    document.getElementById('craft-tool').addEventListener('click', craftTool);
    document.getElementById('advance-age').addEventListener('click', advanceAge);
    
    // Attack button handler
    document.getElementById('attack').addEventListener('click', attackNearbyEnemies);
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
        needBarracks.textContent = window.translate ? window.translate('Need Barracks') : 'Need Barracks';
        needsContainer.appendChild(needBarracks);
    }
    
    if (gameState.military.needsTowers) {
        const needTowers = document.createElement('div');
        needTowers.className = 'military-need';
        needTowers.textContent = window.translate ? window.translate('Need Towers') : 'Need Towers';
        needsContainer.appendChild(needTowers);
    }
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
            showMessage(`${window.translate ? window.translate('Advanced to') : 'Advanced to'} ${window.translate ? window.translate(AGES[nextAgeIdx].name) : AGES[nextAgeIdx].name}!`);
            
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
                missingResources.push(`${woodCost - Math.floor(gameState.resources.wood)} ${window.translate ? window.translate('more wood') : 'more wood'}`);
            }
            if (gameState.resources.food < foodCost) {
                missingResources.push(`${foodCost - Math.floor(gameState.resources.food)} ${window.translate ? window.translate('more food') : 'more food'}`);
            }
            if (gameState.resources.stone < stoneCost) {
                missingResources.push(`${stoneCost - Math.floor(gameState.resources.stone)} ${window.translate ? window.translate('more stone') : 'more stone'}`);
            }
            
            showMessage(`${window.translate ? window.translate('Not enough resources to advance! Need') : 'Not enough resources to advance! Need'} ${missingResources.join(', ')}.`);
        }
    } else {
        const buildingsNeeded = AGES[nextAgeIdx].buildingReq - gameState.buildings.length;
        showMessage(`${window.translate ? window.translate('Need') : 'Need'} ${buildingsNeeded} ${window.translate ? window.translate('more building(s) to advance to') : 'more building(s) to advance to'} ${window.translate ? window.translate(AGES[nextAgeIdx].name) : AGES[nextAgeIdx].name}`);
    }
}

// Toggle gather mode
function toggleGatherMode() {
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
    
    showMessage(window.translate ? window.translate("Gathered resources from surrounding tiles!") : "Gathered resources from surrounding tiles!");
}

// Initialize main menu system
function initializeMainMenu() {
    // Get main menu elements
    const mainMenu = document.getElementById('main-menu');
    const newGameBtn = document.getElementById('new-game-btn');
    const continueBtn = document.getElementById('continue-btn');
    const savedGamesBtn = document.getElementById('saved-games-btn');
    const settingsBtn = document.getElementById('settings-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const closeSettingsBtn = document.getElementById('close-settings');
    const saveSettingsBtn = document.getElementById('save-settings');
    const resetSettingsBtn = document.getElementById('reset-settings');
    
    // Saved games panel
    const savedGamesPanel = document.getElementById('saved-games-panel');
    const closeSavedGamesBtn = document.getElementById('close-saved-games');
    
    // In-game menu elements
    const menuBtn = document.getElementById('menu-button');
    const inGameMenuPanel = document.getElementById('in-game-menu-panel');
    const closeInGameMenuBtn = document.getElementById('close-in-game-menu');
    const resumeGameBtn = document.getElementById('resume-game-btn');
    const saveGameBtn = document.getElementById('save-game-btn');
    const loadGameBtn = document.getElementById('load-game-btn');
    const gameSettingsBtn = document.getElementById('game-settings-btn');
    const exitToMenuBtn = document.getElementById('exit-to-menu-btn');
    
    // Manual save button in top bar
    const saveGameButton = document.getElementById('save-game-button');
    
    // Track if there are unsaved changes
    gameState.hasUnsavedChanges = false;
    
    // Check if there's a saved game
    const hasSavedGame = localStorage.getItem('imperialDawnSaveGame') !== null;
    
    // Enable/disable continue button based on save state
    if (!hasSavedGame) {
        continueBtn.classList.add('disabled');
        continueBtn.setAttribute('disabled', 'disabled');
    }
    
    // New Game button handler
    newGameBtn.addEventListener('click', function() {
        // Hide main menu
        mainMenu.style.display = 'none';
        
        // Initialize a new game
        initGame();
    });
    
    // Continue button handler
    continueBtn.addEventListener('click', function() {
        if (hasSavedGame) {
            // Hide main menu
            mainMenu.style.display = 'none';
            
            // Load the saved game
            loadGame();
        }
    });
    
    // Saved Games button handler
    savedGamesBtn.addEventListener('click', function() {
        // Hide main menu to prevent overlapping
        mainMenu.style.display = 'none';
        
        // Set flag indicating this wasn't opened from within a game
        savedGamesPanel.dataset.openedFromGame = 'false';
        
        // Show saved games panel
        savedGamesPanel.classList.add('active');
        
        // Load and display saved games
        loadSavedGamesList();
    });
    
    // Close saved games panel button
    if (closeSavedGamesBtn) {
        closeSavedGamesBtn.addEventListener('click', function() {
            // Hide saved games panel
            savedGamesPanel.classList.remove('active');
            
            // Check if the panel was opened from within a game or from main menu
            const openedFromGame = savedGamesPanel.dataset.openedFromGame === 'true';
            
            if (openedFromGame || (gameState && gameState.isRunning)) {
                // Panel was opened from within a game or game is already running
                // Just close the panel and return to game
                console.log("Returning to game...");
            } else {
                // Panel was opened from main menu or no game is running
                // Show main menu again
                console.log("Returning to main menu...");
                mainMenu.style.display = 'flex';
            }
        });
    }
    
    // Settings button handler
    settingsBtn.addEventListener('click', function() {
        // Show settings panel
        settingsPanel.classList.add('active');
    });
    
    // Close settings button handler
    closeSettingsBtn.addEventListener('click', function() {
        // Hide settings panel
        settingsPanel.classList.remove('active');
    });
    
    // Save settings button handler
    saveSettingsBtn.addEventListener('click', function() {
        // Save settings
        saveSettings();
        
        // Hide settings panel
        settingsPanel.classList.remove('active');
        
        // Show success message
        showMessage(translate('Settings saved successfully!'));
    });
    
    // Reset settings button handler
    resetSettingsBtn.addEventListener('click', function() {
        // Reset settings to default
        resetSettings();
    });
    
    // Menu button handler
    if (menuBtn) {
        menuBtn.addEventListener('click', function() {
            // Show in-game menu
            inGameMenuPanel.classList.add('active');
        });
    }
    
    // Close in-game menu button handler
    if (closeInGameMenuBtn) {
        closeInGameMenuBtn.addEventListener('click', function() {
            // Hide in-game menu
            inGameMenuPanel.classList.remove('active');
        });
    }
    
    // Resume game button handler
    if (resumeGameBtn) {
        resumeGameBtn.addEventListener('click', function() {
            // Hide in-game menu
            inGameMenuPanel.classList.remove('active');
        });
    }
    
    // Save game button handler (in-game menu)
    if (saveGameBtn) {
        saveGameBtn.addEventListener('click', function() {
            // Save game
            saveGameWithName('game_' + new Date().toISOString());
            
            // Hide in-game menu
            inGameMenuPanel.classList.remove('active');
        });
    }
    
    // Load game button handler
    if (loadGameBtn) {
        loadGameBtn.addEventListener('click', function() {
            // Hide in-game menu
            inGameMenuPanel.classList.remove('active');
            
            // Set a flag indicating this was opened from within the game
            savedGamesPanel.dataset.openedFromGame = 'true';
            
            // Show saved games panel
            savedGamesPanel.classList.add('active');
            
            // Load and display saved games
            loadSavedGamesList();
        });
    }
    
    // Game settings button handler
    if (gameSettingsBtn) {
        gameSettingsBtn.addEventListener('click', function() {
            // Hide in-game menu
            inGameMenuPanel.classList.remove('active');
            
            // Show settings panel
            settingsPanel.classList.add('active');
        });
    }
    
    // Exit to menu button handler
    if (exitToMenuBtn) {
        exitToMenuBtn.addEventListener('click', function() {
            // If there are unsaved changes, confirm with user
            if (gameState.hasUnsavedChanges) {
                const confirmExit = confirm(translate('You have unsaved changes. Are you sure you want to exit to menu?'));
                if (!confirmExit) {
                    return;
                }
            }
            
            // Hide in-game menu
            inGameMenuPanel.classList.remove('active');
            
            // Stop game loop
            gameState.isRunning = false;
            
            // Show main menu
            mainMenu.style.display = 'flex';
        });
    }
    
    // Manual save button handler
    if (saveGameButton) {
        saveGameButton.addEventListener('click', function() {
            // Add saving animation class
            saveGameButton.classList.add('saving');
            
            // Save game with timestamp
            const saveName = 'game_' + new Date().toISOString();
            saveGameWithName(saveName);
            
            // Remove animation class after a delay
            setTimeout(function() {
                saveGameButton.classList.remove('saving');
                saveGameButton.classList.remove('unsaved-changes');
            }, 1000);
        });
    }
}

// Load and display saved games list
function loadSavedGamesList() {
    const savedGamesList = document.getElementById('saved-games-list');
    
    // Clear current list
    savedGamesList.innerHTML = '';
    
    // Get all saved games from localStorage
    const savedGames = getAllSavedGames();
    
    // Check if there are no saved games
    if (savedGames.length === 0) {
        savedGamesList.innerHTML = `<div class="no-saves-message" data-i18n="No saved games found">No saved games found</div>`;
        return;
    }
    
    // Sort saves by date, newest first
    savedGames.sort((a, b) => b.timestamp - a.timestamp);
    
    // Create elements for each saved game
    for (const save of savedGames) {
        const saveItem = document.createElement('div');
        saveItem.className = 'save-item';
        saveItem.setAttribute('data-save-id', save.id);
        
        // Format date and time
        const saveDate = new Date(save.timestamp);
        const formattedDate = saveDate.toLocaleDateString();
        const formattedTime = saveDate.toLocaleTimeString();
        
        // Calculate game age
        const gameAge = save.gameTime ? `Year ${Math.floor(save.gameTime)}` : 'New Game';
        
        // Create save item HTML
        saveItem.innerHTML = `
            <div class="save-icon">
                <i class="material-icons-round">save</i>
            </div>
            <div class="save-details">
                <div class="save-name">${formattedDate}</div>
                <div class="save-info">
                    <div class="save-info-item">
                        <i class="material-icons-round">access_time</i>
                        <span>${formattedTime}</span>
                    </div>
                    <div class="save-info-item">
                        <i class="material-icons-round">calendar_month</i>
                        <span>${gameAge}</span>
                    </div>
                </div>
            </div>
            <div class="save-actions">
                <button class="save-action load-action" data-action="load" data-save-id="${save.id}">
                    <i class="material-icons-round">play_arrow</i>
                </button>
                <button class="save-action delete-action" data-action="delete" data-save-id="${save.id}">
                    <i class="material-icons-round">delete</i>
                </button>
            </div>
        `;
        
        // Append to list
        savedGamesList.appendChild(saveItem);
    }
    
    // Add event listeners for load and delete buttons
    const loadButtons = document.querySelectorAll('.save-action[data-action="load"]');
    const deleteButtons = document.querySelectorAll('.save-action[data-action="delete"]');
    
    loadButtons.forEach(button => {
        button.addEventListener('click', function() {
            const saveId = this.getAttribute('data-save-id');
            loadSavedGameById(saveId);
        });
    });
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const saveId = this.getAttribute('data-save-id');
            deleteSavedGameById(saveId);
        });
    });
}

// Get all saved games from localStorage
function getAllSavedGames() {
    const savedGames = [];
    
    // Loop through all localStorage items
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        // Check if item is a saved game
        if (key.startsWith('imperialDawnSave_')) {
            try {
                const saveData = JSON.parse(localStorage.getItem(key));
                const saveId = key.replace('imperialDawnSave_', '');
                
                // Add ID to save data
                saveData.id = saveId;
                
                // Add to list
                savedGames.push(saveData);
            } catch (error) {
                console.error('Error parsing saved game:', error);
            }
        }
    }
    
    return savedGames;
}

// Save game with name
function saveGameWithName(saveName) {
    try {
        // Prepare save data
        const saveData = {
            player: {
                x: gameState.player.x,
                y: gameState.player.y,
                health: gameState.player.health
            },
            resources: {
                wood: gameState.resources.wood,
                stone: gameState.resources.stone,
                food: gameState.resources.food
            },
            buildings: gameState.buildings.map(building => ({
                type: building.type,
                x: building.x,
                y: building.y,
                health: building.health
            })),
            enemies: gameState.enemies.map(enemy => ({
                type: enemy.type,
                x: enemy.x,
                y: enemy.y,
                health: enemy.health
            })),
            military: gameState.military ? {
                attack: gameState.military.attack,
                defense: gameState.military.defense,
                trainingSpeed: gameState.military.trainingSpeed,
                range: gameState.military.range,
                barracksCount: gameState.military.barracksCount,
                towerCount: gameState.military.towerCount,
                attackBonus: gameState.military.attackBonus,
                defenseBonus: gameState.military.defenseBonus,
                needsBarracks: gameState.military.needsBarracks,
                needsTowers: gameState.military.needsTowers
            } : null,
            economy: gameState.economy ? {
                gold: gameState.economy.gold,
                taxRate: gameState.economy.taxRate,
                marketPrices: gameState.economy.marketPrices,
                lastTaxCollection: gameState.economy.lastTaxCollection,
                researchPoints: gameState.economy.researchPoints,
                researching: gameState.economy.researching,
                researchProgress: gameState.economy.researchProgress,
                technologies: gameState.economy.technologies,
                marketTrades: gameState.economy.marketTrades
            } : null,
            // Save kingdoms data
            kingdoms: gameState.kingdoms ? gameState.kingdoms.map(kingdom => ({
                id: kingdom.id,
                name: kingdom.name,
                color: kingdom.color,
                territory: kingdom.territory,
                capitalX: kingdom.capitalX,
                capitalY: kingdom.capitalY,
                resources: {
                    wood: kingdom.resources?.wood || 50,
                    stone: kingdom.resources?.stone || 40,
                    food: kingdom.resources?.food || 30
                },
                expansionRate: kingdom.expansionRate || 0.3,
                lastExpansion: kingdom.lastExpansion || 0,
                wallPerimeter: Array.isArray(kingdom.wallPerimeter) ? kingdom.wallPerimeter : []
            })) : [],
            // Save diplomacy data
            diplomacy: window.diplomacySystem ? {
                reputation: window.diplomacySystem.reputation,
                factions: window.diplomacySystem.factions,
                treaties: window.diplomacySystem.treaties
            } : null,
            currentAge: gameState.currentAge,
            gameTime: gameState.gameTime,
            timestamp: Date.now(),
            population: {
                current: gameState.population.current,
                max: gameState.population.max,
                soldiers: gameState.population.soldiers
            }
        };
        
        // Save with unique name
        const saveKey = 'imperialDawnSave_' + saveName;
        localStorage.setItem(saveKey, JSON.stringify(saveData));
        
        // Also save to default location for compatibility
        localStorage.setItem('imperialDawnSaveGame', JSON.stringify(saveData));
        
        // Reset unsaved changes flag
        gameState.hasUnsavedChanges = false;
        
        // Show success message
        showMessage(translate('Game saved successfully!'));
        
        // Log save details for debugging
        console.log("Game saved successfully with name:", saveName);
        console.log("Save data size:", JSON.stringify(saveData).length, "bytes");
        
        return true;
    } catch (error) {
        console.error('Error saving game:', error);
        showMessage(translate('Failed to save game: ') + error.message);
        return false;
    }
}

// Load saved game by ID
function loadSavedGameById(saveId) {
    try {
        // Get saved data from localStorage
        const saveKey = 'imperialDawnSave_' + saveId;
        const saveDataString = localStorage.getItem(saveKey);
        
        if (!saveDataString) {
            showMessage(translate('Save file not found!'));
            return false;
        }
        
        // Parse save data
        const saveData = JSON.parse(saveDataString);
        
        const mainMenu = document.getElementById('main-menu');
        // Hide main menu only if it's currently visible
        if (mainMenu && mainMenu.style.display === 'flex') {
            mainMenu.style.display = 'none';
        }
        
        // Hide saved games panel
        document.getElementById('saved-games-panel').classList.remove('active');
        
        // Load the saved game using existing function
        const success = loadGameFromData(saveData);
        
        return success;
    } catch (error) {
        console.error('Error loading saved game:', error);
        showMessage(translate('Failed to load game!'));
        return false;
    }
}

// Load game from save data
function loadGameFromData(saveData) {
    try {
        console.log("Loading game from save data...");
        
        // Reset current game state
        console.log("Resetting game state...");
        try {
            resetGameState();
        } catch (resetError) {
            console.error("Error in resetGameState:", resetError);
            showMessage(translate('Error resetting game state: ') + resetError.message);
            return false;
        }
        
        console.log("Loading player data...");
        // Load player data
        gameState.player.x = saveData.player.x;
        gameState.player.y = saveData.player.y;
        gameState.player.health = saveData.player.health;
        
        console.log("Loading resources...");
        // Load resources
        gameState.resources.wood = saveData.resources.wood;
        gameState.resources.stone = saveData.resources.stone;
        gameState.resources.food = saveData.resources.food;
        
        console.log("Loading buildings...");
        // Load buildings with error handling
        try {
            gameState.buildings = saveData.buildings.map(buildingData => {
                return createBuilding(buildingData.type, buildingData.x, buildingData.y, buildingData.health);
            });
        } catch (buildingError) {
            console.error("Error loading buildings:", buildingError);
            gameState.buildings = []; // Fallback to empty buildings list
        }
        
        console.log("Loading enemies...");
        // Load enemies with error handling
        try {
            gameState.enemies = saveData.enemies.map(enemyData => {
                return createEnemy(enemyData.type, enemyData.x, enemyData.y, enemyData.health);
            });
        } catch (enemyError) {
            console.error("Error loading enemies:", enemyError);
            gameState.enemies = []; // Fallback to empty enemies list
        }
        
        // Load military data if available
        console.log("Loading military data...");
        if (saveData.military) {
            try {
                gameState.military.attack = saveData.military.attack || gameState.military.attack;
                gameState.military.defense = saveData.military.defense || gameState.military.defense;
                gameState.military.trainingSpeed = saveData.military.trainingSpeed || gameState.military.trainingSpeed;
                gameState.military.range = saveData.military.range || gameState.military.range;
                gameState.military.barracksCount = saveData.military.barracksCount || gameState.military.barracksCount;
                gameState.military.towerCount = saveData.military.towerCount || gameState.military.towerCount;
                gameState.military.attackBonus = saveData.military.attackBonus || gameState.military.attackBonus;
                gameState.military.defenseBonus = saveData.military.defenseBonus || gameState.military.defenseBonus;
                gameState.military.needsBarracks = saveData.military.needsBarracks !== undefined ? 
                                                  saveData.military.needsBarracks : gameState.military.needsBarracks;
                gameState.military.needsTowers = saveData.military.needsTowers !== undefined ? 
                                               saveData.military.needsTowers : gameState.military.needsTowers;
            } catch (militaryError) {
                console.error("Error loading military data:", militaryError);
            }
        }
        
        // Load economy data if available
        console.log("Loading economy data...");
        if (saveData.economy) {
            try {
                // Initialize economy system if it doesn't exist
                if (!gameState.economy) {
                    if (window.economySystem && typeof window.economySystem.init === 'function') {
                        window.economySystem.init();
                    } else {
                        gameState.economy = {
                            gold: 100,
                            taxRate: 5,
                            marketPrices: {
                                wood: 1.0,
                                stone: 1.5,
                                food: 0.8
                            },
                            lastTaxCollection: 0,
                            researchPoints: 0,
                            researching: null,
                            researchProgress: 0,
                            technologies: [],
                            marketTrades: []
                        };
                    }
                }
                
                // Now load saved data
                gameState.economy.gold = saveData.economy.gold;
                gameState.economy.taxRate = saveData.economy.taxRate;
                
                if (saveData.economy.marketPrices) {
                    gameState.economy.marketPrices = saveData.economy.marketPrices;
                }
                
                gameState.economy.lastTaxCollection = saveData.economy.lastTaxCollection;
                gameState.economy.researchPoints = saveData.economy.researchPoints;
                gameState.economy.researching = saveData.economy.researching;
                gameState.economy.researchProgress = saveData.economy.researchProgress;
                
                if (saveData.economy.technologies && saveData.economy.technologies.length > 0) {
                    gameState.economy.technologies = saveData.economy.technologies;
                }
                
                if (saveData.economy.marketTrades && saveData.economy.marketTrades.length > 0) {
                    gameState.economy.marketTrades = saveData.economy.marketTrades;
                }
                
                // Update economySystem treasury if it exists
                if (window.economySystem) {
                    window.economySystem.treasury = gameState.economy.gold;
                }
            } catch (economyError) {
                console.error("Error loading economy data:", economyError);
            }
        }
        
        // Load kingdoms data if available
        console.log("Loading kingdoms data...");
        if (saveData.kingdoms && saveData.kingdoms.length > 0) {
            try {
                gameState.kingdoms = saveData.kingdoms;
                
                // Ensure each kingdom has all required properties
                gameState.kingdoms.forEach(kingdom => {
                    // Ensure resources exist
                    if (!kingdom.resources) {
                        kingdom.resources = {
                            wood: 50,
                            stone: 40,
                            food: 30
                        };
                    } else {
                        // Ensure all resource properties exist
                        kingdom.resources.wood = kingdom.resources.wood || 50;
                        kingdom.resources.stone = kingdom.resources.stone || 40;
                        kingdom.resources.food = kingdom.resources.food || 30;
                    }
                    
                    // Ensure wallPerimeter exists
                    if (!Array.isArray(kingdom.wallPerimeter)) {
                        kingdom.wallPerimeter = [];
                    }
                    
                    // Ensure expansion properties exist
                    if (typeof kingdom.expansionRate !== 'number' || isNaN(kingdom.expansionRate)) {
                        kingdom.expansionRate = 0.3 + Math.random() * 0.3; // Random expansion rate
                    }
                    
                    if (typeof kingdom.lastExpansion !== 'number' || isNaN(kingdom.lastExpansion)) {
                        kingdom.lastExpansion = Date.now();
                    }
                    
                    // Ensure capital coordinates exist
                    if (typeof kingdom.capitalX !== 'number' || isNaN(kingdom.capitalX) ||
                        typeof kingdom.capitalY !== 'number' || isNaN(kingdom.capitalY)) {
                        // If we don't have valid capital coordinates, try to find them from the map
                        let foundCapital = false;
                        for (let y = 0; y < MAP_SIZE; y++) {
                            for (let x = 0; x < MAP_SIZE; x++) {
                                const tile = gameState.map[y][x];
                                if (tile.territory === kingdom.id && tile.isCapital) {
                                    kingdom.capitalX = x;
                                    kingdom.capitalY = y;
                                    foundCapital = true;
                                    break;
                                }
                            }
                            if (foundCapital) break;
                        }
                        
                        // If still no capital found, use a default position or don't expand this kingdom
                        if (!foundCapital) {
                            console.warn(`Could not find capital for kingdom ${kingdom.id}, using default coordinates`);
                            kingdom.capitalX = 100 + (kingdom.id * 50);
                            kingdom.capitalY = 100 + (kingdom.id * 50);
                        }
                    }
                });
                
                console.log("Successfully loaded kingdoms data:", gameState.kingdoms.length, "kingdoms");
            } catch (kingdomsError) {
                console.error("Error loading kingdoms data:", kingdomsError);
            }
        }
        
        // Load diplomacy data if available
        console.log("Loading diplomacy data...");
        if (saveData.diplomacy && window.diplomacySystem) {
            try {
                // First initialize the diplomacy system so it's in a clean state
                if (typeof window.diplomacySystem.init === 'function') {
                    window.diplomacySystem.init(true); // Reset to defaults before loading saved data
                }
                
                // Now load saved data
                window.diplomacySystem.reputation = saveData.diplomacy.reputation;
                
                // Load factions
                if (saveData.diplomacy.factions) {
                    window.diplomacySystem.factions = saveData.diplomacy.factions;
                }
                
                // Load treaties
                if (saveData.diplomacy.treaties && Array.isArray(saveData.diplomacy.treaties)) {
                    window.diplomacySystem.treaties = saveData.diplomacy.treaties;
                }
                
                // Make sure diplomacy system is synchronized with kingdoms
                if (typeof window.diplomacySystem.syncKingdomsWithFactions === 'function') {
                    window.diplomacySystem.syncKingdomsWithFactions();
                }
                
                // Update diplomacy UI
                if (typeof window.diplomacySystem.updateDiplomacyUI === 'function') {
                    window.diplomacySystem.updateDiplomacyUI();
                }
                
                console.log("Successfully loaded diplomacy data");
            } catch (diplomacyError) {
                console.error("Error loading diplomacy data:", diplomacyError);
            }
        } else {
            // If diplomacy system exists but no saved data, ensure it's properly initialized
            if (window.diplomacySystem && typeof window.diplomacySystem.init === 'function') {
                window.diplomacySystem.init(true); // Reset to defaults since no saved data
                
                // Make sure diplomacy system is synchronized with kingdoms
                if (typeof window.diplomacySystem.syncKingdomsWithFactions === 'function') {
                    window.diplomacySystem.syncKingdomsWithFactions();
                }
            }
        }
        
        // Load population data if available
        console.log("Loading population data...");
        if (saveData.population) {
            try {
                gameState.population.current = saveData.population.current || gameState.population.current;
                gameState.population.max = saveData.population.max || gameState.population.max;
                gameState.population.soldiers = saveData.population.soldiers || gameState.population.soldiers;
            } catch (populationError) {
                console.error("Error loading population data:", populationError);
            }
        }
        
        console.log("Loading age and time...");
        // Load age and time with validation
        try {
            // Ensure currentAge is a valid number
            if (typeof saveData.currentAge === 'number') {
                // Valid number, make sure it's in range
                gameState.currentAge = Math.min(Math.max(0, saveData.currentAge), AGES.length - 1);
            } else if (typeof saveData.currentAge === 'string') {
                // Handle legacy string format like 'DarkAge'
                switch (saveData.currentAge) {
                    case 'DarkAge':
                        gameState.currentAge = 0;
                        break;
                    case 'FeudalAge':
                        gameState.currentAge = 1;
                        break;
                    case 'CastleAge':
                        gameState.currentAge = 2;
                        break;
                    case 'ImperialAge':
                        gameState.currentAge = 3;
                        break;
                    default:
                        gameState.currentAge = 0; // Default to Dark Age
                }
            } else {
                // Invalid format, default to Dark Age
                gameState.currentAge = 0;
            }
            
            gameState.gameTime = typeof saveData.gameTime === 'number' ? saveData.gameTime : 0;
        } catch (ageError) {
            console.error("Error loading age data:", ageError);
            gameState.currentAge = 0; // Default to Dark Age
            gameState.gameTime = 0;
        }
        
        console.log("Updating UI...");
        // Update UI
        try {
            updateAllUIText();
            updateUI();
            
            // Update UI for systems that have their own update functions
            if (window.updateMilitaryUI && typeof window.updateMilitaryUI === 'function') {
                window.updateMilitaryUI();
            }
            
            if (window.economySystem && typeof window.economySystem.updateEconomyUI === 'function') {
                window.economySystem.updateEconomyUI();
            }
            
            if (window.diplomacySystem && typeof window.diplomacySystem.updateDiplomacyUI === 'function') {
                window.diplomacySystem.updateDiplomacyUI();
            }
        } catch (uiError) {
            console.error("Error updating UI:", uiError);
        }
        
        console.log("Centering camera on player...");
        // Center camera on player
        try {
            if (typeof centerCameraOnPlayer === 'function') {
                centerCameraOnPlayer();
            }
        } catch (cameraError) {
            console.error("Error centering camera:", cameraError);
        }
        
        // Reset unsaved changes flag
        gameState.hasUnsavedChanges = false;
        
        // Show success message
        console.log("Game loaded successfully");
        showMessage(translate('Game loaded successfully!'));
        
        // Start game loop if it's not running
        console.log("Starting game loop...");
        if (!gameState.isRunning) {
            gameState.isRunning = true;
            gameState.lastTick = Date.now();
            requestAnimationFrame(gameLoop);
        }
        
        return true;
    } catch (error) {
        console.error('Error loading game:', error);
        showMessage(translate('Failed to load game: ') + error.message);
        return false;
    }
}

// Delete saved game by ID
function deleteSavedGameById(saveId) {
    try {
        // Confirm deletion
        const confirmDelete = confirm(translate('Are you sure you want to delete this saved game?'));
        if (!confirmDelete) {
            return false;
        }
        
        // Remove from localStorage
        const saveKey = 'imperialDawnSave_' + saveId;
        localStorage.removeItem(saveKey);
        
        // Reload saved games list
        loadSavedGamesList();
        
        // Show success message
        showMessage(translate('Saved game deleted!'));
        
        // Keep the saved games panel open
        // Do not return to main menu after deletion
        
        return true;
    } catch (error) {
        console.error('Error deleting saved game:', error);
        showMessage(translate('Failed to delete saved game!'));
        return false;
    }
}

// Mark that there are unsaved changes
function markUnsavedChanges() {
    // Set flag
    gameState.hasUnsavedChanges = true;
    
    // Add indicator to save button
    const saveButton = document.getElementById('save-game-button');
    if (saveButton) {
        saveButton.classList.add('unsaved-changes');
    }
}

// Legacy load function for backward compatibility
function loadGame() {
    try {
        // Get saved data from localStorage
        const saveDataString = localStorage.getItem('imperialDawnSaveGame');
        
        if (!saveDataString) {
            showMessage(translate('No saved game found!'));
            return false;
        }
        
        // Parse save data
        const saveData = JSON.parse(saveDataString);
        
        // Load the game using the new function
        return loadGameFromData(saveData);
    } catch (error) {
        console.error('Error loading game:', error);
        showMessage(translate('Failed to load game: ') + error.message);
        return false;
    }
}

// Legacy save function for backward compatibility
function saveGame() {
    return saveGameWithName('game_' + new Date().toISOString());
}

// Save user settings
function saveSettings() {
    try {
        // Create a settings object
        const settings = {
            difficulty: document.getElementById('difficulty-select').value,
            musicVolume: document.getElementById('music-volume').value,
            sfxVolume: document.getElementById('sfx-volume').value,
            language: document.getElementById('language-select').value
        };
        
        // Save to localStorage
        localStorage.setItem('imperialDawnSettings', JSON.stringify(settings));
        
        // Apply settings
        applySettings(settings);
        
        // Show success message
        showMessage(translate('Settings saved successfully!'));
        
        return true;
    } catch (error) {
        console.error('Error saving settings:', error);
        showMessage(translate('Failed to save settings!'));
        return false;
    }
}

// Load and apply user settings
function loadSettings() {
    try {
        // Get settings from localStorage
        const settingsString = localStorage.getItem('imperialDawnSettings');
        
        if (!settingsString) {
            // Use default settings
            return applySettings(getDefaultSettings());
        }
        
        const settings = JSON.parse(settingsString);
        
        // Apply settings
        return applySettings(settings);
    } catch (error) {
        console.error('Error loading settings:', error);
        return false;
    }
}

// Apply settings to the game
function applySettings(settings) {
    try {
        // Apply difficulty
        if (settings.difficulty) {
            document.getElementById('difficulty-select').value = settings.difficulty;
            gameState.difficulty = settings.difficulty;
        }
        
        // Apply music volume
        if (settings.musicVolume) {
            document.getElementById('music-volume').value = settings.musicVolume;
            // TODO: Apply music volume when audio system is implemented
        }
        
        // Apply SFX volume
        if (settings.sfxVolume) {
            document.getElementById('sfx-volume').value = settings.sfxVolume;
            // TODO: Apply SFX volume when audio system is implemented
        }
        
        // Apply language
        if (settings.language) {
            document.getElementById('language-select').value = settings.language;
            console.log("Switching language to:", settings.language);
            
            // Make sure window.switchLanguage is available
            if (typeof window.switchLanguage === 'function') {
                // Fixed: Pass language code directly, not as a property of LANGUAGES
                window.switchLanguage(settings.language);
            } else {
                console.error("switchLanguage function not found in window object");
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error applying settings:', error);
        return false;
    }
}

// Reset settings to default
function resetSettings() {
    try {
        // Get default settings
        const defaultSettings = getDefaultSettings();
        
        // Apply default settings
        applySettings(defaultSettings);
        
        // Update UI elements
        document.getElementById('difficulty-select').value = defaultSettings.difficulty;
        document.getElementById('music-volume').value = defaultSettings.musicVolume;
        document.getElementById('sfx-volume').value = defaultSettings.sfxVolume;
        document.getElementById('language-select').value = defaultSettings.language;
        
        // Show success message
        showMessage(translate('Settings reset to default!'));
        
        return true;
    } catch (error) {
        console.error('Error resetting settings:', error);
        showMessage(translate('Failed to reset settings!'));
        return false;
    }
}

// Get default settings
function getDefaultSettings() {
    return {
        difficulty: 'normal',
        musicVolume: 70,
        sfxVolume: 80,
        language: 'en'
    };
}

// Create a new building object (used for game loading)
function createBuilding(type, x, y, health) {
    return {
        type: type,
        x: x,
        y: y,
        health: health || BUILDING_TYPES[type].maxHealth,
        id: Date.now() + Math.floor(Math.random() * 1000)
    };
}

// Create a new enemy object (used for game loading)
function createEnemy(type, x, y, health) {
    const enemyInfo = ENEMY_TYPES[type];
    return {
        id: generateEnemyId(),
        x: x,
        y: y,
        type: type,
        health: health || enemyInfo.health,
        attack: enemyInfo.attack,
        lastMoved: 0,
        moveDelay: enemyInfo.speed * 1000,
        kingdomId: 1 // Default to first enemy kingdom
    };
}

// Export functions for other modules
window.updateUI = updateUI;
window.showMessage = showMessage;
window.updateButtonTexts = updateButtonTexts;
window.addAttackButton = addAttackButton;
window.updateMilitaryUI = updateMilitaryUI;
window.advanceAge = advanceAge;
window.initializeMenuSystem = initializeMenuSystem;
window.initializeMainMenu = initializeMainMenu;
window.toggleGatherMode = toggleGatherMode; 
window.saveGame = saveGame;
window.loadGame = loadGame;
window.createBuilding = createBuilding;
window.createEnemy = createEnemy;

// Ekonomi UI'daki altın değerini güncelleme işlemini düzelt (gold-amount elementinde HTML parsing sorunu var)
function updateEconomyGoldDisplay() {
    try {
        const goldAmountElement = document.getElementById('gold-amount');
        if (goldAmountElement) {
            // HTML kodu ekleme yerine iki element olarak ayır ve temiz şekilde ekle
            goldAmountElement.innerHTML = ''; // İçeriği temizle
            
            // Altın miktarı metni
            const goldText = document.createElement('span');
            goldText.textContent = Math.floor(gameState.economy.gold);
            goldAmountElement.appendChild(goldText);
            
            // Altın ikonu
            const goldIcon = document.createElement('i');
            goldIcon.className = 'fas fa-coins gold-icon';
            goldAmountElement.appendChild(goldIcon);
        }
    } catch (error) {
        console.error("Altın göstergesini güncellerken hata:", error);
    }
}

// showMessage fonksiyonunu yerel bir değişkenle güncelleyelim, çünkü bu bütün UI'ı güncelleme şansını veriyor
const originalShowMessage = window.showMessage;
window.showMessage = function(message) {
    // Orijinal fonksiyonu çağır
    originalShowMessage(message);
    
    // Ekonomi paneli açıksa altın değerini güncelle
    const economyPanel = document.getElementById('economy-panel');
    if (economyPanel && economyPanel.classList.contains('show')) {
        updateEconomyGoldDisplay();
    }
};

// Ekonomi ve Diplomasi panellerinde dokunmatik kaydırmayı düzeltmek için helper fonksiyonu
function setupTouchScrolling(panel) {
    if (!panel) return;
    
    const panelContent = panel.querySelector('.panel-content');
    if (!panelContent) return;
    
    // Touch başlangıç noktası
    let startY = 0;
    let startScrollTop = 0;
    
    // Touch olaylarını ekle
    panelContent.addEventListener('touchstart', function(e) {
        startY = e.touches[0].clientY;
        startScrollTop = panelContent.scrollTop;
        // Propagasyonu durdurma
        e.stopPropagation();
    }, { passive: true });
    
    panelContent.addEventListener('touchmove', function(e) {
        // Dokunmatik hareket
        const touchY = e.touches[0].clientY;
        const distance = startY - touchY;
        panelContent.scrollTop = startScrollTop + distance;
        
        // Panel içeriği tamamen scroll edilince ebeveyn elemana kaydırma izni verme
        if ((panelContent.scrollTop === 0 && distance < 0) || 
            (panelContent.scrollTop + panelContent.clientHeight >= panelContent.scrollHeight && distance > 0)) {
            // En üstte veya en altta ise, ebeveyn elemanın kaydırmasına izin ver
        } else {
            // Aksi takdirde sayfa kaydırmasını engelle
            e.preventDefault();
        }
    }, { passive: false }); // preventDefault için passive false olmalı
    
    console.log("Touch scrolling setup completed for", panel.id);
}

// window.onload içinde tüm panelleri tarayıp dokunmatik kaydırma ekleyen bir fonksiyon çağıralım
window.addEventListener('load', function() {
    // Tüm side-panel sınıflı öğelere dokunmatik kaydırma ekle
    document.querySelectorAll('.side-panel').forEach(panel => {
        setupTouchScrolling(panel);
    });
}); 