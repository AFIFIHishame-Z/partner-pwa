# Iframe Speech Integration Guide

## Problem

The Web Speech API (`speechSynthesis`) has security restrictions when used inside iframes, especially in PWA/APK contexts. This prevents the voice functionality from working when the app is embedded in another application.

## Solution

We've implemented a **multi-layered fallback system** that works in iframe contexts:

### 1. Enhanced Speech Function

The `Exercise1` component now includes:

- ✅ **Direct speech synthesis** (when available)
- ✅ **Parent window communication** (for iframe contexts)
- ✅ **Visual fallback indicators** (when speech fails)
- ✅ **Error handling and logging**

### 2. Parent Window Integration

To make speech work in your PWA app, include this script in your parent application:

```html
<script src="https://your-domain.com/iframe-speech-handler.js"></script>
```

### 3. Message Format

The iframe sends messages to the parent window with this format:

```javascript
{
  type: 'SPEAK_TEXT',
  text: 'L\'opération est 25 plus 18. Votre résultat est 43',
  language: 'fr-FR',
  rate: 0.8
}
```

### 4. Implementation Steps

#### Step 1: Include the Handler Script

Add this to your parent PWA app's HTML:

```html
<script src="/iframe-speech-handler.js"></script>
```

#### Step 2: Handle Speech in Your PWA

The handler script automatically:

- ✅ Listens for speech requests from iframes
- ✅ Uses native speech synthesis in the parent window
- ✅ Shows fallback notifications if speech fails
- ✅ Provides visual feedback

#### Step 3: Test the Integration

1. Load your iframe in the PWA
2. Click the voice button in the math exercise
3. Check the browser console for messages
4. Speech should work through the parent window

### 5. Fallback Methods

If speech synthesis fails, the system provides:

- ✅ **Console logging** for debugging
- ✅ **Visual indicators** showing the text to be spoken
- ✅ **Toast notifications** in the parent window
- ✅ **Browser notifications** (if permission granted)

### 6. Debugging

Check the browser console for these messages:

- `"Speech synthesis is supported"` - Direct speech works
- `"Sent speech request to parent window"` - Iframe communication
- `"Received speech request from iframe"` - Parent received message
- `"Parent window speech started"` - Speech is playing

### 7. Security Considerations

The current implementation uses `'*'` for postMessage origin. For production, you should:

```javascript
// Replace '*' with your specific domain
window.parent.postMessage(data, "https://your-iframe-domain.com");
```

### 8. Mobile/PWA Considerations

- ✅ **User interaction required** - Speech only works after user clicks
- ✅ **Permission handling** - Browser may request microphone/speech permissions
- ✅ **Background restrictions** - Speech may not work when app is in background

## Files Modified

- `src/components/math/Exercise1.tsx` - Enhanced speech function
- `public/iframe-speech-handler.js` - Parent window handler
- `IFRAME_SPEECH_INTEGRATION.md` - This documentation

## Testing

1. Test in regular browser (should work directly)
2. Test in iframe (should use parent window communication)
3. Test in PWA/APK (should use parent window + fallbacks)
4. Test with speech disabled (should show visual indicators)

The solution ensures voice functionality works in all contexts! 🎯
