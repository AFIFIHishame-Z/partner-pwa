// Parent window speech handler for iframe communication
// This script should be included in the parent PWA app

(function() {
  'use strict';
  
  // Listen for speech requests from iframes
  window.addEventListener('message', function(event) {
    // Security check - you might want to verify the origin
    // if (event.origin !== 'https://your-iframe-domain.com') return;
    
    if (event.data && event.data.type === 'SPEAK_TEXT') {
      handleSpeechRequest(event.data);
    }
  });
  
  function handleSpeechRequest(data) {
    const { text, language = 'fr-FR', rate = 0.8 } = data;
    
    console.log('Received speech request from iframe:', text);
    
    // Method 1: Try native speech synthesis in parent window
    if ('speechSynthesis' in window) {
      try {
        // Stop any current speech
        speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = language;
        utterance.rate = rate;
        utterance.volume = 1.0;
        
        utterance.onstart = () => {
          console.log('Parent window speech started');
        };
        
        utterance.onerror = (event) => {
          console.warn('Parent window speech failed:', event);
          // Fallback to alternative method
          showSpeechFallback(text);
        };
        
        utterance.onend = () => {
          console.log('Parent window speech ended');
        };
        
        speechSynthesis.speak(utterance);
        return;
      } catch (error) {
        console.warn('Speech synthesis error in parent:', error);
      }
    }
    
    // Method 2: Fallback - show notification or use alternative TTS
    showSpeechFallback(text);
  }
  
  function showSpeechFallback(text) {
    // Create a notification or visual indicator
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Speech Request', {
        body: text,
        icon: '/icons/icon-192x192.svg'
      });
    } else {
      // Show console message
      console.log('🔊 Speech Request:', text);
      
      // Optional: Show a toast notification
      showToast(text);
    }
  }
  
  function showToast(text) {
    // Create a toast notification
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #007AA9;
      color: white;
      padding: 15px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      z-index: 10000;
      font-size: 14px;
      max-width: 300px;
      word-wrap: break-word;
    `;
    toast.textContent = `🔊 ${text}`;
    
    document.body.appendChild(toast);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }
  
  // Request notification permission on load
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
  
  console.log('Iframe speech handler loaded');
})();
