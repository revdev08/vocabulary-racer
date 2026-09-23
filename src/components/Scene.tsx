import { memo, useEffect, useId, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Platform, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Polygon, Stop } from 'react-native-svg';
import { Car } from './Car';
import { CoastalRock, Obstacle, Palm } from './Scenery';
import { APPROACH_MS, LANES, Race } from '../game/engine';
import { depthAt, encounterDepth, groundY, laneX, roadHalf, dividerSkew, WORLD_DURATION, SAMPLES } from '../game/perspective';

const native = { useNativeDriver: Platform.OS !== 'web', isInteraction: false } as const;

/** One native timeline drives roadside objects and road markings without React frame updates. */
function useTravel(paused: boolean) {
  const [travel] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (paused) return;
    let active = true;
    const run = (from: number) => {
      if (!active) return;
      Animated.timing(travel, { toValue: 1, duration: Math.max(1, (1 - from) * WORLD_DURATION), easing: Easing.linear, ...native }).start(({ finished }) => {
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
  kind: 'stripe' | 'post' | 'palm' | 'rock';
}) {
  const phase = useMemo(() => Animated.modulo(Animated.add(travel, offset), 1), [travel, offset]);
  const depths = SAMPLES.map(depthAt);
  const project = (values: number[]) => phase.interpolate({ inputRange: SAMPLES, outputRange: values, extrapolate: 'clamp' });
  const height = kind === 'palm' ? 200 : kind === 'rock' ? 62 : kind === 'post' ? 65 : 62;
  const width = kind === 'palm' ? 130 : kind === 'rock' ? 110 : kind === 'post' ? 12 : 5;
  return <Animated.View style={{ position: 'absolute', left: w / 2 - width / 2, top: -height / 2,
    opacity: phase.interpolate({ inputRange: [0, .10, .985, 1], outputRange: [0, 1, 1, 0] }),
    transform: [
      { translateX: project(depths.map(p => kind === 'rock' ? -roadHalf(w, p) - (width / 2 + 16) * p : lateral * roadHalf(w, p))) },
      { translateY: project(depths.map(p => groundY(h, p) - (kind === 'stripe' ? 0 : height * p / 2))) },
      { scale: project(depths) },
    ] }}>
    {kind === 'palm' ? <Palm /> : kind === 'rock' ? <CoastalRock /> : kind === 'post' ? <View style={{ height, width, borderRadius: 3, backgroundColor: '#fff3d0', borderBottomWidth: 36, borderColor: '#d99f71' }}><View style={{ height: 9, backgroundColor: '#f58a48', marginTop: 8 }} /></View> : <Animated.View style={{ width, height, backgroundColor: '#fff0cc', opacity: .85, transform: [{ skewX: `${dividerSkew(w, h, lateral)}deg` }, { scaleY: project(depths) }] }} />}
  </Animated.View>;
}

function EncounterLayer({ race, paused, w, h }: { race: Race; paused: boolean; w: number; h: number }) {
  const [passage] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (race.phase !== 'feedback') { passage.setValue(0); return; }
    if (paused) return;
    const fade = Animated.timing(passage, { toValue: 1, duration: 650, easing: Easing.out(Easing.quad), ...native });
    fade.start(); return () => fade.stop();
  }, [race.phase, paused, passage]);
  const [approach] = useState(() => new Animated.Value(race.elapsed / APPROACH_MS));
  // Scene skips clock-only renders. Resample on encounter/lane/pause transitions.
  useEffect(() => {
    if (race.phase !== 'approach') { approach.setValue(1); return; }
    approach.setValue(Math.min(1, race.elapsed / APPROACH_MS));
    if (paused) return;
    const motion = Animated.timing(approach, { toValue: 1, duration: Math.max(0, APPROACH_MS - race.elapsed), easing: Easing.linear, ...native });
    motion.start(); return () => motion.stop();
  }, [approach, race, paused]);
  if (race.phase === 'finished') return null;
  const depths = SAMPLES.map(encounterDepth);
  const labelWidth = Math.min(110, w * .26);
  const project = (values: number[]) => approach.interpolate({ inputRange: SAMPLES, outputRange: values });
  return <>{LANES.map(lane => <Animated.View key={lane} style={{ position: 'absolute', left: w / 2 - 55, top: -105,
    transform: [{ translateX: project(depths.map(p => laneX(w, lane, p) - w / 2)) }, { translateY: project(depths.map(p => groundY(h, p))) }] }}>
    <Animated.View style={{ width: 110, height: 105, justifyContent: 'flex-end', alignItems: 'center', transformOrigin: 'bottom center', transform: [{ scale: project(depths.map(p => p * 1.32)) }] }}>
      {lane === race.encounter.blocked ? (race.phase === 'approach' ? <Obstacle type={race.encounter.obstacle} /> : null) : null}
    </Animated.View>
    {lane !== race.encounter.blocked && <Animated.View style={{ position: 'absolute', bottom: 22, left: (110 - labelWidth) / 2, width: labelWidth, height: 74, alignItems: 'center', opacity: passage.interpolate({ inputRange: [0, .25, 1], outputRange: [1, 1, 0] }), transformOrigin: 'bottom center', transform: [{ translateY: approach.interpolate({ inputRange: SAMPLES, outputRange: SAMPLES.map(t => Math.sin(t * Math.PI * 4) * 3) }) }, { scale: Animated.multiply(project(depths.map(p => .54 + p * .62)), passage.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] })) }] }}>
      <View style={[s.wordPlaque, { width: labelWidth }, race.phase === 'feedback' && (lane === race.encounter.correct ? s.signCorrect : lane === race.lane ? s.signWrong : undefined)]}><View style={[s.signInset, race.phase === 'feedback' && { backgroundColor: 'transparent' }]}><View style={s.glassShine} /><View style={s.glassHighlight} /><Text numberOfLines={1} adjustsFontSizeToFit style={[s.wordText, { fontSize: Math.min(19, labelWidth * .17) }]}>{lane === race.encounter.correct ? race.encounter.word.en : race.encounter.word.distractor}</Text></View></View>
    </Animated.View>}
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
      Animated.timing(bank, { toValue: reduced ? 0 : direction * 2, duration: 90, ...native }),
      Animated.spring(bank, { toValue: 0, stiffness: 170, damping: 13, ...native }),
    ]);
    lean.start(); return () => { steer.stop(); lean.stop(); };
  }, [lane, paused, reduced, position, bank]);
  useEffect(() => {
    if (paused || reduced) return;
    const suspension = Animated.loop(Animated.sequence([
      Animated.timing(bounce, { toValue: -.35, duration: 70, easing: Easing.inOut(Easing.sin), ...native }),
      Animated.timing(bounce, { toValue: .35, duration: 80, easing: Easing.inOut(Easing.sin), ...native }),
    ]));
    suspension.start(); return () => suspension.stop();
  }, [paused, reduced, bounce]);
  useEffect(() => {
    if (paused || !feedback || reduced) return;
    const values = feedback === 'correct' ? [0] : [2, -1, 0];
    const reaction = Animated.sequence(values.map(value => Animated.timing(impact, { toValue: value, duration: 90, ...native })));
    reaction.start(); return () => reaction.stop();
  }, [feedback, paused, reduced, impact]);
  const carWidth = Math.min(140, w * .29);
  const ground = groundY(h, .72);
  const spacing = roadHalf(w, .72) * 2 / 3;
  return <Animated.View style={{ position: 'absolute', left: w / 2 - carWidth / 2, top: ground - carWidth * .69,
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
    {Array.from({ length: 24 }, (_, i) => [-1, 1].map(side => <WorldItem key={`stripe-${i}-${side}`} travel={travel} offset={i / 24} lateral={side / 3} w={w} h={h} kind="stripe" />))}
    {Array.from({ length: 12 }, (_, i) => [-1, 1].map(side => <WorldItem key={`post-${i}-${side}`} travel={travel} offset={i / 12} lateral={side * 1.12} w={w} h={h} kind="post" />))}
    {[.05, .30, .55, .80].map((offset, i) => <WorldItem key={`rock-${i}`} travel={travel} offset={offset} lateral={-1.3} w={w} h={h} kind="rock" />)}
    {Array.from({ length: 4 }, (_, i) => <WorldItem key={`palm-${i}`} travel={travel} offset={i / 4 + .06} lateral={1.3} w={w} h={h} kind="palm" />)}
    {race && <EncounterLayer race={race} paused={paused} w={w} h={h} />}
    <Player lane={race?.lane ?? 1} paused={paused} reduced={reduced} w={w} h={h} feedback={feedback} />
    {feedback && <View style={[s.edgeTint, { borderColor: feedback === 'correct' ? '#67e6b255' : '#ed706555' }]} />}
  </View>;
}, (before, after) => before.paused === after.paused && before.race?.id === after.race?.id && before.race?.lane === after.race?.lane && before.race?.phase === after.race?.phase && before.race?.answers.length === after.race?.answers.length);

