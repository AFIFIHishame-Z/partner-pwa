# Iframe Communication Guide 📱

This guide explains how to test the iframe communication between your child app and parent Capacitor-based PWA for accessing native device functionalities like the camera.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────┐
│        Parent Capacitor PWA         │
│  ┌─────────────────────────────────┐ │
│  │        iframe                   │ │
│  │    Child App (This App)        │ │
│  │  ┌─────────────────────────────┐│ │
│  │  │    CameraCapture Component  ││ │
│  │  │  ┌─────────────────────────┐││ │
│  │  │  │  IframeCommunication   │││ │
│  │  │  │     Service             │││ │
│  │  │  └─────────────────────────┘││ │
│  │  └─────────────────────────────┘│ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌─────────────────────────────────┐ │
│  │  ParentAppCommunicationHandler │ │
│  │  + Capacitor Camera Plugin     │ │
│  └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## 🔧 Implementation Details

### Child App (This App)

- **IframeCommunication Service**: Handles postMessage communication
- **CameraCapture Component**: UI for requesting camera access
- **Message Types**: `IFRAME_READY`, `CAMERA_REQUEST`, `CAMERA_RESPONSE`

### Parent App (Your Capacitor PWA)

- **ParentAppCommunicationHandler**: Listens for iframe messages
- **Capacitor Camera Plugin**: Provides native camera access
- **Message Handling**: Processes camera requests and returns image data

## 📋 Setup Instructions

### 1. Child App Setup (Already Done)

✅ Communication service implemented  
✅ Camera capture component created  
✅ Message handling configured

### 2. Parent App Setup (Your Capacitor PWA)

#### Install Dependencies

```bash
npm install @capacitor/camera
npx cap sync
```

#### Add to your parent app:

```javascript
import ParentAppCommunicationHandler from "./parent-app-handler.js";

// Initialize communication handler
const communicationHandler = new ParentAppCommunicationHandler();

// When creating iframe
const iframe = document.getElementById("partner-app-iframe");
communicationHandler.setupIframeCommunication(iframe);
```

#### HTML Structure in Parent App:

```html
<iframe
  id="partner-app-iframe"
  src="https://your-child-app.com"
  width="100%"
  height="600px"
  allow="camera; microphone"
  sandbox="allow-scripts allow-same-origin allow-forms"
></iframe>
```

## 🧪 Testing Steps

### 1. Development Testing

```bash
# Start child app
npm run dev

# In another terminal, serve parent app
# (Your Capacitor app should be running)
```

### 2. Test Communication Flow

1. **Load Parent App** with iframe pointing to child app
2. **Check Console** for "Iframe is ready for communication" message
3. **Click "Capture Photo"** button in child app
4. **Verify** parent app receives camera request
5. **Check** if camera opens and photo is captured
6. **Confirm** image is displayed in child app

### 3. Message Flow Verification

#### Child App → Parent App:

```javascript
// Child app sends:
{
  type: 'IFRAME_READY',
  timestamp: 1234567890
}

{
  type: 'CAMERA_REQUEST',
  action: 'capture_photo',
  requestId: 'camera_1234567890_0.123',
  options: {
    quality: 0.8,
    allowEditing: false,
    correctOrientation: true
  }
}
```

#### Parent App → Child App:

```javascript
// Parent app responds:
{
  type: 'CAMERA_RESPONSE',
  requestId: 'camera_1234567890_0.123',
  success: true,
  data: {
    dataUrl: 'data:image/jpeg;base64,/9j/4AAQ...',
    format: 'jpeg',
    width: 1920,
    height: 1080
  }
}
```

## 🔍 Debugging

### Console Logs to Check:

- ✅ "Iframe is ready for communication"
- ✅ "Parent app received message: CAMERA_REQUEST"
- ✅ "Handling camera request: {...}"
- ✅ "Sent message to iframe: CAMERA_RESPONSE"

### Common Issues:

1. **No communication**: Check iframe `src` and CORS settings
2. **Camera not opening**: Verify Capacitor camera permissions
3. **Image not displaying**: Check data format and base64 encoding

### Browser DevTools:

- **Network Tab**: Check for failed requests
- **Console Tab**: Look for error messages
- **Application Tab**: Verify iframe is loaded correctly

## 🚀 Production Considerations

### Security:

```javascript
// In production, specify exact origins
if (event.origin !== "https://your-child-app.com") return;
```

### Error Handling:

```javascript
// Add timeout and retry logic
setTimeout(() => {
  if (!responseReceived) {
    // Handle timeout
  }
}, 30000);
```

### Performance:

- Optimize image quality based on use case
- Implement image compression
- Add loading states and progress indicators

## 📱 Mobile Testing

### Android:

- Test on physical device (camera doesn't work in emulator)
- Check camera permissions in app settings
- Verify iframe communication works in WebView

### iOS:

- Test on physical device
- Check camera permissions
- Verify Safari WebView compatibility

## 🔧 Advanced Features

### Additional Native Functionalities:

- **File System**: Access device storage
- **Geolocation**: Get device location
- **Contacts**: Access device contacts
- **Notifications**: Send push notifications
- **Biometric**: Fingerprint/face recognition

### Message Types to Implement:

```javascript
// File system access
{ type: 'FILE_REQUEST', action: 'read_file' }

// Geolocation
{ type: 'LOCATION_REQUEST', action: 'get_current_position' }

// Contacts
{ type: 'CONTACTS_REQUEST', action: 'get_contacts' }
```

## 📚 Resources

- [Capacitor Camera Plugin](https://capacitorjs.com/docs/apis/camera)
- [PostMessage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
- [Iframe Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options)
- [CORS Configuration](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

Your iframe communication system is now ready for testing! 🎉
