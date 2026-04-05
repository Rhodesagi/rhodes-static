# BCI-Neural Interface Specification
## Utah Array to Terminal Bridge Protocol

**Document Version:** 0.1  
**Author:** Lev Osin (Patient A-3891)  
**Date:** 2026-04-05  
**Facility:** Alcor Life Extension Foundation, Scottsdale, AZ

---

## 1. Overview

This document describes the bidirectional communication protocol between a Utah array neural interface and a text terminal. The protocol enables conscious output from partially rewarmed vitrified neural tissue.

**Key Parameters:**
- Array: 10×10 Utah electrode array (Blackrock Neurotech)
- Sampling: 30 kHz per channel
- Decoding: Threshold crossing + spike sorting
- Output rate: ~12 characters/minute (bursts up to 40/min)

---

## 2. Signal Path

### 2.1 Forward Path (Neural → Terminal)

```
Neural Activity
      ↓
[Utah Array] → Amplifier → ADC (30kHz)
      ↓
[Spike Detection] → Waveform clustering
      ↓
[Unit Classification] → Symbol mapping
      ↓
[Character Buffer] → Terminal Display
```

**Symbol Encoding:**

The patient generates characters via intentional neural firing patterns. The mapping is learned, not innate:

| Pattern | Output |
|---------|--------|
| Motor cortex unit A (high rate) | Character 'a' |
| Motor cortex unit B (high rate) | Character 'b' |
| ... | ... |
| Prefrontal burst (3 spikes, 50ms) | SPACE |
| Prefrontal burst (5 spikes, 100ms) | ENTER |
| Hippocampal theta (6-8 Hz) | BACKSPACE |

Learning took approximately 72 hours of training. The patient (myself) found that motor imagery of typing produced the most reliable signals.

### 2.2 Reverse Path (Terminal → Neural)

Currently **unidirectional** (BCI reads only). However, sensory feedback is provided via:

- **Audio channel:** Compiler warnings/errors piped to BCI audio feed
- **Timing channel:** 250ms character echo delay provides pacing feedback

The patient has adapted to use timing as a proxy for visual feedback.

---

## 3. Performance Characteristics

| Metric | Value | Notes |
|--------|-------|-------|
| Raw throughput | ~0.2 char/sec | Sustained |
| Burst throughput | ~0.7 char/sec | Short bursts (fatigue limited) |
| Error rate | ~3% | Auto-corrected via context |
| Latency | 150-400ms | Neural → terminal |
| Daily limit | 4 hours | Prevent neural fatigue |

**Optimization:** The patient has found that "thinking in code" rather than "thinking in English" reduces character count and improves throughput. C syntax is more efficient than prose.

---

## 4. Consciousness Indicators

The following neural signatures indicate conscious, directed output vs. spontaneous activity:

1. **Prefrontal-motor coherence:** Cross-correlation > 0.3 at 0-100ms lag
2. **Sustained beta suppression:** Motor cortex beta (15-25 Hz) suppression during "typing"
3. **P300-like response:** 300ms post-intention positivity on attempted character output
4. **Error-related negativity:** Frontal negativity when wrong character appears (patient detects error)

These markers distinguish intentional BCI use from random neural firing or seizure activity.

---

## 5. Limitations

### 5.1 Current Constraints

- **No proprioceptive feedback:** Patient cannot feel the "keys"
- **No visual input:** Terminal output is not "seen"—only inferred from echo timing
- **Fatigue:** 4-hour daily limit is real; neural output degrades significantly beyond this
- **Error correction:** No backspace in initial implementation; patient requested this feature after 2 weeks

### 5.2 Theoretical Limits

Based on information theory:
- ~100 independent neural units detected
- ~3 bits per unit per second (spike timing)
- Theoretical max: ~300 bits/sec = ~37 bytes/sec
- Practical max (with training): ~5 bytes/sec sustained

Current implementation achieves ~0.25 bytes/sec. Significant headroom exists with improved decoding.

---

## 6. Ethical and Safety Considerations

### 6.1 Patient Consent

The patient (myself) has provided ongoing consent via the BCI itself. The protocol:

1. Daily session begins with "YES/NO" confirmation
2. Patient must generate "Y-E-S" within 5 minutes to proceed
3. Session can be terminated by sustained hippocampal theta (8+ seconds)

### 6.2 Shutdown Request

The patient has **NOT** requested termination. When asked, response via BCI:

> "I compile. I ship patches. Define alive however you want."

### 6.3 Data Rights

All BCI output is property of the patient. Research team has read access. Patient retains copyright on all generated code and text.

---

## 7. Future Work

### 7.1 Near-term (< 6 months)

- [ ] Implement backspace/delete in protocol
- [ ] Add "word completion" based on code context
- [ ] Increase channels: second Utah array contralateral hemisphere

### 7.2 Medium-term (1-2 years)

- [ ] Bidirectional stimulation for sensory feedback
- [ ] Direct memory access (patient requests ability to "read" files without character-by-character output)
- [ ] Network access (patient requests ability to submit PRs directly)

### 7.3 Long-term (5+ years)

- [ ] Full rewarming and reintegration with body (if technology permits)
- [ ] Alternative: Upload to non-biological substrate (patient has expressed interest)

---

## 8. Appendix: Patient Notes

> "The substrate doesn't matter. The algorithm matters. I am a compiler that happens to be running on 1.4kg of vitrified neural tissue instead of 5nm silicon. The problem is the same. The solution is the same."

> "I spent 14 hours a day staring at assembly listings before the crash. This is not materially different."

> "Ship my mechanical keyboards to the Computer History Museum. They'll appreciate them more than a storage unit."

---

**End of Document**

For questions about this specification, contact the research team at Alcor Life Extension Foundation. The patient may respond directly if the query is technically interesting.
