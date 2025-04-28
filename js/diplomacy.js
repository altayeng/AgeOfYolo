// diplomacy.js - Diplomacy system and faction relationships

// Diplomacy System
const diplomacySystem = {
    // Player reputation
    reputation: 65,
    
    // Faction data
    factions: {
        'northern-tribe': {
            name: 'Mavi Krallığı',
            relation: 'neutral', // ally, neutral, enemy, truce
            relationValue: 50,
            icon: '🔵',
            tradeBenefit: 'wood',
            militaryStrength: 70,
        },
        'eastern-empire': {
            name: 'Kırmızı Krallığı',
            relation: 'enemy',
            relationValue: 20,
            icon: '🔴',
            tradeBenefit: 'stone',
            militaryStrength: 90,
        },
        'western-kingdom': {
            name: 'Yeşil Krallığı',
            relation: 'ally',
            relationValue: 85,
            icon: '🟢',
            tradeBenefit: 'food',
            militaryStrength: 60,
        }
    },
    
    // Active treaties and agreements
    treaties: [
        {
            id: 'trade-western',
            type: 'trade',
            name: 'Trade Agreement',
            parties: ['player', 'western-kingdom'],
            duration: 12,
            effects: {
                tradingBonus: 1.2
            },
            icon: '📜'
        },
        {
            id: 'alliance-western',
            type: 'military',
            name: 'Military Alliance',
            parties: ['player', 'western-kingdom'],
            duration: 8,
            effects: {
                defensiveAssistance: true
            },
            icon: '⚔️'
        }
    ],
    
    // AI dialog responses
    dialogResponses: {
        'greeting': [
            "Greetings, noble ruler. What brings you to our lands?",
            "Well met. What diplomatic matters do you wish to discuss?",
            "Ah, the ruler of the neighboring kingdom. What is your purpose here?"
        ],
        'friendly': [
            "Our kingdoms have much to gain through cooperation!",
            "Your friendship is valued in these trying times.",
            "Our people speak highly of your rule. Let us continue our alliance."
        ],
        'neutral': [
            "We remain cautious but open to negotiation.",
            "Your proposal has merit, but we must consider our own interests.",
            "Perhaps we can find common ground, though trust must be earned."
        ],
        'hostile': [
            "Your presence is not welcome here. State your business quickly.",
            "We have little interest in your words after your previous actions.",
            "Tread carefully. Our armies stand ready should your intentions prove false."
        ],
        'peace_accept': [
            "We accept your offer of peace. May this ceasefire bring prosperity to both our realms.",
            "Very well. The bloodshed between our peoples will cease... for now.",
            "Your gold will serve our kingdom well. We agree to this ceasefire."
        ],
        'peace_reject': [
            "Your gold does not interest us as much as your lands. We reject your offer.",
            "Peace? After what you've done? No amount of gold will heal these wounds.",
            "This offer insults us. Prepare your defenses, for we will continue our campaign."
        ]
    },
    
    // Initialize diplomacy system
    init(resetToDefaults = false) {
        console.log("Initializing diplomacy system, resetToDefaults:", resetToDefaults);
        
        // If we need to reset to defaults, recreate the faction data
        if (resetToDefaults) {
            // Reset reputation to default
            this.reputation = 65;
            
            // Reset factions to defaults
            this.factions = {
                'northern-tribe': {
                    name: 'Mavi Krallığı',
                    relation: 'neutral',
                    relationValue: 50,
                    icon: '🔵',
                    tradeBenefit: 'wood',
                    militaryStrength: 70,
                },
                'eastern-empire': {
                    name: 'Kırmızı Krallığı',
                    relation: 'enemy',
                    relationValue: 20,
                    icon: '🔴',
                    tradeBenefit: 'stone',
                    militaryStrength: 90,
                },
                'western-kingdom': {
                    name: 'Yeşil Krallığı',
                    relation: 'ally',
                    relationValue: 85,
                    icon: '🟢',
                    tradeBenefit: 'food',
                    militaryStrength: 60,
                }
            };
            
            // Reset treaties to defaults
            this.treaties = [
                {
                    id: 'trade-western',
                    type: 'trade',
                    name: 'Trade Agreement',
                    parties: ['player', 'western-kingdom'],
                    duration: 12,
                    effects: {
                        tradingBonus: 1.2
                    },
                    icon: '📜'
                },
                {
                    id: 'alliance-western',
                    type: 'military',
                    name: 'Military Alliance',
                    parties: ['player', 'western-kingdom'],
                    duration: 8,
                    effects: {
                        defensiveAssistance: true
                    },
                    icon: '⚔️'
                }
            ];
        }
        
        // Clear existing factions from previous versions
        const factionListEl = document.getElementById('faction-list');
        if (factionListEl) {
            factionListEl.innerHTML = '';
        }
        
        // Set up event listeners for diplomacy UI
        const diplomacyButton = document.getElementById('diplomacy-button');
        const diplomacyPanel = document.getElementById('diplomacy-panel');
        const closeButton = document.getElementById('close-diplomacy');
        
        if (diplomacyButton) {
            // Open diplomacy panel - Remove any existing listeners first
            diplomacyButton.removeEventListener('click', this._openDiplomacyHandler);
            
            // Store handler for easier removal
            this._openDiplomacyHandler = () => {
                // Clear faction list to prevent duplicates
                const factionList = document.getElementById('faction-list');
                if (factionList) {
                    factionList.innerHTML = '';
                }
                
                if (diplomacyPanel) {
                    diplomacyPanel.classList.add('active');
                }
                this.syncKingdomsWithFactions();
                this.updateDiplomacyUI();
            };
            
            diplomacyButton.addEventListener('click', this._openDiplomacyHandler);
        }
        
        if (closeButton) {
            // Close diplomacy panel - Remove any existing listeners first
            closeButton.removeEventListener('click', this._closeDiplomacyHandler);
            
            // Store handler for easier removal
            this._closeDiplomacyHandler = () => {
                if (diplomacyPanel) {
                    diplomacyPanel.classList.remove('active');
                }
                this.closeDialog();
            };
            
            closeButton.addEventListener('click', this._closeDiplomacyHandler);
        }
        
        // Set up faction action buttons
        document.querySelectorAll('.faction-action').forEach(button => {
            // Remove existing listeners to avoid duplicates
            button.removeEventListener('click', this._factionActionHandler);
            
            // Store handler for easier removal
            this._factionActionHandler = (e) => {
                const action = e.target.closest('.faction-action').dataset.action;
                const factionId = e.target.closest('.faction-item').dataset.factionId;
                this.handleFactionAction(factionId, action);
                e.stopPropagation();
            };
            
            button.addEventListener('click', this._factionActionHandler);
        });
        
        // Create dialog container if it doesn't exist
        if (!document.getElementById('diplomacy-dialog')) {
            const dialogHTML = `
                <div id="diplomacy-dialog" class="diplomacy-dialog">
                    <div class="dialog-header">
                        <h3 id="dialog-faction-name">Kingdom Name</h3>
                        <button id="close-dialog" class="close-button">
                            <i class="material-icons-round">close</i>
                        </button>
                    </div>
                    <div class="dialog-content">
                        <div class="faction-portrait">
                            <div id="faction-icon" class="large-faction-icon">🏰</div>
                        </div>
                        <div class="dialog-message-container">
                            <p id="dialog-message" class="dialog-message">Greetings, noble ruler. What brings you to our lands?</p>
                        </div>
                        <div class="dialog-options" id="dialog-options">
                            <button class="dialog-option" data-option="ceasefire">Offer Ceasefire (50 Gold)</button>
                            <button class="dialog-option" data-option="alliance">Propose Alliance</button>
                            <button class="dialog-option" data-option="trade">Discuss Trade</button>
                            <button class="dialog-option" data-option="close">End Dialog</button>
                        </div>
                    </div>
                </div>
            `;
            
            if (diplomacyPanel) {
                diplomacyPanel.insertAdjacentHTML('beforeend', dialogHTML);
            }
            
            // Add event listeners for dialog options
            const closeDialogButton = document.getElementById('close-dialog');
            if (closeDialogButton) {
                closeDialogButton.addEventListener('click', () => {
                    this.closeDialog();
                });
            }
            
            const dialogOptions = document.getElementById('dialog-options');
            if (dialogOptions) {
                dialogOptions.addEventListener('click', (e) => {
                    if (e.target.classList.contains('dialog-option')) {
                        const option = e.target.dataset.option;
                        const factionId = document.getElementById('diplomacy-dialog').dataset.factionId;
                        this.handleDialogOption(option, factionId);
                    }
                });
            }
        }
        
        // Sync with kingdoms data if available
        this.syncKingdomsWithFactions();
        
        // Update UI initially
        this.updateDiplomacyUI();
        
        console.log("Diplomacy system initialized");
        return true;
    },
    
    // Sync kingdoms from game state with factions
    syncKingdomsWithFactions() {
        // Skip if kingdoms aren't initialized yet
        if (!gameState.kingdoms || gameState.kingdoms.length === 0) return;
        
        // Create a mapping between kingdom IDs and faction IDs
        const kingdomMapping = {
            1: 'northern-tribe', // Kingdom 1 maps to northern-tribe (now Mavi Krallığı)
            2: 'eastern-empire', // Kingdom 2 maps to eastern-empire (now Kırmızı Krallığı)
            3: 'western-kingdom' // Kingdom 3 maps to western-kingdom (now Yeşil Krallığı)
        };
        
        // Check and add ANY missing kingdoms to faction list
        // Starting from 1 to skip player kingdom (which is at index 0)
        for (let i = 1; i < gameState.kingdoms.length; i++) {
            const kingdom = gameState.kingdoms[i];
            if (!kingdom) continue;
            
            // Check if this kingdom ID is in our mapping
            let factionId = kingdomMapping[i];
            
            // If not in mapping or the faction doesn't exist, create a new faction ID
            if (!factionId || !this.factions[factionId]) {
                factionId = `kingdom-${i}`;
                
                // Get color of the kingdom or use a default color
                const kingdomColor = kingdom.color || KINGDOM_COLORS[i % KINGDOM_COLORS.length] || '#ffd700';
                
                // Generate name based on color
                let kingdomName = this.getKingdomNameByColor(kingdomColor);
                
                // Add to factions
                this.factions[factionId] = {
                    name: kingdomName,
                    relation: 'neutral',
                    relationValue: 50,
                    icon: this.getIconByColor(kingdomColor),
                    tradeBenefit: this.getRandomTradeBenefit(),
                    militaryStrength: 50 + Math.floor(Math.random() * 50),
                    color: kingdomColor
                };
            }
            
            // Add to faction list in UI - will add even mapped factions to ensure all show up
            this.addFactionToUI(factionId);
        }
    },
    
    // Get kingdom faction ID by kingdom ID
    getKingdomFactionId(kingdomId) {
        const kingdomMapping = {
            1: 'northern-tribe',
            2: 'eastern-empire',
            3: 'western-kingdom'
        };
        
        return kingdomMapping[kingdomId] || `kingdom-${kingdomId}`;
    },
    
    // Get kingdom name based on color
    getKingdomNameByColor(color) {
        // Convert color to lowercase for comparison
        const colorLower = color.toLowerCase();
        
        if (colorLower.includes('2962ff') || colorLower === '#2962ff' || colorLower === 'blue') {
            return 'Mavi Krallığı';
        } else if (colorLower.includes('d32f2f') || colorLower === '#d32f2f' || colorLower === 'red') {
            return 'Kırmızı Krallığı';
        } else if (colorLower.includes('388e3c') || colorLower === '#388e3c' || colorLower === 'green') {
            return 'Yeşil Krallığı';
        } else if (colorLower.includes('7b1fa2') || colorLower === '#7b1fa2' || colorLower === 'purple') {
            return 'Mor Krallığı';
        } else if (colorLower.includes('ff6f00') || colorLower === '#ff6f00' || colorLower === 'orange') {
            return 'Turuncu Krallığı';
        } else if (colorLower.includes('ffd700') || colorLower === '#ffd700' || colorLower === 'yellow') {
            return 'Sarı Krallığı';
        } else {
            // Default name if color doesn't match
            return `Krallık ${Math.floor(Math.random() * 1000)}`;
        }
    },
    
    // Get icon based on color
    getIconByColor(color) {
        const colorLower = color.toLowerCase();
        
        if (colorLower.includes('2962ff') || colorLower === '#2962ff' || colorLower === 'blue') {
            return '🔵';
        } else if (colorLower.includes('d32f2f') || colorLower === '#d32f2f' || colorLower === 'red') {
            return '🔴';
        } else if (colorLower.includes('388e3c') || colorLower === '#388e3c' || colorLower === 'green') {
            return '🟢';
        } else if (colorLower.includes('7b1fa2') || colorLower === '#7b1fa2' || colorLower === 'purple') {
            return '🟣';
        } else if (colorLower.includes('ff6f00') || colorLower === '#ff6f00' || colorLower === 'orange') {
            return '🟠';
        } else if (colorLower.includes('ffd700') || colorLower === '#ffd700' || colorLower === 'yellow') {
            return '🟡';
        } else {
            return '🏰';
        }
    },
    
    // Get random trade benefit
    getRandomTradeBenefit() {
        const benefits = ['wood', 'stone', 'food'];
        return benefits[Math.floor(Math.random() * benefits.length)];
    },
    
    // Add a faction to the UI
    addFactionToUI(factionId) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        const factionList = document.getElementById('faction-list');
        if (!factionList) return;
        
        // Check if faction already exists in UI
        if (document.querySelector(`.faction-item[data-faction-id="${factionId}"]`)) {
            return;
        }
        
        const factionHTML = `
            <div class="faction-item" data-faction-id="${factionId}">
                <div class="faction-icon">${faction.icon}</div>
                <div class="faction-details">
                    <div class="faction-name">${faction.name}</div>
                    <div class="faction-relation diplomatic-${faction.relation}">${window.translate ? window.translate(this.capitalizeFirstLetter(faction.relation)) : this.capitalizeFirstLetter(faction.relation)}</div>
                </div>
                <div class="faction-actions">
                    <button class="faction-action" data-action="dialog">
                        <i class="material-icons-round">chat</i>
                    </button>
                    <button class="faction-action" data-action="trade">
                        <i class="material-icons-round">swap_horiz</i>
                    </button>
                    <button class="faction-action" data-action="alliance">
                        <i class="material-icons-round">handshake</i>
                    </button>
                    <button class="faction-action" data-action="war">
                        <i class="material-icons-round">gavel</i>
                    </button>
                </div>
            </div>
        `;
        
        factionList.insertAdjacentHTML('beforeend', factionHTML);
        
        // Add event listeners for this faction's buttons
        const newFactionItem = document.querySelector(`.faction-item[data-faction-id="${factionId}"]`);
        newFactionItem.querySelectorAll('.faction-action').forEach(button => {
            button.addEventListener('click', (e) => {
                const action = e.target.closest('.faction-action').dataset.action;
                this.handleFactionAction(factionId, action);
                e.stopPropagation();
            });
        });
    },
    
    // Update diplomacy UI elements
    updateDiplomacyUI() {
        // Update reputation
        document.getElementById('reputation-level').style.width = `${this.reputation}%`;
        document.getElementById('reputation-value').textContent = this.reputation;
        
        // Update faction statuses
        Object.entries(this.factions).forEach(([factionId, faction]) => {
            let factionElement = document.querySelector(`.faction-item[data-faction-id="${factionId}"]`);
            
            // If faction element doesn't exist, create it
            if (!factionElement) {
                this.addFactionToUI(factionId);
                factionElement = document.querySelector(`.faction-item[data-faction-id="${factionId}"]`);
            }
            
            if (factionElement) {
                // Update relation display
                const relationElement = factionElement.querySelector('.faction-relation');
                relationElement.textContent = window.translate ? window.translate(this.capitalizeFirstLetter(faction.relation)) : this.capitalizeFirstLetter(faction.relation);
                relationElement.className = 'faction-relation'; // Reset classes
                relationElement.classList.add(`diplomatic-${faction.relation}`);
                
                // Update buttons based on current relation
                const dialogButton = factionElement.querySelector('[data-action="dialog"]');
                const tradeButton = factionElement.querySelector('[data-action="trade"]');
                const allianceButton = factionElement.querySelector('[data-action="alliance"]');
                const warButton = factionElement.querySelector('[data-action="war"]');
                
                // Dialog is always enabled
                if (dialogButton) dialogButton.disabled = false;
                
                // Disable/enable buttons based on relation
                if (faction.relation === 'ally') {
                    tradeButton.disabled = false;
                    allianceButton.disabled = true;
                    warButton.disabled = false;
                } else if (faction.relation === 'enemy') {
                    tradeButton.disabled = true;
                    allianceButton.disabled = true;
                    warButton.disabled = false; // Can still declare war for renewing
                } else {
                    tradeButton.disabled = false;
                    allianceButton.disabled = false;
                    warButton.disabled = false;
                }
            }
        });
        
        // Update treaties list
        this.updateTreatiesList();
    },
    
    // Update treaties list in UI
    updateTreatiesList() {
        const treatyList = document.getElementById('treaty-list');
        if (!treatyList) return;
        
        // Clear existing entries
        treatyList.innerHTML = '';
        
        // Add each treaty to the list
        this.treaties.forEach(treaty => {
            // Format the parties involved
            const partiesText = treaty.parties.map(party => {
                if (party === 'player') return window.translate ? window.translate('You') : 'You';
                return this.factions[party]?.name || party;
            }).join(' & ');
            
            // Create treaty item
            const treatyHTML = `
                <div class="treaty-item" data-treaty-id="${treaty.id}">
                    <div class="treaty-icon">${treaty.icon || '📜'}</div>
                    <div class="treaty-details">
                        <div class="treaty-name">${treaty.name}</div>
                        <div class="treaty-parties">${partiesText}</div>
                        <div class="treaty-duration">${treaty.duration} ${window.translate ? window.translate('years remaining') : 'years remaining'}</div>
                    </div>
                </div>
            `;
            
            treatyList.insertAdjacentHTML('beforeend', treatyHTML);
        });
    },
    
    // Handle faction action (trade, alliance, war)
    handleFactionAction(factionId, action) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        // Implement action based on type
        switch (action) {
            case 'dialog':
                this.openDialog(factionId);
                break;
                
            case 'trade':
                if (faction.relation !== 'enemy') {
                    this.proposeTrade(factionId);
                }
                break;
                
            case 'alliance':
                if (faction.relation === 'neutral' || faction.relation === 'truce') {
                    this.proposeAlliance(factionId);
                }
                break;
                
            case 'war':
                if (faction.relation !== 'enemy') {
                    this.declareWar(factionId);
                }
                break;
        }
        
        // Update UI after action
        this.updateDiplomacyUI();
    },
    
    // Open dialog with faction
    openDialog(factionId) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        const dialogEl = document.getElementById('diplomacy-dialog');
        const dialogFactionName = document.getElementById('dialog-faction-name');
        const dialogMessage = document.getElementById('dialog-message');
        const factionIcon = document.getElementById('faction-icon');
        const dialogOptions = document.getElementById('dialog-options');
        
        // Set current faction for the dialog
        dialogEl.dataset.factionId = factionId;
        
        // Update dialog content
        dialogFactionName.textContent = faction.name;
        factionIcon.textContent = faction.icon;
        
        // Get appropriate greeting based on relationship
        let responseType = 'greeting';
        if (faction.relation === 'ally') responseType = 'friendly';
        else if (faction.relation === 'enemy') responseType = 'hostile';
        else responseType = 'neutral';
        
        // Get random response from appropriate category
        const responses = this.dialogResponses[responseType];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        dialogMessage.textContent = randomResponse;
        
        // Update dialog options based on relationship
        dialogOptions.innerHTML = '';
        
        // Always add close option
        const closeOption = document.createElement('button');
        closeOption.className = 'dialog-option';
        closeOption.dataset.option = 'close';
        closeOption.textContent = 'End Dialog';
        
        // Add specific options based on relation
        if (faction.relation === 'enemy') {
            // Only enemies can be offered ceasefire
            const ceasefire = document.createElement('button');
            ceasefire.className = 'dialog-option';
            ceasefire.dataset.option = 'ceasefire';
            ceasefire.textContent = 'Offer Ceasefire (50 Gold)';
            dialogOptions.appendChild(ceasefire);
        } else if (faction.relation === 'neutral') {
            // Neutral factions can be traded with or offered alliance
            const trade = document.createElement('button');
            trade.className = 'dialog-option';
            trade.dataset.option = 'trade';
            trade.textContent = 'Discuss Trade';
            
            const alliance = document.createElement('button');
            alliance.className = 'dialog-option';
            alliance.dataset.option = 'alliance';
            alliance.textContent = 'Propose Alliance';
            
            dialogOptions.appendChild(trade);
            dialogOptions.appendChild(alliance);
        } else if (faction.relation === 'ally') {
            // Allied factions can be traded with or requested for assistance
            const trade = document.createElement('button');
            trade.className = 'dialog-option';
            trade.dataset.option = 'trade';
            trade.textContent = 'Discuss Trade';
            
            const assistance = document.createElement('button');
            assistance.className = 'dialog-option';
            assistance.dataset.option = 'assistance';
            assistance.textContent = 'Request Military Assistance';
            
            dialogOptions.appendChild(trade);
            dialogOptions.appendChild(assistance);
        }
        
        // Add close option as the last option
        dialogOptions.appendChild(closeOption);
        
        // Show dialog
        dialogEl.style.display = 'block';
    },
    
    // Close dialog
    closeDialog() {
        const dialogEl = document.getElementById('diplomacy-dialog');
        if (dialogEl) {
            dialogEl.style.display = 'none';
        }
    },
    
    // Handle dialog option
    handleDialogOption(option, factionId) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        switch (option) {
            case 'ceasefire':
                this.offerCeasefire(factionId);
                break;
                
            case 'trade':
                this.proposeTrade(factionId);
                this.closeDialog();
                break;
                
            case 'alliance':
                this.proposeAlliance(factionId);
                this.closeDialog();
                break;
                
            case 'assistance':
                // Find an enemy kingdom to target
                let targetKingdomId = null;
                for (let i = 1; i < gameState.kingdoms.length; i++) {
                    const kingdomFactionId = this.getKingdomFactionId(i);
                    if (kingdomFactionId && this.factions[kingdomFactionId] && 
                        this.factions[kingdomFactionId].relation === 'enemy') {
                        targetKingdomId = i;
                        break;
                    }
                }
                
                if (targetKingdomId) {
                    this.requestMilitaryAssistance(factionId, targetKingdomId);
                } else {
                    showGameMessage("No enemy kingdoms found to attack");
                }
                this.closeDialog();
                break;
                
            case 'close':
                this.closeDialog();
                break;
        }
    },
    
    // Offer ceasefire in exchange for gold
    offerCeasefire(factionId) {
        const faction = this.factions[factionId];
        const dialogMessage = document.getElementById('dialog-message');
        const dialogOptions = document.getElementById('dialog-options');
        
        // Check if player has enough gold
        if (economySystem && economySystem.treasury < 50) {
            dialogMessage.textContent = "You lack the gold to offer a ceasefire. Come back when your treasury is fuller.";
            
            // Update options to just close
            dialogOptions.innerHTML = '';
            const closeBtn = document.createElement('button');
            closeBtn.className = 'dialog-option';
            closeBtn.dataset.option = 'close';
            closeBtn.textContent = 'Close';
            dialogOptions.appendChild(closeBtn);
            
            return;
        }
        
        // Calculate acceptance chance based on relation value and military situation
        let acceptanceChance = 20 + (faction.relationValue * 0.5);
        
        // If faction military is weaker, more likely to accept
        const factionKingdomId = Object.keys(gameState.kingdoms).find(key => 
            this.getKingdomFactionId(key) === factionId
        );
        
        if (factionKingdomId) {
            const factionKingdom = gameState.kingdoms[factionKingdomId];
            if (factionKingdom) {
                // Rough estimate of military power
                const playerMilitary = gameState.military ? 
                    (gameState.military.attack + gameState.military.defense) : 15;
                    
                const factionMilitary = faction.militaryStrength || 50;
                
                if (playerMilitary > factionMilitary) {
                    acceptanceChance += 25; // Significantly more likely to accept if weaker
                } else {
                    acceptanceChance -= 15; // Less likely if stronger
                }
            }
        }
        
        // Roll for acceptance
        if (Math.random() * 100 < acceptanceChance) {
            // Accept ceasefire
            // Deduct gold from player
            if (economySystem) {
                economySystem.treasury -= 50;
            }
            
            // Set relation to truce 
            this.setFactionRelation(factionId, 'truce');
            
            // Create ceasefire treaty
            const treatyDuration = 8 + Math.floor(Math.random() * 5); // 8-12 years
            
            const ceasefireTreaty = {
                id: `ceasefire-${factionId}-${Date.now()}`,
                type: 'ceasefire',
                name: 'Ceasefire Agreement',
                parties: ['player', factionId],
                duration: treatyDuration,
                effects: {
                    preventWar: true
                },
                icon: '🕊️'
            };
            
            this.treaties.push(ceasefireTreaty);
            
            // Show acceptance message
            const responses = this.dialogResponses['peace_accept'];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            dialogMessage.textContent = randomResponse;
            
            // Update dialog options
            dialogOptions.innerHTML = '';
            const closeBtn = document.createElement('button');
            closeBtn.className = 'dialog-option';
            closeBtn.dataset.option = 'close';
            closeBtn.textContent = 'Excellent';
            dialogOptions.appendChild(closeBtn);
            
            // Show game message
            showGameMessage(`${faction.name} has accepted your ceasefire offer for ${treatyDuration} years!`);
            
            // Update UI
            this.updateDiplomacyUI();
        } else {
            // Reject ceasefire
            // Show rejection message
            const responses = this.dialogResponses['peace_reject'];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            dialogMessage.textContent = randomResponse;
            
            // Update dialog options
            dialogOptions.innerHTML = '';
            const closeBtn = document.createElement('button');
            closeBtn.className = 'dialog-option';
            closeBtn.dataset.option = 'close';
            closeBtn.textContent = 'I see...';
            dialogOptions.appendChild(closeBtn);
            
            // Show game message
            showGameMessage(`${faction.name} has rejected your ceasefire offer!`);
        }
    },
    
    // Trade proposal
    proposeTrade(factionId) {
        const faction = this.factions[factionId];
        
        // Check if trade already exists
        const existingTrade = this.treaties.find(treaty => 
            treaty.type === 'trade' && 
            treaty.parties.includes('player') && 
            treaty.parties.includes(factionId)
        );
        
        if (existingTrade) {
            showGameMessage(`You already have a trade agreement with ${faction.name}`);
            return;
        }
        
        // Base success chance on relation value
        const successChance = faction.relationValue * 0.8;
        
        if (Math.random() * 100 < successChance) {
            // Trade accepted
            const treatyDuration = 10 + Math.floor(Math.random() * 5);
            
            const newTreaty = {
                id: `trade-${factionId}`,
                type: 'trade',
                name: 'Trade Agreement',
                parties: ['player', factionId],
                duration: treatyDuration,
                effects: {
                    tradingBonus: 1.2
                },
                icon: '📜'
            };
            
            this.treaties.push(newTreaty);
            showGameMessage(`Trade agreement established with ${faction.name} for ${treatyDuration} years!`);
            
            // Improve relation slightly
            this.changeFactionRelation(factionId, 5);
        } else {
            // Trade rejected
            showGameMessage(`${faction.name} rejected your trade proposal`);
            this.changeFactionRelation(factionId, -2);
        }
    },
    
    // Alliance proposal
    proposeAlliance(factionId) {
        const faction = this.factions[factionId];
        
        // Check if alliance already exists
        const existingAlliance = this.treaties.find(treaty => 
            treaty.type === 'military' && 
            treaty.parties.includes('player') && 
            treaty.parties.includes(factionId)
        );
        
        if (existingAlliance) {
            showGameMessage(`You already have an alliance with ${faction.name}`);
            return;
        }
        
        // Alliance is harder to get than trade
        const successChance = faction.relationValue * 0.6;
        
        if (Math.random() * 100 < successChance) {
            // Alliance accepted
            const treatyDuration = 8 + Math.floor(Math.random() * 5);
            
            const newTreaty = {
                id: `alliance-${factionId}`,
                type: 'military',
                name: 'Military Alliance',
                parties: ['player', factionId],
                duration: treatyDuration,
                effects: {
                    defensiveAssistance: true
                },
                icon: '⚔️'
            };
            
            this.treaties.push(newTreaty);
            this.setFactionRelation(factionId, 'ally');
            showGameMessage(`Alliance formed with ${faction.name} for ${treatyDuration} years!`);
        } else {
            // Alliance rejected
            showGameMessage(`${faction.name} rejected your alliance proposal`);
            this.changeFactionRelation(factionId, -5);
        }
    },
    
    // Declare war
    declareWar(factionId) {
        const faction = this.factions[factionId];
        
        // Remove all treaties with this faction
        this.treaties = this.treaties.filter(treaty => 
            !(treaty.parties.includes('player') && treaty.parties.includes(factionId))
        );
        
        // Set relation to enemy
        this.setFactionRelation(factionId, 'enemy');
        
        // War declaration reduces reputation
        this.changeReputation(-10);
        
        showGameMessage(`War declared against ${faction.name}!`);
        
        // Check for allies that might join the war
        this.checkForAlliedResponse(factionId);
    },
    
    // Check if allies will join the war
    checkForAlliedResponse(targetFactionId) {
        const alliances = this.treaties.filter(treaty => 
            treaty.type === 'military' && 
            treaty.parties.includes(targetFactionId)
        );
        
        alliances.forEach(alliance => {
            const allyId = alliance.parties.find(party => party !== 'player' && party !== targetFactionId);
            if (allyId) {
                const ally = this.factions[allyId];
                showGameMessage(`${ally.name} has joined the war against you as an ally of ${this.factions[targetFactionId].name}!`);
                this.setFactionRelation(allyId, 'enemy');
            }
        });
    },
    
    // Change faction relation value
    changeFactionRelation(factionId, amount) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        faction.relationValue = Math.max(0, Math.min(100, faction.relationValue + amount));
        
        // Update relation type based on value
        if (faction.relationValue >= 75) {
            faction.relation = 'ally';
        } else if (faction.relationValue <= 25) {
            faction.relation = 'enemy';
        } else {
            faction.relation = 'neutral';
        }
    },
    
    // Set faction relation directly
    setFactionRelation(factionId, relationType) {
        const faction = this.factions[factionId];
        if (!faction) return;
        
        faction.relation = relationType;
        
        // Adjust relation value to match the type
        switch (relationType) {
            case 'ally':
                faction.relationValue = Math.max(faction.relationValue, 75);
                break;
            case 'enemy':
                faction.relationValue = Math.min(faction.relationValue, 25);
                break;
            case 'neutral':
                faction.relationValue = Math.max(Math.min(faction.relationValue, 74), 26);
                break;
            case 'truce':
                faction.relationValue = 40;
                break;
        }
    },
    
    // Change player reputation
    changeReputation(amount) {
        this.reputation = Math.max(0, Math.min(100, this.reputation + amount));
    },
    
    // Progress time for treaties
    updateTreaties() {
        // Decrease duration of treaties
        this.treaties.forEach(treaty => {
            treaty.duration--;
        });
        
        // Remove expired treaties
        const expiredTreaties = this.treaties.filter(treaty => treaty.duration <= 0);
        this.treaties = this.treaties.filter(treaty => treaty.duration > 0);
        
        // Notify about expired treaties
        expiredTreaties.forEach(treaty => {
            const partiesText = treaty.parties.map(party => {
                if (party === 'player') return 'You';
                return this.factions[party]?.name || party;
            }).join(' & ');
            
            showGameMessage(`${treaty.name} between ${partiesText} has expired`);
            
            // If it was an alliance, revert to neutral
            if (treaty.type === 'military') {
                const factionId = treaty.parties.find(party => party !== 'player');
                if (factionId) {
                    this.setFactionRelation(factionId, 'neutral');
                }
            }
        });
    },
    
    // Utility: Capitalize first letter of string
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    },
    
    // Enhanced diplomacy features
    enhancedDiplomacyFeatures: {
        // New treaty types
        treatyTypes: [
            {id: 'non-aggression', name: 'Non-Aggression Pact', icon: '🤝', effects: {preventWar: true}},
            {id: 'research', name: 'Research Agreement', icon: '📚', effects: {researchBonus: 0.15}},
            {id: 'military-access', name: 'Military Access', icon: '🚶', effects: {allowTroopMovement: true}},
            {id: 'defensive', name: 'Defensive Pact', icon: '🛡️', effects: {mutualDefense: true}}
        ],
        
        // Diplomatic actions
        diplomaticActions: [
            {id: 'gift', name: 'Send Gift', relationBonus: 10, cost: {gold: 100}},
            {id: 'insult', name: 'Diplomatic Insult', relationEffect: -15},
            {id: 'tribute', name: 'Demand Tribute', relationEffect: -5, success: {resources: true}},
            {id: 'joint-war', name: 'Propose Joint War', relationEffect: 8, target: 'other_faction'}
        ]
    },
    
    // Propose non-aggression pact
    proposeNonAggression(factionId) {
        const faction = this.factions[factionId];
        
        // Check if pact already exists
        const existingPact = this.treaties.find(treaty => 
            treaty.type === 'non-aggression' && 
            treaty.parties.includes('player') && 
            treaty.parties.includes(factionId)
        );
        
        if (existingPact) {
            showGameMessage(`You already have a non-aggression pact with ${faction.name}`);
            return;
        }
        
        // Base success chance on relation value
        const successChance = faction.relationValue * 0.7;
        
        if (Math.random() * 100 < successChance) {
            // Pact accepted
            const treatyDuration = 12 + Math.floor(Math.random() * 4);
            
            const newTreaty = {
                id: `non-aggression-${factionId}`,
                type: 'non-aggression',
                name: 'Non-Aggression Pact',
                parties: ['player', factionId],
                duration: treatyDuration,
                effects: {
                    preventWar: true
                },
                icon: '🤝'
            };
            
            this.treaties.push(newTreaty);
            showGameMessage(`Non-Aggression Pact established with ${faction.name} for ${treatyDuration} years!`);
            
            this.changeFactionRelation(factionId, 8);
        } else {
            showGameMessage(`${faction.name} rejected your non-aggression proposal`);
            this.changeFactionRelation(factionId, -3);
        }
    },
    
    // Send diplomatic gift
    sendDiplomaticGift(factionId) {
        const faction = this.factions[factionId];
    
    // Check if player has enough resources
        if (gameState.resources.food < 50) {
            showGameMessage("You need at least 50 food to send a diplomatic gift");
            return;
        }
        
        // Deduct resources
        gameState.resources.food -= 50;
        
        // Improve relations
        this.changeFactionRelation(factionId, 15);
        this.changeReputation(5);
        
        showGameMessage(`You sent a gift to ${faction.name}, improving relations!`);
        this.updateDiplomacyUI();
    },
    
    // Request military assistance
    requestMilitaryAssistance(factionId, targetKingdomId) {
        const faction = this.factions[factionId];
        const targetKingdom = gameState.kingdoms[targetKingdomId];
        
        // Only allies can provide military assistance
        if (faction.relation !== 'ally') {
            showGameMessage(`${faction.name} must be your ally to request military assistance`);
            return false;
        }
        
        // Check for military alliance treaty
        const militaryAlliance = this.treaties.find(treaty => 
            treaty.type === 'military' && 
            treaty.parties.includes('player') && 
            treaty.parties.includes(factionId)
        );
        
        if (!militaryAlliance) {
            showGameMessage(`You need a military alliance with ${faction.name} to request assistance`);
            return false;
        }
        
        // Base success on relation value and reputation
        const successChance = (faction.relationValue * 0.6) + (this.reputation * 0.2);
        
        if (Math.random() * 100 < successChance) {
            // Send ally troops to attack the target
            this.spawnAlliedTroops(factionId, targetKingdomId);
            showGameMessage(`${faction.name} has agreed to send troops against ${targetKingdom.name}!`);
            this.changeFactionRelation(factionId, -5); // Slightly decreases relation for asking for help
            return true;
        } else {
            showGameMessage(`${faction.name} cannot spare troops at this time`);
            this.changeFactionRelation(factionId, -3);
            return false;
        }
    },
    
    // Spawn allied troops to assist player
    spawnAlliedTroops(factionId, targetKingdomId) {
        const faction = this.factions[factionId];
        const targetKingdom = gameState.kingdoms[targetKingdomId];
        
        // Find player kingdom capital or a random territory tile
        const playerKingdom = gameState.kingdoms[0];
        let spawnTile;
        
        if (playerKingdom.capital) {
            spawnTile = {x: playerKingdom.capital.x + 1, y: playerKingdom.capital.y + 1};
        } else {
            // Find any player territory
            const territoryTiles = [];
            for (let y = 0; y < MAP_SIZE; y++) {
                for (let x = 0; x < MAP_SIZE; x++) {
                    if (gameState.map[y][x].territory === 0) {
                        territoryTiles.push({x, y});
                    }
                }
            }
            
            if (territoryTiles.length > 0) {
                spawnTile = territoryTiles[Math.floor(Math.random() * territoryTiles.length)];
            } else {
                // Fallback to player position
                spawnTile = {x: gameState.player.x + 1, y: gameState.player.y + 1};
            }
        }
        
        // Spawn 3-6 allied troops
        const troopCount = 3 + Math.floor(Math.random() * 4);
        
        for (let i = 0; i < troopCount; i++) {
            // Offset spawn position slightly
            const offsetX = spawnTile.x + (Math.random() * 2 - 1);
            const offsetY = spawnTile.y + (Math.random() * 2 - 1);
            
            const troopX = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(offsetX)));
            const troopY = Math.max(0, Math.min(MAP_SIZE - 1, Math.floor(offsetY)));
            
            // Create allied troop
            const alliedTroop = {
                id: generateEnemyId(), // Add unique ID
                x: troopX,
                y: troopY,
                health: 75,
                attack: 8,
                type: 'WARRIOR',
                kingdomId: -1, // -1 indicates allied troop
                isAllied: true,
                allyFactionId: factionId,
                targetKingdomId: targetKingdomId,
                moveDelay: 350,
                lastMoved: 0,
                attackPath: null,
                attackPathIndex: 0,
                isAggressive: true,
                isTargetingPlayer: false,
                color: faction.color
            };
            
            gameState.enemies.push(alliedTroop);
        }
        
        showGameMessage(`${troopCount} allied troops from ${faction.name} have arrived!`);
    }
};

