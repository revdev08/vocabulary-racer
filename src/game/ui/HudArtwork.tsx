import { memo, useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import { decorativeSvgProps } from './decorativeSvgProps';

// Static vector highlights give the HUD volume without bitmap assets or animated filters.
export const HudCoin = memo(function HudCoin({ size }: { size: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return <Svg width={size} height={size} viewBox="0 0 64 64" {...decorativeSvgProps}>
    <Defs>
      <LinearGradient id={`${id}rim`} x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor="#FFFBE0" /><Stop offset="0.28" stopColor="#FFE48B" />
        <Stop offset="0.65" stopColor="#E99A17" /><Stop offset="1" stopColor="#FFD064" />
      </LinearGradient>
      <RadialGradient id={`${id}gold`} cx="0.32" cy="0.22" r="0.85">
        <Stop offset="0" stopColor="#FFF3A0" /><Stop offset="0.5" stopColor="#FFCB3D" /><Stop offset="1" stopColor="#EE9916" />
      </RadialGradient>
    </Defs>
    <Circle cx="32" cy="34" r="29" fill="#0A263F" />
    <Circle cx="32" cy="32" r="28" fill="#B96B0F" stroke="#FFF1AF" strokeWidth="1.2" />
    <Circle cx="32" cy="30" r="26" fill={`url(#${id}rim)`} />
    <Circle cx="32" cy="30" r="20.5" fill={`url(#${id}gold)`} stroke="#BD7A17" strokeWidth="1.5" />
    <Path d="M14 23A20 20 0 0 1 43 12" fill="none" stroke="#FFF9CD" strokeWidth="2.2" strokeLinecap="round" />
    <Path d="m32 16 4.2 8.5 9.4 1.4-6.8 6.6 1.6 9.3-8.4-4.4-8.4 4.4 1.6-9.3-6.8-6.6 9.4-1.4Z" fill="#B87812" transform="translate(0 2)" />
    <Path d="m32 16 4.2 8.5 9.4 1.4-6.8 6.6 1.6 9.3-8.4-4.4-8.4 4.4 1.6-9.3-6.8-6.6 9.4-1.4Z" fill="#FFF0A0" stroke="#FFF9CB" strokeWidth="0.8" strokeLinejoin="round" />
    <Path d="M9 18 10.5 12 17 10.5 10.5 9 9 3 7.5 9 1 10.5 7.5 12Z" fill="#FFFADE" />
  </Svg>;
});

export const HudFlame = memo(function HudFlame({ size }: { size: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const flame = 'M33 3C43 13 49 18 45 32c5-3 6-8 6-8 7 9 10 17 6 26-4 9-12 12-24 12C17 62 8 55 8 43c0-10 5-20 12-26-1 7 0 11 4 14C22 19 34 15 33 3Z';
  return <Svg width={size} height={size} viewBox="0 0 64 64" {...decorativeSvgProps}>
    <Defs>
      <LinearGradient id={`${id}fire`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFE277" /><Stop offset="0.35" stopColor="#FF9C27" />
        <Stop offset="0.75" stopColor="#FF5426" /><Stop offset="1" stopColor="#D92935" />
      </LinearGradient>
      <LinearGradient id={`${id}core`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#FFF9BC" /><Stop offset="1" stopColor="#FFD149" />
      </LinearGradient>
    </Defs>
    <Path d={flame} fill="#0B273F" stroke="#0B273F" strokeWidth="3" strokeLinejoin="round" />
    <Path d={flame} fill={`url(#${id}fire)`} stroke="#F88640" strokeWidth="1" strokeLinejoin="round" />
    <Path d="M35 22c5 8 4 15 1 20 5-1 9-7 9-7 6 10 4 23-11 23-14 0-18-11-12-21 1 5 3 7 5 8-2-9 7-13 8-23Z" fill={`url(#${id}core)`} />
    <Path d="M35 41c4 5 7 10 3 14-4 3-10 0-9-5 0-4 5-5 6-9Z" fill="#FFFCE3" />
    <Path d="M15 39c-2 7 0 13 5 16" fill="none" stroke="#FFC678" strokeWidth="2.3" strokeLinecap="round" />
  </Svg>;
});

const heartPath = 'M32 56 9 34C-5 19 6 3 20 7c6 1 10 5 12 9 3-5 7-8 12-9 14-4 25 12 11 27Z';
export const HudHeart = memo(function HudHeart({ size, filled }: { size: number; filled: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  return <Svg width={size} height={size} viewBox="0 0 64 64" {...decorativeSvgProps}>
    <Defs>
      <RadialGradient id={`${id}heart`} cx="0.33" cy="0.14" r="0.9">
        <Stop offset="0" stopColor="#FFB4B1" /><Stop offset="0.35" stopColor="#FF5266" />
        <Stop offset="0.72" stopColor="#EB2949" /><Stop offset="1" stopColor="#A30F37" />
      </RadialGradient>
      <LinearGradient id={`${id}empty`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#244A6B" /><Stop offset="1" stopColor="#102C49" />
      </LinearGradient>
    </Defs>
    <Path d={heartPath} transform="translate(0 3)" fill="#092339" stroke="#092339" strokeWidth="2.5" strokeLinejoin="round" />
    <Path d={heartPath} fill={`url(#${id}${filled ? 'heart' : 'empty'})`} stroke={filled ? '#AF2346' : '#173951'} strokeWidth="2" strokeLinejoin="round" />
    {filled ? <>
      <Path d="M9 22c-1-7 8-12 14-7" stroke="#FFF0DF" strokeWidth="4" strokeLinecap="round" fill="none" />
      <Path d="M42 13c5-3 11 1 12 6" stroke="#FFB9B6" strokeWidth="2" strokeLinecap="round" fill="none" />
      <Path d="m22 43 10 10 15-15" stroke="#FF758A" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.65" />
    </> : <Path d="M9 19c2-7 11-8 16-2" stroke="#3C617C" strokeWidth="2" strokeLinecap="round" fill="none" />}
  </Svg>;
});

export const HudPlate = memo(function HudPlate({ width, height = 44, warm = false }: { width: number; height?: number; warm?: boolean }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const shape = `M12 2H${width - 12}Q${width - 2} 2 ${width - 2} 12V${height - 14}L${width - 11} ${height - 5}H10Q2 ${height - 5} 2 ${height - 13}V12Q2 2 12 2Z`;
  return <Svg width={width} height={height} {...decorativeSvgProps}>
    <Defs>
      <LinearGradient id={`${id}plate`} x1="0" y1="0" x2="0" y2="1">
        <Stop offset="0" stopColor="#355D80" /><Stop offset="0.46" stopColor="#193C60" /><Stop offset="1" stopColor="#0B243F" />
      </LinearGradient>
    </Defs>
    <Path d={shape} transform="translate(0 3)" fill="#081E33" />
    <Path d={shape} fill={`url(#${id}plate)`} stroke="#0A2844" strokeWidth="1.3" />
    <Path d={`M12 3H${width - 13}Q${width - 4} 3 ${width - 4} 12`} stroke="#7CA2BD" strokeWidth="1.2" fill="none" opacity="0.85" />
    <Path d={`M16 ${height - 5}H${width - 18}`} stroke={warm ? '#F0B950' : '#6CB9D1'} strokeWidth="1.5" strokeLinecap="round" opacity="0.75" />
  </Svg>;
});
