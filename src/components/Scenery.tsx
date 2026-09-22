import Svg, { Ellipse, G, Path, Polygon, Rect } from 'react-native-svg';
import { Car } from './Car';

export function Obstacle({ type }: { type: 'cones' | 'car' | 'hole' }) {
  if (type === 'car') return <Car color="#75b5b9" width={104} />;
  return <Svg width="110" height="105" viewBox="0 0 110 105">
    <Ellipse cx="55" cy="92" rx="48" ry="10" fill="#162b38" opacity=".28" />
    {type === 'hole' ? <><Path d="M8 83L22 66L41 62L60 66L80 61L101 79L96 95L66 100L38 94L20 99Z" fill="#859695" /><Ellipse cx="55" cy="82" rx="39" ry="14" fill="#152c3b" /><Path d="M21 76Q53 60 89 76" fill="none" stroke="#0c1e2b" strokeWidth="5" /><Path d="M16 73L6 61M90 72L103 56M46 98L39 105" stroke="#283e49" strokeWidth="3" /></> : <>
      <Path d="M18 39V94M90 39V94" stroke="#b7c9c8" strokeWidth="7" /><Path d="M13 95H27M83 95H98" stroke="#415962" strokeWidth="5" />
      <Rect x="5" y="32" width="100" height="35" rx="4" fill="#fff3d6" stroke="#e7d8b6" strokeWidth="2" />
      <Path d="M8 64L38 32H56L24 67H8ZM59 67L91 32H105V39L78 67Z" fill="#ff8545" />
      <Path d="M5 34H104" stroke="#fffaf0" strokeWidth="3" />
      <Polygon points="0,99 9,74 18,99" fill="#f47c37" /><Polygon points="92,99 101,74 110,99" fill="#f47c37" />
      <Path d="M6 87H12M98 87H104" stroke="#fff8e6" strokeWidth="4" />
    </>}
  </Svg>;
}

export function Palm() {
  return <Svg width="130" height="200" viewBox="0 0 130 200">
    <Ellipse cx="65" cy="190" rx="48" ry="8" fill="#233f37" opacity=".16" />
    <Path d="M60 190Q78 120 61 55" fill="none" stroke="#946645" strokeWidth="13" />
    <Path d="M65 177L74 175M67 154L77 152M70 132L77 130M70 107L77 105" stroke="#c29b65" strokeWidth="4" />
    <Path d="M62 60Q22 17 0 63Q29 41 57 69Q13 53 5 100Q31 70 58 72Q33 93 37 128Q54 103 66 75Q92 113 119 118Q108 84 75 67Q109 62 130 83Q119 36 76 55Q104 15 126 38Q102 -1 66 45Q61 17 39 13Q41 39 62 60Z" fill="#23856a" />
    <Path d="M65 65Q27 33 8 62M69 62Q99 43 124 76M64 68L46 107" fill="none" stroke="#65b37a" strokeWidth="5" />
  </Svg>;
}

export function House({ alternate }: { alternate: boolean }) {
  return <Svg width="150" height="190" viewBox="0 0 150 190">
    <Polygon points="9,178 111,188 148,161 47,150" fill="#213d38" opacity=".18" />
    <Path d="M21 64L99 47V173L21 163Z" fill={alternate ? '#e3ae7d' : '#f2d8a6'} />
    <Path d="M99 47L139 65V163L99 173Z" fill="#c79468" />
    <Path d="M10 67L60 22L99 44L99 55Z" fill="#d77b51" /><Path d="M60 22L107 27L147 67L99 55Z" fill="#b85b43" />
    {[0, 1].map(row => <G key={row}><Rect x="34" y={78 + row * 42} width="17" height="25" rx="2" fill="#357b83" /><Rect x="67" y={70 + row * 42} width="17" height="25" rx="2" fill="#357b83" /><Rect x="110" y={80 + row * 39} width="13" height="23" fill="#496668" /></G>)}
    <Path d="M30 104H57M63 96H90" stroke="#fff0cf" strokeWidth="4" />
  </Svg>;
}
