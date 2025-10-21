// Communication service for iframe to parent app communication
export interface CameraRequest {
  type: "CAMERA_REQUEST";
  action: "capture_photo";
  options?: {
    quality?: number;
    allowEditing?: boolean;
    correctOrientation?: boolean;
  };
}

export interface CameraResponse {
  type: "CAMERA_RESPONSE";
  success: boolean;
  data?: {
    base64?: string;
    dataUrl?: string;
    path?: string;
  };
  error?: string;
}

export interface CommunicationMessage {
  type: string;
  [key: string]: any;
}

class IframeCommunicationService {
  private parentOrigin: string = "*"; // Allow communication with any parent origin
  private messageHandlers: Map<string, (data: any) => void> = new Map();
  private isReady: boolean = false;

  constructor() {
    this.setupMessageListener();
    this.notifyParentReady();
  }

  private setupMessageListener() {
    window.addEventListener("message", (event) => {
      // Verify origin if needed (for production, specify exact parent origin)
      // if (event.origin !== 'https://your-parent-app.com') return;

      const message = event.data as CommunicationMessage;

      if (message.type && this.messageHandlers.has(message.type)) {
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          handler(message);
        }
      }
    });
  }

  private notifyParentReady() {
    // Notify parent that iframe is ready to receive messages
    this.sendMessageToParent({
      type: "IFRAME_READY",
      timestamp: Date.now(),
    });
    this.isReady = true;
  }

  public sendMessageToParent(message: CommunicationMessage) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, this.parentOrigin);
    } else {
      console.warn("No parent window found for communication");
    }
  }

  public requestCameraCapture(
    options?: CameraRequest["options"]
  ): Promise<CameraResponse> {
    return new Promise((resolve, reject) => {
      const requestId = `camera_${Date.now()}_${Math.random()}`;

      // Set up response handler
      const responseHandler = (message: CommunicationMessage) => {
        if (
          message.type === "CAMERA_RESPONSE" &&
          message.requestId === requestId
        ) {
          this.messageHandlers.delete(`CAMERA_RESPONSE_${requestId}`);
          resolve(message as CameraResponse);
        }
      };

      this.messageHandlers.set(`CAMERA_RESPONSE_${requestId}`, responseHandler);

      // Send camera request to parent
      const cameraRequest: CameraRequest & { requestId: string } = {
        type: "CAMERA_REQUEST",
        action: "capture_photo",
        requestId,
        options: {
          quality: 0.8,
          allowEditing: false,
          correctOrientation: true,
          ...options,
        },
      };

      this.sendMessageToParent(cameraRequest);

      // Set timeout for request
      setTimeout(() => {
        if (this.messageHandlers.has(`CAMERA_RESPONSE_${requestId}`)) {
          this.messageHandlers.delete(`CAMERA_RESPONSE_${requestId}`);
          reject(new Error("Camera request timeout"));
        }
      }, 30000); // 30 second timeout
    });
  }

  public onMessage(type: string, handler: (data: any) => void) {
    this.messageHandlers.set(type, handler);
  }

  public removeMessageHandler(type: string) {
    this.messageHandlers.delete(type);
  }

  public isCommunicationReady(): boolean {
    return this.isReady;
  }
}

// Export singleton instance
export const iframeCommunication = new IframeCommunicationService();
export default iframeCommunication;
