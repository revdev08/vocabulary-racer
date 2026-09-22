import Svg, { Path } from 'react-native-svg';

export function GameIcon({ name, size = 24, color = '#173647' }: { name: 'left' | 'right' | 'pause' | 'flag' | 'retry'; size?: number; color?: string }) {
  const paths = { left: 'M19 12H5M11 5L4 12L11 19', right: 'M5 12H19M13 5L20 12L13 19', pause: 'M8 5V19M16 5V19', flag: 'M5 21V3M5 4C10 0 14 8 20 3V14C14 19 10 10 5 15', retry: 'M4 10A8 8 0 1 1 5 18M4 3V10H11' };
  return <Svg width={size} height={size} viewBox="0 0 24 24" aria-hidden={true}><Path d={paths[name]} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}
