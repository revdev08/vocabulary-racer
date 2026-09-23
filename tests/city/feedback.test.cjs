const assert=require('node:assert/strict');
const {test}=require('node:test');
const {createRun,advanceGame,gameView}=require('../../.qa/geometry/gameplay/engine.js');
const {routeTarget,phaseSpeed}=require('../../.qa/geometry/gameplay/patterns.js');
const {feedbackDuration,answerMotion,answerCardLayout,createAnswerCue,answerCueMotion}=require('../../.qa/geometry/gameplay/answerFeedback.js');
const {gameplay}=require('../../.qa/geometry/config/gameplay.js');
const {createSceneLayout}=require('../../.qa/geometry/geometry/perspective.js');
const {projectEntities}=require('../../.qa/geometry/geometry/worldEntities.js');
const {objectProjection,coinProjection}=require('../../.qa/geometry/geometry/entities.js');

function question() {
  let state=createRun(81);
  for(let i=0;i<1800 && state.phase==='traffic';i++) state=advanceGame(state,1/120,routeTarget(state.plan,0,state.phaseTime));
  assert.equal(state.phase,'question'); return state;
}
function cross(correct,lastLife=false) {
  let state=question();
  if(lastLife) state={...state,lives:1};
  const lane=correct?state.question.correctLane:(state.question.correctLane===1?0:1);
  while(state.phase==='question') state=advanceGame(state,1/120,lane);
  return state;
}

test('correct and wrong cues have distinct readable durations and no hazards during the explanation',()=>{
  for(const correct of [true,false]) {
    let state=cross(correct); const score=state.score, answers=state.correct+state.errors;
    const duration=feedbackDuration(state.feedback.kind);
    assert.equal(duration,correct?1.15:1.75);
    while(state.phaseTime<duration-.02) {
      state=advanceGame(state,1/120,0);
      assert.equal(state.phase,'feedback'); assert.equal(state.score,score);
      assert.equal(state.correct+state.errors,answers);
      assert.equal(state.objects.length+state.coins.length,0);
    }
    const speed=phaseSpeed('feedback',duration,0,2,duration);
    assert.equal(speed,2,'next traffic starts without a speed discontinuity');
    for(let i=0;i<5;i++) state=advanceGame(state,1/120,0);
    assert.equal(state.phase,'traffic');
  }
});

test('last wrong answer pauses normally, then ends without spawning another traffic block',()=>{
  let state=cross(false,true);
  assert.equal(state.lives,0); assert.equal(state.phase,'feedback');
  const round=state.round, saved=state;
  assert.strictEqual(advanceGame(state,0,1),saved);
  while(state.phase==='feedback') state=advanceGame(state,1/120,0);
  assert.equal(state.phase,'gameOver'); assert.equal(state.round,round);
  assert.equal(state.objects.length+state.coins.length,0);
  assert.strictEqual(advanceGame(state,.2,1),state);
});

test('answer motion is time-driven, reduced motion stays still and symbols remain explicit',()=>{
  for(const correct of [true,false]) for(const time of [0,.05,.18,.3,.6,1]) {
    const still=answerMotion(time,correct,true);
    assert.equal(still.translateY,0); assert.equal(still.scale,1); assert.equal(still.shake,0);
    assert.equal(still.symbol,1); assert.equal(still.ring,1);
    assert.ok(answerMotion(time,correct,false).opacity>=0);
  }
  assert.equal(answerMotion(.6,true,false).symbol,1);
  assert.equal(answerMotion(.6,false,false).shake,0);
  assert.notEqual(answerMotion(.2,false,false).shake,0);
  assert.equal(answerMotion(.2,true,false).shake,0);
});

