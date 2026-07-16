// api/tts.js
// Vercel Serverless Function: Text -> MP3 via Fish Audio TTS API
//
// Deploy this file in an `api/` folder at your project root.
// Vercel will automatically expose it at: POST https://<your-project>.vercel.app/api/tts
//
// Required environment variable (set in Vercel dashboard -> Settings -> Environment Variables):
//   FISH_API_KEY   = your Fish Audio API key
// Optional:
//   FISH_VOICE_ID  = default reference_id (voice) to use if none is passed in the request

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const {
    text,
    reference_id,
    format = 'mp3',
    model = 's2.1-pro-free',
  } = req.body || {};

  // Basic validation
  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'Missing required field: "text" (non-empty string).' });
  }

  const FISH_API_KEY = process.env.FISH_API_KEY;
  if (!FISH_API_KEY) {
    return res.status(500).json({ error: 'Server misconfigured: FISH_API_KEY environment variable is not set.' });
  }

  const voiceId = reference_id || process.env.FISH_VOICE_ID;
  if (!voiceId) {
    return res.status(400).json({
      error: 'Missing "reference_id" (voice ID). Pass it in the request body, or set FISH_VOICE_ID as a default env var.',
    });
  }

  try {
    const fishResponse = await fetch('https://api.fish.audio/v1/tts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${FISH_API_KEY}`,
        'Content-Type': 'application/json',
        model, // e.g. "s2-pro"
      },
      body: JSON.stringify({
        text,
        reference_id: voiceId,
        format,
      }),
    });

    if (!fishResponse.ok) {
      const errText = await fishResponse.text();
      return res.status(fishResponse.status).json({
        error: 'Fish Audio API request failed.',
        status: fishResponse.status,
        details: errText,
      });
    }

    const arrayBuffer = await fishResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', format === 'mp3' ? 'audio/mpeg' : `audio/${format}`);
    res.setHeader('Content-Disposition', 'inline; filename="speech.' + format + '"');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('TTS generation failed:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

// Increase body size limit slightly in case of long book-chapter text inputs.
// (Vercel default is 4.5mb for serverless function payloads, which is plenty for text.)
module.exports.config = {
  api: {
    bodyParser: {
      sizeLimit: '2mb',
    },
  },
};
