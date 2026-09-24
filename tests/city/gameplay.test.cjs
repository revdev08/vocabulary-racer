const assert = require('node:assert/strict');
const { test } = require('node:test');
const { vocabulary } = require('../../.qa/geometry/data/vocabulary.js');
const { gameplay, objectVisuals } = require('../../.qa/geometry/config/gameplay.js');
const { createRun, advanceGame, makeQuestion, sweptContact } = require('../../.qa/geometry/gameplay/engine.js');
const { createSceneLayout } = require('../../.qa/geometry/geometry/perspective.js');
const { objectProjection, portalProjection, portalTone } = require('../../.qa/geometry/geometry/entities.js');
const { advanceClock } = require('../../.qa/geometry/motion/simulation.js');
const { routeTarget } = require('../../.qa/geometry/gameplay/patterns.js');
const close=(a,b,e=1e-6)=>assert.ok(Math.abs(a-b)<e, `${a} != ${b}`);
function advance(state, seconds, target=0, hz=120) {
  for(let t=0;t<seconds-1e-8;t+=1/hz) state=advanceGame(state,Math.min(1/hz,seconds-t),target);
  return state;
}
function avoid(state) {
  return [-1,0,1].find(l=>!state.objects.some(o=>o.lane===l)) ?? 0;
}
function reachQuestion(state) {
  for(let i=0;i<2000 && state.phase!=='question';i++) state=advanceGame(state,1/120,
    state.phase==='traffic' ? routeTarget(state.plan,state.plan.initialLateral,state.phaseTime) : Math.round(state.lateral));
  assert.equal(state.phase,'question');
  return state;
}

test('all imported and introductory local questions have unique IDs, answers and unambiguous distractors',()=>{
  assert.equal(vocabulary.length,3862);
  assert.equal(new Set(vocabulary.map(q=>q.id)).size,vocabulary.length);
  for(const q of vocabulary) assert.equal(new Set([q.correct,...q.distractors].map(s=>s.toLowerCase())).size,3);
  assert.deepEqual(vocabulary.slice(0,10).map(q=>`${q.spanish} — ${q.correct}`.toLowerCase()),[
    'Casa — House','Perro — Dog','Agua — Water','Sol — Sun','Libro — Book','Escuela — School',
    'Comida — Food','Amigo — Friend','Luna — Moon','Frío — Cold'].map(value => value.toLowerCase()));
});

test('shuffling preserves options and distributes correct answers across all lanes',()=>{
  const lanes=new Set(); let seed=37, previous=9;
  for(let i=0;i<100;i++) {
    const result=makeQuestion(i,seed,previous), q=result.question;
    assert.equal(q.options[q.correctLane+1],q.correct);
    assert.equal(new Set(q.options).size,3);
    assert.notEqual(q.correctLane,previous);
    lanes.add(q.correctLane); previous=q.correctLane; seed=result.seed;
  }
  assert.equal(lanes.size,3);
});

test('safe traffic generation leaves a reachable route for hundreds of seeds',()=>{
  for(let seed=1;seed<=200;seed++) {
    let state=createRun(seed*971);
    assert.equal(state.plan.encounters.length,6);
    assert.equal(state.plan.route.length,6);
    const times=state.plan.encounters.map(o=>o.time);
    assert.ok(times[0]>=2.1 && times[1]-times[0]>=gameplay.encounterGapSeconds);
    state=reachQuestion(state);
    assert.equal(state.lives,3); assert.equal(state.crashes,0);
    assert.equal(state.objects.length,0);
  }
});

test('four legible seconds are reserved and changing lane is not an answer',()=>{
  let state=reachQuestion(createRun(81));
  const question=state.question;
  state=advance(state,1.8,-1); assert.equal(state.correct+state.errors,0);
  state=advance(state,1.8,1); assert.equal(state.correct+state.errors,0);
  state=advance(state,0.39,question.correctLane);
  assert.equal(state.phase,'question'); assert.equal(state.objects.length,0);
  state=advance(state,0.02,question.correctLane);
  assert.equal(state.phase,'feedback'); assert.equal(state.correct,1);
  assert.equal(state.score,100); assert.equal(state.streak,1);
  const answered=state.correct+state.errors;
  state=advance(state,0.7,-question.correctLane);
  assert.equal(state.correct+state.errors,answered,'row may be scored only once');
});

test('crossing uses actual interpolated car position, not the newest steering target',()=>{
  let state=reachQuestion(createRun(49));
  state={...state,lateral:-1,portalPosition:state.distance+0.0005};
  const result=advanceGame(state,1/120,1);
  assert.equal(result.selectedLane,-1);
  assert.equal(result.correct+result.errors,1);
});

test('wrong translations consume a life, reset streak and reveal the correction',()=>{
  let state=reachQuestion(createRun(2));
  const wrong=state.question.correctLane===1?0:1;
  state={...state,streak:4};
  state=advance(state,4.01,wrong);
  assert.equal(state.errors,1); assert.equal(state.crashes,0); assert.equal(state.lives,2);
  assert.equal(state.streak,0); assert.equal(state.score,0);
  assert.equal(state.feedback.kind,'wrong');
  assert.ok(state.feedback.message.includes(state.question.correct));
});

