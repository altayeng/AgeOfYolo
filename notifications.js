// Modern Notification System for Age of Empire: Imperial Dawn 2025

// Show a modern notification with type (success, error, warning)
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
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

// Enhanced message system that shows both in-game message and notification
function showEnhancedMessage(message, type = 'success') {
    // Show regular in-game message
    showMessage(message);
    
    // Also show modern notification
    showNotification(message, type);
}

// Export functions for use in game.js
if (typeof window !== 'undefined') {
    window.showNotification = showNotification;
    window.showEnhancedMessage = showEnhancedMessage;
} 