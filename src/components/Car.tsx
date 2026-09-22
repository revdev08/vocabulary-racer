import { useId } from 'react';
import Svg, { Defs, Ellipse, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

/** Rear chase-camera view, with visible body planes and tire contact. */
export function Car({ color = '#ff8545', width = 100, braking = false }: { color?: string; width?: number; braking?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const paint = `paint${id}`, glass = `glass${id}`;
  return <Svg width={width} height={width * 1.15} viewBox="0 0 120 138">
    <Defs>
      <LinearGradient id={paint} x1="0" y1="0" x2=".8" y2="1"><Stop offset="0" stopColor="#ffce92" /><Stop offset=".45" stopColor={color} /><Stop offset="1" stopColor="#d45b32" /></LinearGradient>
      <LinearGradient id={glass} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#32798b" /><Stop offset="1" stopColor="#142d45" /></LinearGradient>
    </Defs>
    <Ellipse cx="60" cy="123" rx="54" ry="12" fill="#102333" opacity=".26" />
    <Rect x="12" y="87" width="18" height="42" rx="7" fill="#112735" /><Rect x="90" y="87" width="18" height="42" rx="7" fill="#112735" />
    <Path d="M16 83L26 42Q31 23 46 23H74Q90 23 95 42L105 83L109 105Q109 121 96 122H24Q11 121 11 106Z" fill={`url(#${paint})`} stroke="#ac492e" strokeWidth="1.5" />
    <Path d="M31 42Q35 28 47 28H73Q85 28 90 42L85 56H35Z" fill="#ffb776" />
    <Path d="M33 49H87L96 78Q60 85 24 78Z" fill={`url(#${glass})`} stroke="#edb584" strokeWidth="3" />
    <Path d="M38 52H51L38 76H29Z" fill="#c5eeed" opacity=".38" /><Path d="M58 52H63L49 78H44Z" fill="#c5eeed" opacity=".16" />
    <Path d="M17 82Q60 91 103 82L106 109Q60 123 14 109Z" fill={color} />
    <Path d="M17 82Q60 87 103 82" stroke="#ffd8a1" strokeWidth="3" />
    <Rect x="5" y="67" width="16" height="10" rx="4" fill={color} /><Rect x="99" y="67" width="16" height="10" rx="4" fill={color} />
    <Path d="M17 107Q60 114 104 107L102 118Q60 127 19 118Z" fill="#293c49" />
    <Rect x="19" y="91" width="25" height="10" rx="4" fill={braking ? '#ff333f' : '#da4541'} /><Rect x="76" y="91" width="25" height="10" rx="4" fill={braking ? '#ff333f' : '#da4541'} />
    <Rect x="21" y="92" width="18" height="3" rx="1" fill="#ffb1a0" /><Rect x="81" y="92" width="18" height="3" rx="1" fill="#ffb1a0" />
    <Rect x="48" y="103" width="24" height="10" rx="3" fill="#fff3d6" /><Rect x="51" y="106" width="18" height="2" rx="1" fill="#35525e" />
    <Path d="M25 114H38M82 114H95" stroke="#a9c3c5" strokeWidth="3" />
  </Svg>;
}