test('a faded answer never reappears while React is late unmounting it at the next traffic block',()=>{
  for(const correct of [true,false]) for(const hz of [30,60,120]) for(const reduced of [true,false]) {
    let state=cross(correct);
    // Keep rendering the same React snapshot through the UI-thread phase reset.
    const cue=createAnswerCue(gameView(state));
    let lastOpacity=1, exited=false, tailFrames=0;
    while(tailFrames<hz/2) {
      const motion=answerCueMotion(state,cue,reduced);
      assert.ok(motion.opacity<=lastOpacity+1e-9,'opacity cannot rebound during the exit');
      lastOpacity=motion.opacity;
      if(state.phase!=='feedback') {
        assert.equal(state.phase,'traffic');
        assert.equal(motion.opacity,0,'old card must stay hidden even before React unmounts it');
        assert.equal(motion.symbol,1,'a closing card cannot restart its symbol');
        assert.equal(motion.scale,1,'a closing card cannot replay its entrance');
        exited=true; tailFrames++;
      }
      state=advanceGame(state,1/hz,routeTarget(state.plan,0,state.phaseTime));
    }
    assert.ok(exited);
  }
});

test('answer cue freezes in pause and stays hidden at the final-life summary',()=>{
  let state=cross(false,true);
  const cue=createAnswerCue(gameView(state));
  state=advanceGame(state,.2,0);
  const before=answerCueMotion(state,cue,false);
  for(let i=0;i<20;i++) {
    state=advanceGame(state,0,1);
    assert.deepEqual(answerCueMotion(state,cue,false),before);
  }
  while(state.phase==='feedback') state=advanceGame(state,1/60,0);
  assert.equal(state.phase,'gameOver');
  assert.equal(answerCueMotion(state,cue,false).opacity,0);
});

test('stale, absent and collision cues cannot animate a new response or a restarted run',()=>{
  const state=cross(false), cue=createAnswerCue(gameView(state));
  assert.equal(answerCueMotion(state,cue,false).opacity,1);
  assert.equal(createAnswerCue(gameView(createRun(81))),null);
  assert.equal(createAnswerCue({...gameView(state),feedback:{...state.feedback,kind:'collision'}}),null);
  assert.equal(answerCueMotion(state,null,false).opacity,0);
  assert.equal(answerCueMotion({...state,runId:state.runId+1,elapsed:0},cue,false).opacity,0);
  assert.equal(answerCueMotion({...state,feedback:{...state.feedback,until:state.feedback.until+10}},cue,false).opacity,0);
  assert.equal(answerCueMotion({...state,feedback:{...state.feedback,kind:'correct'}},cue,false).opacity,0);
});

test('result card fits safe areas without covering the player at narrow and tall sizes',()=>{
  for(const [width,height,top,bottom] of [[320,568,20,16],[390,844,59,34],[430,932,59,34]]) {
    const layout=createSceneLayout(width,height,{top,bottom,left:0,right:0});
    const card=answerCardLayout(layout);
    assert.ok(card.left>=layout.hudLeft && card.left+card.width<=width-layout.hudRight);
    assert.ok(card.top>=layout.hudTop+80);
    assert.ok(card.top+card.height+45<layout.player.y,'room for paused banner above the car');
  }
});

test('shared entity projection preserves sprite position, depth order and both player layers',()=>{
  const layout=createSceneLayout(390,844,{top:59,bottom:34,left:0,right:0});
  const state={...createRun(81),distance:2,
    objects:[{id:1,kind:'traffic',lane:-1,position:1.95,speed:.2,contacted:false},
      {id:2,kind:'barrier',lane:1,position:4,speed:0,contacted:false}],
    coins:[{id:3,lane:0,position:3},{id:4,lane:-1,position:1.9}]};
  const projected=projectEntities(layout,state);
  assert.deepEqual(projected.map(p=>p.id),[2,3,1,4]);
  assert.deepEqual(projected.map(p=>p.front),[false,false,true,true]);
  for(const object of state.objects) {
    const p=objectProjection(layout,object,state.distance), shared=projected.find(p=>p.id===object.id);
    for(const key of ['x','y','size','opacity']) assert.equal(shared[key],p[key]);
  }
  for(const coin of state.coins) {
    const p=coinProjection(layout,coin,state.distance), shared=projected.find(p=>p.id===coin.id);
    assert.equal(shared.size,p.radius*2); assert.equal(shared.x,p.x-p.radius); assert.equal(shared.y,p.y-p.radius);
  }
});
