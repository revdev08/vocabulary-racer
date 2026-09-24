import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { JourneyLevel } from '../../game/data/journey';
import { ButtonSurface, PaperSurface, TravelStamp } from './LevelTicket';
import { journeyPalette as c, type TicketState } from './theme';
import { GameIcon } from '../../game/ui/GameIcon';

export function SelectedLevelPanel({ level, state, target, requirement, disabled, bottom, onPlay, onWords }: {
  level: JourneyLevel; state: TicketState; target: number; requirement: string; disabled: boolean; bottom: number; onPlay: () => void; onWords: () => void;
}) {
  const { height, fontScale } = useWindowDimensions();
  const compact = height < 730 || fontScale > 1.3;
  const blocked = disabled || state === 'locked';
  const buttonTitle = level.development ? 'Vista de prueba' : state === 'locked' ? 'Nivel bloqueado' : state === 'completed' ? `Repetir nivel ${level.number}` : `Jugar nivel ${level.number}`;
  return <View style={[s.root, { paddingBottom: Math.max(bottom, 7) }]}>
    <View style={[s.ticket, compact && s.compact]}>
      <PaperSurface active perforation={false}/>
      {!compact && <View style={s.stamp}><TravelStamp/></View>}
      <View style={s.heading}>
        <Text style={s.eyebrow}>NIVEL {String(level.number).padStart(2, '0')}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Ver vocabulario del nivel ${level.number}`} onPress={onWords} style={s.words}>
          <Text style={s.wordsText}>Palabras ↗</Text>
        </Pressable>
      </View>
      <Text style={[s.title, compact && { fontSize: 22 }]}>{level.title}</Text>
      <Text style={s.detail}>{state === 'locked' ? requirement : `${target} palabras · 3 vidas · Meta: ${Math.ceil(target * .8)} aciertos`}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={buttonTitle} accessibilityState={{ disabled: blocked }} disabled={blocked} onPress={onPlay}
        style={({ pressed }) => [s.button, compact && { minHeight: 48 }, blocked && s.blocked, pressed && { transform: [{ translateY: 2 }], borderBottomWidth: 2 }]}>
        {!blocked && <ButtonSurface/>}
        <Text style={[s.buttonText, blocked && { color: '#5F6D6D' }]}>{buttonTitle}</Text>
        {!blocked && <View style={s.play}><GameIcon name="play" size={24} color="#FFFDF2"/></View>}
      </Pressable>
    </View>
  </View>;
}
const s = StyleSheet.create({
  root: { paddingHorizontal: 8, paddingTop: 4 },
  ticket: { paddingTop: 10, paddingHorizontal: 20, paddingBottom: 17, boxShadow: '0 -4px 18px -10px #62513755' },
  compact: { paddingTop: 8, paddingHorizontal: 17, paddingBottom: 15 },
  stamp: { position: 'absolute', top: 13, right: 16, pointerEvents: 'none' },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: c.green, fontSize: 13, letterSpacing: 1, fontWeight: '800' },
  title: { color: c.ink, fontSize: 24, fontWeight: '900', letterSpacing: -0.7 },
  detail: { color: '#435B4D', fontSize: 14, lineHeight: 20, marginTop: 7 },
  button: { marginTop: 14, minHeight: 58, paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'center', borderRadius: 31, backgroundColor: c.greenDark, borderBottomWidth: 5, borderBottomColor: '#035C42', boxShadow: '0 4px 6px #3D483020' },
  blocked: { backgroundColor: '#D9DECE', borderBottomColor: '#C1C9B8' },
  buttonText: { color: '#FFFDF2', fontSize: 22, letterSpacing: -0.6, fontWeight: '900', textAlign: 'center', flexShrink: 1, zIndex: 1 },
  play: { width: 24, height: 24, flexShrink: 0, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  words: { minHeight: 40, paddingVertical: 8, paddingHorizontal: 6, justifyContent: 'center' },
  wordsText: { color: '#296F51', fontSize: 14, fontWeight: '700' },
});
