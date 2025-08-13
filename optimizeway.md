# Fast Video Rendering Optimization with Remotion + FFmpeg

## Overview
This document explains how to drastically speed up video rendering in your application by rendering **only the changed parts** (text, stickers, transitions, overlays) with Remotion, and compositing them onto the original video with FFmpeg.

Instead of re-rendering the entire video in Remotion (which is slow and resource-heavy), we:
1. Keep the original video untouched.
2. Render overlays (with transparent background) in Remotion.
3. Merge overlays onto the video using FFmpeg.   

---

## Why This is Faster
- **Old way:** Remotion + headless Chrome renders every single frame, even if 99% is unchanged → slow.
- **New way:** Only changed elements are rendered → faster, cheaper, less CPU.

Example: Adding text to a 1-minute HD video.
- Full render: 3–5 minutes with high CPU/memory usage.
- Overlay method: Remotion renders only transparent text (seconds), FFmpeg merges instantly.

---

## Implementation

### Step 1 — Remotion Overlay Component
Create a Remotion project that renders **only overlays** (transparent background).

```tsx
// src/OverlayComposition.tsx
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const OverlayComposition: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "transparent",
        justifyContent: "center",
        alignItems: "center",
        opacity,
      }}
    >
      <h1
        style={{
          fontSize: "80px",
          color: "white",
          textShadow: "2px 2px 10px rgba(0,0,0,0.7)",
        }}
      >
        {text}
      </h1>
    </AbsoluteFill>
  );
};
```

---

### Step 2 — Render Overlay with Alpha Channel
Export the overlay as a transparent video (e.g., `.webm` with VP9 codec).

```bash
npx remotion render OverlayComposition overlay.webm --codec=vp9 --transparent
```

---

### Step 3 — Merge with Original Video using FFmpeg

```bash
ffmpeg -i original.mp4 -i overlay.webm   -filter_complex "[0:v][1:v] overlay=0:0:format=auto"   -c:v libx264 -c:a copy final.mp4
```

---

### Step 4 — Integrate into Your Website
- **Frontend:** Capture user edits (text, stickers, timing, etc.).
- **Backend:**
  1. Store original video.
  2. Send edit data to Remotion Lambda or Remotion server to render overlay only.
  3. Use FFmpeg to merge overlay with original video.

**Example Node.js API endpoint:**
```js
import express from "express";
import { spawn } from "child_process";

const app = express();
app.use(express.json());

app.post("/render", async (req, res) => {
  const { text } = req.body;

  // 1. Render overlay with Remotion
  // (call Remotion render function or Lambda here)

  // 2. Merge with FFmpeg
  const ffmpeg = spawn("ffmpeg", [
    "-i", "original.mp4",
    "-i", "overlay.webm",
    "-filter_complex", "[0:v][1:v] overlay=0:0:format=auto",
    "-c:v", "libx264",
    "-c:a", "copy",
    "final.mp4"
  ]);

  ffmpeg.on("close", (code) => {
    if (code === 0) {
      res.download("final.mp4");
    } else {
      res.status(500).send("FFmpeg failed");
    }
  });
});

app.listen(3000, () => console.log("Server running"));
```

---

## Benefits
- **Speed:** Render only small overlays, not the whole video.
- **Cost:** Less Lambda runtime or server CPU usage → lower cloud bill.
- **Scalability:** Can handle thousands of edits/month with minimal hardware.

---

## Example Workflow
1. User uploads 60s MP4.
2. User adds “SALE ENDS SOON” text.
3. Backend renders text overlay (transparent).
4. FFmpeg overlays text onto original video.
5. Done in ~5–10 seconds instead of minutes.

---

## Quick Start
```bash
# Install Remotion & FFmpeg
npm install remotion
sudo apt install ffmpeg

# Create Remotion overlay project
npx create-video overlay-project

# Render overlay
npx remotion render OverlayComposition overlay.webm --codec=vp9 --transparent

# Merge
ffmpeg -i original.mp4 -i overlay.webm   -filter_complex "[0:v][1:v] overlay=0:0:format=auto"   -c:v libx264 -c:a copy final.mp4
```

---

## License
Internal documentation for in-house implementation.