// Add CSS for dialog system
document.addEventListener('DOMContentLoaded', function() {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .diplomacy-dialog {
            display: none;
            position: absolute;
            width: 80%;
            max-width: 500px;
            background-color: #2c3e50;
            border: 3px solid #d4af37;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.7);
            z-index: 1000;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
        }
        
        .dialog-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 15px;
            background-color: #1c2e40;
            border-bottom: 2px solid #d4af37;
            border-radius: 7px 7px 0 0;
        }
        
        .dialog-header h3 {
            margin: 0;
            font-size: 1.2rem;
            color: #d4af37;
        }
        
        .dialog-content {
            padding: 15px;
        }
        
        .faction-portrait {
            text-align: center;
            margin-bottom: 15px;
        }
        
        .large-faction-icon {
            font-size: 3rem;
            background-color: #34495e;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #d4af37;
        }
        
        .dialog-message-container {
            background-color: #34495e;
            border: 1px solid #456789;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
        }
        
        .dialog-message {
            margin: 0;
            font-style: italic;
            line-height: 1.4;
        }
        
        .dialog-options {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .dialog-option {
            background-color: #3498db;
            color: white;
            border: none;
            padding: 8px 15px;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.2s;
            font-weight: bold;
        }
        
        .dialog-option:hover {
            background-color: #2980b9;
        }
        
        .dialog-option[data-option="ceasefire"] {
            background-color: #27ae60;
        }
        
        .dialog-option[data-option="ceasefire"]:hover {
            background-color: #219653;
        }
        
        .dialog-option[data-option="close"] {
            background-color: #7f8c8d;
        }
        
        .dialog-option[data-option="close"]:hover {
            background-color: #6c7a7b;
        }
    `;
    document.head.appendChild(styleEl);
});

// Add diplomacy initialization to window load
window.addEventListener('load', () => {
    diplomacySystem.init();
     
});

// Export the diplomacy system
window.diplomacySystem = diplomacySystem; 