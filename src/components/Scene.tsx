import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, Ellipse, G, LinearGradient, Path, Polygon, Stop } from 'react-native-svg';
import { Car } from './Car';
import { House, Obstacle, Palm } from './Scenery';
import { APPROACH_MS, LANES, Race } from '../game/engine';
import { depthAt, encounterDepth, groundY, laneX, roadHalf, SAMPLES } from '../game/perspective';

const native = { useNativeDriver: true, isInteraction: false } as const;

/** One native timeline drives roadside objects and road markings without React frame updates. */
function useTravel(paused: boolean) {
  const [travel] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (paused) return;
    let active = true;
    const run = (from: number) => {
      if (!active) return;
      Animated.timing(travel, { toValue: 1, duration: Math.max(1, (1 - from) * 6800), easing: Easing.linear, ...native }).start(({ finished }) => {
        if (finished && active) { travel.setValue(0); run(0); }
      });
    };
    travel.stopAnimation(run);
    return () => { active = false; travel.stopAnimation(); };
  }, [paused, travel]);
  return travel;
}

function WorldItem({ travel, offset, lateral, w, h, kind }: {
  travel: Animated.Value; offset: number; lateral: number; w: number; h: number;
  kind: 'stripe' | 'post' | 'palm' | 'house';
}) {
  const phase = useMemo(() => Animated.modulo(Animated.add(travel, offset), 1), [travel, offset]);
  const depths = SAMPLES.map(depthAt);
  const project = (values: number[]) => phase.interpolate({ inputRange: SAMPLES, outputRange: values, extrapolate: 'clamp' });
  const width = kind === 'palm' ? 130 : kind === 'house' ? 150 : kind === 'post' ? 12 : 5;
  const height = kind === 'palm' ? 200 : kind === 'house' ? 190 : kind === 'post' ? 65 : 62;
  return <Animated.View style={{ position: 'absolute', left: w / 2 - width / 2, top: -height / 2,
    opacity: phase.interpolate({ inputRange: [0, .05, .96, 1], outputRange: [0, 1, 1, 0] }),
    transform: [
      { translateX: project(depths.map(p => lateral * roadHalf(w, p))) },
      { translateY: project(depths.map(p => groundY(h, p) - (kind === 'stripe' ? 0 : height * p / 2))) },
      { scale: project(depths) },
    ] }}>
    {kind === 'palm' ? <Palm /> : kind === 'house' ? <House alternate={offset > .4} /> : kind === 'post' ? <View style={{ height, width, borderRadius: 3, backgroundColor: '#fff3d0', borderBottomWidth: 36, borderColor: '#d99f71' }}><View style={{ height: 9, backgroundColor: '#f58a48', marginTop: 8 }} /></View> : <View style={{ width, height, backgroundColor: '#fff0cc', opacity: .85 }} />}
  </Animated.View>;
}

function EncounterLayer({ race, paused, w, h }: { race: Race; paused: boolean; w: number; h: number }) {
  const [approach] = useState(() => new Animated.Value(race.elapsed / APPROACH_MS));
  // Scene skips clock-only renders. Resample on encounter/lane/pause transitions.
  useEffect(() => {
    if (race.phase !== 'approach') return;
    approach.setValue(Math.min(1, race.elapsed / APPROACH_MS));
    if (paused) return;
    const motion = Animated.timing(approach, { toValue: 1, duration: Math.max(0, APPROACH_MS - race.elapsed), easing: Easing.linear, ...native });
    motion.start(); return () => motion.stop();
  }, [approach, race, paused]);
  if (race.phase !== 'approach') return null;
  const depths = SAMPLES.map(encounterDepth);
  const labelWidth = Math.min(110, w * .27);
  const project = (values: number[]) => approach.interpolate({ inputRange: SAMPLES, outputRange: values });
  return <>{LANES.map(lane => <Animated.View key={lane} style={{ position: 'absolute', left: w / 2 - 55, top: -105,
    transform: [{ translateX: project(depths.map(p => laneX(w, lane, p) - w / 2)) }, { translateY: project(depths.map(p => groundY(h, p))) }] }}>
    <Animated.View style={{ width: 110, height: 105, justifyContent: 'flex-end', alignItems: 'center', transformOrigin: 'bottom center', transform: [{ scale: project(depths.map(p => p * 1.32)) }] }}>
      {lane === race.encounter.blocked ? <Obstacle type={race.encounter.obstacle} /> : <Svg width="110" height="32" viewBox="0 0 110 32"><Ellipse cx="55" cy="17" rx="48" ry="12" fill="#203c49" opacity=".2" /><Path d="M12 18L55 7L98 18M20 26L55 17L90 26" stroke="#fff3cd" strokeWidth="5" fill="none" /></Svg>}
    </Animated.View>
    {lane !== race.encounter.blocked && <Animated.View style={{ position: 'absolute', bottom: 30, left: (110 - labelWidth) / 2, width: labelWidth, alignItems: 'center', transform: [{ scale: project(depths.map(p => .54 + p * .62)) }] }}><View style={[s.wordPlaque, { width: labelWidth }]}><Text numberOfLines={2} adjustsFontSizeToFit style={[s.wordText, { fontSize: Math.min(20, labelWidth * .185), textAlign: 'center' }]}>{lane === race.encounter.correct ? race.encounter.word.en : race.encounter.word.distractor}</Text><Text style={s.wordArrow}>↓</Text></View></Animated.View>}
  </Animated.View>)}</>;
}

