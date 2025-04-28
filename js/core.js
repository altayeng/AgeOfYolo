// Game constants
const TILE_WIDTH = 64;  // Width of isometric tile
const TILE_HEIGHT = 32; // Height of isometric tile
const MAP_SIZE = 100;    // Size of the game map (100x100)
const VISIBLE_TILES = 15; // Number of tiles visible in viewport
const MAX_KINGDOMS = 5; // Maximum number of kingdoms including player

// Language system
const LANGUAGES = {
    EN: 'en',
    TR: 'tr'
};

let currentLanguage = LANGUAGES.TR; // Default language

// Translation dictionaries
const translations = {
    [LANGUAGES.EN]: {
        // Ages
        'Dark Age': 'Dark Age',
        'Feudal Age': 'Feudal Age',
        'Castle Age': 'Castle Age',
        'Imperial Age': 'Imperial Age',
        
        // UI elements
        'Economy': 'Economy',
        'Diplomacy': 'Diplomacy',
        'Your Reputation': 'Your Reputation',
        'Known Factions': 'Known Factions',
        'Treaties & Agreements': 'Treaties & Agreements',
        'Treasury': 'Treasury',
        'Tax Rate': 'Tax Rate',
        'Market': 'Market',
        'Research': 'Research',
        'Research Points': 'Research Points',
        
        // Resources
        'Wood': 'Wood',
        'Stone': 'Stone',
        'Food': 'Food',
        
        // Buildings
        'House': 'House',
        'Barracks': 'Barracks',
        'Mill': 'Mill',
        'Tower': 'Tower',
        'Wall': 'Wall',
        'BUILDINGS': 'BUILDINGS',
        
        // Actions
        'ACTIONS': 'ACTIONS',
        'Gather': 'Gather',
        'Craft': 'Craft',
        'Advance': 'Advance',
        'Buy': 'Buy',
        'Sell': 'Sell',
        'Research': 'Research',
        
        // Military
        'Need Barracks': 'Need Barracks',
        'Need Towers': 'Need Towers',
        
        // Year display
        'Year': 'Year',
        
        // Kingdom colors
        'Blue Kingdom': 'Blue Kingdom',
        'Red Kingdom': 'Red Kingdom',
        'Green Kingdom': 'Green Kingdom',
        'Purple Kingdom': 'Purple Kingdom',
        'Orange Kingdom': 'Orange Kingdom',
        'Yellow Kingdom': 'Yellow Kingdom',
        
        // Diplomatic relations
        'Ally': 'Ally',
        'Neutral': 'Neutral',
        'Enemy': 'Enemy',
        'Hostile': 'Hostile',
        'Truce': 'Truce',
        
        // Messages
        'Welcome to Age of Empires! Build walls to establish your kingdom territory.': 'Welcome to Age of Empires! Build walls to establish your kingdom territory.',
        'You have reached the maximum age!': 'You have reached the maximum age!',
        'Advanced to': 'Advanced to',
        'Need': 'Need',
        'more building(s) to advance to': 'more building(s) to advance to',
        'Not enough resources to advance! Need': 'Not enough resources to advance! Need',
        'more wood': 'more wood',
        'more stone': 'more stone',
        'more food': 'more food',
        'Gathered resources from surrounding tiles!': 'Gathered resources from surrounding tiles!',
        
        // Research Technologies
        'Improved Farming': 'Improved Farming',
        'Efficient Mining': 'Efficient Mining',
        'Advanced Logging': 'Advanced Logging',
        'Trade Routes': 'Trade Routes',
        '+20% Food Production': '+20% Food Production',
        '+20% Stone Production': '+20% Stone Production',
        '+20% Wood Production': '+20% Wood Production',
        '+25% Trading Income': '+25% Trading Income',
        'Cost': 'Cost',
        'Points': 'Points',
        
        // Others
        'MINI MAP': 'MINI MAP',
        'years remaining': 'years remaining',
        'You': 'You',
        'Language': 'Language',
        'English': 'English',
        'Turkish': 'Turkish',
        
        // Save and menu translations
        'New Game': 'New Game',
        'Continue': 'Continue',
        'Saved Games': 'Saved Games',
        'Settings': 'Settings',
        'Save': 'Save',
        'Game Menu': 'Game Menu',
        'Resume Game': 'Resume Game',
        'Save Game': 'Save Game',
        'Load Game': 'Load Game',
        'Exit to Menu': 'Exit to Menu',
        'Game saved successfully!': 'Game saved successfully!',
        'Failed to save game!': 'Failed to save game!',
        'Game loaded successfully!': 'Game loaded successfully!',
        'Failed to load game!': 'Failed to load game!',
        'No saved games found': 'No saved games found',
        'No saved game found!': 'No saved game found!',
        'Save file not found!': 'Save file not found!',
        'Error resetting game state: ': 'Error resetting game state: ',
        'Failed to load game: ': 'Failed to load game: ',
        'Are you sure you want to delete this saved game?': 'Are you sure you want to delete this saved game?',
        'Saved game deleted!': 'Saved game deleted!',
        'Failed to delete saved game!': 'Failed to delete saved game!',
        'You have unsaved changes. Are you sure you want to exit to menu?': 'You have unsaved changes. Are you sure you want to exit to menu?',
        'Game Settings': 'Game Settings',
        'Difficulty': 'Difficulty',
        'Easy': 'Easy',
        'Normal': 'Normal',
        'Hard': 'Hard',
        'Music Volume': 'Music Volume',
        'Sound Effects': 'Sound Effects',
        'Save Settings': 'Save Settings',
        'Reset to Default': 'Reset to Default',
        'Settings saved successfully!': 'Settings saved successfully!',
        'Failed to save settings!': 'Failed to save settings!',
        'Settings reset to default!': 'Settings reset to default!',
        'Failed to reset settings!': 'Failed to reset settings!'
    },
    [LANGUAGES.TR]: {
        // Ages
        'Dark Age': 'Karanlık Çağ',
        'Feudal Age': 'Feodal Çağ',
        'Castle Age': 'Kale Çağı',
        'Imperial Age': 'İmparatorluk Çağı',
        
        // UI elements
        'Economy': 'Ekonomi',
        'Diplomacy': 'Diplomasi',
        'Your Reputation': 'İtibarınız',
        'Known Factions': 'Bilinen Krallıklar',
        'Treaties & Agreements': 'Antlaşmalar',
        'Treasury': 'Hazine',
        'Tax Rate': 'Vergi Oranı',
        'Market': 'Pazar',
        'Research': 'Araştırma',
        'Research Points': 'Araştırma Puanları',
        
        // Resources
        'Wood': 'Odun',
        'Stone': 'Taş',
        'Food': 'Yiyecek',
        
        // Buildings
        'House': 'Ev',
        'Barracks': 'Kışla',
        'Mill': 'Değirmen',
        'Tower': 'Kule',
        'Wall': 'Duvar',
        'BUILDINGS': 'BİNALAR',
        
        // Actions
        'ACTIONS': 'EYLEMLER',
        'Gather': 'Topla',
        'Craft': 'Üret',
        'Advance': 'İlerle',
        'Buy': 'Satın Al',
        'Sell': 'Sat',
        'Research': 'Araştır',
        
        // Military
        'Need Barracks': 'Kışla Gerekli',
        'Need Towers': 'Kule Gerekli',
        
        // Year display
        'Year': 'Yıl',
        
        // Kingdom colors
        'Blue Kingdom': 'Mavi Krallığı',
        'Red Kingdom': 'Kırmızı Krallığı',
        'Green Kingdom': 'Yeşil Krallığı',
        'Purple Kingdom': 'Mor Krallığı',
        'Orange Kingdom': 'Turuncu Krallığı',
        'Yellow Kingdom': 'Sarı Krallığı',
        
        // Diplomatic relations
        'Ally': 'Müttefik',
        'Neutral': 'Tarafsız',
        'Enemy': 'Düşman',
        'Hostile': 'Düşmanca',
        'Truce': 'Ateşkes',
        
        // Messages
        'Welcome to Age of Empires! Build walls to establish your kingdom territory.': 'Age of Empires\'e hoş geldiniz! Krallık bölgenizi oluşturmak için duvarlar inşa edin.',
        'You have reached the maximum age!': 'Maksimum çağa ulaştınız!',
        'Advanced to': 'Yükseldiniz:',
        'Need': 'Gerekli',
        'more building(s) to advance to': 'bina daha gerekli:',
        'Not enough resources to advance! Need': 'İlerlemek için yeterli kaynak yok! Gerekli:',
        'more wood': 'odun daha',
        'more stone': 'taş daha',
        'more food': 'yiyecek daha',
        'Gathered resources from surrounding tiles!': 'Çevredeki karelerden kaynaklar toplandı!',
        
        // Research Technologies
        'Improved Farming': 'Gelişmiş Tarım',
        'Efficient Mining': 'Verimli Madencilik',
        'Advanced Logging': 'İleri Ağaç Kesimi',
        'Trade Routes': 'Ticaret Yolları',
        '+20% Food Production': '+20% Yiyecek Üretimi',
        '+20% Stone Production': '+20% Taş Üretimi',
        '+20% Wood Production': '+20% Odun Üretimi',
        '+25% Trading Income': '+25% Ticaret Geliri',
        'Cost': 'Maliyet',
        'Points': 'Puan',
        
        // Others
        'MINI MAP': 'MİNİ HARİTA',
        'years remaining': 'yıl kaldı',
        'You': 'Siz',
        'Language': 'Dil',
        'English': 'İngilizce',
        'Turkish': 'Türkçe',
        
        // Save and menu translations
        'New Game': 'Yeni Oyun',
        'Continue': 'Devam Et',
        'Saved Games': 'Kayıtlı Oyunlar',
        'Settings': 'Ayarlar',
        'Save': 'Kaydet',
        'Game Menu': 'Oyun Menüsü',
        'Resume Game': 'Oyuna Devam Et',
        'Save Game': 'Oyunu Kaydet',
        'Load Game': 'Oyun Yükle',
        'Exit to Menu': 'Menüye Dön',
        'Game saved successfully!': 'Oyun başarıyla kaydedildi!',
        'Failed to save game!': 'Oyun kaydedilemedi!',
        'Game loaded successfully!': 'Oyun başarıyla yüklendi!',
        'Failed to load game!': 'Oyun yüklenemedi!',
        'No saved games found': 'Kayıtlı oyun bulunamadı',
        'No saved game found!': 'Kayıtlı oyun bulunamadı!',
        'Save file not found!': 'Kayıt dosyası bulunamadı!',
        'Error resetting game state: ': 'Oyun durumu sıfırlanırken hata: ',
        'Failed to load game: ': 'Oyun yüklenemedi: ',
        'Are you sure you want to delete this saved game?': 'Bu kayıtlı oyunu silmek istediğinize emin misiniz?',
        'Saved game deleted!': 'Kayıtlı oyun silindi!',
        'Failed to delete saved game!': 'Kayıtlı oyun silinemedi!',
        'You have unsaved changes. Are you sure you want to exit to menu?': 'Kaydedilmemiş değişiklikleriniz var. Menüye dönmek istediğinize emin misiniz?',
        'Game Settings': 'Oyun Ayarları',
        'Difficulty': 'Zorluk',
        'Easy': 'Kolay',
        'Normal': 'Normal',
        'Hard': 'Zor',
        'Music Volume': 'Müzik Sesi',
        'Sound Effects': 'Efekt Sesi',
        'Save Settings': 'Ayarları Kaydet',
        'Reset to Default': 'Varsayılana Sıfırla',
        'Settings saved successfully!': 'Ayarlar başarıyla kaydedildi!',
        'Failed to save settings!': 'Ayarlar kaydedilemedi!',
        'Settings reset to default!': 'Ayarlar varsayılana sıfırlandı!',
        'Failed to reset settings!': 'Ayarlar sıfırlanamadı!'
    }
};

