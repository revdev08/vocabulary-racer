import { StyleSheet, Text, View } from 'react-native';
import type { GameView } from '../gameplay/types';
import type { SceneLayout } from '../geometry/perspective';
import { GameIcon } from './GameIcon';

export function RunFeedback({ layout, game, paused }: { layout: SceneLayout; game: GameView; paused: boolean }) {
  if (paused || game.phase === 'gameOver' || !game.feedback) return null;
  if (game.phase === 'feedback') return null;
  const good = game.feedback?.kind === 'correct';
  const message = game.feedback?.kind === 'wrong'
    ? `Incorrecto · ${game.feedback.message}` : game.feedback?.message;
  return <View accessible accessibilityRole="alert" accessibilityLiveRegion="polite"
    accessibilityLabel={message} style={[styles.banner, { top: layout.prompt.y + (game.phase === 'traffic' ? 44
      : layout.prompt.height + 10),
      left: layout.hudLeft, right: layout.hudRight, backgroundColor: good ? '#DDFBEF' : '#FFE6EA' }]}>
    <GameIcon name={good ? 'check' : 'cross'} size={20} color={good ? '#167552' : '#AB3045'} />
    <Text maxFontSizeMultiplier={1.1} style={[styles.text, { color: good ? '#167552' : '#AB3045' }]}>{message}</Text>
  </View>;
}
const styles = StyleSheet.create({
  banner: { pointerEvents: 'none', position: 'absolute', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  text: { fontSize: 14, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
});
