import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import type { SceneLayout } from '../geometry/perspective';

const SIZE = 132;

function CountdownLabel({ value }: { value: number }) {
  const reduced = useReducedMotion();
  const enter = useSharedValue(reduced ? 1 : 0);
  const fade = useSharedValue(1);
  useEffect(() => {
    if (!reduced) enter.set(withTiming(1, { duration: 420, easing: Easing.out(Easing.back(2.2)) }));
    if (value === 0) fade.set(withDelay(260, withTiming(0, { duration: 300 })));
  }, [enter, fade, reduced, value]);
  const style = useAnimatedStyle(() => ({ opacity: Math.min(1, enter.value * 2) * fade.value,
    transform: [{ scale: 1.7 - .7 * enter.value }] }));
  const go = value === 0;
  return <Animated.View style={[styles.badge, go && styles.go, style]}>
    <View style={[styles.ring, go && styles.goRing]} />
    <Text maxFontSizeMultiplier={1} style={[styles.label, go && styles.goLabel]}>{go ? '¡YA!' : value}</Text>
  </Animated.View>;
}

export function Countdown({ layout, value }: { layout: SceneLayout; value: number | null }) {
  if (value === null) return null;
  const center = (layout.camera.horizonY + layout.player.y) / 2;
  return <View accessible accessibilityLiveRegion="assertive" accessibilityLabel={value === 0 ? '¡Ya!' : String(value)}
    style={[styles.root, { top: center - SIZE / 2 }]}>
    <CountdownLabel key={value} value={value} />
  </View>;
}

const styles = StyleSheet.create({
  root: { pointerEvents: 'none', position: 'absolute', left: 0, right: 0, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  badge: { width: SIZE, height: SIZE, borderRadius: SIZE / 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(16, 42, 68, 0.9)', borderWidth: 4, borderColor: '#FFD470', boxShadow: '0px 10px 30px rgba(5, 20, 36, 0.45)' },
  ring: { position: 'absolute', top: 7, left: 7, right: 7, bottom: 7, borderRadius: SIZE / 2, borderWidth: 1.5, borderColor: '#FFFFFF33' },
  label: { color: '#FFFFFF', fontSize: 72, lineHeight: 82, fontWeight: '900', fontStyle: 'italic', letterSpacing: -2, fontVariant: ['tabular-nums'] },
  go: { width: SIZE * 1.45, borderRadius: SIZE / 2, backgroundColor: '#087D55', borderColor: '#A8F3D5' },
  goRing: { borderColor: '#FFFFFF44' },
  goLabel: { fontSize: 54, lineHeight: 64, letterSpacing: -1 },
});