// Function to translate text
function translate(text) {
    if (!text) return '';
    
    // Metinde dinamik içerik var mı kontrol edelim (sayılar, değişkenler, vs.)
    // Örnek: "Bought 10 Wood for 5.0 gold." gibi dinamik içerikleri parçalayalım
    // Bu tür mesajlar genellikle "showMessage" ile gösterilir
    
    // İlk olarak basit bir çeviri kontrolü yapalım
    if (translations[currentLanguage] && translations[currentLanguage][text]) {
        return translations[currentLanguage][text];
    }
    
    // Eğer doğrudan çeviri bulunamadıysa, dinamik içeriği olan mesajları işleyelim
    // Bazı yaygın mesaj kalıplarını kontrol edelim
    
    // "Bought X Y for Z gold." örüntüsü
    const boughtMatch = text.match(/Bought (\d+) ([a-zA-Z]+) for ([0-9.]+) gold./);
    if (boughtMatch) {
        const amount = boughtMatch[1];
        const resource = boughtMatch[2];
        const cost = boughtMatch[3];
        
        // Kaynak adını çevirelim
        const translatedResource = translate(resource);
        
        // Mesaj kalıbını çevirelim (Türkçede farklı kelime sırası olabilir)
        if (currentLanguage === LANGUAGES.TR) {
            return `${amount} ${translatedResource} ${cost} altına satın alındı.`;
        }
    }
    
    // "Sold X Y for Z gold." örüntüsü
    const soldMatch = text.match(/Sold (\d+) ([a-zA-Z]+) for ([0-9.]+) gold./);
    if (soldMatch) {
        const amount = soldMatch[1];
        const resource = soldMatch[2];
        const profit = soldMatch[3];
        
        // Kaynak adını çevirelim
        const translatedResource = translate(resource);
        
        // Mesaj kalıbını çevirelim (Türkçede farklı kelime sırası olabilir)
        if (currentLanguage === LANGUAGES.TR) {
            return `${amount} ${translatedResource} ${profit} altına satıldı.`;
        }
    }
    
    // "Tax rate increased/decreased to X%" örüntüsü
    const taxRateMatch = text.match(/Tax rate (increased|decreased) to (\d+)%/);
    if (taxRateMatch) {
        const direction = taxRateMatch[1];
        const rate = taxRateMatch[2];
        
        if (currentLanguage === LANGUAGES.TR) {
            const action = direction === 'increased' ? 'yükseltildi' : 'düşürüldü';
            return `Vergi oranı %${rate} olarak ${action}.`;
        }
    }
    
    // "Gathered resources from surrounding tiles!" mesajı
    if (text === "Gathered resources from surrounding tiles!") {
        if (currentLanguage === LANGUAGES.TR) {
            return "Çevredeki karelerden kaynaklar toplandı!";
        }
    }
    
    // "Not enough resources to advance! Need X more Y" örüntüsü
    const advanceMatch = text.match(/Not enough resources to advance! Need ([0-9]+) more ([a-zA-Z]+)/);
    if (advanceMatch) {
        const amount = advanceMatch[1];
        const resource = advanceMatch[2];
        
        const translatedResource = translate(`more ${resource}`);
        
        if (currentLanguage === LANGUAGES.TR) {
            return `İlerlemek için yeterli kaynak yok! Gerekli: ${amount} ${translatedResource}`;
        }
    }
    
    // "Need X more building(s) to advance to Y" örüntüsü
    const buildingMatch = text.match(/Need ([0-9]+) more building\(s\) to advance to ([a-zA-Z ]+)/);
    if (buildingMatch) {
        const amount = buildingMatch[1];
        const age = buildingMatch[2];
        
        const translatedAge = translate(age);
        
        if (currentLanguage === LANGUAGES.TR) {
            return `Gerekli ${amount} bina daha gerekli: ${translatedAge}`;
        }
    }
    
    // "Game saved successfully!" mesajı
    if (text === "Game saved successfully!") {
        if (currentLanguage === LANGUAGES.TR) {
            return "Oyun başarıyla kaydedildi!";
        }
    }
    
    // "Started researching X!" örüntüsü
    const researchMatch = text.match(/Started researching ([a-zA-Z ]+)!/);
    if (researchMatch) {
        const tech = researchMatch[1];
        
        const translatedTech = translate(tech);
        
        if (currentLanguage === LANGUAGES.TR) {
            return `${translatedTech} araştırılmaya başlandı!`;
        }
    }
    
    // "Completed research: X!" örüntüsü
    const completeResearchMatch = text.match(/Completed research: ([a-zA-Z ]+)!/);
    if (completeResearchMatch) {
        const tech = completeResearchMatch[1];
        
        const translatedTech = translate(tech);
        
        if (currentLanguage === LANGUAGES.TR) {
            return `Araştırma tamamlandı: ${translatedTech}!`;
        }
    }
    
    // Return original text if no match found
    return text;
}

