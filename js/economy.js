// economy.js - Economy system, market and research

// Economy and Resource Management System
const economySystem = {
    // Add treasury property for diplomatic transactions
    treasury: 100,
    marketTraders: [], // Add market traders for more interactive economy
    
    init() {
        try {
            console.log("Initializing economy system...");
            
            // Initialize the basic economy system if it doesn't exist
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
            
            // Ensure all properties exist
            if (!gameState.economy.marketPrices) {
                gameState.economy.marketPrices = {
                    wood: 1.0,
                    stone: 1.5,
                    food: 0.8
                };
            }
            
            if (!gameState.economy.technologies) {
                gameState.economy.technologies = [];
            }
            
            if (!gameState.economy.marketTrades) {
                gameState.economy.marketTrades = [];
            }
            
            // Set default values for missing properties
            if (typeof gameState.economy.gold === 'undefined') gameState.economy.gold = 100;
            if (typeof gameState.economy.taxRate === 'undefined') gameState.economy.taxRate = 5;
            if (typeof gameState.economy.lastTaxCollection === 'undefined') gameState.economy.lastTaxCollection = 0;
            if (typeof gameState.economy.researchPoints === 'undefined') gameState.economy.researchPoints = 0;
            if (typeof gameState.economy.researching === 'undefined') gameState.economy.researching = null;
            if (typeof gameState.economy.researchProgress === 'undefined') gameState.economy.researchProgress = 0;
            
            // IMPORTANT: Set local treasury to match the economy's gold
            // This ensures that when loading a game, the treasury is properly synchronized
            this.treasury = gameState.economy.gold;
            
            // Initialize research technologies
            if (gameState.economy.technologies.length === 0) {
                gameState.economy.technologies = [
                    {
                        id: 'improved-farming',
                        name: 'Improved Farming',
                        cost: 50,
                        researched: false,
                        effect: { foodProduction: 1.2 }
                    },
                    {
                        id: 'efficient-mining',
                        name: 'Efficient Mining',
                        cost: 60,
                        researched: false,
                        effect: { stoneProduction: 1.2 }
                    },
                    {
                        id: 'advanced-logging',
                        name: 'Advanced Logging',
                        cost: 55,
                        researched: false,
                        effect: { woodProduction: 1.2 }
                    },
                    {
                        id: 'trade-routes',
                        name: 'Trade Routes',
                        cost: 80,
                        researched: false,
                        effect: { tradingIncome: 1.25 }
                    }
                ];
            }
            
            // Set up traders
            this.initTraders();
            
            // Add event listeners
            this.setupEconomyEventListeners();
            
            // Make sure economySystem is available globally
            window.economySystem = this;
            
            console.log("Economy system initialized successfully");
        } catch (error) {
            console.error("Error initializing economy system:", error);
        }
    },
    
    initTraders() {
        // Create NPC traders that visit player kingdom
        this.marketTraders = [
            {
                id: 'spice_merchant',
                name: 'Spice Merchant',
                icon: '🧂',
                specialty: 'food',
                visitInterval: 120000, // Visits every 2 minutes
                lastVisit: 0,
                offers: [
                    { resource: 'food', amount: 50, discount: 0.2 }
                ],
                getGreeting() {
                    return "Greetings! I bring exotic spices and foods from distant lands!";
                }
            },
            {
                id: 'lumber_trader',
                name: 'Lumber Trader',
                icon: '🪓',
                specialty: 'wood',
                visitInterval: 180000, // Visits every 3 minutes
                lastVisit: 0,
                offers: [
                    { resource: 'wood', amount: 75, discount: 0.15 }
                ],
                getGreeting() {
                    return "Need fine timber for your buildings? I have the best prices in the land!";
                }
            },
            {
                id: 'stone_mason',
                name: 'Stone Mason',
                icon: '⛏️',
                specialty: 'stone',
                visitInterval: 240000, // Visits every 4 minutes
                lastVisit: 0,
                offers: [
                    { resource: 'stone', amount: 60, discount: 0.1 }
                ],
                getGreeting() {
                    return "Finest quarried stone for your castles and fortifications!";
                }
            },
            {
                id: 'knowledge_keeper',
                name: 'Knowledge Keeper',
                icon: '📚',
                specialty: 'research',
                visitInterval: 300000, // Visits every 5 minutes
                lastVisit: 0,
                offers: [
                    { type: 'research', amount: 15, price: 25 }
                ],
                getGreeting() {
                    return "Wisdom can be more valuable than gold. I offer knowledge for a price!";
                }
            }
        ];
    },
    
    setupEconomyEventListeners() {
        // Economy button click event
        // Removing the duplicate listener for the economy button as it's already handled in ui.js
        // This duplicate listener was causing conflicts
        
        // Close economy panel
        const closeEconomyButton = document.getElementById('close-economy');
        if (closeEconomyButton) {
            closeEconomyButton.addEventListener('click', () => {
                const economyPanel = document.getElementById('economy-panel');
                if (economyPanel) {
                    economyPanel.classList.remove('show');
                }
            });
        }
        
        // Tax rate buttons
        document.getElementById('increase-tax').addEventListener('click', () => {
            if (gameState.economy.taxRate < 20) {
                gameState.economy.taxRate += 1;
                this.updateEconomyUI();
                showMessage(`Tax rate increased to ${gameState.economy.taxRate}%`);
            } else {
                showMessage("Maximum tax rate reached (20%)");
            }
        });
            
        document.getElementById('decrease-tax').addEventListener('click', () => {
            if (gameState.economy.taxRate > 1) {
                gameState.economy.taxRate -= 1;
                this.updateEconomyUI();
                showMessage(`Tax rate decreased to ${gameState.economy.taxRate}%`);
            } else {
                showMessage("Minimum tax rate reached (1%)");
            }
        });
        
        // Market buy buttons
        const buyButtons = document.querySelectorAll('.buy-button');
        buyButtons.forEach(button => {
            button.addEventListener('click', () => {
                const resource = button.getAttribute('data-resource');
                const amount = 10; // Default amount
                this.buyResource(resource, amount);
            });
        });
        
        // Market sell buttons
        const sellButtons = document.querySelectorAll('.sell-button');
        sellButtons.forEach(button => {
            button.addEventListener('click', () => {
                const resource = button.getAttribute('data-resource');
                const amount = 10; // Default amount
                this.sellResource(resource, amount);
            });
        });
        
        // Research buttons
        const techButtons = document.querySelectorAll('.tech-button');
        techButtons.forEach(button => {
            button.addEventListener('click', () => {
                const techId = button.getAttribute('data-tech-id');
                this.researchTechnology(techId);
            });
        });
    },
    
    updateEconomyUI() {
        try {

            // Update treasury display - ekonomi panelindeki altın değeri güncelleme
            if (window.updateEconomyGoldDisplay && typeof window.updateEconomyGoldDisplay === 'function') {
                window.updateEconomyGoldDisplay();
            } else {
                // Alternatif - yeni fonksiyon tanımlı değilse eski yöntemle devam et
                document.getElementById('gold-amount').textContent = `${Math.floor(gameState.economy.gold)}`;
                
                // Altın ikonu ekle
                const iconElement = document.createElement('i');
                iconElement.className = 'fas fa-coins gold-icon';
                document.getElementById('gold-amount').appendChild(iconElement);
            }
            
            // Update tax rate display
            document.getElementById('tax-rate').textContent = `${gameState.economy.taxRate}%`;
            
            // Update market prices
            for (const resource in gameState.economy.marketPrices) {
                document.getElementById(`${resource}-price`).textContent = gameState.economy.marketPrices[resource].toFixed(1);
            }
            
            // Update research section
            this.updateTechnologies();
            
            // Panel görünmüyor olabilir, ancak bu kod onu kendi kendine açmamalı
            // sadece arayüzü güncellemeli. Panel zaten açıksa güncelleme yapılacak.
            return true;
        } catch (error) {
            console.error("Error updating economy UI:", error);
            return false;
        }
    },
    
    updateTechnologies() {
        try {
            const techList = document.querySelector('.technologies-list');
            if (!techList) return;
            
            // Ensure technologies array exists
            if (!gameState.economy || !gameState.economy.technologies) {
                if (!gameState.economy) {
                    gameState.economy = {};
                }
                gameState.economy.technologies = [];
                return;
            }
            
            gameState.economy.technologies.forEach(tech => {
                const techItem = document.querySelector(`.tech-item[data-tech-id="${tech.id}"]`);
                if (techItem) {
                    const researchBtn = techItem.querySelector('.tech-button');
                    if (!researchBtn) return;
                    
                    if (tech.researched) {
                        techItem.classList.add('researched');
                        researchBtn.disabled = true;
                        researchBtn.textContent = translate('Researched');
                    } else if (gameState.economy.researching === tech.id) {
                        techItem.classList.add('researching');
                        researchBtn.disabled = true;
                        researchBtn.textContent = `${Math.floor(gameState.economy.researchProgress || 0)}%`;
                    } else {
                        techItem.classList.remove('researched', 'researching');
                        researchBtn.disabled = (gameState.economy.researchPoints < tech.cost) || (gameState.economy.researching !== null);
                        researchBtn.textContent = translate('Research');
                    }
                }
            });
        } catch (error) {
            console.error("Error in updateTechnologies:", error);
        }
    },
    
    collectTaxes() {
        const now = Date.now();
        const populationCount = gameState.population.current || 1;
        
        // Check if sufficient time has passed since last collection (at least 30 seconds)
        if (now - gameState.economy.lastTaxCollection < 30000) {
            showMessage("You can only collect taxes once every 30 seconds.");
            return;
        }
        
        // Calculate tax amount based on population and tax rate
        const taxAmount = populationCount * gameState.economy.taxRate * 0.5;
        
        // Add tax to treasury
        this.treasury += taxAmount;
        gameState.economy.gold = this.treasury; // Keep gold synchronized
        
        // Update last collection time
        gameState.economy.lastTaxCollection = now;
        
        // Show message
        showMessage(`Taxes collected: ${taxAmount.toFixed(1)} gold`);
        
        // Tax collection affects happiness (implemented in population system)
        if (gameState.population && typeof gameState.population.adjustHappiness === 'function') {
            // Higher tax rates reduce happiness
            const happinessImpact = -0.5 * (gameState.economy.taxRate / 10);
            gameState.population.adjustHappiness(happinessImpact);
        }
        
        // Update UI
        this.updateEconomyUI();
    },
    
    buyResource(resource, amount) {
        // Check if resource is valid
        if (!['wood', 'stone', 'food'].includes(resource)) {
            showMessage("Invalid resource type.");
            return;
        }
        
        // Check amount is positive
        if (amount <= 0) {
            showMessage("Amount must be positive.");
            return;
        }
        
        // Calculate cost with possible discount
        let pricePerUnit = gameState.economy.marketPrices[resource];
        
        // Apply market exchange discount if researched
        const marketExchangeTech = gameState.economy.technologies.find(t => t.id === 'market-exchanges');
        if (marketExchangeTech && marketExchangeTech.researched) {
            pricePerUnit *= marketExchangeTech.effect.marketDiscount;
        }
        
        const totalCost = pricePerUnit * amount;
        
        // Check if player has enough gold
        if (this.treasury < totalCost) {
            showMessage(`Not enough gold to buy ${amount} ${resource}.`);
            return;
        }
        
        // Deduct gold and add resources
        this.treasury -= totalCost;
        gameState.economy.gold = this.treasury; // Keep gold synchronized
        gameState.resources[resource] += amount;
        
        // Update market prices slightly - buying increases price
        gameState.economy.marketPrices[resource] *= 1.03;
        
        // Track transaction
        gameState.economy.marketTrades.push({
            type: 'buy',
            resource,
            amount,
            price: totalCost,
            time: Date.now()
        });
        
        // Limit history to last 10 trades
        if (gameState.economy.marketTrades.length > 10) {
            gameState.economy.marketTrades.shift();
        }
        
        // Show message
        showMessage(`Bought ${amount} ${translate(resource)} for ${totalCost.toFixed(1)} gold.`);
        
        // Update UI
        this.updateEconomyUI();
        updateUI(); // Update main UI resources
    },
    
    sellResource(resource, amount) {
        // Check if resource is valid
        if (!['wood', 'stone', 'food'].includes(resource)) {
            showMessage("Invalid resource type.");
            return;
        }
        
        // Check amount is positive
        if (amount <= 0) {
            showMessage("Amount must be positive.");
            return;
        }
        
        // Check if player has enough of the resource
        if (gameState.resources[resource] < amount) {
            showMessage(`Not enough ${translate(resource)} to sell.`);
            return;
        }
        
        // Calculate proceeds
        const pricePerUnit = gameState.economy.marketPrices[resource];
        const totalProceeds = pricePerUnit * amount;
        
        // Add gold and deduct resources
        this.treasury += totalProceeds;
        gameState.economy.gold = this.treasury; // Keep gold synchronized
        gameState.resources[resource] -= amount;
        
        // Update market prices slightly - selling decreases price
        gameState.economy.marketPrices[resource] *= 0.97;
        
        // Track transaction
        gameState.economy.marketTrades.push({
            type: 'sell',
            resource,
            amount,
            price: totalProceeds,
            time: Date.now()
        });
        
        // Limit history to last 10 trades
        if (gameState.economy.marketTrades.length > 10) {
            gameState.economy.marketTrades.shift();
        }
        
        // Show message
        showMessage(`Sold ${amount} ${translate(resource)} for ${totalProceeds.toFixed(1)} gold.`);
        
        // Update UI
        this.updateEconomyUI();
        updateUI(); // Update main UI resources
    },
    
    updateMarketPrices() {
        // Random market fluctuations
        gameState.economy.marketPrices.wood *= 0.95 + (Math.random() * 0.1);
        gameState.economy.marketPrices.stone *= 0.95 + (Math.random() * 0.1);
        gameState.economy.marketPrices.food *= 0.95 + (Math.random() * 0.1);
        
        // Ensure prices don't go too low or high
        gameState.economy.marketPrices.wood = Math.max(0.5, Math.min(3.0, gameState.economy.marketPrices.wood));
        gameState.economy.marketPrices.stone = Math.max(0.8, Math.min(4.0, gameState.economy.marketPrices.stone));
        gameState.economy.marketPrices.food = Math.max(0.3, Math.min(2.5, gameState.economy.marketPrices.food));
        
        // Update UI if panel is open
        if (document.getElementById('economy-panel').classList.contains('show')) {
            this.updateEconomyUI();
        }
    },
    
    generateResearchPoints(deltaTime) {
        // Base research points on buildings and population
        const buildingContribution = gameState.buildings.length * 0.001 * deltaTime;
        const populationContribution = gameState.population.current * 0.0005 * deltaTime;
        
        // Add research points
        gameState.economy.researchPoints += buildingContribution + populationContribution;
        
        // Update research progress if actively researching
        if (gameState.economy.researching) {
            const tech = gameState.economy.technologies.find(t => t.id === gameState.economy.researching);
            if (tech) {
                // Progress based on delta time
                const progressIncrement = (0.05 * deltaTime) / tech.cost;
                gameState.economy.researchProgress += progressIncrement * 100;
                
                // Check if research is complete
                if (gameState.economy.researchProgress >= 100) {
                    this.completeResearch(tech);
                }
                
                // Update UI if panel is open
                if (document.getElementById('economy-panel').classList.contains('show')) {
                    this.updateEconomyUI();
                }
            }
        }
    },
    
    researchTechnology(techId) {
        // Find the technology
        const tech = gameState.economy.technologies.find(t => t.id === techId);
        if (!tech || tech.researched) return;
        
        // Check if already researching something
        if (gameState.economy.researching) {
            showMessage(`Already researching ${gameState.economy.technologies.find(t => t.id === gameState.economy.researching).name}`);
            return;
        }
        
        // Check if player has enough research points
        if (gameState.economy.researchPoints < tech.cost) {
            showMessage(`Not enough research points to research ${tech.name}!`);
            return;
        }
        
        // Deduct research points
        gameState.economy.researchPoints -= tech.cost;
        
        // Start research
        gameState.economy.researching = tech.id;
        gameState.economy.researchProgress = 0;
        
        // Show message and update UI
        showMessage(`Started researching ${tech.name}!`);
        this.updateEconomyUI();
    },
    
    completeResearch(tech) {
        // Mark as researched
        tech.researched = true;
        
        // Apply effects
        if (tech.effect.foodProduction) {
            gameState.economy.resourceProductionBonuses.food *= tech.effect.foodProduction;
        }
        if (tech.effect.woodProduction) {
            gameState.economy.resourceProductionBonuses.wood *= tech.effect.woodProduction;
        }
        if (tech.effect.stoneProduction) {
            gameState.economy.resourceProductionBonuses.stone *= tech.effect.stoneProduction;
        }
        if (tech.effect.militaryStrength && gameState.military) {
            gameState.military.attack *= tech.effect.militaryStrength;
            gameState.military.defense *= tech.effect.militaryStrength;
            
            // Update military UI
            if (typeof updateMilitaryUI === 'function') {
                updateMilitaryUI();
            }
        }
        
        // Reset research progress
        gameState.economy.researching = null;
        gameState.economy.researchProgress = 0;
        
        // Show message
        showMessage(`Completed research: ${tech.name}!`);
        
        // Update UI
        this.updateEconomyUI();
    },
    
    checkForTraderVisits(currentTime) {
        // Ensure traderVisits array exists
        if (!gameState.economy.traderVisits) {
            gameState.economy.traderVisits = [];
        }
        
        this.marketTraders.forEach(trader => {
            // Check if it's time for trader to visit
            if (currentTime - trader.lastVisit >= trader.visitInterval) {
                // Mark visit time
                trader.lastVisit = currentTime;
                
                // Only show trader if player has a market (mill)
                const hasMarket = gameState.buildings.some(building => building.type === 'MILL');
                if (hasMarket) {
                    // Announce trader visit
                    showMessage(`${trader.icon} ${trader.name} has arrived with special offers!`);
                    
                    // Create trader offer UI
                    this.showTraderOffer(trader);
                    
                    // Add to visit history
                    gameState.economy.traderVisits.push({
                        traderId: trader.id,
                        time: currentTime
                    });
                    
                    // Limit history to last 10 visits
                    if (gameState.economy.traderVisits.length > 10) {
                        gameState.economy.traderVisits.shift();
                    }
                }
            }
        });
    },
    
    showTraderOffer(trader) {
        // Create trader dialog
        const traderDialog = document.createElement('div');
        traderDialog.className = 'trader-dialog';
        traderDialog.innerHTML = `
            <div class="trader-header">
                <span class="trader-icon">${trader.icon}</span>
                <h3>${trader.name}</h3>
                <button class="close-trader">×</button>
            </div>
            <p class="trader-greeting">${trader.getGreeting()}</p>
            <div class="trader-offers">
                ${trader.offers.map(offer => {
                    if (offer.resource) {
                        const discountedPrice = gameState.economy.marketPrices[offer.resource] * (1 - offer.discount) * offer.amount;
                        return `
                            <div class="trader-offer" data-resource="${offer.resource}" data-amount="${offer.amount}">
                                <div class="offer-details">
                                    <span class="offer-amount">${offer.amount}</span>
                                    <span class="offer-resource">${translate(offer.resource)}</span>
                                    <span class="offer-discount">-${offer.discount * 100}%</span>
                                </div>
                                <button class="buy-from-trader" data-price="${discountedPrice.toFixed(1)}">
                                    Buy for ${discountedPrice.toFixed(1)} gold
                                </button>
                            </div>
                        `;
                    } else if (offer.type === 'research') {
                        return `
                            <div class="trader-offer" data-type="research" data-amount="${offer.amount}">
                                <div class="offer-details">
                                    <span class="offer-amount">+${offer.amount}</span>
                                    <span class="offer-resource">Research Points</span>
                                </div>
                                <button class="buy-from-trader" data-price="${offer.price}">
                                    Buy for ${offer.price} gold
                                </button>
                            </div>
                        `;
                    }
                }).join('')}
            </div>
        `;
        
        // Add to DOM
        document.body.appendChild(traderDialog);
        
        // Add event listeners
        traderDialog.querySelector('.close-trader').addEventListener('click', () => {
            traderDialog.remove();
        });
        
        traderDialog.querySelectorAll('.buy-from-trader').forEach(button => {
            button.addEventListener('click', () => {
                const price = parseFloat(button.getAttribute('data-price'));
                const offer = button.closest('.trader-offer');
                
                if (this.treasury < price) {
                    showMessage("Not enough gold for this offer.");
                    return;
                }
                
                // Process purchase
                this.treasury -= price;
                gameState.economy.gold = this.treasury;
                
                if (offer.hasAttribute('data-resource')) {
                    // Resource offer
                    const resource = offer.getAttribute('data-resource');
                    const amount = parseInt(offer.getAttribute('data-amount'));
                    gameState.resources[resource] += amount;
                    showMessage(`Bought ${amount} ${translate(resource)} from ${trader.name}`);
                    updateUI();
                } else if (offer.getAttribute('data-type') === 'research') {
                    // Research points offer
                    const amount = parseInt(offer.getAttribute('data-amount'));
                    gameState.economy.researchPoints += amount;
                    showMessage(`Gained ${amount} research points from ${trader.name}`);
                }
                
                // Update economy UI
                this.updateEconomyUI();
                
                // Remove dialog
                traderDialog.remove();
            });
        });
    },
    
    update(deltaTime) {
        // Generate research points
        this.generateResearchPoints(deltaTime);
        
        // Update market prices periodically (every 30 seconds)
        const currentTime = Date.now();
        if (currentTime - gameState.economy.lastPriceUpdate > 30000) {
            this.updateMarketPrices();
            gameState.economy.lastPriceUpdate = currentTime;
        }
        
        // Check for trader visits
        this.checkForTraderVisits(currentTime);
        
        // Apply production bonuses to resource gathering
        if (gameState.gatheringProgress > 0) {
            const resourceType = gameState.gatheringResource;
            if (resourceType && gameState.economy.resourceProductionBonuses[resourceType]) {
                gameState.gatheringProgress += (0.1 * gameState.economy.resourceProductionBonuses[resourceType]) * deltaTime * 0.001;
            }
        }
    },
    
    // Add a method to check if player has enough gold for diplomatic actions
    hasEnoughGold(amount) {
        return this.treasury >= amount;
    },
    
    // Add method to spend gold on diplomatic actions
    spendGoldOnDiplomacy(amount, reason) {
        if (this.treasury < amount) {
            return false;
        }
        
        this.treasury -= amount;
        gameState.economy.gold = this.treasury; // Keep gold synchronized
        
        // Show message about the diplomatic expenditure
        showMessage(`Spent ${amount} gold on ${reason}`);
        
        // Update UI
        this.updateEconomyUI();
        
        return true;
    }
};

// Make economySystem globally available
window.economySystem = economySystem; 