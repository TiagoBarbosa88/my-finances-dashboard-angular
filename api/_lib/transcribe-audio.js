/**
 * Transcrição de áudio via OpenAI Whisper.
 */

async function transcribeAudio(audioUrl) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada.');
  }

  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Falha ao baixar áudio: ${audioResponse.status}`);
  }

  const buffer = Buffer.from(await audioResponse.arrayBuffer());
  const form = new FormData();
  form.append('file', new Blob([buffer]), 'audio.ogg');
  form.append('model', process.env.WHISPER_MODEL || 'whisper-1');
  form.append('language', 'pt');

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Whisper error: ${response.status} ${errText}`);
  }

  const payload = await response.json();
  return String(payload.text || '').trim();
}

module.exports = { transcribeAudio };