test('contact removes only one life and protects against overlapping repeated contacts',()=>{
  let state=createRun(1);
  state={...state,objects:[0,1].map(id=>({id,kind:'barrier',lane:0,position:0.22,speed:0,contacted:false}))};
  state=advance(state,0.4,0);
  assert.equal(state.crashes,1); assert.equal(state.lives,2);
  state=advance(state,1.3,0);
  assert.equal(state.crashes,1);
  state={...state,objects:[{id:3,kind:'traffic',lane:0,position:state.distance+0.22,speed:0,contacted:false}]};
  state=advance(state,0.2,0);
  assert.equal(state.crashes,2); assert.equal(state.lives,1);
});

test('swept collision catches contact between frames and ignores transparent margins',()=>{
  assert.ok(sweptContact(0,0,-1,1,0.59,0.185,0.105));
  assert.ok(!sweptContact(0.72,0.72,-1,1,0.59,0.185,0.105));
  assert.ok(!sweptContact(0,1,-2,-1,0.59,0.185,0.105));
  const l=createSceneLayout(390,844,{top:59,bottom:34,left:0,right:0});
  for(const kind of ['traffic','barrier']) {
    const o={id:1,kind,lane:1,position:3,speed:0,contacted:false};
    const p=objectProjection(l,o,1), b=objectVisuals[kind];
    close(p.y+p.size*b.bottom,p.foot.y);
    close(p.visibleWidth,p.size*(b.right-b.left));
    assert.ok(b.halfWidth*2<b.visibleWidth);
    assert.ok(objectProjection(l,o,2).size>p.size);
  }
});

test('portals share one depth, start readable, and are neutral before crossing',()=>{
  const state=reachQuestion(createRun(37));
  for(const [width,height,top,bottom] of [[320,568,20,16],[390,844,59,34],[540,911,0,0]]) {
    const l=createSceneLayout(width,height,{top,bottom,left:0,right:0});
    const portals=[-1,0,1].map(lane=>portalProjection(l,state,lane));
    portals.forEach((p,i)=>{
      close(p.foot.y,portals[0].foot.y);
      assert.ok(p.width>=53,'all options readable at appearance');
      assert.ok(p.x>=0 && p.x+p.width<=width);
      assert.ok(p.y>l.prompt.y+l.prompt.height+10);
      assert.equal(portalTone(state,i-1),'neutral');
    });
  }
});

test('a full run ends at three vocabulary errors, freezes and restarts cleanly',()=>{
  let state=createRun(344);
  for(let i=0;i<3;i++) {
    state=reachQuestion(state);
    const wrong=state.question.correctLane===0?1:0;
    state=advance(state,4.02,wrong);
    assert.equal(state.phase,'feedback','even the last error must be explained first');
    state=advance(state,gameplay.wrongFeedbackSeconds+0.02,wrong);
  }
  assert.equal(state.phase,'gameOver'); assert.equal(state.lives,0);
  assert.equal(state.errors,3); assert.equal(state.crashes,0);
  assert.strictEqual(advanceGame(state,0.2,-1),state);
  const fresh=createRun(567,state.runId+1);
  assert.equal(fresh.lives,3); assert.equal(fresh.score+fresh.errors+fresh.crashes+fresh.correct+fresh.streak,0);
  assert.equal(fresh.distance+fresh.elapsed+fresh.lateral+fresh.phaseTime,0);
  assert.equal(fresh.question,null); assert.equal(fresh.feedback,null); assert.equal(fresh.invulnerableUntil,0);
});

test('ten correct rounds remain survivable and award 1000 points with no errors',()=>{
  let state=createRun(103);
  const seen=[];
  for(let i=0;i<10;i++) {
    state=reachQuestion(state); seen.push(state.question.id);
    state=advance(state,4.01,state.question.correctLane);
    assert.equal(state.correct,i+1);
    state=advance(state,gameplay.feedbackSeconds+0.01,state.selectedLane);
  }
  assert.equal(new Set(seen).size,10);
  assert.equal(state.lives,3); assert.equal(state.crashes+state.errors,0);
  assert.equal(state.score,1000); assert.equal(state.streak,10);
});

test('question timing and scoring agree at 30, 60 and 120 Hz',()=>{
  const initial=reachQuestion(createRun(192));
  const runs=[30,60,120].map(hz=>advance(initial,4.2,initial.question.correctLane,hz));
  for(const state of runs) {
    assert.equal(state.correct,1); assert.equal(state.score,100); assert.equal(state.lives,3);
    assert.equal(state.phase,'feedback');
    close(state.distance,runs[0].distance);
    close(state.phaseTime,runs[0].phaseTime);
  }
});

test('pause and a long background gap cannot expire a pending question',()=>{
  let state=reachQuestion(createRun(197));
  state=advance(state,3.9,state.question.correctLane);
  const pausedState=state;
  let clock=advanceClock(1000,1016,false);
  state=advanceGame(state,clock.seconds,0);
  assert.strictEqual(state,pausedState);
  clock=advanceClock(clock.timestamp,601016,true);
  state=advanceGame(state,clock.seconds,0);
  assert.strictEqual(state,pausedState);
  assert.equal(state.correct+state.errors,0);
  clock=advanceClock(clock.timestamp,601032,true);
  state=advanceGame(state,clock.seconds,state.question.correctLane);
  assert.equal(state.phase,'question');
  state=advance(state,0.09,state.question.correctLane);
  assert.equal(state.correct,1); assert.equal(state.errors,0);
});
