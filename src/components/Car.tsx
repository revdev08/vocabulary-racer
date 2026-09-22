import { Image, View } from 'react-native';

/** Keep the supplied artwork intact; the layout compensates for its transparent margins. */
export function Car({ width = 100, braking = false }: { width?: number; braking?: boolean }) {
  return <View style={{ width, height: width * .84 }}>
    <View style={{ position: 'absolute', bottom: 0, left: width * .08, width: width * .84, height: width * .16, borderRadius: width, backgroundColor: braking ? '#ef514777' : '#10233066', boxShadow: '0 4px 8px #10233044' }} />
    <Image source={require('../../assets/basic-main-car.png')} resizeMode="contain" fadeDuration={0} accessible={false}
      style={{ position: 'absolute', width: width * 1.055, height: width * 1.055, left: -width * .0275, top: -width * .17 }} />
  </View>;
}
