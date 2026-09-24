import { Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GameIcon } from './GameIcon';

type PauseMenuProps = {
  visible: boolean;
  audioEnabled: boolean;
  lastWord: string;
  audioError: string;
  onResume: () => void;
  onToggleAudio: () => void;
  onReplay: () => void;
  onExit: () => void;
};

const colors = {
  ink: '#142D49', muted: '#52677A', paper: '#FFFCF4',
  green: '#087D55', greenDark: '#045C42', gold: '#FFCC56',
};

export function PauseMenu({ visible, audioEnabled, lastWord, audioError, onResume, onToggleAudio, onReplay, onExit }: PauseMenuProps) {
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType="none" onRequestClose={onResume}
    statusBarTranslucent navigationBarTranslucent accessibilityLabel="Menú de pausa">
    <View style={styles.backdrop}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, {
        paddingTop: Math.max(24, insets.top + 16),
        paddingBottom: Math.max(24, insets.bottom + 16),
        paddingLeft: Math.max(16, insets.left + 12),
        paddingRight: Math.max(16, insets.right + 12),
      }]} bounces={false}>
        <View style={styles.card} accessibilityViewIsModal>
          <View style={styles.header}>
            <View style={styles.emblem}>
              <View style={styles.pauseBar} /><View style={styles.pauseBar} />
            </View>
            <Text accessibilityRole="header" style={styles.title}>En pausa</Text>
            <Text style={styles.subtitle}>El recorrido está detenido.</Text>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Reanudar partida"
            accessibilityHint="Continúa la carrera desde donde la pausaste."
            onPress={onResume} style={({ pressed }) => [styles.resume, pressed && styles.resumePressed]}>
            <View style={styles.playIcon}><GameIcon name="play" size={25} /></View>
            <Text style={styles.resumeText}>Reanudar partida</Text>
          </Pressable>

          <View style={styles.audioCard}>
            <View style={styles.audioHeading}>
              <GameIcon name="audio" size={24} color={colors.ink} />
              <Text style={styles.settingTitle}>Pronunciación</Text>
            </View>
            <View style={styles.settingRow}>
              <View style={styles.settingCopy}>
                <Text style={[styles.settingState, audioEnabled && styles.settingEnabled]}>{audioEnabled ? 'Activada' : 'Desactivada'}</Text>
                <Text style={styles.settingHelp}>Escuchar al responder</Text>
              </View>
              <View style={styles.switchTarget}>
                <Switch accessibilityLabel="Pronunciación automática" value={audioEnabled}
                  onValueChange={onToggleAudio} trackColor={{ false: '#8293A2', true: colors.green }}
                  thumbColor="#FFFFFF" ios_backgroundColor="#8293A2" hitSlop={8}
                  {...(Platform.OS === 'web' ? { activeThumbColor: '#FFFFFF', style: styles.webSwitch } : {})} />
              </View>
            </View>
            {!!lastWord && <Pressable accessibilityRole="button" accessibilityLabel={`Escuchar de nuevo: ${lastWord}`}
              onPress={onReplay} style={({ pressed }) => [styles.replay, pressed && styles.secondaryPressed]}>
              <GameIcon name="audio" size={22} color={colors.greenDark} />
              <View style={styles.replayCopy}>
                <Text style={styles.replayLabel}>Escuchar de nuevo</Text>
                <Text style={styles.replayWord}>{lastWord}</Text>
              </View>
            </Pressable>}
            {!!audioError && <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.error}>{audioError}</Text>}
          </View>

          <View style={styles.exitArea}>
            <Pressable accessibilityRole="button" accessibilityLabel="Salir al inicio"
              accessibilityHint="Descarta esta partida y vuelve a los niveles."
              onPress={onExit} style={({ pressed }) => [styles.exit, pressed && styles.secondaryPressed]}>
              <Text style={styles.exitText}>Salir al inicio</Text>
            </Pressable>
            <Text style={styles.exitHelp}>Se descartará esta partida</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(8, 24, 42, 0.76)' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center' },
  card: { width: '100%', maxWidth: 400, padding: 20, borderRadius: 30, backgroundColor: colors.paper,
    borderWidth: 1, borderColor: '#FFFFFF', boxShadow: '0 18px 50px rgba(0, 9, 24, 0.35)' },
  header: { alignItems: 'center', paddingTop: 5, paddingBottom: 24 },
  emblem: { width: 64, height: 64, borderRadius: 22, backgroundColor: colors.gold,
    borderWidth: 4, borderColor: '#FFE6A4', flexDirection: 'row', gap: 5, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  pauseBar: { width: 6, height: 23, borderRadius: 2, backgroundColor: colors.ink },
  title: { fontSize: 34, fontWeight: '900', color: colors.ink, textAlign: 'center', letterSpacing: -0.8 },
  subtitle: { fontSize: 16, lineHeight: 23, color: colors.muted, textAlign: 'center', marginTop: 6 },
  resume: { minHeight: 68, borderRadius: 20, backgroundColor: colors.green, borderBottomWidth: 5,
    borderBottomColor: colors.greenDark, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, paddingHorizontal: 12, gap: 10 },
  resumePressed: { backgroundColor: colors.greenDark, transform: [{ translateY: 2 }] },
  playIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.14)' },
  resumeText: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', flexShrink: 1, textAlign: 'center' },
  audioCard: { backgroundColor: '#EDF2F3', borderColor: '#DCE4E8', borderWidth: 1, borderRadius: 20, padding: 16, marginTop: 22, gap: 14 },
  audioHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  settingTitle: { fontSize: 18, fontWeight: '800', color: colors.ink, flexShrink: 1 },
  settingRow: { minHeight: 52, flexDirection: 'row', gap: 12, alignItems: 'center', justifyContent: 'space-between', borderRadius: 8 },
  settingCopy: { flex: 1, gap: 3 },
  settingState: { fontSize: 16, fontWeight: '700', color: colors.muted },
  settingEnabled: { color: colors.greenDark },
  settingHelp: { fontSize: 14, lineHeight: 20, color: colors.muted },
  switchTarget: { minHeight: 44, justifyContent: 'center', flexShrink: 0 },
  webSwitch: { height: 28, width: 56 },
  replay: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#CCD9DF', paddingTop: 13 },
  replayCopy: { flex: 1, gap: 2 },
  replayLabel: { fontSize: 14, color: colors.muted },
  replayWord: { fontSize: 18, fontWeight: '800', color: colors.greenDark },
  error: { fontSize: 14, lineHeight: 20, color: '#9B3445' },
  exitArea: { marginTop: 16, alignItems: 'center', gap: 3 },
  exit: { alignSelf: 'stretch', minHeight: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 10 },
  exitText: { fontSize: 17, fontWeight: '700', color: colors.ink, textAlign: 'center' },
  exitHelp: { fontSize: 14, color: colors.muted, textAlign: 'center', paddingBottom: 2 },
  secondaryPressed: { opacity: 0.65 },
});
