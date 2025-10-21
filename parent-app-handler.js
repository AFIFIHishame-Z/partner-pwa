// Parent App Communication Handler for Capacitor-based PWA
// This code should be added to your parent Capacitor app

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

class ParentAppCommunicationHandler {
  constructor() {
    this.setupMessageListener();
  }

  setupMessageListener() {
    window.addEventListener('message', async (event) => {
      // Verify origin for security (replace with your iframe domain)
      // if (event.origin !== 'https://your-iframe-domain.com') return;

      const message = event.data;
      console.log('Parent app received message:', message);

      switch (message.type) {
        case 'IFRAME_READY':
          console.log('Iframe is ready for communication');
          this.sendMessageToIframe(event.source, {
            type: 'PARENT_READY',
            timestamp: Date.now()
          });
          break;

        case 'CAMERA_REQUEST':
          await this.handleCameraRequest(event.source, message);
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    });
  }

  async handleCameraRequest(iframeWindow, request) {
    try {
      console.log('Handling camera request:', request);

      // Use Capacitor Camera plugin to capture photo
      const image = await Camera.getPhoto({
        quality: request.options?.quality || 80,
        allowEditing: request.options?.allowEditing || false,
        resultType: CameraResultType.DataUrl, // or CameraResultType.Uri for file path
        source: CameraSource.Camera,
        correctOrientation: request.options?.correctOrientation || true
      });

      // Send success response back to iframe
      this.sendMessageToIframe(iframeWindow, {
        type: 'CAMERA_RESPONSE',
        requestId: request.requestId,
        success: true,
        data: {
          dataUrl: image.dataUrl,
          format: image.format,
          width: image.width,
          height: image.height
        }
      });

    } catch (error) {
      console.error('Camera capture failed:', error);
      
      // Send error response back to iframe
      this.sendMessageToIframe(iframeWindow, {
        type: 'CAMERA_RESPONSE',
        requestId: request.requestId,
        success: false,
        error: error.message || 'Camera capture failed'
      });
    }
  }

  sendMessageToIframe(iframeWindow, message) {
    if (iframeWindow && iframeWindow.postMessage) {
      iframeWindow.postMessage(message, '*'); // Use specific origin in production
      console.log('Sent message to iframe:', message);
    }
  }

  // Method to handle iframe in your parent app
  setupIframeCommunication(iframeElement) {
    // Store reference to iframe for communication
    this.iframeElement = iframeElement;
    
    // You can also listen for iframe load events
    iframeElement.addEventListener('load', () => {
      console.log('Iframe loaded, communication ready');
    });
  }
}

// Export for use in your parent app
export default ParentAppCommunicationHandler;

// Usage example in your parent Capacitor app:
/*
import ParentAppCommunicationHandler from './parent-app-handler.js';

// Initialize the communication handler
const communicationHandler = new ParentAppCommunicationHandler();

// When you create the iframe in your parent app:
const iframe = document.getElementById('partner-app-iframe');
communicationHandler.setupIframeCommunication(iframe);
*/
