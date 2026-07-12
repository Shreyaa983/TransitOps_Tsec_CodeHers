/**
 * Generalized Text-to-Speech wrapper using Web Speech Synthesis API
 */

export interface SpeakOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: () => void;
}

export const speakText = (
  text: string,
  optionsOrOnEnd?: (() => void) | SpeakOptions
) => {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    console.error("Speech Synthesis is not supported in this browser.");
    return;
  }

  // Cancel any currently playing speech to prevent overlapping audio queues
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);

  // Set language preference (or read from localStorage / current app lang)
  const lang = localStorage.getItem("transit_lang") || "en";
  utterance.lang = lang.startsWith("en") ? "en-US" : lang;

  let onStart: (() => void) | undefined;
  let onEnd: (() => void) | undefined;
  let onError: (() => void) | undefined;

  if (typeof optionsOrOnEnd === "function") {
    onEnd = optionsOrOnEnd;
  } else if (optionsOrOnEnd && typeof optionsOrOnEnd === "object") {
    onStart = optionsOrOnEnd.onStart;
    onEnd = optionsOrOnEnd.onEnd;
    onError = optionsOrOnEnd.onError;
  }

  if (onStart) {
    utterance.onstart = onStart;
  }

  if (onEnd || onError) {
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      if (onError) onError();
      else if (onEnd) onEnd();
    };
  }

  // Select the best matching natural voice available on the device
  const voices = window.speechSynthesis.getVoices();
  let selectedVoice = voices.find((v) => v.lang.startsWith(lang));

  // Preferred voice fallbacks (e.g., natural sounding voices)
  if (lang === "en" || lang.startsWith("en")) {
    selectedVoice =
      voices.find(
        (v) =>
          v.name.includes("Google") ||
          v.name.includes("Natural") ||
          v.name.includes("Samantha") ||
          v.name.includes("Microsoft")
      ) || selectedVoice;
  }

  if (selectedVoice) utterance.voice = selectedVoice;

  utterance.rate = 1.0; // Speech speed (0.5 to 2.0)
  utterance.pitch = 1.0; // Voice pitch

  window.speechSynthesis.speak(utterance);
};

/**
 * Stop any ongoing speech immediately (Mute / Cancel)
 */
export const stopSpeaking = () => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Pause current speech
 */
export const pauseSpeaking = () => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.pause();
  }
};

/**
 * Resume paused speech
 */
export const resumeSpeaking = () => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    window.speechSynthesis.resume();
  }
};

/**
 * Check if speech synthesis is currently speaking
 */
export const isSpeaking = (): boolean => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    return window.speechSynthesis.speaking;
  }
  return false;
};

/**
 * Check if speech synthesis is currently paused
 */
export const isPaused = (): boolean => {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    return window.speechSynthesis.paused;
  }
  return false;
};
