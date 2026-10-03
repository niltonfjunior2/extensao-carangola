// Módulo de Áudio: Síntese de beeps de feedback para leituras ópticas via Web Audio API
// Elimina necessidade de arquivos MP3/WAV pesados (Custo Zero de banda e latência zero)

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!sharedAudioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      sharedAudioCtx = new AudioContextClass();
    }
  }
  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export type FeedbackSoundType = 'success' | 'error';

/**
 * Emite um feedback sonoro sintetizado em tempo real no alto-falante do dispositivo
 */
export function playFeedbackSound(type: FeedbackSoundType): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'success') {
      // Arpejo ascendente harmônico: Nota Lá (A5 - 880Hz) seguida de Ré (D6 - 1174Hz)
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    } else {
      // Tom grave dissonante de alerta (220Hz - A3)
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    // Falhas de áudio não devem interromper o fluxo da aplicação
    console.debug('[Audio] Síntese sonora não permitida pelo navegador:', e);
  }
}
