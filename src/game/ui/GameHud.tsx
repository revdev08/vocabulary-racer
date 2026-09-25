import { useEffect, useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { palette } from '../config/visual';
import { gameplay, rewardVisuals } from '../config/gameplay';
import { clamp, type SceneLayout } from '../geometry/perspective';
import type { DrivingSimulation } from '../motion/useDrivingSimulation';
import { GameIcon } from './GameIcon';
import { HudCoin, HudFlame, HudHeart, HudPlate } from './HudArtwork';

/** A lost heart jumps and tilts once so the penalty reads at a glance. */
function HeartSlot({ size, filled }: { size: number; filled: boolean }) {
  const reduced = useReducedMotion();
  const hit = useSharedValue(0);
  const wasFilled = useRef(filled);
  useEffect(() => {
    if (wasFilled.current && !filled && !reduced) hit.set(withSequence(withTiming(1, { duration: 110 }), withTiming(0, { duration: 420 })));
    wasFilled.current = filled;
  }, [filled, hit, reduced]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -6 * hit.value }, { scale: 1 + hit.value * .5 }, { rotate: `${-16 * hit.value}deg` }] }));
  return <Animated.View style={style}><HudHeart size={size} filled={filled} /></Animated.View>;
}

export function GameHud({ layout, simulation }: { layout: SceneLayout; simulation: DrivingSimulation }) {
  const { paused, togglePause, view, game, reducedMotion } = simulation;
  const width = layout.width - layout.hudLeft - layout.hudRight;
  const heartSize = clamp(width * .086, 27, 36);
  const heartsWidth = heartSize * gameplay.initialLives + 4;
  const counterWidth = Math.min(148, (width - heartsWidth - 16) / 2);
  const iconSize = width < 310 ? 46 : 50;
  const captionSize = { fontSize: counterWidth < 104 ? 8 : 9.5, lineHeight: counterWidth < 104 ? 10 : 11.5 };
  const progress = useAnimatedStyle(() => ({ transform: [{ scaleX: Math.max(0, 1 - game.value.phaseTime / gameplay.decisionSeconds) }] }));
  const streakPulse = useAnimatedStyle(() => {
    const state = game.value;
    const pulse = !reducedMotion.value && state.phase === 'feedback' && state.feedback?.kind === 'correct'
      ? Math.sin(Math.min(1, state.phaseTime / rewardVisuals.streakPulseSeconds) * Math.PI) * rewardVisuals.streakPulseScale : 0;
    return { transform: [{ scale: 1 + pulse }] };
  });
  const nitroStyle = useAnimatedStyle(() => ({ opacity: game.value.elapsed < game.value.nitroUntil ? 1 : 0 }));

  return <View testID="game-hud"
    style={[styles.hud, { top: layout.hudTop, left: layout.hudLeft, right: layout.hudRight }]}>
    <View style={styles.topRow}>
      <View accessible accessibilityLabel={`${view.coinsCollected} monedas`} style={[styles.counterPlate, { width: counterWidth }]}>
        <View style={styles.plateArtwork}><HudPlate width={counterWidth - 12} warm /></View>
        <View style={styles.coinArtwork}><HudCoin size={iconSize} /></View>
        <View style={[styles.counterCopy, { paddingLeft: iconSize - 3 }]}>
          <Text numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.1} style={[styles.caption, captionSize]}>MONEDAS</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.1} style={styles.counter}>{view.coinsCollected}</Text>
        </View>
      </View>
      <Animated.View accessible accessibilityLabel={`Racha de ${view.streak}`} style={[styles.counterPlate, { width: counterWidth }, streakPulse]}>
        <View style={styles.plateArtwork}><HudPlate width={counterWidth - 12} warm /></View>
        <View style={styles.flameArtwork}><HudFlame size={iconSize} /></View>
        <View style={[styles.counterCopy, { paddingLeft: iconSize - 5 }]}>
          <Text numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.1} style={[styles.caption, captionSize, styles.streakCaption]}>RACHA</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.1} style={[styles.counter, styles.streakCount]}>{view.streak}</Text>
        </View>
        {view.nitroUntil > 0 && <Animated.View accessible accessibilityLabel="Recompensa de racha: nitro visual" style={[styles.nitro, nitroStyle]}>
          <Text maxFontSizeMultiplier={1.1} style={styles.nitroText}>NITRO</Text>
        </Animated.View>}
      </Animated.View>
      <View accessible accessibilityLabel={`${view.lives} vidas`} style={[styles.hearts, { width: heartsWidth }]}>
        {Array.from({ length: gameplay.initialLives }, (_, i) => <HeartSlot key={i} size={heartSize} filled={i < view.lives} />)}
      </View>
    </View>
    <View style={styles.subRow}>
      <View accessible accessibilityLabel={`${view.score} puntos`} style={styles.score}>
        <View style={styles.scoreAccent} />
        <Text maxFontSizeMultiplier={1.1} style={styles.scoreCaption}>PUNTOS</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit maxFontSizeMultiplier={1.1} style={styles.scoreValue}>{view.score}</Text>
      </View>
      {view.phase === 'question' && <View style={styles.progressRow}>
        <Text maxFontSizeMultiplier={1.1} numberOfLines={1} adjustsFontSizeToFit style={styles.timerLabel}>{view.currentIsReview ? 'Repaso' : `${view.vocabularyCursor}/${view.wordTarget}`} · Elige tu carril</Text>
        <View accessibilityRole="progressbar" accessibilityLabel="Tiempo para responder"
          accessibilityValue={{ text: `${gameplay.decisionSeconds} segundos para elegir` }} style={styles.track}>
          <Animated.View style={[styles.progress, progress]}><View style={styles.progressGlint} /></Animated.View>
        </View>
      </View>}
    </View>
    <Pressable onPress={togglePause} disabled={view.phase === 'gameOver'} accessibilityRole="button"
      accessibilityLabel={paused ? 'Reanudar conducción' : 'Pausar conducción'}
      accessibilityState={{ checked: paused, disabled: view.phase === 'gameOver' }}
      style={({ pressed }) => [styles.pauseTarget, pressed && styles.pausePressed, view.phase === 'gameOver' && styles.pauseDisabled]}>
      <View style={styles.pauseFace}>
        <View style={styles.pauseGlint} /><GameIcon name={paused ? 'play' : 'pause'} size={21} />
      </View>
    </Pressable>
  </View>;
}

