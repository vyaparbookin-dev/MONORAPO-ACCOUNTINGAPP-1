// UPI Soundbox Voice & Chime Announcement Utility (Like Paytm / PhonePe Soundbox)

export const playPaymentChime = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.35, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.12);
    gain2.gain.setValueAtTime(0.4, ctx.currentTime + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.12);
    osc2.stop(ctx.currentTime + 0.65);
  } catch (e) {
    console.warn("Payment chime error:", e);
  }
};

export const speakUpiPayment = (amount, appName = "व्यापार") => {
  try {
    playPaymentChime();
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setTimeout(() => {
        window.speechSynthesis.cancel();
        const amtNum = Number(amount || 0);
        const message = `${appName} पर ${amtStr} रुपये प्राप्त हुए!`;
        const utterance = new SpeechSynthesisUtterance(message);
        const voices = window.speechSynthesis.getVoices() || [];
        const hindiVoice = voices.find(v => v.lang && (v.lang.includes("hi") || v.lang.includes("HI")));
        if (hindiVoice) {
          utterance.voice = hindiVoice;
        }
        utterance.lang = "hi-IN";
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
      }, 380);
    }
  } catch (err) {
    console.warn("UPI Voice announcement error:", err);
  }
};

export default { playPaymentChime, speakUpiPayment };
