import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { palette } from '../config/visual';
import { decorativeSvgProps } from './decorativeSvgProps';

type IconName = 'coin' | 'flame' | 'heart' | 'pause' | 'play' | 'audio' | 'flag' | 'chevron' | 'check' | 'cross';

export function GameIcon({ name, size = 24, color = palette.white }: {
  name: IconName; size?: number; color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...decorativeSvgProps}>
      {name === 'coin' && <>
        <Circle cx="12" cy="12" r="10" fill="#F4B945" stroke="#FFE3A2" strokeWidth="1.5" />
        <Circle cx="12" cy="12" r="7.3" stroke="#C38726" strokeWidth="1" />
        <Path d="m12 6 1.7 3.4 3.8.6-2.7 2.6.6 3.8-3.4-1.8-3.4 1.8.6-3.8L6.5 10l3.8-.6Z" fill="#FFF1B7" />
      </>}
      {name === 'flame' && <>
        <Path d="M13 2c1 5-4 6-3 9-2-1-2.5-3-2.5-3C4 11 4 15 6 18.5 8 22 16 23 19 17c2-4-1-8-3-10 .5 4-2 5-2 5 1-4 .5-7-1-10Z" fill="#FFBD61" />
        <Path d="M12 12c1 3-3 3-2.5 6 1 3 5 2 5.5-.5.4-2-1-3-1-3 0 2-1 2-1 2 .5-2 0-3-1-4.5Z" fill="#FFF1BA" />
      </>}
      {name === 'heart' && <Path d="M12 21 3.2 12.5C-3 6.2 6.8-1 12 6c5.2-7 15 0.2 8.8 6.5Z" fill={color} />}
      {name === 'pause' && <><Rect x="6.5" y="5" width="4" height="14" rx="1.4" fill={color} /><Rect x="14" y="5" width="4" height="14" rx="1.4" fill={color} /></>}
      {name === 'play' && <Path d="M7 4.5 20 12 7 19.5Z" fill={color} strokeLinejoin="round" />}
      {name === 'audio' && <>
        <Path d="M4 9h4l5-4v14l-5-4H4Z" fill={color} stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
        <Path d="M16 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      </>}
      {name === 'flag' && <>
        <Path d="m5 21 2-18m0 1c5-3 7 3 13 0l-1 10c-6 3-8-3-13 0" stroke={color} strokeWidth="1.7" strokeLinejoin="round" />
        <Path d="m7 4 4-.2-.5 4.8-4-.5Zm7.5 1.5 5.5-1-.5 4.5-5-.1ZM10.5 9l4 0-.5 4.4-4-.4Z" fill={color} />
      </>}
      {name === 'chevron' && <Path d="m5 9 7 6 7-6" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
      {name === 'check' && <Path d="m5 12 5 5L20 7" stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />}
      {name === 'cross' && <Path d="m6 6 12 12M18 6 6 18" stroke={color} strokeWidth="2.6" strokeLinecap="round" />}
    </Svg>
  );
}
