import { useState, useEffect, useRef, useCallback } from 'react';

// Fix: Add type definitions for the Web Speech API to resolve compilation errors.
// These types are not part of the standard TypeScript DOM library.
interface SpeechRecognitionAlternative {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;

  addEventListener(type: 'result', listener: (this: SpeechRecognition, ev: SpeechRecognitionEvent) => any, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: 'error', listener: (this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any, options?: boolean | AddEventListenerOptions): void;
  addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;

  removeEventListener(type: 'result', listener: (this: SpeechRecognition, ev: SpeechRecognitionEvent) => any, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: 'error', listener: (this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any, options?: boolean | EventListenerOptions): void;
  removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}


// Type guard for SpeechRecognition
const hasSpeechRecognition = (): boolean =>
  'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;

const getSpeechRecognition = () => {
  if ('SpeechRecognition' in window) {
    return window.SpeechRecognition;
  }
  if ('webkitSpeechRecognition' in window) {
    return (window as any).webkitSpeechRecognition;
  }
  return null;
};

type CommandCallback = (command: string) => void;

export const useVoiceControl = (onCommand: CommandCallback) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const handleResult = (event: SpeechRecognitionEvent) => {
    const lastResult = event.results[event.results.length - 1];
    if (lastResult.isFinal) {
      const commandText = lastResult[0].transcript.trim().toLowerCase().replace('.', '');
      onCommand(commandText);
      // Ensure we stop listening after a final command is processed.
      if (recognitionRef.current) {
        setIsListening(false);
      }
    }
  };

  const handleError = (event: SpeechRecognitionErrorEvent) => {
    console.error('Speech recognition error', event.error);
    setIsListening(false);
  };

  const handleEnd = () => {
    // This event fires when recognition stops, either automatically or manually.
    // We only change state if it was an automatic stop (e.g., timeout).
    // If stopListening() was called, isListening would already be false.
    if (isListening) {
      setIsListening(false);
    }
  };
  
  useEffect(() => {
    if (!hasSpeechRecognition()) {
      console.warn('SpeechRecognition API not supported in this browser.');
      return;
    }

    const SpeechRecognition = getSpeechRecognition()!;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognitionRef.current = recognition;

    // Add event listeners
    recognition.addEventListener('result', handleResult);
    recognition.addEventListener('error', handleError);
    recognition.addEventListener('end', handleEnd);

    return () => {
      // Cleanup: remove event listeners and stop recognition
      recognition.removeEventListener('result', handleResult);
      recognition.removeEventListener('error', handleError);
      recognition.removeEventListener('end', handleEnd);
      recognition.abort();
    };
  }, [onCommand]); // Re-create if onCommand changes

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch(e) {
        console.error("Could not start recognition", e);
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, [isListening]);

  return { isListening, startListening, stopListening, isSupported: hasSpeechRecognition() };
};
