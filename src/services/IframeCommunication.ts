/* eslint-disable @typescript-eslint/no-explicit-any */
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

export interface VoiceRequest {
  type: "VOICE_REQUEST";
  action: "start_recording" | "stop_recording";
  returnText?: boolean;
  options?: {
    maxDuration?: number; // in seconds
    audioFormat?: "mp3" | "wav" | "webm";
    quality?: "low" | "medium" | "high";
  };
}

export interface VoiceResponse {
  type: "VOICE_RESPONSE";
  success: boolean;
  data?: {
    recordDataBase64: string; // Base64 encoded audio (required when success and audio data available)
    duration?: number; // in seconds
    format?: string;
  };
  error?: string;
}

export interface SpeechRecognitionResponse {
  requestId?: string;
  type: "SPEECH_RECOGNITION_RESPONSE";
  success: boolean;
  text: string;
  error?: string;
}

export interface NavigationRequest {
  type: "NAVIGATION_REQUEST";
  route: string;
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

      // Check for voice response handler
      if (message.type === "VOICE_RESPONSE" && message.requestId) {
        const specificHandlerKey = `VOICE_RESPONSE_${message.requestId}`;
        console.log(
          "🎤 IframeCommunication: Looking for voice handler with key:",
          specificHandlerKey
        );
        console.log(
          "🎤 IframeCommunication: Available handler keys:",
          Array.from(this.messageHandlers.keys()).filter((k) =>
            k.startsWith("VOICE_RESPONSE_")
          )
        );
        if (this.messageHandlers.has(specificHandlerKey)) {
          console.log(
            "🎤 IframeCommunication: Found specific voice handler for request ID:",
            message.requestId
          );
          const handler = this.messageHandlers.get(specificHandlerKey);
          if (handler) {
            console.log(
              "🎤 IframeCommunication: Calling voice handler with message:",
              message
            );
            handler(message);
            return;
          } else {
            console.warn(
              "🎤 IframeCommunication: Handler found but is null/undefined"
            );
          }
        } else {
          console.warn(
            "🎤 IframeCommunication: No handler found for key:",
            specificHandlerKey
          );
        }
      }

      // Check for voice recording complete handler
      if (message.type === "VOICE_RECORDING_COMPLETE") {
        console.log(
          "🎤 IframeCommunication: Received VOICE_RECORDING_COMPLETE message:",
          message
        );
        console.log("🎤 IframeCommunication: Message data:", message.data);
        console.log(
          "🎤 IframeCommunication: Message success:",
          message.success
        );

        if (this.messageHandlers.has("VOICE_RECORDING_COMPLETE")) {
          console.log(
            "🎤 IframeCommunication: Found voice recording complete handler"
          );
          const handler = this.messageHandlers.get("VOICE_RECORDING_COMPLETE");
          if (handler) {
            console.log(
              "🎤 IframeCommunication: Calling voice recording complete handler"
            );
            handler(message);
            return;
          }
        } else {
          console.log(
            "🎤 IframeCommunication: No voice recording complete handler found"
          );
          console.log(
            "🎤 IframeCommunication: Available handlers:",
            Array.from(this.messageHandlers.keys())
          );
        }
      }

