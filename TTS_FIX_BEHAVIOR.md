# TTS 30-Second Fix - Expected Behavior

## Before the Fix

**Timeline:**
- 0s: TTS starts playing
- 0-29s: Audio plays normally
- 30s: Browser autoplay policy pauses audio
- 30s: `audio.onpause` fires → immediately calls `cleanupAudio('pause')`
- 30s: Status changes to "listening", TTS stops, face animation stops
- **Result:** TTS cuts off at exactly 30 seconds

## After the Fix

**Timeline:**
- 0s: TTS starts playing
- 0s: Audio element configured with `preload='auto'`
- 0s: Keepalive interval starts (touches audio every 5 seconds)
- 0-29s: Audio plays normally
- 5s, 10s, 15s, 20s, 25s: Keepalive touches audio (helps prevent throttling)
- 30s: *If* browser still pauses audio despite keepalive:
  - `audio.onpause` fires
  - Console logs detailed audio state
  - Immediately attempts `audio.play()` to resume
  - If resume succeeds: Audio continues seamlessly
  - If resume fails: Only then cleanup and switch to listening
- **Result:** TTS should play through completely, or at worst have brief stutters that auto-recover

## Console Output Examples

### Successful Operation (No Pause)
```
[TTS] TTS response OK, loading audio...
Audio playing, showing face and starting animation
(Audio plays to completion)
[VoiceChat] audio.onended triggered at timestamp: 1234567890
Audio cleanup: ended
```

### Browser Paused but Auto-Recovered
```
[TTS] TTS response OK, loading audio...
Audio playing, showing face and starting animation
[TTS] audio.onpause fired: {ended: false, currentTime: 30.2, duration: 45.5, paused: true, ttsPlaying: true, readyState: 4}
[TTS] Audio paused unexpectedly - attempting resume
[TTS] Successfully resumed after pause
(Audio continues)
[VoiceChat] audio.onended triggered at timestamp: 1234567890
Audio cleanup: ended
```

### Browser Paused and Could Not Resume
```
[TTS] TTS response OK, loading audio...
Audio playing, showing face and starting animation
[TTS] audio.onpause fired: {ended: false, currentTime: 30.2, duration: 45.5, paused: true, ttsPlaying: true, readyState: 4}
[TTS] Audio paused unexpectedly - attempting resume
[TTS] Could not resume, cleaning up: NotAllowedError: play() failed because the user didn't interact with the document first
[VoiceChat] cleanupAudio called with reason: pause at timestamp: 1234567890
Audio cleanup: pause
```

## Technical Details

### Why 30 Seconds?
Chrome and other browsers implement autoplay policies that limit continuous audio playback without recent user interaction. The exact threshold varies, but 30 seconds is a common limit in Chrome when:
- Page is in background
- User hasn't interacted recently
- Audio is programmatically triggered (not user-initiated)

### How the Fix Works

1. **Keepalive Mechanism**: Periodic no-op touches of the audio element signal to the browser that the audio is actively managed
2. **Auto-Resume**: When pause is detected, immediately attempt to resume before giving up
3. **Enhanced Logging**: Detailed state information helps diagnose if issues persist

### Alternative Approaches Considered

1. **Wake Lock API**: Would prevent system sleep but doesn't address autoplay policies
2. **Audio Context**: More complex, requires rewriting entire TTS pipeline
3. **Chunking**: Split long TTS into <30s chunks - adds complexity and potential gaps
4. **User Interaction**: Require click to continue - bad UX

The current fix (keepalive + auto-resume) is the least invasive and should handle most cases.

## Testing

To verify the fix:
1. Start a conversation in hands-free mode
2. Trigger TTS response longer than 30 seconds
3. Watch console for pause/resume messages
4. Audio should continue to completion

Test in different scenarios:
- Tab active vs background
- Different browsers (Chrome, Firefox, Safari)
- Mobile vs desktop
- With/without recent user interaction

## Date
2026-01-16
