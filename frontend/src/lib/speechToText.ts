/**
 * Generalized Speech-to-Text wrapper
 * Works across Chrome, Edge, Safari (via webkitSpeechRecognition)
 */

export interface SpeechRecognitionOptions {
  onStart?: () => void;
  onEnd?: () => void;
  onResult?: (result: { finalTranscript: string; interimTranscript: string }) => void;
  onError?: (error: any) => void;
  lang?: string;
}

export const createSpeechRecognition = ({
  onStart,
  onEnd,
  onResult,
  onError,
  lang = "en-US",
}: SpeechRecognitionOptions) => {
  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  if (!SpeechRecognition) {
    console.error("Speech Recognition is not supported in this browser.");
    return null;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true; // Keep listening even if user pauses briefly
  recognition.interimResults = true; // Provide live text before sentence finishes
  recognition.lang = lang; // Can be dynamically set based on user's locale

  if (onStart) recognition.onstart = onStart;
  if (onEnd) recognition.onend = onEnd;
  if (onError) recognition.onerror = onError;

  recognition.onresult = (event: any) => {
    let interimTranscript = "";
    let finalTranscript = "";

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript;
      } else {
        interimTranscript += event.results[i][0].transcript;
      }
    }

    if (onResult) {
      onResult({ finalTranscript, interimTranscript });
    }
  };

  return recognition;
};