      if (message.type === "SPEECH_RECOGNITION_RESPONSE") {
        console.log(
          "🎤 IframeCommunication: Received SPEECH_RECOGNITION_RESPONSE message:",
          message
        );
        console.log("🎤 IframeCommunication: Message data:", message.data);
        console.log(
          "🎤 IframeCommunication: Message success:",
          message.success
        );

        if (message.requestId) {
          const specificHandlerKey = `SPEECH_RECOGNITION_RESPONSE_${message.requestId}`;
          if (this.messageHandlers.has(specificHandlerKey)) {
            const handler = this.messageHandlers.get(specificHandlerKey);
            if (handler) {
              handler(message);
              return;
            }
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

  public startVoiceRecording(
    options?: VoiceRequest["options"]
  ): Promise<VoiceResponse> {
    return new Promise((resolve, reject) => {
      const requestId = `voice_start_${Date.now()}_${Math.random()}`;

      const responseHandler = (message: CommunicationMessage) => {
        if (
          message.type === "VOICE_RESPONSE" &&
          message.requestId === requestId
        ) {
          this.messageHandlers.delete(`VOICE_RESPONSE_${requestId}`);
          resolve(message as VoiceResponse);
        }
      };

      this.messageHandlers.set(`VOICE_RESPONSE_${requestId}`, responseHandler);

      const voiceRequest: VoiceRequest & { requestId: string } = {
        type: "VOICE_REQUEST",
        action: "start_recording",
        requestId,
        options: {
          maxDuration: 60,
          audioFormat: "webm",
          quality: "medium",
          ...options,
        },
      };

      this.sendMessageToParent(voiceRequest);

      setTimeout(() => {
        if (this.messageHandlers.has(`VOICE_RESPONSE_${requestId}`)) {
          this.messageHandlers.delete(`VOICE_RESPONSE_${requestId}`);
          reject(new Error("Voice recording start timeout"));
        }
      }, 10000); // 10 second timeout
    });
  }

  public stopVoiceRecording(): Promise<VoiceResponse> {
    return new Promise((resolve) => {
      const requestId = `voice_stop_${Date.now()}_${Math.random()}`;
      let isResolved = false;

      const responseHandler = (message: CommunicationMessage) => {
        console.log(
          "🎤 stopVoiceRecording: Handler received message:",
          message
        );
        console.log("🎤 stopVoiceRecording: Expected requestId:", requestId);
        console.log(
          "🎤 stopVoiceRecording: Received requestId:",
          message.requestId
        );
        console.log(
          "🎤 stopVoiceRecording: RequestId match:",
          message.requestId === requestId
        );
        console.log("🎤 stopVoiceRecording: Message type:", message.type);
        console.log("🎤 stopVoiceRecording: Is resolved:", isResolved);

        if (isResolved) {
          console.log(
            "🎤 stopVoiceRecording: Promise already resolved, ignoring message"
          );
          return;
        }

        if (
          message.type === "VOICE_RESPONSE" &&
          String(message.requestId) === String(requestId)
        ) {
          console.log(
            "🎤 stopVoiceRecording: Message matches, resolving promise"
          );
          isResolved = true;
          this.messageHandlers.delete(`VOICE_RESPONSE_${requestId}`);
          // Ensure we always resolve with a valid response object
          const response: VoiceResponse = {
            type: "VOICE_RESPONSE",
            success: message.success ?? false,
            data: message.data,
            error: message.error,
          };
          console.log(
            "🎤 stopVoiceRecording: Resolving with response:",
            response
          );
          resolve(response);
        } else {
          console.log(
            "🎤 stopVoiceRecording: Message does not match expected criteria"
          );
        }
      };

      console.log(
        "🎤 stopVoiceRecording: Setting up handler for requestId:",
        requestId
      );
      this.messageHandlers.set(`VOICE_RESPONSE_${requestId}`, responseHandler);

      const voiceRequest: VoiceRequest & { requestId: string } = {
        type: "VOICE_REQUEST",
        action: "stop_recording",
        returnText: true,
        requestId,
      };

      console.log(
        "🎤 stopVoiceRecording: Sending request to parent:",
        voiceRequest
      );
      this.sendMessageToParent(voiceRequest);

      setTimeout(() => {
        if (
          this.messageHandlers.has(`VOICE_RESPONSE_${requestId}`) &&
          !isResolved
        ) {
          console.log(
            "🎤 stopVoiceRecording: Timeout reached, resolving with timeout error"
          );
          isResolved = true;
          this.messageHandlers.delete(`VOICE_RESPONSE_${requestId}`);
          // Resolve with error response instead of rejecting to ensure response object is always returned
          resolve({
            type: "VOICE_RESPONSE",
            requestId,
            success: false,
            error: "Voice recording stop timeout",
          } as VoiceResponse);
        } else {
          console.log(
            "🎤 stopVoiceRecording: Timeout reached but promise already resolved or handler removed"
          );
        }
      }, 15000); // 15 second timeout
    });
  }

  public requestVoiceRecord(
    options?: VoiceRequest["options"]
  ): Promise<VoiceResponse> {
    return new Promise((resolve, reject) => {
      const requestId = `voice_${Date.now()}_${Math.random()}`;
      console.log(
        "IframeCommunication: Starting voice request with ID:",
        requestId
      );

      // Set up response handler
      const responseHandler = (message: CommunicationMessage) => {
        console.log(
          "IframeCommunication: Received voice response message:",
          message
        );
        console.log("IframeCommunication: Expected requestId:", requestId);
        console.log(
          "IframeCommunication: Received requestId:",
          message.requestId
        );

        if (
          message.type === "VOICE_RESPONSE" &&
          message.requestId === requestId
        ) {
          console.log(
            "IframeCommunication: Voice response matches request ID, resolving promise"
          );
          this.messageHandlers.delete(`VOICE_RESPONSE_${requestId}`);
          resolve(message as VoiceResponse);
        } else {
          console.log(
            "IframeCommunication: Voice response does not match request ID, ignoring"
          );
        }
      };

      this.messageHandlers.set(`VOICE_RESPONSE_${requestId}`, responseHandler);

      // Send voice request to parent
      const voiceRequest: VoiceRequest & { requestId: string } = {
        type: "VOICE_REQUEST",
        action: "start_recording",
        requestId,
        options: {
          maxDuration: 60, // 60 seconds max
          audioFormat: "webm",
          quality: "medium",
          ...options,
        },
      };

      console.log(
        "IframeCommunication: Sending voice request to parent:",
        voiceRequest
      );
      this.sendMessageToParent(voiceRequest);

      // Set timeout for request
      setTimeout(() => {
        if (this.messageHandlers.has(`VOICE_RESPONSE_${requestId}`)) {
          console.error(
            "IframeCommunication: Voice request timeout for ID:",
            requestId
          );
          this.messageHandlers.delete(`VOICE_RESPONSE_${requestId}`);
          reject(new Error("Voice request timeout"));
        }
      }, 120000); // 2 minute timeout for voice recording
    });
  }

  public onVoiceRecordingComplete(handler: (response: VoiceResponse) => void) {
    this.messageHandlers.set("VOICE_RECORDING_COMPLETE", handler);
  }

  public removeVoiceRecordingHandler() {
    this.messageHandlers.delete("VOICE_RECORDING_COMPLETE");
  }

  public requestNavigation(route: string) {
    console.log("IframeCommunication: Requesting navigation to:", route);

    const navigationRequest: NavigationRequest = {
      type: "NAVIGATION_REQUEST",
      route: route,
    };

    this.sendMessageToParent(navigationRequest);
  }

  public requestSpeechRecognition(
    locale: string = "fr-FR",
    useDefaultUI: boolean = true
  ): Promise<SpeechRecognitionResponse> {
    return new Promise((resolve, reject) => {
      const requestId = `speech_${Date.now()}_${Math.random()}`;
      const handlerKey = `SPEECH_RECOGNITION_RESPONSE_${requestId}`;

      const responseHandler = (message: CommunicationMessage) => {
        if (
          message.type === "SPEECH_RECOGNITION_RESPONSE" &&
          message.requestId === requestId
        ) {
          this.messageHandlers.delete(handlerKey);
          resolve(message as SpeechRecognitionResponse);
        }
      };

      this.messageHandlers.set(handlerKey, responseHandler);

      const speechRecognitionRequest = {
        type: "SPEECH_RECOGNITION",
        requestId,
        local: locale,
        useDefaultUI,
      };

      this.sendMessageToParent(speechRecognitionRequest);

      setTimeout(() => {
        if (this.messageHandlers.has(handlerKey)) {
          this.messageHandlers.delete(handlerKey);
          reject(new Error("Speech recognition timeout"));
        }
      }, 60000); // 60 second timeout
    });
  }
}

// Export singleton instance
export const iframeCommunication = new IframeCommunicationService();
export default iframeCommunication;
