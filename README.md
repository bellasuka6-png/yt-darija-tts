# Fish Audio Text-to-Speech — Vercel Endpoint

A single serverless function that takes text and returns an MP3 (via [Fish Audio](https://fish.audio)).

## Files

```
.
├── api/
│   └── tts.js        # the serverless function (POST /api/tts)
├── package.json
└── .env.example
```

## 1. Deploy

**Option A — Vercel CLI**
```bash
npm i -g vercel
cd this-folder
vercel
```

**Option B — GitHub + Vercel dashboard**
1. Push this folder to a GitHub repo
2. Import the repo at vercel.com/new
3. Deploy (no build settings needed — it's just a serverless function)

## 2. Set environment variables

In the Vercel dashboard → your project → **Settings → Environment Variables**, add:

| Key | Value |
|---|---|
| `FISH_API_KEY` | Your Fish Audio API key |
| `FISH_VOICE_ID` *(optional)* | A default `reference_id` (voice) to use if you don't pass one per-request |

Redeploy after adding env vars so they take effect.

## 3. Call the endpoint

```bash
curl -X POST https://YOUR-PROJECT.vercel.app/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "سلام، كيف داير؟",
    "reference_id": "YOUR_VOICE_ID",
    "format": "mp3"
  }' \
  --output speech.mp3
```

Or from JavaScript (e.g. inside your video pipeline):

```javascript
const res = await fetch("https://YOUR-PROJECT.vercel.app/api/tts", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    text: "Your book chapter text here...",
    reference_id: "YOUR_VOICE_ID", // optional if FISH_VOICE_ID env var is set
    format: "mp3",
  }),
});

const arrayBuffer = await res.arrayBuffer();
const buffer = Buffer.from(arrayBuffer);
require("fs").writeFileSync("output.mp3", buffer);
```

## Request body reference

| Field | Required | Default | Notes |
|---|---|---|---|
| `text` | ✅ | — | The text to synthesize. Supports emotion tags like `[excited]`, `[laughing]` per Fish Audio's format. |
| `reference_id` | ⚠️ (unless `FISH_VOICE_ID` env var is set) | — | The voice ID to use. |
| `format` | ❌ | `"mp3"` | Output audio format. |
| `model` | ❌ | `"s2-pro"` | Fish Audio model/engine. |

## Notes for a book-to-speech pipeline

- **Long chapters**: split very long text into chunks (e.g. per-paragraph or ~2,000–4,000 characters) and call `/api/tts` once per chunk, then stitch the resulting MP3s together (e.g. with `ffmpeg` in your video-build step). This avoids hitting request timeouts and gives you finer control over pacing/pauses between sections.
- **Vercel timeout limits**: Hobby plan serverless functions have a max execution time (commonly 10s on Hobby, up to 60s+ on Pro). If Fish Audio takes longer to synthesize a large chunk, you may need to either shorten chunks or upgrade your Vercel plan.
- **Rate limits**: Check Fish Audio's dashboard for your plan's requests-per-minute cap before wiring this into an automated pipeline generating multiple videos per day.
