import { Image, View } from 'react-native';

/** Keep the supplied artwork intact; the layout compensates for its transparent margins. */
export function Car({ width = 100, braking = false }: { width?: number; braking?: boolean }) {
  return <View style={{ width, height: width * .69 }}>
    <View style={{ position: 'absolute', bottom: -1, left: width * .09, width: width * .82, height: width * .045, borderRadius: width, backgroundColor: braking ? '#62292bbb' : '#102330aa' }} />
    <Image source={require('../../assets/basic-main-car.png')} resizeMode="contain" fadeDuration={0} accessible={false}
      style={{ position: 'absolute', width: width * 1.055, height: width * 1.055, left: -width * .0275, top: -width * .17 }} />
  </View>;
}