const s = StyleSheet.create({
  wordPlaque: { height: 74, padding: 3, backgroundColor: '#287da45c', borderRadius: 12, borderWidth: 2, borderColor: '#a9e7fb', boxShadow: '0 0 15px #56caff99, 0 3px 12px #112e4533' },
  signCorrect: { backgroundColor: '#0b674e', borderColor: '#a2ffcf', boxShadow: '0 0 16px #50eca888' },
  signWrong: { backgroundColor: '#862f39', borderColor: '#ffb0a5', boxShadow: '0 0 16px #f5757588' },
  signInset: { flex: 1, overflow: 'hidden', borderRadius: 8, borderWidth: 1, borderColor: '#bdefff70', backgroundColor: '#24688760', justifyContent: 'center', paddingHorizontal: 4 },
  wordText: { fontWeight: '900', color: '#f3fbff', textAlign: 'center', textShadowColor: '#163b59', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 3 },
  glassShine: { position: 'absolute', left: '18%', top: -30, width: '19%', height: 145, backgroundColor: '#e8faff26', transform: [{ rotate: '29deg' }] },
  glassHighlight: { position: 'absolute', top: 0, left: 3, right: 3, height: 1, backgroundColor: '#e8faffb0' },
  glow: { position: 'absolute', bottom: 0, left: -6, height: 30, borderRadius: 60 },
  edgeTint: { ...StyleSheet.absoluteFill, borderWidth: 5 },
});