const counterShadow = Platform.OS === 'web'
  ? { textShadow: '0px 2px 1px #051A2D' }
  : { textShadowColor: '#051A2D', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 1 };

const styles = StyleSheet.create({
  hud: { pointerEvents: 'box-none', position: 'absolute', height: 84 },
  topRow: { pointerEvents: 'none', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, height: 48 },
  counterPlate: { height: 46, justifyContent: 'center' },
  plateArtwork: { position: 'absolute', left: 12, top: 3 },
  coinArtwork: { position: 'absolute', left: -4, top: 0 },
  flameArtwork: { position: 'absolute', left: -4, top: -3 },
  counterCopy: { paddingRight: 10, paddingTop: 1 },
  caption: { fontSize: 9.5, lineHeight: 11.5, fontWeight: '800', color: '#D4E5F2', letterSpacing: .35, textAlign: 'center' },
  counter: { color: '#FFFDF0', fontSize: 27, lineHeight: 29, fontWeight: '900', textAlign: 'center', fontVariant: ['tabular-nums'], ...counterShadow },
  streakCaption: { color: '#FFE6A4' },
  streakCount: { color: '#FFCF48', fontStyle: 'italic' },
  hearts: { flexDirection: 'row', gap: 2, alignItems: 'center', justifyContent: 'center' },
  nitro: { position: 'absolute', right: 9, bottom: -4, backgroundColor: '#144F71', borderColor: '#83E3FF', borderWidth: 1, borderRadius: 4, paddingHorizontal: 5 },
  nitroText: { color: '#D9F8FF', fontWeight: '900', fontSize: 9, lineHeight: 12, letterSpacing: .8 },
  subRow: { pointerEvents: 'none', height: 32, marginTop: 4, paddingRight: 52, flexDirection: 'row', alignItems: 'center', gap: 10 },
  score: { maxWidth: '46%', minWidth: 88, flexDirection: 'row', alignItems: 'center', gap: 6, height: 30, paddingHorizontal: 9, borderRadius: 7, borderBottomWidth: 2, borderBottomColor: '#0B223B', backgroundColor: '#153957' },
  scoreAccent: { width: 3, height: 14, borderRadius: 1, backgroundColor: '#90DDEF', transform: [{ skewX: '-13deg' }] },
  scoreCaption: { fontSize: 9.5, color: '#C9DDEB', fontWeight: '800', letterSpacing: .5 },
  scoreValue: { flexShrink: 1, color: palette.white, fontWeight: '900', fontSize: 18, lineHeight: 22, fontVariant: ['tabular-nums'] },
  pauseTarget: { position: 'absolute', right: 0, top: 40, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pauseFace: { width: 38, height: 34, borderRadius: 10, backgroundColor: '#204664', borderWidth: 1.5, borderColor: '#6E93AD', borderBottomWidth: 3, borderBottomColor: '#0C2943', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  pauseGlint: { position: 'absolute', top: 1, left: 4, right: 4, height: 12, borderTopWidth: 1, borderTopColor: '#A4BED1', backgroundColor: '#345B77', borderRadius: 6 },
  pausePressed: { transform: [{ translateY: 2 }, { scale: .95 }] },
  pauseDisabled: { opacity: .5 },
  progressRow: { flex: 1, minWidth: 0, height: 32, paddingHorizontal: 8, justifyContent: 'center', gap: 3, borderRadius: 7, backgroundColor: '#153957ED' },
  timerLabel: { color: '#E3F0FC', fontSize: 11, lineHeight: 13, fontWeight: '800' },
  track: { height: 8, padding: 1, backgroundColor: '#16334E', borderRadius: 5, borderBottomWidth: 1, borderBottomColor: '#B5D5E8', overflow: 'hidden' },
  progress: { width: '100%', height: '100%', transformOrigin: 'left center', borderRadius: 4, backgroundColor: '#8DF1C6', overflow: 'hidden' },
  progressGlint: { height: 2, backgroundColor: '#DDFFE4', opacity: .8 },
});
