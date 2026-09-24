import { memo, useId, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G, LinearGradient, Path, Pattern, Rect, Stop } from 'react-native-svg';
import { decorativeSvgProps } from '../../game/ui/decorativeSvgProps';
import type { JourneyLevel } from '../../game/data/journey';
import { journeyAssets, journeyPalette } from './theme';
import type { TicketState } from './theme';
export { journeyAssets, type TicketState } from './theme';
export const { ink, green, paper } = journeyPalette;

// The border's central cutout reaches 16 pt into the ticket. Keep the number
// beyond it, and share the same column width with the yellow fill/perforation.
const numberColumn = { width: 80, narrowWidth: 74, leftInset: 20, rightInset: 10 };

// Both borders and all artwork share the same real cutout: the background remains visible in the notches.
function ticketPath(w: number, h: number, inset: number) {
  const l = inset, r = w - inset, t = inset, b = h - inset, c = 12, n = 7;
  return `M ${l+c} ${t} H ${r-c} Q ${r-c} ${t+c} ${r} ${t+c} V ${h/2-n} C ${r-12} ${h/2-n} ${r-12} ${h/2+n} ${r} ${h/2+n} V ${b-c} Q ${r-c} ${b-c} ${r-c} ${b} H ${l+c} Q ${l+c} ${b-c} ${l} ${b-c} V ${h/2+n} C ${l+12} ${h/2+n} ${l+12} ${h/2-n} ${l} ${h/2-n} V ${t+c} Q ${l+c} ${t+c} ${l+c} ${t} Z`;
}
export function RoadIcon({ size = 27, color = ink }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 32 32" {...decorativeSvgProps}><Path d="M7 27 11 6h10l4 21M15 26l1-5m0-5V9M5 28h22" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"/></Svg>;
}
function Landscape({ w, h, theme, active }: { w: number; h: number; theme: JourneyLevel['theme']; active: boolean }) {
  const x = w * .55;
  return <G opacity={active ? 1 : .28}>
    {active ? <><Circle cx={w-53} cy={h*.38} r={18} fill="#EEB642"/><Path d={`M ${x} ${h-8} Q ${w-100} ${h*.3} ${w-65} ${h*.44} Q ${w-29} ${h*.13} ${w-7} ${h*.35} V ${h-8}Z`} fill="#78A489"/><Path d={`M ${x+15} ${h-8} Q ${w-65} ${h*.5} ${w-8} ${h*.43} V ${h-8}Z`} fill="#326C5B"/><Path d={`M ${x+5} ${h-8} Q ${w-93} ${h*.62} ${w-8} ${h*.52} L ${w-8} ${h-8}Z`} fill="#F2CF64"/><Path d={`M ${x+24} ${h-8} Q ${w-82} ${h*.67} ${w-8} ${h*.57} V ${h-8}Z`} fill="#506568"/><Path d={`M ${x+45} ${h-8} Q ${w-60} ${h*.73} ${w-8} ${h*.68}`} stroke="#F8EFCE" strokeWidth="2" fill="none"/></>
    : theme === 'city' ? <><Path d={`M ${w-97} ${h-9}v-29l16-16 16 16v29m4 0v-52l20-20 21 20v52`} fill="#A87370"/><Path d={`M ${w-53} ${h-53}h5v9h-5m14 0h5v-9h-5m-48 13h5v8h-5m35 4h8v20h-8`} fill="#F8EBDF"/></>
    : <><Path d={`M ${x} ${h-9} ${w-86} ${h-44} ${w-66} ${h-28} ${w-45} ${h-70} ${w-11} ${h-9}Z`} fill="#7A929D"/><Path d={`m${w-45} ${h-70} -12 25 12-7 8 9Z`} fill="#FFFDF2"/><Path d={`M ${w-21} ${h-12}v-46m-7 29 7-21 8 21m-48 17v-21`} stroke="#688B86" strokeWidth="4"/></>}
  </G>;
}
export function PaperSurface({ active = false, selected = false, yellow = false, locked = false, theme = 'coast', decoration = false, perforation = true, stubWidth = numberColumn.width }: { active?: boolean; selected?: boolean; yellow?: boolean; locked?: boolean; theme?: JourneyLevel['theme']; decoration?: boolean; perforation?: boolean; stubWidth?: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [size, setSize] = useState({ width: 320, height: 110 });
  const w = size.width, h = size.height, outline = ticketPath(w,h,4);
  return <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]} onLayout={({ nativeEvent: { layout } }) => setSize(old => old.width === layout.width && old.height === layout.height ? old : layout)}>
    <Svg width="100%" height="100%" {...decorativeSvgProps}>
      <Defs><LinearGradient id={`${id}p`} x2="0.4" y2="1"><Stop offset="0" stopColor={locked ? theme === 'city' ? '#F4E2DB' : '#E9EDED' : '#FFFCF1'}/><Stop offset="0.55" stopColor={locked ? theme === 'city' ? '#EED9D0' : '#E0E6E5' : '#FAF0D9'}/><Stop offset="1" stopColor={locked ? theme === 'city' ? '#DDC8C2' : '#CFD9D7' : '#E9DAC0'}/></LinearGradient>
        <LinearGradient id={`${id}y`} x2="0.8" y2="1"><Stop offset="0" stopColor="#FFDA66"/><Stop offset="1" stopColor="#F4BC2A"/></LinearGradient>
        <Pattern id={`${id}g`} width="29" height="23" patternUnits="userSpaceOnUse"><Circle cx="4" cy="7" r=".65" fill="#907E54" opacity=".22"/><Circle cx="19" cy="17" r=".45" fill="#FFFDF6" opacity=".8"/><Path d="M16 21h5M23 4l3 1M7 19h2" stroke="#907E54" strokeWidth=".5" opacity=".19"/></Pattern>
        <ClipPath id={`${id}c`}><Path d={outline}/></ClipPath></Defs>
      <Path d={outline} fill={`url(#${id}p)`}/>
      <G clipPath={`url(#${id}c)`}>
        {yellow && <Rect width={stubWidth} height="100%" fill={`url(#${id}y)`}/>}
        {decoration && <Landscape w={w} h={h} theme={theme} active={yellow}/>}
        <Rect x={0} y={0} width={w} height={h} fill={`url(#${id}g)`}/>
      </G>
      <Path d={outline} fill="none" stroke={active ? green : selected ? '#C39232' : '#FFFAED'} strokeWidth={active ? 7 : selected ? 3 : 2}/>
      <Path d={ticketPath(w,h,10)} fill="none" stroke={active ? '#72BB83' : '#C8B998'} strokeOpacity={active ? 1 : 0.6} strokeWidth="1.2"/>
      {perforation && <Path d={`M ${stubWidth} 12 V ${h-12}`} stroke={yellow ? '#3C7660' : '#9E9E94'} strokeWidth="2" strokeDasharray="2 5" strokeLinecap="round"/>}
    </Svg>
  </View>;
}
export function Seal({ locked = false, size = 55 }: { locked?: boolean; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 50 50" {...decorativeSvgProps}><Circle cx="25" cy="25" r="21" fill={locked ? '#7C8A91' : 'none'} stroke={locked ? '#A5AFB0' : '#259466'} strokeWidth={locked ? 1 : 4} strokeDasharray={locked ? undefined : '7 1 2 1'}/>{locked ? <><Rect x="18" y="23" width="14" height="13" rx="2" fill="#F5F1E8"/><Path d="M20 23v-5a5 5 0 0 1 10 0v5" fill="none" stroke="#F5F1E8" strokeWidth="3"/><Circle cx="25" cy="28" r="1.7" fill="#7C8A91"/><Path d="M25 29v3" stroke="#7C8A91" strokeWidth="2"/></> : <Path d="m14 25 8 8 15-18" fill="none" stroke="#259466" strokeWidth="5"/>}</Svg>;
}
export function Stars({ count }: { count: number }) {
  return <View style={{ flexDirection: 'row', gap: 2 }} accessibilityLabel={`${count} de 3 estrellas`}>{[1,2,3].map(n => <Svg key={n} width={17} height={18} viewBox="0 0 24 24" {...decorativeSvgProps}><Path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill={n <= count ? '#EDB129' : '#D9D2C1'} stroke={n <= count ? '#BF871B' : '#BEB8A8'}/></Svg>)}</View>;
}
export const LevelTicket = memo(function LevelTicket({ level, state, stars, selected, onPress }: { level: JourneyLevel; state: TicketState; stars: number; selected: boolean; onPress: () => void }) {
  const { width, fontScale } = useWindowDimensions();
  const active = state === 'available', locked = state === 'locked';
  const narrow = width < 360;
  const numberLabel = String(level.number).padStart(2, '0');
  const stubWidth = (narrow ? numberColumn.narrowWidth : numberColumn.width)
    + Math.round(Math.max(0, Math.min(fontScale, 1.5) - 1) * 40);
  const numberSize = numberLabel.length > 2 ? Math.max(16, 32 - (numberLabel.length - 2) * 6) : active ? 34 : 32;
  const showArt = (!narrow || active) && fontScale < 1.3;
  const label = state === 'completed' ? 'Completado' : active ? 'Disponible' : 'Bloqueado';
  const theme = level.number % 2 === 0 ? 'city' : level.theme;
  return <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected }} accessibilityLabel={`Nivel ${level.number}, ${level.title}, ${label}, ${stars} de 3 estrellas`} style={({ pressed }) => [s.ticket, active && s.activeTicket, pressed && { opacity: .92, transform: [{ scale: .985 }] }]}>
    <PaperSurface active={active} selected={selected} yellow={active} locked={locked} theme={theme} decoration={showArt && state !== 'completed'} stubWidth={stubWidth}/>
    <View style={[s.stub, { width: stubWidth }]}>
      <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} maxFontSizeMultiplier={1.5}
        style={[s.number, { fontSize: numberSize }]}>{numberLabel}</Text>
      {active && <RoadIcon size={25}/>}
    </View>
    <View style={s.content}><Text style={[s.title, active && { fontSize: narrow ? 20 : 22 }]}>{level.title}</Text><View style={s.statusRow}>{state === 'completed' && <Stars count={stars}/>}<View style={[s.badge, locked && { backgroundColor: '#667780' }]}><Text style={s.state}>{label}</Text></View></View></View>
    {showArt && <View style={[s.art, active && s.activeArt, active && narrow && { width: 55 }, { pointerEvents: 'none' }]}>{active ? <Image source={journeyAssets.redCar} style={[s.car, narrow && { width: 76, height: 56 }]} resizeMode="contain" accessible={false}/> : <Seal locked={locked} size={state === 'completed' ? 66 : 53}/>}</View>}
  </Pressable>;
});
const s = StyleSheet.create({
  ticket: { flex: 1, flexDirection: 'row', minHeight: 108, paddingVertical: 20, paddingRight: 15, boxShadow: '0 5px 7px -5px #57462E66' },
  activeTicket: { minHeight: 140, paddingVertical: 25 },
  stub: { flexShrink: 0, paddingLeft: numberColumn.leftInset, paddingRight: numberColumn.rightInset, justifyContent: 'center', alignItems: 'center', gap: 6 },
  number: { width: '100%', fontWeight: '900', color: ink, fontVariant: ['tabular-nums'], letterSpacing: -0.5, textAlign: 'center', includeFontPadding: false },
  content: { flex: 1, justifyContent: 'center', paddingLeft: 12, gap: 9, zIndex: 1 },
  title: { fontSize: 20, fontWeight: '800', color: ink, letterSpacing: -.6 },
  statusRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  badge: { backgroundColor: '#16865A', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  state: { fontSize: 13, fontWeight: '700', color: '#FFFDF3' },
  art: { width: 54, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  activeArt: { width: 96, justifyContent: 'flex-end', marginLeft: 0 },
  car: { width: 120, height: 82, marginRight: 3, marginBottom: -4 },
});

export function TravelStamp() {
  return <Svg width="85" height="72" viewBox="0 0 85 72" {...decorativeSvgProps}><G opacity="0.23" stroke="#607A7D" fill="none" strokeWidth="1.5"><Circle cx="56" cy="28" r="24"/><Circle cx="56" cy="28" r="20"/><Path d="M1 51c14-15 19 11 35-5M1 57c14-15 19 11 35-5M1 63c14-15 19 11 35-5"/><Path d="m47 37 4-21h10l4 21m-9-2 1-5m0-5v-5" strokeWidth="3"/></G></Svg>;
}

export function ButtonSurface() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const [size, setSize] = useState({ width: 0, height: 0 });
  const { width, height } = size;
  // Measure a native View, not a percentage-sized SVG inside a padded Pressable.
  // iOS otherwise resolves the decoration against a smaller box than the button.
  return <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', overflow: 'hidden', borderRadius: 31 }]}
    onLayout={({ nativeEvent: { layout } }) => setSize(old => old.width === layout.width && old.height === layout.height
      ? old : { width: layout.width, height: layout.height })}>
    {width > 2 && height > 2 && <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} {...decorativeSvgProps}>
      <Defs>
        <LinearGradient id={id} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={0} y2={height}>
          <Stop offset="0" stopColor="#39B786"/>
          <Stop offset="0.4" stopColor="#099667"/>
          <Stop offset="1" stopColor="#036C49"/>
        </LinearGradient>
      </Defs>
      <Rect x={1} y={1} width={width - 2} height={height - 2} rx={Math.min(29, (height - 2) / 2)}
        fill={`url(#${id})`} stroke="#75CC9F" strokeWidth={1.2}/>
    </Svg>}
  </View>;
}
