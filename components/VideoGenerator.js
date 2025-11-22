'use client';

import { useEffect, useRef, useState } from 'react';

const DEFAULT_MESSAGES = [
  'Tarik napas. Tenangkan hati.',
  'Setiap langkah kecil bernilai.',
  'Air yang tenang mengajarkan sabar.',
  'Hutan berbisik: teruslah tumbuh.',
  'Kamu cukup. Kamu mampu.',
  'Hari ini adalah awal yang baru.'
];

function createAmbientAudio(audioContext) {
  const masterGain = audioContext.createGain();
  masterGain.gain.value = 0.2;

  // Soft pad chords using two oscillators
  const pad1 = audioContext.createOscillator();
  pad1.type = 'sine';
  pad1.frequency.value = 432; // calming tone
  const pad1Gain = audioContext.createGain();
  pad1Gain.gain.value = 0.08;
  pad1.connect(pad1Gain).connect(masterGain);

  const pad2 = audioContext.createOscillator();
  pad2.type = 'sine';
  pad2.frequency.value = 528; // heart/solfeggio
  const pad2Gain = audioContext.createGain();
  pad2Gain.gain.value = 0.05;
  pad2.connect(pad2Gain).connect(masterGain);

  // Gentle water noise: filtered noise
  const bufferSize = 2 * audioContext.sampleRate;
  const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * 0.6;
  }
  const noise = audioContext.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;

  const biquad = audioContext.createBiquadFilter();
  biquad.type = 'lowpass';
  biquad.frequency.value = 600;
  biquad.Q.value = 0.7;

  const noiseGain = audioContext.createGain();
  noiseGain.gain.value = 0.05;
  noise.connect(biquad).connect(noiseGain).connect(masterGain);

  // Slow breathing-like swell
  const lfo = audioContext.createOscillator();
  lfo.type = 'sine';
  lfo.frequency.value = 0.06; // very slow
  const lfoGain = audioContext.createGain();
  lfoGain.gain.value = 0.06;
  lfo.connect(lfoGain).connect(pad1Gain.gain);

  const lfo2 = audioContext.createOscillator();
  lfo2.type = 'sine';
  lfo2.frequency.value = 0.045;
  const lfo2Gain = audioContext.createGain();
  lfo2Gain.gain.value = 0.05;
  lfo2.connect(lfo2Gain).connect(pad2Gain.gain);

  pad1.start();
  pad2.start();
  noise.start();
  lfo.start();
  lfo2.start();

  return { master: masterGain, stop: () => {
    try { pad1.stop(); pad2.stop(); noise.stop(); lfo.stop(); lfo2.stop(); } catch {}
  }};
}

