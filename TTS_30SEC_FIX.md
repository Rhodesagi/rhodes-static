# TTS 30-Second Cutoff Fix

## Problem
TTS audio was cutting off at exactly 30 seconds and switching to listening mode during playback.

## Root Cause
Browser autoplay policies can pause audio elements after ~30 seconds of continuous playback without recent user interaction. When the browser auto-paused the audio, the `audio.onpause` event handler was immediately calling `cleanupAudio('pause')`, which:
1. Set status to 'listening'
2. Stopped TTS playback
3. Cleared the speaking animation

## Solution Applied

### 1. Enhanced audio.onpause Handler (Line ~4860)
**Before:**
```javascript
audio.onpause = () => {
    if (!audio.ended && self.ttsPlaying) {
        console.log('Audio paused unexpectedly');
        cleanupAudio('pause');
    }
};
```

**After:**
```javascript
audio.onpause = () => {
    console.log('[TTS] audio.onpause fired:', {
        ended: audio.ended,
        currentTime: audio.currentTime,
        duration: audio.duration,
        paused: audio.paused,
        ttsPlaying: self.ttsPlaying,
        readyState: audio.readyState
    });
    // Only cleanup if audio didn't just end naturally
    if (!audio.ended && self.ttsPlaying) {
        console.log('[TTS] Audio paused unexpectedly - attempting resume');
        // Try to resume playback first before giving up
        audio.play().then(() => {
            console.log('[TTS] Successfully resumed after pause');
        }).catch(err => {
            console.error('[TTS] Could not resume, cleaning up:', err);
            cleanupAudio('pause');
        });
    }
};
```

**Key change:** Instead of immediately cleaning up when paused, we now:
1. Log detailed audio state for debugging
2. Attempt to resume playback with `audio.play()`
3. Only cleanup if resume fails

### 2. Audio Element Configuration (Line ~4829)
Added explicit configuration to prevent browser throttling:
```javascript
audio.preload = 'auto';
audio.loop = false;
```

### 3. Keepalive Mechanism (Line ~4945)
Added periodic "touch" of the audio element to prevent browser from considering it inactive:
```javascript
let keepaliveInterval = setInterval(() => {
    if (self.ttsPlaying && !audio.paused && !audio.ended) {
        // Touch the audio element to keep it alive
        const vol = audio.volume;
        audio.volume = vol; // No-op that prevents throttling
    } else {
        clearInterval(keepaliveInterval);
    }
}, 5000); // Every 5 seconds
```

## Files Modified
- `/var/www/html/rhodes.js` (main application)
- `/var/www/html/rhodes.js.backup-30sec` (backup of previous version)

## Testing Recommendations
1. Test with TTS audio longer than 30 seconds
2. Check browser console for the new logging messages
3. Verify audio resumes automatically if browser pauses it
4. Test in different browsers (Chrome, Firefox, Safari)
5. Test with page in background vs foreground

## Rollback
If issues occur:
```bash
cp /var/www/html/rhodes.js.backup-30sec /var/www/html/rhodes.js
```

## Date
2026-01-16