function Player({ lane, paused, reduced, w, h, feedback }: { lane: number; paused: boolean; reduced: boolean; w: number; h: number; feedback?: string }) {
  const [position] = useState(() => new Animated.Value(lane));
  const [bank] = useState(() => new Animated.Value(0));
  const [bounce] = useState(() => new Animated.Value(0));
  const [impact] = useState(() => new Animated.Value(0));
  const previousLane = useRef(lane);
  useEffect(() => {
    const direction = lane - previousLane.current; previousLane.current = lane;
    if (paused) { position.stopAnimation(); bank.stopAnimation(); return; }
    const steer = Animated.spring(position, { toValue: lane, stiffness: 230, damping: 25, mass: .7, overshootClamping: true, ...native });
    steer.start();
    const lean = Animated.sequence([
      Animated.timing(bank, { toValue: reduced ? 0 : direction * 6, duration: 90, ...native }),
      Animated.spring(bank, { toValue: 0, stiffness: 170, damping: 13, ...native }),
    ]);
    lean.start(); return () => { steer.stop(); lean.stop(); };
  }, [lane, paused, reduced, position, bank]);
  useEffect(() => {
    if (paused || reduced) return;
    const suspension = Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: -2, duration: 190, easing: Easing.inOut(Easing.sin), ...native }),
      Animated.timing(bounce, { toValue: 1, duration: 210, easing: Easing.inOut(Easing.sin), ...native }),
    ]));
    suspension.start(); return () => suspension.stop();
  }, [paused, reduced, bounce]);
  useEffect(() => {
    if (paused || !feedback || reduced) return;
    const values = feedback === 'correct' ? [-5, 0] : [7, -6, 4, 0];
    const reaction = Animated.sequence(values.map(value => Animated.timing(impact, { toValue: value, duration: 90, ...native })));
    reaction.start(); return () => reaction.stop();
  }, [feedback, paused, reduced, impact]);
  const carWidth = Math.min(112, w * .25);
  const ground = groundY(h, .72);
  const spacing = roadHalf(w, .72) * 2 / 3;
  return <Animated.View style={{ position: 'absolute', left: w / 2 - carWidth / 2, top: ground - carWidth * 1.03,
    transform: [{ translateX: position.interpolate({ inputRange: [0, 1, 2], outputRange: [-spacing, 0, spacing] }) }] }}>
    {feedback && <View style={[s.glow, { width: carWidth + 12, backgroundColor: feedback === 'correct' ? '#63e4ab77' : '#ff6a6177' }]} />}
    <Animated.View style={{ transform: [{ translateY: Animated.add(bounce, impact) }, { rotate: bank.interpolate({ inputRange: [-12, 12], outputRange: ['-12deg', '12deg'] }) }] }}><Car width={carWidth} braking={!!feedback && feedback !== 'correct'} /></Animated.View>
  </Animated.View>;
}

