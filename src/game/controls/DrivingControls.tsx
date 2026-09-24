import { useEffect, useMemo, useRef } from 'react';
import { PanResponder, Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import type { SceneLayout } from '../geometry/perspective';
import { swipeDirection } from '../motion/simulation';
import type { DrivingSimulation } from '../motion/useDrivingSimulation';

export function DrivingControls({ layout, simulation }: { layout: SceneLayout; simulation: DrivingSimulation }) {
  const consumed = useRef(false);
  const pendingDirection = useRef<-1 | 0 | 1>(0);
  const { steer, targetLane, setHolding } = simulation;
  const paused = simulation.paused || simulation.view.phase === 'gameOver';
  useEffect(() => () => setHolding(false), [setHolding]);
  // PanResponder registers these callbacks; ref reads happen only during gestures.
  // eslint-disable-next-line react-hooks/refs
  const responder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: (_, gesture) => !paused && gesture.numberActiveTouches === 1,
    onMoveShouldSetPanResponder: (_, gesture) => {
      if (paused || gesture.numberActiveTouches !== 1) return false;
      pendingDirection.current = swipeDirection(gesture.dx, gesture.dy);
      return pendingDirection.current !== 0;
    },
    onPanResponderGrant: () => {
      // PanResponder resets dx/dy on grant, so retain the recognized intent.
      consumed.current = false;
      setHolding(true);
      const direction = pendingDirection.current;
      if (direction) { steer(direction); consumed.current = true; }
    },
    onPanResponderMove: (_, gesture) => {
      if (gesture.numberActiveTouches !== 1 || Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8) setHolding(false);
      if (consumed.current) return;
      const direction = swipeDirection(gesture.dx, gesture.dy);
      if (direction) { steer(direction); consumed.current = true; }
    },
    onPanResponderRelease: () => { setHolding(false); consumed.current = false; pendingDirection.current = 0; },
    onPanResponderTerminate: () => { setHolding(false); consumed.current = false; pendingDirection.current = 0; },
    onPanResponderStart: (_, gesture) => { if (gesture.numberActiveTouches !== 1) setHolding(false); },
    onPanResponderTerminationRequest: () => true,
  }), [paused, steer, setHolding]);

  return <View
    testID="driving-controls"
    accessible
    accessibilityRole="adjustable"
    accessibilityLabel="Cambiar de carril"
    accessibilityHint="Desliza para cambiar de carril. Mantén pulsada la carretera para acelerar la pregunta"
    accessibilityValue={{ min: 1, max: 3, now: targetLane + 2, text: `Carril ${targetLane + 2} de 3` }}
    aria-valuemin={1}
    aria-valuemax={3}
    aria-valuenow={targetLane + 2}
    aria-valuetext={`Carril ${targetLane + 2} de 3`}
    accessibilityState={{ disabled: paused }}
    accessibilityActions={[{ name: 'decrement', label: 'Carril izquierdo' }, { name: 'increment', label: 'Carril derecho' }]}
    onAccessibilityAction={({ nativeEvent }) => {
      if (nativeEvent.actionName === 'decrement') steer(-1);
      if (nativeEvent.actionName === 'increment') steer(1);
    }}
    style={[styles.surface, Platform.OS === 'web' && webInteractionStyle, { top: layout.prompt.y + layout.prompt.height + 8 }]}
    {...responder.panHandlers}
  />;
}

const styles = StyleSheet.create({
  surface: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});
const webInteractionStyle: ViewStyle & { touchAction: 'none' } = { touchAction: 'none' };
