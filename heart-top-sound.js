/*
 * NKUHT 旅館島：跟領航員切磋陀螺的音效。
 *
 * 全部用 Web Audio 即時合成，不載入音檔。預設靜音：訪客按喇叭打開聲音之前不建立
 * AudioContext。沒有 Web Audio 或任何一步出錯時都安靜地略過，不影響遊戲本身。
 * 頻率、長度、音量都是估計值，調整時同步更新 heart-island-top-sound 的 design 音效表。
 */

const SOUND_KEY = 'heart-top:sound';
const MASTER_VOLUME = 0.6;
const HUM_VOLUME = 0.03;
/**
 * 撞擊聲：低頻三角波的「咚」在筆電、手機喇叭幾乎放不出來，聽得到的主要是中高頻的
 * 木頭脆響「喀」（正弦波加一小段帶通雜訊）。
 *
 * @type {Record<'hit'|'knockout', { thump: number, thumpVol: number, thumpLen: number, crack: number, crackVol: number, crackLen: number, noiseVol: number }>}
 */
const IMPACT = {
  hit: { thump: 220, thumpVol: 0.5, thumpLen: 0.12, crack: 1300, crackVol: 1.3, crackLen: 0.06, noiseVol: 1.1 },
  knockout: { thump: 140, thumpVol: 0.3, thumpLen: 0.2, crack: 950, crackVol: 1.4, crackLen: 0.14, noiseVol: 1.5 },
};
/** 結果音：每個音的頻率（Hz），依序播放；win 最後再加一個和弦。 */
const RESULT_NOTES = {
  win: [523, 659, 784, 1047],
  lose: [392, 330, 262],
  tie: [440, 440],
};
/** 兩顆鐵釘相撞的金屬泛音（不成整數倍，聽起來像金屬而不是樂音）：[頻率, 音量, 長度]。 */
const CLANG = [[2210, 0.16, 0.32], [3370, 0.11, 0.24], [5150, 0.07, 0.16], [6890, 0.04, 0.1]];
/** 殘響送出量：一點點空間感，像在大廳裡打陀螺。 */
const REVERB_SEND = 0.22;

/** 訪客有沒有打開聲音；只有存著 {"on":true} 才算開，其餘一律當作靜音。 */
export function readSoundOn(storage) {
  try {
    return JSON.parse(storage.getItem(SOUND_KEY))?.on === true;
  } catch {
    return false;
  }
}

/** 記住訪客的選擇；寫不進去就算了。 */
export function saveSoundOn(storage, on) {
  try {
    storage.setItem(SOUND_KEY, JSON.stringify({ on: on === true }));
  } catch {}
}

function defaultAudioContext() {
  try {
    return window.AudioContext || window.webkitAudioContext;
  } catch {
    return undefined;
  }
}

/**
 * @param {{ AudioContextCtor?: typeof AudioContext }} [options]
 * @return {{ enable(): void, disable(): void, resume(): void, wind(tension: number): void, whoosh(quality: number): void, touchdown(quality: number): void, impact(kind: 'hit'|'knockout'): void, land(): void, topple(pan: number): void, hum(me: number, puma: number): void, result(kind: 'win'|'lose'|'tie'): void, close(): void }}
 */
