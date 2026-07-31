'use client';

import { useState, useEffect, useRef } from 'react';
import PHRASES from '@/app/phrases.json';

export function Typewriter() {
  const [text, setText] = useState('Kulesika');
  const [targetWord, setTargetWord] = useState('Kulesika');
  const [phase, setPhase] = useState<'paused' | 'deleting' | 'preparing' | 'typing'>('paused');
  const [validPhrases, setValidPhrases] = useState<string[]>(['Kulesika', ...PHRASES]);

  const containerRef = useRef<HTMLSpanElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const phraseQueueRef = useRef<string[]>([]);

  const shuffleArray = (array: string[]) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  useEffect(() => {
    const updateValidPhrases = () => {
      if (!containerRef.current || !measureRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const bodyPadding = parseInt(window.getComputedStyle(document.body).paddingRight || '0');
      const availableWidth = window.innerWidth - rect.left - bodyPadding - 32;

      const valid: string[] = ['Kulesika'];
      for (const phrase of PHRASES) {
        measureRef.current.textContent = phrase;
        if (measureRef.current.offsetWidth <= availableWidth) {
          valid.push(phrase);
        }
      }
      const finalValid = valid.length > 1 ? valid : ['Kulesika', 'coder', 'writer'];
      setValidPhrases(prev => {
        if (prev.length === finalValid.length && prev.every((v, i) => v === finalValid[i])) {
          return prev;
        }
        return finalValid;
      });
      if (phraseQueueRef.current.length === 0) {
        phraseQueueRef.current = shuffleArray(finalValid);
      }
    };

    const timer = setTimeout(updateValidPhrases, 100);
    window.addEventListener('resize', updateValidPhrases);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateValidPhrases);
    };
  }, []);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (phase === 'paused') {
      timeout = setTimeout(() => {
        setPhase('deleting');
      }, 4000);
    } else if (phase === 'deleting') {
      if (text.length > 0) {
        timeout = setTimeout(() => {
          setText(prev => prev.slice(0, -1));
        }, Math.random() * 15 + 25);
      } else {
        if (phraseQueueRef.current.length === 0) {
          phraseQueueRef.current = shuffleArray(validPhrases);
        }
        const nextWord = phraseQueueRef.current.pop() || 'Kulesika';
        setTargetWord(nextWord);
        setPhase('preparing');
      }
    } else if (phase === 'preparing') {
      timeout = setTimeout(() => {
        setPhase('typing');
      }, 600 + Math.random() * 300);
    } else if (phase === 'typing') {
      const targetChars = Array.from(targetWord);
      const currentChars = Array.from(text);
      if (currentChars.length < targetChars.length) {
        timeout = setTimeout(() => {
          setText(targetChars.slice(0, currentChars.length + 1).join(''));
        }, Math.random() * 40 + 60);
      } else {
        timeout = setTimeout(() => {
          setPhase('paused');
        }, 10);
      }
    }

    return () => clearTimeout(timeout);
  }, [text, phase, targetWord, validPhrases]);

  return (
    <span ref={containerRef} className="flex items-center relative h-full">
      <span ref={measureRef} className="invisible absolute top-0 left-0 pointer-events-none whitespace-nowrap h-0 overflow-hidden" />
      <span className="italic text-amber-600 dark:text-amber-400 whitespace-nowrap">{text}</span>
      <span className="animate-[pulse_1.5s_ease-in-out_infinite] text-amber-600/40 dark:text-amber-400/40 font-light ml-0.5 md:ml-1 -mt-1 font-serif text-[1.1em]">|</span>
    </span>
  );
}
