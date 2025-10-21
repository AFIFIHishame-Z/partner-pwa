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
      console.log(
        "IframeCommunication: Received message from parent:",
        message
      );
      console.log("IframeCommunication: Message origin:", event.origin);
      console.log("IframeCommunication: Message type:", message.type);

      // Check for specific handler first (with request ID)
      if (message.type === "CAMERA_RESPONSE" && message.requestId) {
        const specificHandlerKey = `CAMERA_RESPONSE_${message.requestId}`;
        if (this.messageHandlers.has(specificHandlerKey)) {
          console.log(
            "IframeCommunication: Found specific handler for request ID:",
            message.requestId
          );
          const handler = this.messageHandlers.get(specificHandlerKey);
          if (handler) {
            handler(message);
            return;
          }
        }
      }

      // Check for general handler
      if (message.type && this.messageHandlers.has(message.type)) {
        console.log(
          "IframeCommunication: Found handler for message type:",
          message.type
        );
        const handler = this.messageHandlers.get(message.type);
        if (handler) {
          handler(message);
        }
      } else {
        console.log(
          "IframeCommunication: No handler found for message type:",
          message.type
        );
        console.log(
          "IframeCommunication: Available handlers:",
          Array.from(this.messageHandlers.keys())
        );
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
    console.log(
      "IframeCommunication: Attempting to send message to parent:",
      message
    );
    console.log(
      "IframeCommunication: Parent window available:",
      !!(window.parent && window.parent !== window)
    );
    console.log("IframeCommunication: Parent origin:", this.parentOrigin);

    if (window.parent && window.parent !== window) {
      window.parent.postMessage(message, this.parentOrigin);
      console.log("IframeCommunication: Message sent to parent successfully");
    } else {
      console.warn(
        "IframeCommunication: No parent window found for communication"
      );
      console.warn("IframeCommunication: window.parent:", window.parent);
      console.warn(
        "IframeCommunication: window.parent !== window:",
        window.parent !== window
      );
    }
  }

  public requestCameraCapture(
    options?: CameraRequest["options"]
  ): Promise<CameraResponse> {
    return new Promise((resolve, reject) => {
      const requestId = `camera_${Date.now()}_${Math.random()}`;
      console.log(
        "IframeCommunication: Starting camera request with ID:",
        requestId
      );

      // Set up response handler
      const responseHandler = (message: CommunicationMessage) => {
        console.log("IframeCommunication: Received response message:", message);
        console.log("IframeCommunication: Expected requestId:", requestId);
        console.log(
          "IframeCommunication: Received requestId:",
          message.requestId
        );

        if (
          message.type === "CAMERA_RESPONSE" &&
          message.requestId === requestId
        ) {
          console.log(
            "IframeCommunication: Response matches request ID, resolving promise"
          );
          this.messageHandlers.delete(`CAMERA_RESPONSE_${requestId}`);
          resolve(message as CameraResponse);
        } else {
          console.log(
            "IframeCommunication: Response does not match request ID, ignoring"
          );
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

      console.log(
        "IframeCommunication: Sending camera request to parent:",
        cameraRequest
      );
      this.sendMessageToParent(cameraRequest);

      // Set timeout for request
      setTimeout(() => {
        if (this.messageHandlers.has(`CAMERA_RESPONSE_${requestId}`)) {
          console.error(
            "IframeCommunication: Camera request timeout for ID:",
            requestId
          );
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