// Function to switch language
function switchLanguage(language) {
    console.log("switchLanguage called with:", language);
    
    // Check if it's a direct language code (like 'en', 'tr')
    if (language === 'en') {
        currentLanguage = LANGUAGES.EN;
    } else if (language === 'tr') {
        currentLanguage = LANGUAGES.TR;
    }
    // Legacy support for LANGUAGES object keys
    else if (LANGUAGES[language]) {
        currentLanguage = LANGUAGES[language];
    } else {
        // Default fallback
        currentLanguage = language;
    }
    
    // Update all text elements with data-i18n attribute
    updateAllUIText();
    
    // Save language preference to localStorage
    localStorage.setItem('gameLanguage', currentLanguage);
    
    // Update the top-bar language selector if it exists
    const topBarSelector = document.getElementById('language-select-topbar');
    if (topBarSelector) {
        topBarSelector.value = currentLanguage;
    }
    
    // Update the settings panel language selector if it exists
    const settingsSelector = document.getElementById('language-select');
    if (settingsSelector) {
        settingsSelector.value = currentLanguage;
    }
    
    // Log language change
    console.log("Language switched to:", currentLanguage);
}

// DOM Elements
let gameCanvas, gameCtx, minimapCanvas, minimapCtx;

// Animation timing
let lastFrameTime = 0;

