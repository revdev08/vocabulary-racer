import { useId, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Pattern, Rect, Stop } from 'react-native-svg';
import { decorativeSvgProps } from '../../game/ui/decorativeSvgProps';
import type { JourneyLevel } from '../../game/data/journey';
export const ink = '#142B40', green = '#14805B', paper = '#EEE7D5';
export type TicketState = 'completed' | 'available' | 'locked';
export const journeyAssets = { redCar: require('../../../assets/journey/red-touring-car.png'), paper: 'PaperSurface vector grain' };

// Both borders and all artwork share the same real cutout: the background remains visible in the notches.
function ticketPath(w: number, h: number, inset: number) {
  const l = inset, r = w - inset, t = inset, b = h - inset, c = 12, n = 7;
  return `M ${l+c} ${t} H ${r-c} Q ${r-c} ${t+c} ${r} ${t+c} V ${h/2-n} C ${r-12} ${h/2-n} ${r-12} ${h/2+n} ${r} ${h/2+n} V ${b-c} Q ${r-c} ${b-c} ${r-c} ${b} H ${l+c} Q ${l+c} ${b-c} ${l} ${b-c} V ${h/2+n} C ${l+12} ${h/2+n} ${l+12} ${h/2-n} ${l} ${h/2-n} V ${t+c} Q ${l+c} ${t+c} ${l+c} ${t} Z`;
}
export function Plane({ size = 27, color = ink }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 32 32" {...decorativeSvgProps}><Path d="m3 16 10-2 5-10c1-2 4-2 3 1l-2 9 8-2 3 2-12 5-3 10-3 1 1-10-7 1-4-5Z" fill={color}/></Svg>;
}
function Landscape({ w, h, theme, active }: { w: number; h: number; theme: JourneyLevel['theme']; active: boolean }) {
  const x = w * .55;
  return <G opacity={active ? 1 : .28}>
    {active ? <><Circle cx={w-53} cy={h*.38} r={18} fill="#EEB642"/><Path d={`M ${x} ${h-8} Q ${w-100} ${h*.3} ${w-65} ${h*.44} Q ${w-29} ${h*.13} ${w-7} ${h*.35} V ${h-8}Z`} fill="#78A489"/><Path d={`M ${x+15} ${h-8} Q ${w-65} ${h*.5} ${w-8} ${h*.43} V ${h-8}Z`} fill="#326C5B"/><Path d={`M ${x+5} ${h-8} Q ${w-93} ${h*.62} ${w-8} ${h*.52} L ${w-8} ${h-8}Z`} fill="#F2CF64"/><Path d={`M ${x+24} ${h-8} Q ${w-82} ${h*.67} ${w-8} ${h*.57} V ${h-8}Z`} fill="#506568"/><Path d={`M ${x+45} ${h-8} Q ${w-60} ${h*.73} ${w-8} ${h*.68}`} stroke="#F8EFCE" strokeWidth="2" fill="none"/></>
    : theme === 'city' ? <><Path d={`M ${w-97} ${h-9}v-29l16-16 16 16v29m4 0v-52l20-20 21 20v52`} fill="#A87370"/><Path d={`M ${w-53} ${h-53}h5v9h-5m14 0h5v-9h-5m-48 13h5v8h-5m35 4h8v20h-8`} fill="#F8EBDF"/></>
    : <><Path d={`M ${x} ${h-9} ${w-86} ${h-44} ${w-66} ${h-28} ${w-45} ${h-70} ${w-11} ${h-9}Z`} fill="#7A929D"/><Path d={`m${w-45} ${h-70} -12 25 12-7 8 9Z`} fill="#FFFDF2"/><Path d={`M ${w-21} ${h-12}v-46m-7 29 7-21 8 21m-48 17v-21`} stroke="#688B86" strokeWidth="4"/></>}
  </G>;
}
export function PaperSurface({ active = false, yellow = false, locked = false, theme = 'coast', decoration = false, perforation = true }: { active?: boolean; yellow?: boolean; locked?: boolean; theme?: JourneyLevel['theme']; decoration?: boolean; perforation?: boolean }) {
  const id = useId().replace(/:/g, '');
  const [size, setSize] = useState({ width: 320, height: 110 });
  const w = size.width, h = size.height, outline = ticketPath(w,h,4);
  return <View pointerEvents="none" style={StyleSheet.absoluteFill} onLayout={e => setSize(e.nativeEvent.layout)}>
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} {...decorativeSvgProps}>
      <Defs><LinearGradient id={`${id}p`} x2="0" y2="1"><Stop stopColor={locked ? theme === 'city' ? '#F1DEDA' : '#E9EDED' : '#FFFAEB'}/><Stop offset="1" stopColor={locked ? theme === 'city' ? '#E6CFC8' : '#D8E0DD' : '#EDE2CD'}/></LinearGradient>
        <Pattern id={`${id}g`} width="29" height="23" patternUnits="userSpaceOnUse"><Circle cx="4" cy="7" r=".65" fill="#907E54" opacity=".22"/><Circle cx="19" cy="17" r=".45" fill="#FFFDF6" opacity=".8"/><Path d="M16 21h5M23 4l3 1M7 19h2" stroke="#907E54" strokeWidth=".5" opacity=".19"/></Pattern>
        <ClipPath id={`${id}c`}><Path d={outline}/></ClipPath></Defs>
      <Path d={outline} fill={`url(#${id}p)`}/>
      <G clipPath={`url(#${id}c)`}>
        {yellow && <Rect x={0} y={0} width={64} height={h} fill="#F7C641"/>}
        {decoration && <Landscape w={w} h={h} theme={theme} active={yellow}/>}
        <Rect x={0} y={0} width={w} height={h} fill={`url(#${id}g)`}/>
      </G>
      <Path d={outline} fill="none" stroke={active ? green : '#CFC6B4'} strokeWidth={active ? 6 : 1.5}/>
      <Path d={ticketPath(w,h,10)} fill="none" stroke={active ? '#80AD7B' : '#D6CDBB'} strokeWidth="1"/>
      {perforation && <Path d={`M 64 12 V ${h-12}`} stroke={yellow ? '#3C7660' : '#9E9E94'} strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round"/>}
    </Svg>
  </View>;
}
export function Seal({ locked = false, size = 55 }: { locked?: boolean; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 50 50" {...decorativeSvgProps}><Circle cx="25" cy="25" r="21" fill={locked ? '#7C8A91' : 'none'} stroke={locked ? '#A5AFB0' : '#259466'} strokeWidth={locked ? 1 : 4} strokeDasharray={locked ? undefined : '7 1 2 1'}/>{locked ? <><Rect x="18" y="23" width="14" height="13" rx="2" fill="#F5F1E8"/><Path d="M20 23v-5a5 5 0 0 1 10 0v5" fill="none" stroke="#F5F1E8" strokeWidth="3"/><Circle cx="25" cy="28" r="1.7" fill="#7C8A91"/><Path d="M25 29v3" stroke="#7C8A91" strokeWidth="2"/></> : <Path d="m14 25 8 8 15-18" fill="none" stroke="#259466" strokeWidth="5"/>}</Svg>;
}
export function Stars({ count }: { count: number }) {
  return <View style={{ flexDirection: 'row', gap: 2 }} accessibilityLabel={`${count} de 3 estrellas`}>{[1,2,3].map(n => <Svg key={n} width={17} height={18} viewBox="0 0 24 24" {...decorativeSvgProps}><Path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill={n <= count ? '#EDB129' : '#D9D2C1'} stroke={n <= count ? '#BF871B' : '#BEB8A8'}/></Svg>)}</View>;
}
export function LevelTicket({ level, state, stars, selected, onPress }: { level: JourneyLevel; state: TicketState; stars: number; selected: boolean; onPress: () => void }) {
  const { width, fontScale } = useWindowDimensions();
  const active = state === 'available', locked = state === 'locked';
  const showArt = width >= 350 && fontScale < 1.35;
  const label = state === 'completed' ? 'Completado' : active ? 'Disponible' : 'Bloqueado';
  const theme = level.number % 2 === 0 ? 'city' : level.theme;
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`Nivel ${level.number}, ${level.title}, ${label}, ${stars} de 3 estrellas`} style={({ pressed }) => [s.ticket, active && s.activeTicket, pressed && { opacity: .85 }]}>
    <PaperSurface active={active} yellow={active} locked={locked} theme={theme} decoration={showArt && state !== 'completed'}/>
    <View style={s.stub}><Text style={[s.number, active && { fontSize: 39 }]}>{String(level.number).padStart(2,'0')}</Text>{active && <Plane size={26}/>}</View>
    <View style={s.content}><View style={[s.titleSlot, { minHeight: (active ? 52 : 44) * fontScale }]}><Text style={[s.title, active && { fontSize: 21, lineHeight: 26 }]}>{level.title}</Text></View><View style={s.statusRow}>{state === 'completed' && <Stars count={stars}/>}<View style={[s.badge, locked && { backgroundColor: '#79888E' }]}><Text style={s.state}>{label}</Text></View></View></View>
    {showArt && <View pointerEvents="none" style={[s.art, active && s.activeArt]}>{active ? <Image source={journeyAssets.redCar} style={s.car} resizeMode="contain"/> : <Seal locked={locked} size={state === 'completed' ? 62 : 50}/>}</View>}
    {selected && !active && <View pointerEvents="none" style={s.selection}><View style={s.selectionDot}/></View>}
  </Pressable>;
}
const s = StyleSheet.create({
  ticket: { flex: 1, flexDirection: 'row', minHeight: 116, paddingVertical: 20, paddingRight: 15, filter: [{ dropShadow: { offsetX: 0, offsetY: 3, standardDeviation: 2, color: '#3D38282B' } }] },
  activeTicket: { minHeight: 148, paddingVertical: 23 },
  stub: { width: 64, justifyContent: 'center', alignItems: 'center', gap: 3 },
  number: { fontSize: 34, fontWeight: '900', color: ink, fontVariant: ['tabular-nums'], letterSpacing: -2 },
  content: { flex: 1, justifyContent: 'center', paddingLeft: 12, gap: 9, zIndex: 1 },
  titleSlot: { justifyContent: 'center' },
  title: { fontSize: 17, lineHeight: 22, fontWeight: '900', color: ink, letterSpacing: -.5 },
  statusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  badge: { backgroundColor: '#269466', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  state: { fontSize: 10, lineHeight: 14, fontWeight: '700', color: '#FFFDF3' },
  art: { width: 61, alignItems: 'center', justifyContent: 'center', marginLeft: 5 },
  activeArt: { width: 102, justifyContent: 'flex-end', marginLeft: 0 },
  car: { width: 112, height: 80, marginRight: 3, marginBottom: -4 },
  selection: { position: 'absolute', left: 25, bottom: 10 },
  selectionDot: { width: 12, height: 3, borderRadius: 2, backgroundColor: green },
});
