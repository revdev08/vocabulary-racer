import { useCallback, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Speech from 'expo-speech';
const KEY = 'vocab-racer:pronunciation:v1';
export function usePronunciation() {
  const [enabled, setEnabled] = useState(true);
  const [error, setError] = useState('');
  const [lastWord, setLastWord] = useState('');
  const enabledRef = useRef(true);
  const changed = useRef(false);
  const generation = useRef(0);
  const mounted = useRef(true);
  const settingQueue = useRef<Promise<unknown>>(Promise.resolve());
  const stop = useCallback(() => { generation.current++; void Speech.stop().catch(() => {}); }, []);
  useEffect(() => {
    mounted.current = true;
    void AsyncStorage.getItem(KEY).then(value => {
      if (mounted.current && !changed.current) { enabledRef.current = value !== 'off'; setEnabled(value !== 'off'); }
    }).catch(() => {});
    return () => { mounted.current = false; stop(); };
  }, [stop]);
  const speak = useCallback((word: string, manual = false) => {
    setLastWord(word);
    if (!enabledRef.current && !manual) return;
    const token = ++generation.current;
    setError('');
    const failed = () => { if (mounted.current && token === generation.current) setError('Audio no disponible. Puedes intentar escuchar de nuevo desde la pausa.'); };
    void Speech.stop().then(() => {
      if (!mounted.current || token !== generation.current) return;
      Speech.speak(word, { language: 'en-US', rate: .85, pitch: 1, onError: failed });
    }).catch(failed);
  }, []);
  const toggle = useCallback(() => {
    changed.current = true;
    enabledRef.current = !enabledRef.current;
    setEnabled(enabledRef.current);
    if (!enabledRef.current) stop();
    const value = enabledRef.current ? 'on' : 'off';
    settingQueue.current = settingQueue.current.catch(() => {}).then(() => AsyncStorage.setItem(KEY, value));
    void settingQueue.current.catch(() => { if (mounted.current) setError('No se pudo guardar la preferencia de audio.'); });
  }, [stop]);
  // A restarted run must not offer the previous run's word.
  const forget = useCallback(() => { setLastWord(''); setError(''); }, []);
  return { enabled, error, lastWord, speak, stop, toggle, forget };
}