export const Scene = memo(function Scene({ race, paused = false }: { race?: Race; paused?: boolean }) {
  const asphaltId = `asphalt${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const [size, setSize] = useState({ width: 390, height: 800 });
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then(value => { if (mounted) setReduced(value); }).catch(() => {});
    const listener = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { mounted = false; listener.remove(); };
  }, []);
  const travel = useTravel(paused);
  const { width: w, height: h } = size;
  const horizon = groundY(h, 0);
  const feedback = race?.phase === 'feedback' ? race.answers.at(-1)?.result : undefined;
  return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden', backgroundColor: '#56bfc4' }]} onLayout={e => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
    <Image source={require('../../assets/coast.png')} style={{ position: 'absolute', width: w, height: h * .87 }} resizeMode="stretch" />
    <Svg width={w} height={h} style={StyleSheet.absoluteFill}>
      <Defs><LinearGradient id={asphaltId} x1="0" y1="0" x2="0" y2="1"><Stop offset="0" stopColor="#839c9c" /><Stop offset=".3" stopColor="#61767c" /><Stop offset="1" stopColor="#3c505d" /></LinearGradient></Defs>
      <Polygon points={`${w / 2 - roadHalf(w, 0) * 1.65},${horizon} ${w / 2 + roadHalf(w, 0) * 1.65},${horizon} ${w / 2 + roadHalf(w, 1) * 1.65},${h} ${w / 2 - roadHalf(w, 1) * 1.65},${h}`} fill="#cfa77a" />
      <Polygon points={`${w / 2 - roadHalf(w, 0) * 1.22},${horizon} ${w / 2 + roadHalf(w, 0) * 1.22},${horizon} ${w / 2 + roadHalf(w, 1) * 1.22},${h} ${w / 2 - roadHalf(w, 1) * 1.22},${h}`} fill="#f0d8ac" />
      <Polygon points={`${w / 2 - roadHalf(w, 0)},${horizon} ${w / 2 + roadHalf(w, 0)},${horizon} ${w / 2 + roadHalf(w, 1)},${h} ${w / 2 - roadHalf(w, 1)},${h}`} fill={`url(#${asphaltId})`} />
      {[-1, 1].map(side => <G key={side}><Path d={`M${w / 2 + side * roadHalf(w, 0) * .95} ${horizon} L${w / 2 + side * roadHalf(w, 1) * .95} ${h}`} stroke="#f8eacb" strokeWidth="3" /><Path d={`M${w / 2 + side * roadHalf(w, 0) * 1.15} ${horizon} L${w / 2 + side * roadHalf(w, 1) * 1.15} ${h}`} stroke="#b58561" strokeWidth="4" /></G>)}
    </Svg>
    {Array.from({ length: 15 }, (_, i) => [-1, 1].map(side => <WorldItem key={`stripe-${i}-${side}`} travel={travel} offset={i / 15} lateral={side / 3} w={w} h={h} kind="stripe" />))}
    {Array.from({ length: 9 }, (_, i) => [-1, 1].map(side => <WorldItem key={`post-${i}-${side}`} travel={travel} offset={i / 9} lateral={side * 1.12} w={w} h={h} kind="post" />))}
    {Array.from({ length: 5 }, (_, i) => <WorldItem key={`house-${i}`} travel={travel} offset={i / 5} lateral={-1.3} w={w} h={h} kind="house" />)}
    {Array.from({ length: 6 }, (_, i) => <WorldItem key={`palm-${i}`} travel={travel} offset={i / 6 + .02} lateral={i % 2 ? -1.2 : 1.25} w={w} h={h} kind="palm" />)}
    {race && <EncounterLayer race={race} paused={paused} w={w} h={h} />}
    <Player lane={race?.lane ?? 1} paused={paused} reduced={reduced} w={w} h={h} feedback={feedback} />
    {feedback && <View style={[s.edgeTint, { borderColor: feedback === 'correct' ? '#67e6b255' : '#ed706555' }]} />}
  </View>;
}, (before, after) => before.paused === after.paused && before.race?.id === after.race?.id && before.race?.lane === after.race?.lane && before.race?.phase === after.race?.phase && before.race?.answers.length === after.race?.answers.length);

const s = StyleSheet.create({
  wordPlaque: { backgroundColor: '#fff8eaf5', paddingHorizontal: 9, paddingTop: 9, paddingBottom: 2, borderRadius: 12, width: 110, alignItems: 'center', borderBottomWidth: 4, borderColor: '#dfbd89', boxShadow: '0 5px 10px #17364720' },
  wordText: { fontSize: 20, fontWeight: '900', color: '#173647' }, wordArrow: { color: '#7a8a82', fontSize: 17 },
  glow: { position: 'absolute', bottom: 0, left: -6, height: 30, borderRadius: 60 },
  edgeTint: { ...StyleSheet.absoluteFill, borderWidth: 5 },
});

