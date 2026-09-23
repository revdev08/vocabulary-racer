import { StyleSheet, Text, View } from 'react-native';
import type { GameView } from '../gameplay/types';
import type { SceneLayout } from '../geometry/perspective';
import { GameIcon } from './GameIcon';
import { answerCardLayout } from '../gameplay/answerFeedback';

export function RunFeedback({ layout, game, paused }: { layout: SceneLayout; game: GameView; paused: boolean }) {
  if (game.phase === 'gameOver' || (!game.feedback && !paused)) return null;
  if (game.phase === 'feedback' && !paused) return null;
  const good = game.feedback?.kind === 'correct';
  const message = paused ? 'En pausa' : game.feedback?.kind === 'wrong'
    ? `Incorrecto · ${game.feedback.message}` : game.feedback?.message;
  return <View accessible accessibilityRole="alert" accessibilityLiveRegion="polite"
    accessibilityLabel={message} style={[styles.banner, { top: layout.prompt.y + (game.phase === 'traffic' ? 44
      : game.phase === 'feedback' ? answerCardLayout(layout).height + 10 : layout.prompt.height + 10),
      left: layout.hudLeft, right: layout.hudRight, backgroundColor: paused ? '#EDF6FE' : good ? '#DDFBEF' : '#FFE6EA' }]}>
    <GameIcon name={paused ? 'pause' : good ? 'check' : 'cross'} size={20} color={paused ? '#245575' : good ? '#167552' : '#AB3045'} />
    <Text maxFontSizeMultiplier={1.1} style={[styles.text, { color: paused ? '#245575' : good ? '#167552' : '#AB3045' }]}>{message}</Text>
  </View>;
}
const styles = StyleSheet.create({
  banner: { pointerEvents: 'none', position: 'absolute', paddingVertical: 9, paddingHorizontal: 12, borderRadius: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  text: { fontSize: 14, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
});
