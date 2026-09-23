import { Platform } from 'react-native';

// The web SVG renderer forwards `accessible` to the DOM, where it is invalid.
// Labels belong to the containing control or counter, not its decorative artwork.
export const decorativeSvgProps = Platform.OS === 'web'
  ? { 'aria-hidden': true as const, focusable: false }
  : { accessible: false };