function drawScenery(ctx, t, width, height) {
  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, '#dbeafe');
  sky.addColorStop(1, '#f0fdf4');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // Distant mountains
  ctx.fillStyle = '#a7c7c5';
  ctx.beginPath();
  ctx.moveTo(0, height * 0.55);
  for (let x = 0; x <= width; x += 8) {
    const y = height * 0.55 + Math.sin((x * 0.004) + t * 0.2) * 8 + Math.cos((x * 0.007) - t * 0.15) * 6;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // Forest silhouettes
  function drawTree(baseX, baseY, scale, sway) {
    const trunkWidth = 10 * scale;
    const trunkHeight = 80 * scale;
    ctx.fillStyle = '#0f2f2e';
    ctx.save();
    ctx.translate(baseX, baseY);
    ctx.rotate(Math.sin((t + baseX * 0.01) * 0.5) * sway);
    ctx.fillRect(-trunkWidth / 2, -trunkHeight, trunkWidth, trunkHeight);
    // canopy
    ctx.fillStyle = '#133d3b';
    for (let i = 0; i < 4; i++) {
      const r = (60 - i * 10) * scale;
      ctx.beginPath();
      ctx.arc(0, -trunkHeight + i * 12, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  const treeLineY = height * 0.62;
  for (let i = 0; i < 18; i++) {
    const x = (i / 17) * width + Math.sin(i * 12.3) * 12;
    const s = 0.6 + (i % 5) * 0.08;
    drawTree(x, treeLineY + Math.sin(t * 0.5 + i) * 2, s, 0.02);
  }

  // River with gentle flow
  const riverTop = height * 0.67;
  ctx.beginPath();
  ctx.moveTo(0, riverTop);
  for (let x = 0; x <= width; x += 6) {
    const y = riverTop + Math.sin((x * 0.02) + t * 1.2) * 2 + Math.cos((x * 0.012) - t * 0.9) * 1.4;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  const water = ctx.createLinearGradient(0, riverTop, 0, height);
  water.addColorStop(0, '#9be8ff');
  water.addColorStop(1, '#5bd0ff');
  ctx.fillStyle = water;
  ctx.fill();

  // Water highlights
  ctx.strokeStyle = 'rgba(255,255,255,0.6)';
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 4; i++) {
    const yBase = riverTop + i * 20 + (Math.sin(t * 0.8 + i) * 4);
    ctx.beginPath();
    for (let x = 0; x <= width; x += 10) {
      const y = yBase + Math.sin(x * 0.06 + t * (0.9 + i * 0.1)) * 1.5;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
}

function drawCenteredText(ctx, text, alpha, width, height) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = '#0b1f1e';
  ctx.shadowColor = 'rgba(255,255,255,0.9)';
  ctx.shadowBlur = 12;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const baseSize = Math.min(width, height) * 0.05;
  ctx.font = `700 ${baseSize}px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial`;

  const lines = text.split('\n');
  const lineHeight = baseSize * 1.4;
  const centerY = height * 0.38;
  lines.forEach((line, idx) => {
    ctx.fillText(line, width / 2, centerY + idx * lineHeight);
  });
  ctx.restore();
}

export default function VideoGenerator() {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [messagesText, setMessagesText] = useState(DEFAULT_MESSAGES.join('\n'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);
  const [status, setStatus] = useState('Siap membuat video');

  useEffect(() => () => { if (downloadUrl) URL.revokeObjectURL(downloadUrl); }, [downloadUrl]);

  async function generate() {
    setIsGenerating(true);
    setStatus('Menyiapkan kanvas dan audio...');

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = 1280;
    const height = 720;
    canvas.width = width;
    canvas.height = height;

    // Setup audio
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const ambient = createAmbientAudio(audioContext);
    const dest = audioContext.createMediaStreamDestination();
    ambient.master.connect(dest);

    // Capture canvas stream
    const videoStream = canvas.captureStream(30);
    const mixedStream = new MediaStream([
      ...videoStream.getVideoTracks(),
      ...dest.stream.getAudioTracks(),
    ]);

    const chunks = [];
    const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm;codecs=vp8';
    const recorder = new MediaRecorder(mixedStream, {
      mimeType: mime,
      videoBitsPerSecond: 4_000_000,
      audioBitsPerSecond: 128_000
    });

    recorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };

    const messages = messagesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const secondsPerMessage = 4.5;
    const fadeDuration = 0.9;
    const totalDuration = messages.length * secondsPerMessage + 2.0; // tail

    let startTime = 0;
    let rafId;

    const start = () => {
      recorder.start();
      startTime = performance.now();
      draw();
    };

    function draw() {
      const now = performance.now();
      const elapsed = (now - startTime) / 1000; // seconds
      const t = elapsed;

      drawScenery(ctx, t, width, height);

      // Determine current message
      const idx = Math.min(Math.floor(elapsed / secondsPerMessage), messages.length - 1);
      const msgStart = idx * secondsPerMessage;
      const dt = elapsed - msgStart;

      // Compute alpha fade in/out
      let alpha = 1.0;
      if (dt < fadeDuration) alpha = dt / fadeDuration;
      else if (dt > secondsPerMessage - fadeDuration) alpha = Math.max(0, (secondsPerMessage - dt) / fadeDuration);

      drawCenteredText(ctx, messages[idx] || '', alpha, width, height);

      // Progress text
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.font = '600 18px ui-sans-serif, system-ui';
      ctx.textAlign = 'right';
      ctx.fillText(`Scene ${idx + 1}/${messages.length}`, width - 20, height - 26);
      ctx.restore();

      if (elapsed < totalDuration) {
        rafId = requestAnimationFrame(draw);
      } else {
        // Finish recording a bit after drawing completes to flush frames
        setStatus('Merampungkan rekaman...');
        setTimeout(() => {
          try { recorder.stop(); } catch {}
          cancelAnimationFrame(rafId);
          ambient.stop();
          audioContext.close().catch(() => {});
        }, 200);
      }
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mime });
        const url = URL.createObjectURL(blob);
        setDownloadUrl(url);
        setIsGenerating(false);
        setStatus('Selesai. Video siap diunduh.');
        resolve();
      };
      setStatus('Memulai rekaman...');
      start();
    });
  }

  return (
    <div className="panel">
      <div className="inputs">
        <label>
          Teks Motivasi (satu baris per adegan)
          <textarea value={messagesText} onChange={e => setMessagesText(e.target.value)} placeholder="Tulis kata-kata motivasi Anda di sini..." />
        </label>
      </div>

      <div className="controls" style={{ marginTop: 12, justifyContent: 'space-between' }}>
        <div className="controls" style={{ gap: 8 }}>
          <button className="button" onClick={generate} disabled={isGenerating}>
            {isGenerating ? 'Membuat Video...' : 'Buat Video'}
          </button>
          {downloadUrl && (
            <a className="button secondary" href={downloadUrl} download={`video-motivasi.webm`}>
              Unduh Video
            </a>
          )}
        </div>
        <span className={`badge ${isGenerating ? 'warn' : 'ok'}`}>{isGenerating ? 'Sedang memproses' : 'Siap'}</span>
      </div>

      <p className="progress" style={{ marginTop: 10 }}>{status}</p>

      <div className="preview" style={{ marginTop: 12 }}>
        <canvas ref={canvasRef} style={{ width: '100%', borderRadius: 12, background: '#e2f3ff', display: 'block' }} />
        {downloadUrl && (
          <video ref={videoRef} src={downloadUrl} controls />
        )}
      </div>
    </div>
  );
}
