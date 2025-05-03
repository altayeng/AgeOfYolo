// Modern Notification System for Age of Empire: Imperial Dawn 2025

// Show a modern notification with type (success, error, warning)
function showNotification(message, type = 'success', notificationType = 'personal') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type} notification-${notificationType}`;
    notification.textContent = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Remove after delay
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Kingdom notification for kingdom-related events (left side)
function showKingdomNotification(message, type = 'success') {
    // UI bildirimini göster
    if (window.showMessage && typeof window.showMessage === 'function') {
        try {
            window.showMessage(message, 'kingdom');
        } catch (error) {
            console.error("Kingdom message error:", error);
        }
    }
    
    // Ekrana bildirim ekleme
    // Removed: showNotification(message, type, 'kingdom');
}

// Personal notification for player-related events (right side)
function showPersonalNotification(message, type = 'success') {
    // UI bildirimini göster
    if (window.showMessage && typeof window.showMessage === 'function') {
        try {
            window.showMessage(message, 'personal');
        } catch (error) {
            console.error("Personal message error:", error);
        }
    }
    
    // Ekrana bildirim ekleme
    // Removed: showNotification(message, type, 'personal');
}

// Enhanced message system that shows both in-game message and notification
function showEnhancedMessage(message, type = 'success', notificationType = 'personal') {
    // UI bildirimini göster - use showMessage directly
    if (window.showMessage && typeof window.showMessage === 'function') {
        try {
            window.showMessage(message, notificationType);
        } catch (error) {
            console.error("Enhanced message error:", error);
        }
    }
}

// Queue for storing game messages with priority
const messageQueue = [];
let isMessageDisplaying = false;

// Fixed notification DOM elements
const kingdomMessage = document.getElementById('kingdom-message');
const personalMessage = document.getElementById('personal-message');
const kingdomMessageContent = kingdomMessage ? kingdomMessage.querySelector('.message-content') : null;
const personalMessageContent = personalMessage ? personalMessage.querySelector('.message-content') : null;

// Function to safely translate text or return original if translate function is not available
function safeTranslate(text) {
    if (typeof translate === 'function') {
        return translate(text);
    }
    return text;
}

// Function to show a game message with optional priority
function showGameMessage(message, priority = 1, duration = 5000, type = 'personal') {
    console.log(`${type} message shown: ${message} Translated: ${safeTranslate(message)}`);
    
    // Add message to queue with priority and type
    messageQueue.push({
        message: message,
        priority: priority,
        duration: duration,
        type: type
    });
    
    // Only process if no message is currently displaying
    if (!isMessageDisplaying) {
        processNextMessage();
    }
}

// Process the next message in queue
function processNextMessage() {
    // If queue is empty, mark as not displaying
    if (messageQueue.length === 0) {
        isMessageDisplaying = false;
        return;
    }
    
    // Flag as displaying
    isMessageDisplaying = true;
    
    // Sort queue by priority (higher number = higher priority)
    messageQueue.sort((a, b) => b.priority - a.priority);
    
    // Get highest priority message
    const nextMessage = messageQueue.shift();
    
    // Show message in appropriate location based on priority and type
    if (nextMessage.priority >= 3) {
        // Critical message - show in both locations
        if (kingdomMessageContent) kingdomMessageContent.textContent = nextMessage.message;
        if (personalMessageContent) personalMessageContent.textContent = nextMessage.message;
    } else if (nextMessage.type === 'kingdom' || nextMessage.priority >= 2) {
        // Kingdom message or important message - show in kingdom section
        if (kingdomMessageContent) kingdomMessageContent.textContent = nextMessage.message;
    } else {
        // Normal message - show in personal section
        if (personalMessageContent) personalMessageContent.textContent = nextMessage.message;
    }
    
    // Clear message after duration
    setTimeout(() => {
        processNextMessage();
    }, nextMessage.duration);
}

// Specific function for kingdom/public messages
function showKingdomMessage(message, priority = 2, duration = 6000) {
    return showGameMessage(message, priority, duration, 'kingdom');
}

// Special function for kingdom warfare notifications
function showKingdomWarfareMessage(message, isWar = true) {
    // War notifications are higher priority than peace
    const priority = isWar ? 2 : 1; 
    
    // Show in kingdom message area
    showKingdomMessage(message, priority, isWar ? 7000 : 5000);
    
    // Flash the kingdom message background for emphasis
    if (kingdomMessage) {
        // Add class for visual effect
        kingdomMessage.classList.add(isWar ? 'warfare-alert' : 'peace-alert');
        
        // Remove class after animation
        setTimeout(() => {
            kingdomMessage.classList.remove('warfare-alert', 'peace-alert');
        }, 2000);
    }
}

// Show a kingdom declaration of war notification
function showWarDeclarationMessage(kingdom1Name, kingdom2Name) {
    const message = `${kingdom1Name} has declared war against ${kingdom2Name}!`;
    showKingdomWarfareMessage(message, true);
}

// Show a kingdom peace treaty notification
function showPeaceTreatyMessage(kingdom1Name, kingdom2Name) {
    const message = `${kingdom1Name} and ${kingdom2Name} have agreed to peace!`;
    showKingdomWarfareMessage(message, false);
}

// Add CSS for warfare notifications
function addWarfareNotificationStyles() {
    // Create style element
    const style = document.createElement('style');
    
    // Add CSS rules for warfare notifications
    style.textContent = `
        .warfare-alert {
            animation: warfareFlash 0.5s ease-in-out 4 alternate;
        }
        
        .peace-alert {
            animation: peaceFlash 0.5s ease-in-out 4 alternate;
        }
        
        @keyframes warfareFlash {
            0% { background-color: rgba(50, 50, 50, 0.7); }
            100% { background-color: rgba(200, 0, 0, 0.7); }
        }
        
        @keyframes peaceFlash {
            0% { background-color: rgba(50, 50, 50, 0.7); }
            100% { background-color: rgba(0, 100, 0, 0.7); }
        }
    `;
    
    // Add to document head
    document.head.appendChild(style);
}

// Initialize notifications
function initNotifications() {
    // Add warfare notification styles
    addWarfareNotificationStyles();
}

// Call init when window loads
window.addEventListener('load', initNotifications);

// Expose functions globally
window.showGameMessage = showGameMessage;
window.showKingdomMessage = showKingdomMessage;
window.showWarDeclarationMessage = showWarDeclarationMessage;
window.showPeaceTreatyMessage = showPeaceTreatyMessage;

// Export functions for use in game.js
if (typeof window !== 'undefined') {
    window.showNotification = showNotification;
    window.showKingdomNotification = showKingdomNotification;
    window.showPersonalNotification = showPersonalNotification;
    window.showEnhancedMessage = showEnhancedMessage;
} 