export function createTopSound({ AudioContextCtor = defaultAudioContext() } = {}) {
  let ctx = null;
  let master = null;
  let noiseBuffer = null;
  let hums = null;
  let reverb = null;
  let windStep = 0;
  let on = false;
  let dead = !AudioContextCtor;

  /** 包住每個播放函式：沒開聲音就不做事，出錯就吞掉。 */
  const play = (fn) => (...args) => {
    if (!on || !ctx) return;
    try {
      fn(...args);
    } catch {}
  };

  const noise = () => {
    if (!noiseBuffer) {
      noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.5), ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    return noiseBuffer;
  };

  /** 小小的大廳殘響：程式產生的衰減雜訊當脈衝響應，建一次共用。沒有 ConvolverNode 就略過。 */
  const reverbIn = () => {
    if (reverb !== null) return reverb || null;
    try {
      const len = Math.floor(ctx.sampleRate * 1.1);
      const ir = ctx.createBuffer(2, len, ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const d = ir.getChannelData(ch);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 3.2;
      }
      const conv = ctx.createConvolver();
      conv.buffer = ir;
      const send = ctx.createGain();
      send.gain.setValueAtTime(REVERB_SEND, ctx.currentTime);
      send.connect(conv);
      conv.connect(master);
      reverb = send;
    } catch {
      reverb = false;
    }
    return reverb || null;
  };

  /** 輸出端：pan 是 -1（左，你的陀螺）到 1（右，對手），wet 決定要不要送殘響。 */
  const out = (pan = 0, wet = false) => {
    let node = master;
    if (pan && ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.setValueAtTime(Math.max(-1, Math.min(1, pan)), ctx.currentTime);
      p.connect(master);
      node = p;
    }
    if (!wet) return node;
    const split = ctx.createGain();
    split.connect(node);
    const r = reverbIn();
    if (r) split.connect(r);
    return split;
  };

  /** 一個很快衰減掉的音。 */
  const tone = (freq, type, delay, duration, volume, pan = 0, wet = false) => {
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(volume, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(gain);
    gain.connect(out(pan, wet));
    osc.start(t);
    osc.stop(t + duration + 0.02);
  };

  /** 一段濾波過的雜訊，濾波頻率從 from 掃到 to。 */
  const hiss = (filterType, from, to, duration, volume, delay = 0, pan = 0, wet = false) => {
    const t = ctx.currentTime + delay;
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    src.buffer = noise();
    filter.type = filterType;
    filter.Q.setValueAtTime(1.2, t);
    filter.frequency.setValueAtTime(from, t);
    filter.frequency.exponentialRampToValueAtTime(to, t + duration);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.linearRampToValueAtTime(volume, t + Math.min(0.03, duration / 3));
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(out(pan, wet));
    src.start(t);
    src.stop(t + duration + 0.02);
  };

  /** 木頭敲地的「叩」：短促的中頻正弦加一點帶通雜訊。 */
  const knock = (freq, delay, volume, pan = 0) => {
    tone(freq, 'sine', delay, 0.07, volume, pan, true);
    tone(freq * 2.7, 'sine', delay, 0.03, volume * 0.35, pan);
    hiss('bandpass', 2400, 1400, 0.05, volume * 0.5, delay, pan);
  };

  const stopHum = () => {
    if (!hums) return;
    for (const h of hums) {
      for (const n of h.sources) {
        try {
          n.stop();
          n.disconnect();
        } catch {}
      }
    }
    hums = null;
  };

  /**
   * 每顆陀螺一組聲音（你在左、對手在右）：
   * 圓潤的三角波「嗚——」＋帶通雜訊的「咻咻」摩擦聲，再用低頻振盪器讓音量隨轉動一起一伏；
   * 轉速變慢時音調往下掉、起伏變大，就是陀螺快倒前搖晃的聲音。
   */
  const startHum = () => {
    hums = [-0.45, 0.45].map((pan) => {
      const t = ctx.currentTime;
      const dest = out(pan);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      const wobble = ctx.createGain(); // 被 LFO 推動的音量
      wobble.gain.setValueAtTime(1, t);
      gain.connect(wobble);
      wobble.connect(dest);

      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      const tone = ctx.createBiquadFilter();
      tone.type = 'lowpass';
      tone.frequency.setValueAtTime(900, t);
      osc.connect(tone);
      tone.connect(gain);

      const whirr = ctx.createBufferSource();
      whirr.buffer = noise();
      whirr.loop = true;
      const band = ctx.createBiquadFilter();
      band.type = 'bandpass';
      band.Q.setValueAtTime(2.2, t);
      band.frequency.setValueAtTime(1600, t);
      const whirrGain = ctx.createGain();
      whirrGain.gain.setValueAtTime(0.55, t);
      whirr.connect(band);
      band.connect(whirrGain);
      whirrGain.connect(gain);

      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(14, t);
      const depth = ctx.createGain();
      depth.gain.setValueAtTime(0.1, t);
      lfo.connect(depth);
      depth.connect(wobble.gain);

      osc.start(t);
      whirr.start(t);
      lfo.start(t);
      return { osc, band, gain, lfo, depth, sources: [osc, whirr, lfo] };
    });
  };

  return {
    enable() {
      if (dead) return;
      try {
        if (!ctx) {
          ctx = new AudioContextCtor();
          master = ctx.createGain();
          // a gentle limiter so stacked effects (impact + clang + reverb) never clip on phone speakers
          let tail = master;
          try {
            const comp = ctx.createDynamicsCompressor();
            comp.threshold.setValueAtTime(-14, ctx.currentTime);
            comp.ratio.setValueAtTime(6, ctx.currentTime);
            master.connect(comp);
            tail = comp;
          } catch {}
          tail.connect(ctx.destination);
        }
        master.gain.setValueAtTime(MASTER_VOLUME, ctx.currentTime);
        on = true;
        ctx.resume?.()?.catch?.(() => {});
      } catch {
        dead = true;
        on = false;
        ctx = null;
      }
    },
    disable() {
      on = false;
      try {
        stopHum();
        master?.gain.setValueAtTime(0, ctx.currentTime);
      } catch {}
    },
    resume: play(() => {
      ctx.resume?.()?.catch?.(() => {});
    }),
    /** 纏繩：拉滿程度每多 1/12 響一聲棘輪「喀」，越緊音越高；放掉（0）就重新數。 */
    wind: play((tension) => {
      const step = Math.floor(Math.max(0, Math.min(1, tension)) * 12);
      if (step <= 0) {
        windStep = 0;
        return;
      }
      if (step <= windStep) return;
      windStep = step;
      tone(1500 + 70 * step, 'square', 0, 0.016, 0.05, -0.5);
      hiss('highpass', 4200, 3000, 0.02, 0.18, 0, -0.5);
    }),
    whoosh: play((quality) => {
      windStep = 0;
      hiss('bandpass', 500, 1200 + 1800 * quality, 0.25, 0.1 + 0.15 * quality, 0, -0.3);
      // 繩子從陀螺上抽出來的「啪」
      hiss('highpass', 6000, 2500, 0.06, 0.35 + 0.3 * quality, 0, -0.6);
      tone(2600, 'triangle', 0, 0.025, 0.12, -0.6);
    }),
    /** 陀螺落地、鐵釘咬住地板的「叩」。 */
    touchdown: play((quality = 0.5) => {
      knock(480 + 120 * quality, 0.04, 0.45, -0.2);
    }),
    impact: play((kind) => {
      const fx = IMPACT[kind] || IMPACT.hit;
      tone(fx.thump, 'triangle', 0, fx.thumpLen, fx.thumpVol, 0.1, true);
      tone(fx.crack, 'sine', 0, fx.crackLen, fx.crackVol, 0.1, true);
      hiss('bandpass', 3000, 1500, fx.crackLen * 0.6, fx.noiseVol, 0, 0.1);
      // 兩根鐵釘相碰的金屬餘音，打倒時更長更亮
      const k = kind === 'knockout' ? 1.5 : 1;
      for (const [f, v, len] of CLANG) tone(f, 'sine', 0.004, len * k, v * k, 0.15, true);
    }),
    land: play(() => {
      tone(90, 'sine', 0, 0.15, 0.6, 0.5, true);
      knock(360, 0, 0.5, 0.5);
      knock(300, 0.11, 0.3, 0.55);
      hiss('bandpass', 900, 400, 0.35, 0.18, 0.05, 0.5);
    }),
    /** 轉不動倒下：幾下越來越輕、越來越快的木頭敲地，再加一段滾動的摩擦聲。 */
    topple: play((pan = 0) => {
      [[420, 0, 0.42], [380, 0.13, 0.3], [350, 0.22, 0.2], [330, 0.28, 0.12]].forEach(([f, d, v]) => knock(f, d, v, pan));
      hiss('bandpass', 1100, 500, 0.45, 0.12, 0.02, pan);
    }),
    hum: play((me, puma) => {
      if (me <= 0 && puma <= 0) {
        stopHum();
        return;
      }
      if (!hums) startHum();
      [me, puma].forEach((speed, i) => {
        const s = Math.max(0, Math.min(1, speed));
        const h = hums[i];
        const t = ctx.currentTime;
        const wob = (1 - s) ** 2; // spinState 的 wobble：轉速掉到一半以下才明顯
        h.osc.frequency.setTargetAtTime(70 + 170 * s, t, 0.05);
        h.band.frequency.setTargetAtTime(700 + 1700 * s, t, 0.08);
        h.lfo.frequency.setTargetAtTime(3 + 14 * s, t, 0.1);
        h.depth.gain.setTargetAtTime(0.08 + 0.6 * wob, t, 0.1);
        h.gain.gain.setTargetAtTime(s > 0 ? HUM_VOLUME * 1.6 * (0.35 + 0.65 * s) : 0, t, 0.05);
      });
    }),
    result: play((kind) => {
      const notes = RESULT_NOTES[kind] || [];
      const start = 0.3; // 等倒下的敲地聲過去
      notes.forEach((freq, i) => {
        tone(freq, 'triangle', start + i * 0.13, 0.16, 0.22, 0, true);
        tone(freq * 2, 'sine', start + i * 0.13, 0.1, 0.06, 0, true);
      });
      if (kind === 'win') {
        // 最後一個和弦：大三和弦加高八度的鈴聲泛音
        const t = start + notes.length * 0.13;
        for (const f of [523, 659, 784]) tone(f, 'triangle', t, 0.7, 0.12, 0, true);
        tone(2093, 'sine', t, 0.5, 0.05, 0, true);
      }
    }),
    close() {
      on = false;
      dead = true;
      try {
        stopHum();
        ctx?.close?.()?.catch?.(() => {});
      } catch {}
      ctx = null;
    },
  };
}