// core.js - Core game functions, state management and main loop
// Initialize the game
function initGame() {
    // Initialize language system
    initLanguageSystem();
    
    // Initialize other systems...
    
    // Initialize DOM elements first
    gameCanvas = document.getElementById('game-canvas');
    gameCtx = gameCanvas.getContext('2d');
    minimapCanvas = document.getElementById('minimap');
    minimapCtx = minimapCanvas.getContext('2d');
    
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
            combatCooldown: 0, // Add combat cooldown property
            economy: {
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
            }
        };
    } else {
        // Initialize or update economy if it doesn't exist
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
        // Just add combatCooldown if it doesn't exist
        if (gameState.combatCooldown === undefined) {
            gameState.combatCooldown = 0;
        }
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
    
    // Initialize military stats
    updateMilitaryStats();
    updateMilitaryUI();
    
    // Initialize Economy System
    if (window.economySystem && typeof window.economySystem.init === 'function') {
        console.log("Initializing economy system from core.js");
        window.economySystem.init();
    } else {
        console.warn("Economy system not available or init method missing");
    }
    
    // Initialize diplomacy early to capture all kingdoms
    if (window.diplomacySystem) {
        window.diplomacySystem.syncKingdomsWithFactions();
    }
    
    // Show welcome message
    setTimeout(() => {
        showMessage(translate('Welcome to Age of Empires! Build walls to establish your kingdom territory.'));
    }, 500);
    
    console.log("Game initialized with player at:", gameState.player.x, gameState.player.y);
    console.log("Camera position:", gameState.camera.x, gameState.camera.y);
    
    // Apply translations to all UI elements after DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
        console.log("DOM fully loaded, applying translations");
        setTimeout(() => {
            updateAllUIText();
        }, 800);
    });
    
    // If DOM is already loaded, apply translations
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        console.log("DOM already loaded, applying translations");
        setTimeout(() => {
            updateAllUIText();
        }, 800);
    }
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

