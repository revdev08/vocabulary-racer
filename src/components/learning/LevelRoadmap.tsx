import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { levels } from '../../game/data/vocabulary';
import type { LevelRecords } from '../../game/gameplay/curriculum';
import { GameIcon } from '../../game/ui/GameIcon';
import { decorativeSvgProps } from '../../game/ui/decorativeSvgProps';

export const routeColors = { paper: '#F2F6F7', ink: '#173B50', muted: '#667F8E', teal: '#197F7D', amber: '#F3AF53', white: '#FFFFFF' };
export const routeType = { utility: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) };
export const learningStages = [
  { title: 'Primeros kilómetros', short: 'Arranque', description: 'Las palabras que abren el camino.', difficulty: 'Inicial', ids: ['essentials', 'greetings', 'family', 'home'] },
  { title: 'Vida cotidiana', short: 'Día a día', description: 'Muévete con soltura en lo cotidiano.', difficulty: 'Cotidiano', ids: ['meals', 'city', 'time', 'actions'] },
  { title: 'Nuevos horizontes', short: 'Explora', description: 'Expresa lo que piensas y sientes.', difficulty: 'En expansión', ids: ['descriptions', 'travel', 'feelings', 'ideas'] },
] as const;

export function LevelRoadmap({ stage, selected, unlocked, records, onSelect }: {
  stage: number; selected: string; unlocked: number; records: LevelRecords; onSelect: (id: string) => void;
}) {
  const [width, setWidth] = useState(350);
  const entries = learningStages[stage].ids.map(id => ({ level: levels.find(level => level.id === id)!, index: levels.findIndex(level => level.id === id) }));
  const nodes = entries.map((_, i) => ({ x: width * (i % 2 === 0 ? .23 : .77), y: 60 + i * 120 }));
  const segments = nodes.slice(1).map((node, i) => `M ${nodes[i].x} ${nodes[i].y} C ${nodes[i].x} ${nodes[i].y + 66}, ${node.x} ${node.y - 66}, ${node.x} ${node.y}`);
  const road = `M ${nodes[0].x} 4 L ${nodes[0].x} 60 ${segments.map(segment => segment.slice(segment.indexOf('C'))).join(' ')} L ${nodes[3].x} 480`;
  return <View style={s.map} onLayout={event => setWidth(event.nativeEvent.layout.width)}>
    <Svg width={width} height={490} style={StyleSheet.absoluteFill} {...decorativeSvgProps}>
      {/* Quiet blocks suggest a street atlas; the learning route remains the focal point. */}
      <Rect x={width * .56} y={5} width={width * .32} height={15} rx={5} fill="#E5ECEF" />
      <Rect x={22} y={119} width={width * .22} height={27} rx={7} fill="#E1EBE8" />
      <Rect x={width * .68} y={243} width={width * .25} height={26} rx={7} fill="#E1EBE8" />
      <Rect x={23} y={365} width={width * .2} height={25} rx={7} fill="#E5ECEF" />
      <Path d={road} stroke="#D3DFE4" strokeWidth={49} fill="none" strokeLinecap="round" />
      <Path d={road} stroke="#E5EDF0" strokeWidth={43} fill="none" strokeLinecap="round" />
      {segments.map((segment, i) => records[entries[i].level.id]?.completed && <Path key={i} d={segment} stroke="#BCDCD6" strokeWidth={43} fill="none" />)}
      <Path d={road} stroke="#FFFFFF" strokeWidth={2} strokeDasharray="9 10" fill="none" />
      <Circle cx={nodes[0].x} cy={5} r={3} fill="#8CA3AE" />
    </Svg>
    {entries.map(({ level, index }, i) => {
      const done = !!records[level.id]?.completed;
      const locked = index > unlocked;
      const active = selected === level.id;
      const current = index === unlocked && !done;
      const node = nodes[i];
      const right = i % 2 === 0;
      const labelWidth = width * .77 - 76;
      const status = done ? 'Completado' : locked ? 'Bloqueado' : 'Siguiente parada';
      return <Pressable key={level.id} accessibilityRole="button"
        accessibilityLabel={`Nivel ${index + 1}: ${level.title}. ${status}. Ver detalles`}
        accessibilityState={{ selected: active }} onPress={() => onSelect(level.id)}
        style={({ pressed }) => [{ position: 'absolute', left: 0, right: 0, top: node.y - 34, height: 100, opacity: pressed ? .75 : 1 }]}>
        <View style={[s.node, { left: node.x - 34, top: 0,
          borderColor: active ? routeColors.amber : current ? '#AACBD3' : 'transparent' }]}>
          <View style={[s.nodeFace, { backgroundColor: done ? routeColors.teal : locked ? '#D7E2E7' : routeColors.ink }]}>
            <Text maxFontSizeMultiplier={1.2} style={[s.number, { color: locked ? '#6B8491' : '#FFF' }]}>{String(index + 1).padStart(2, '0')}</Text>
          </View>
          {done && <View style={s.check}><GameIcon name="check" size={12} color={routeColors.teal} /></View>}
          {locked && <View style={s.check}><Svg width={13} height={13} viewBox="0 0 16 16" fill="none" {...decorativeSvgProps}>
            <Rect x={3} y={7} width={10} height={7} rx={2} stroke={routeColors.muted} strokeWidth={1.5} />
            <Path d="M5 7V5a3 3 0 0 1 6 0v2" stroke={routeColors.muted} strokeWidth={1.5} />
          </Svg></View>}
        </View>
        <View style={[s.label, { top: 2, left: right ? node.x + 48 : 24, width: labelWidth }]}>
          <Text style={[s.status, { color: current ? routeColors.teal : routeColors.muted }]}>{current ? 'SIGUIENTE PARADA' : done ? 'COMPLETADO' : `NIVEL ${String(index + 1).padStart(2, '0')}`}</Text>
          <Text style={[s.title, locked && { color: '#5C7583' }]}>{level.title}</Text>
          <Text style={s.meta}>{done ? `${records[level.id].bestFirstCorrect}/10 · mejor intento` : locked ? `Después del nivel ${index}` : '10 palabras · 3 vidas'}</Text>
        </View>
      </Pressable>;
    })}
  </View>;
}
const s = StyleSheet.create({
  map: { height: 490, marginTop: 5 },
  node: { position: 'absolute', width: 68, height: 68, borderRadius: 34, borderWidth: 3, alignItems: 'center', justifyContent: 'center', backgroundColor: routeColors.paper },
  nodeFace: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#FFFFFF80' },
  number: { fontFamily: routeType.utility, fontSize: 21, fontWeight: '700', letterSpacing: -1 },
  check: { position: 'absolute', right: -1, bottom: -1, width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: routeColors.white, borderWidth: 2, borderColor: routeColors.paper },
  label: { position: 'absolute', paddingVertical: 2, gap: 4, minHeight: 64 },
  status: { fontFamily: routeType.utility, fontSize: 9, letterSpacing: .7, fontWeight: '600' },
  title: { fontSize: 18, fontWeight: '800', color: routeColors.ink, letterSpacing: -.5 },
  meta: { fontSize: 11, color: routeColors.muted, lineHeight: 16 },
});
