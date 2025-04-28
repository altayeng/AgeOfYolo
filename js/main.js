// main.js - Entry point for the game application

// Wait for window to be fully loaded before initializing
window.addEventListener('load', () => {
    console.log("Window loaded, initializing game...");
    
    // Initialize DOM elements first to prevent errors
    window.gameCanvas = document.getElementById('game-canvas');
    window.gameCtx = window.gameCanvas ? window.gameCanvas.getContext('2d') : null;
    window.minimapCanvas = document.getElementById('minimap');
    window.minimapCtx = window.minimapCanvas ? window.minimapCanvas.getContext('2d') : null;
    
    // Initialize the main menu first
    initializeMainMenu();
    
    // Load settings
    loadSettings();
    
    // Don't automatically start the game - wait for user to click "New Game" or "Continue"
    // initGame();
    
    // Initialize the in-game menu system
    initializeMenuSystem();
    
    // Add auto-save functionality
    setInterval(() => {
        // Only save if the game is running
        if (gameState && gameState.isRunning) {
            saveGame();
        }
    }, 5 * 60 * 1000); // Auto-save every 5 minutes
});