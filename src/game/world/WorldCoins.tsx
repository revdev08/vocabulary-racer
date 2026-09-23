import { Circle, Group, Path } from '@shopify/react-native-skia';

/** Unit-size vector coin; positioned and sorted with traffic by TrafficObjects. */
export function CoinArtwork() {
  return <Group>
    <Circle r={1} color="#BE7B13" /><Circle cx={-0.07} cy={-0.05} r={0.94} color="#FFC650" />
    <Circle cx={-0.07} cy={-0.05} r={0.77} color="#FFE7A0" style="stroke" strokeWidth={0.1} />
    <Path path="M 0 -.58 L .17 -.21 L .58 -.15 L .29 .14 L .35 .55 L 0 .36 L -.35 .55 L -.29 .14 L -.58 -.15 L -.17 -.21 Z" color="#FFF4CB" />
  </Group>;
}
