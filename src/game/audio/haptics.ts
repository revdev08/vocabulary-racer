import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import type { GameView } from '../gameplay/types';

// Browsers expose only a coarse vibration motor; web keeps silent instead of buzzing per coin.
const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

/** Tactile counterpart of the visual cues, derived from consecutive React snapshots. */
export function playRunHaptics(previous: GameView, next: GameView) {
  if (!enabled || previous.runId !== next.runId) return;
  let pending: Promise<void> | null = null;
  if (next.crashes > previous.crashes) pending = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  else if (next.errors > previous.errors) pending = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  else if (next.correct > previous.correct) pending = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  else if (next.coinsCollected > previous.coinsCollected) pending = Haptics.selectionAsync();
  pending?.catch(() => {});
}