// Remove window.load event listener since it's now inside initGame
// window.addEventListener('load', initGame);

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
    
    // Minimap click
    minimapCanvas.addEventListener('click', handleMinimapClick);
}

// Game loop
function gameLoop(timestamp) {
    // Handle first frame
    if (lastFrameTime === 0) {
        lastFrameTime = timestamp;
        requestAnimationFrame(gameLoop);
        return;
    }
    
    // Calculate delta time
    const deltaTime = (timestamp - lastFrameTime) / 1000;
    lastFrameTime = timestamp;
    
    // Update game state
    updateGameState(deltaTime);
    
    // Draw the game
    drawMap();
    drawMinimap();
    updateUI();
    
    // Continue the loop
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
    
    // Update Economy System
                if (economySystem) {
        economySystem.update(deltaTime);
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


// Helper functions for colors
function lightenColor(color, percent) {
    return shadeColor(color, percent);
}

function darkenColor(color, percent) {
    return shadeColor(color, -percent);
}



// Helper function to convert hex color to rgba
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}



// Export functions that need to be accessed by other modules
window.initGame = initGame;
window.gameState = gameState;
window.gameLoop = gameLoop;
window.updateGameState = updateGameState;

// Initialize language system
function initLanguageSystem() {
    // Check if language preference is saved
    const savedLanguage = localStorage.getItem('gameLanguage');
    if (savedLanguage) {
        currentLanguage = savedLanguage;
    }
    
    // Create language selector UI
    createLanguageSelector();
}

// Create language selector UI
function createLanguageSelector() {
    // Check if selector already exists
    if (document.getElementById('language-selector')) return;
    
    // Create language selector container
    const languageSelector = document.createElement('div');
    languageSelector.id = 'language-selector';
    languageSelector.className = 'language-selector';
    
    // Add language options
    languageSelector.innerHTML = `
        <span class="language-label">${translate('Language')}:</span>
        <select id="language-select-topbar">
            <option value="${LANGUAGES.EN}" ${currentLanguage === LANGUAGES.EN ? 'selected' : ''}>${translate('English')}</option>
            <option value="${LANGUAGES.TR}" ${currentLanguage === LANGUAGES.TR ? 'selected' : ''}>${translate('Turkish')}</option>
        </select>
    `;
    
    // Add to UI
    const topBar = document.getElementById('top-bar');
    if (topBar) {
        topBar.appendChild(languageSelector);
    } else {
        document.getElementById('game-container').appendChild(languageSelector);
    }
    
    // Add event listener with a different ID to avoid conflict with settings panel
    document.getElementById('language-select-topbar').addEventListener('change', function(e) {
        console.log("Top bar language selection changed to:", e.target.value);
        switchLanguage(e.target.value);
    });
    
    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
        .language-selector {
            display: flex;
            align-items: center;
            margin-left: 20px;
            color: #fff;
        }
        
        .language-label {
            margin-right: 5px;
            font-size: 14px;
        }
        
        #language-select-topbar {
            background-color: #2c3e50;
            color: #fff;
            border: 1px solid #3498db;
            padding: 2px 5px;
            border-radius: 4px;
            font-size: 14px;
        }
    `;
    document.head.appendChild(style);
}

// Update all UI text elements
function updateAllUIText() {
    // Update static elements with data attributes
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            el.textContent = translate(key);
        }
    });
    
    // Update specific UI elements
    updateSpecificUIElements();
}

// Update specific UI elements that need manual updating
function updateSpecificUIElements() {
    // Update age display
    const currentAgeEl = document.getElementById('current-age');
    if (currentAgeEl && currentAgeEl.querySelector('span')) {
        const age = AGES[gameState.currentAge].name;
        currentAgeEl.querySelector('span').textContent = translate(age);
    }
    
    // Update year display
    const gameTimeEl = document.getElementById('game-time');
    if (gameTimeEl && gameTimeEl.querySelector('span')) {
        gameTimeEl.querySelector('span').textContent = `${translate('Year')}: ${Math.floor(gameState.gameYear)}`;
    }
    
    // Update building buttons
    document.querySelectorAll('.building-button span').forEach(el => {
        if (el) {
            const origText = el.textContent;
            el.textContent = translate(origText);
        }
    });
    
    // Update action buttons
    document.querySelectorAll('.action-button span').forEach(el => {
        if (el) {
            const origText = el.textContent;
            el.textContent = translate(origText);
        }
    });
    
    // Update panel headers
    document.querySelectorAll('.panel-header h2').forEach(el => {
        if (el && el.innerHTML) {
            if (el.innerHTML.includes('handshake') && el.querySelector('span')) {
                el.querySelector('span').textContent = translate('Diplomacy');
            } else if (el.innerHTML.includes('account_balance') && el.querySelector('span')) {
                el.querySelector('span').textContent = translate('Economy');
            }
        }
    });
    
    // Update panel content headers
    document.querySelectorAll('.panel-content h3').forEach(el => {
        if (el) {
            el.textContent = translate(el.textContent);
        }
    });
    
    // Update faction relation texts
    document.querySelectorAll('.faction-relation').forEach(el => {
        if (el) {
            el.textContent = translate(el.textContent);
        }
    });
    
    // Update menu titles
    document.querySelectorAll('.menu-title').forEach(el => {
        if (el) {
            el.textContent = translate(el.textContent);
        }
    });
    
    // Update stat labels
    document.querySelectorAll('.stat-label').forEach(el => {
        if (el && el.textContent) {
            if (el.textContent.includes(':')) {
                const label = el.textContent.replace(':', '');
                el.textContent = translate(label) + ':';
            } else {
                el.textContent = translate(el.textContent);
            }
        }
    });
    
    // Update research labels
    document.querySelectorAll('.research-label').forEach(el => {
        if (el && el.textContent) {
            if (el.textContent.includes(':')) {
                const label = el.textContent.replace(':', '');
                el.textContent = translate(label) + ':';
            } else {
                el.textContent = translate(el.textContent);
            }
        }
    });
    
    // Update resource labels
    document.querySelectorAll('.resource-label span').forEach(el => {
        if (el) {
            el.textContent = translate(el.textContent);
        }
    });
    
    // Update market buttons
    document.querySelectorAll('.market-button').forEach(el => {
        if (el) {
            el.textContent = translate(el.textContent);
        }
    });
    
    // Update military needs
    document.querySelectorAll('.military-need').forEach(el => {
        if (el) {
            el.textContent = translate(el.textContent);
        }
    });
    
    // Update minimap label
    const minimapLabel = document.getElementById('minimap-label');
    if (minimapLabel) {
        minimapLabel.textContent = translate('MINI MAP');
    }
    
    // Update language selector
    const languageLabel = document.querySelector('.language-label');
    if (languageLabel) {
        languageLabel.textContent = `${translate('Language')}:`;
    }
    
    // Update treaty durations
    document.querySelectorAll('.treaty-duration').forEach(el => {
        if (el && el.textContent && el.textContent.includes('years remaining')) {
            const years = el.textContent.split(' ')[0];
            el.textContent = `${years} ${translate('years remaining')}`;
        }
    });
    
    // Update reputation label
    const reputationLabel = document.querySelector('.reputation-label');
    if (reputationLabel) {
        reputationLabel.textContent = translate('Your Reputation') + ':';
    }
    
    // Update technology names, effects, and buttons
    document.querySelectorAll('.tech-name').forEach(el => {
        if (el) {
            el.textContent = translate(el.textContent);
        }
    });
    
    document.querySelectorAll('.tech-effect').forEach(el => {
        if (el) {
            el.textContent = translate(el.textContent);
        }
    });
    
    document.querySelectorAll('.tech-cost').forEach(el => {
        if (el && el.textContent) {
            const costText = el.textContent;
            const matches = costText.match(/(\d+)\s+Points/);
            if (matches) {
                const points = matches[1];
                el.innerHTML = `<span>${translate('Cost')}</span>: ${points} <span>${translate('Points')}</span>`;
            }
        }
    });
    
    document.querySelectorAll('.tech-button').forEach(el => {
        if (el) {
            el.textContent = translate('Research');
        }
    });
    
    // Update UI only if it exists
    if (typeof window.updateUI === 'function') {
        window.updateUI();
    }
    
    // Update diplomacy UI if available
    if (window.diplomacySystem && typeof window.diplomacySystem.updateDiplomacyUI === 'function') {
        window.diplomacySystem.updateDiplomacyUI();
    }
}

// Export language functions
window.translate = translate;
window.switchLanguage = switchLanguage;
window.updateAllUIText = updateAllUIText;

// Reset the game state for loading saved games
function resetGameState() {
    console.log("Resetting game state...");
    
    // Reset player
    gameState.player = {
        x: 400,
        y: 300,
        size: 20,
        speed: 3,
        health: 100,
        maxHealth: 100,
        color: '#FFFF00',
        direction: 0,
        isMoving: false
    };
    
    // Reset resources
    gameState.resources = {
        wood: 0,
        stone: 0,
        food: 0
    };
    
    // Reset buildings and enemies
    gameState.buildings = [];
    gameState.enemies = [];
    
    // Reset game time and age
    gameState.gameTime = 0;
    
    // Ensure currentAge is a number (index into AGES array)
    // Instead of the string 'DarkAge' which doesn't match our AGES array
    gameState.currentAge = 0; // 0 = Dark Age, 1 = Feudal Age, etc.
    
    // Reset flags
    gameState.isGatherMode = false;
    gameState.isBuildMode = false;
    gameState.selectedBuildingType = null;
    
    // Reset camera
    gameState.camera = {
        x: 0,
        y: 0,
        width: gameCanvas ? gameCanvas.width : 800,
        height: gameCanvas ? gameCanvas.height : 600
    };
    
    // Reset population
    gameState.population = {
        current: 0,
        max: 10,
        soldiers: 0
    };
    
    // Reset military stats
    gameState.military = {
        attack: 10,          // Base attack power
        defense: 5,          // Base defense
        trainingSpeed: 1.0,  // Training speed multiplier
        range: 1,            // Attack range
        barracksCount: 0,    // Number of barracks
        towerCount: 0,       // Number of towers
        attackBonus: 0,      // Additional attack from buildings
        defenseBonus: 0,     // Additional defense from buildings
        needsBarracks: true, // Whether the player needs more barracks
        needsTowers: true    // Whether the player needs more towers
    };
    
    // Reset economy system
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
        marketTrades: [],
        resourceProductionBonuses: {
            wood: 1.0,
            stone: 1.0,
            food: 1.0
        }
    };
    
    // Reset economy and diplomacy systems if they exist
    if (window.economySystem) {
        window.economySystem.treasury = gameState.economy.gold;
    }
    
    if (window.diplomacySystem && typeof window.diplomacySystem.init === 'function') {
        window.diplomacySystem.init(true); // Reset to defaults
    }
    
    // Reset other state variables as needed
    gameState.lastEnemySpawn = 0;
    gameState.lastTick = Date.now();
    gameState.isRunning = false;
    
    console.log("Game state reset completed");
    
    // Reset UI if the function exists
    if (typeof updateUI === 'function') {
        try {
            updateUI();
        } catch (uiError) {
            console.error("Error updating UI after reset:", uiError);
        }
    }
}

// Export functions that need to be accessed by other modules
window.initGame = initGame;
window.gameState = gameState;
window.gameLoop = gameLoop;
window.updateGameState = updateGameState;
window.resetGameState = resetGameState;