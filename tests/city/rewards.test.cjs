const assert=require('node:assert/strict');
const {test}=require('node:test');
const {createRun,advanceGame}=require('../../.qa/geometry/gameplay/engine.js');
const {routeTarget}=require('../../.qa/geometry/gameplay/patterns.js');
const {gameplay}=require('../../.qa/geometry/config/gameplay.js');
const {createSceneLayout}=require('../../.qa/geometry/geometry/perspective.js');
const {scene}=require('../../.qa/geometry/config/visual.js');
function toQuestion(state){
  for(let i=0;i<2000 && state.phase!=='question';i++) state=advanceGame(state,1/120,
    state.phase==='traffic'?routeTarget(state.plan,state.plan.initialLateral,state.phaseTime):Math.round(state.lateral));
  assert.equal(state.phase,'question'); return state;
}
function answer(state,correct=true){
  const target=correct?state.question.correctLane:(state.question.correctLane===0?1:0);
  for(let i=0;i<500 && state.phase==='question';i++) state=advanceGame(state,1/120,target);
  return state;
}

test('a vocabulary error returns after three intervening questions, not immediately',()=>{
  let state=toQuestion(createRun(154)); const missed=state.question.id;
  state=answer(state,false);
  for(let i=0;i<3;i++) {
    state=toQuestion(state); assert.notEqual(state.question.id,missed);
    state=answer(state);
  }
  state=toQuestion(state); assert.equal(state.question.id,missed);
  state=answer(state); state=toQuestion(state); assert.notEqual(state.question.id,missed);
});

test('three correct answers trigger nitro through the whole next section without changing distance',()=>{
  let state=createRun(751);
  for(let i=0;i<3;i++) state=answer(toQuestion(state));
  assert.equal(state.nitroCount,1);
  assert.ok(Math.abs(state.nitroUntil-state.elapsed-gameplay.nitroSeconds)<1e-8);
  let without={...state,nitroUntil:0}, extended=false;
  for(let i=0;i<3000 && state.phase!=='question';i++) {
    const target=state.phase==='traffic'?routeTarget(state.plan,state.plan.initialLateral,state.phaseTime):Math.round(state.lateral);
    const phase=state.phase;
    state=advanceGame(state,1/120,target); without=advanceGame(without,1/120,target);
    assert.equal(state.distance,without.distance);
    if(phase==='feedback' && state.phase==='traffic') {
      assert.ok(Math.abs(state.nitroUntil-state.elapsed-state.plan.duration)<1e-8,'nitro covers the new section');
      extended=true;
    }
  }
  assert.ok(extended); assert.equal(state.phase,'question');
  assert.ok(state.nitroUntil===0 || state.elapsed>=state.nitroUntil-1/60,'nitro ends with its section');
  const fresh=createRun(751,2); assert.equal(fresh.nitroUntil,0); assert.equal(fresh.nitroCount,0);
});

test('nitro ignores crashes and its magnet pulls a coin from another lane into the car',()=>{
  const setup=(nitroUntil)=>({...createRun(11),nitroUntil,coins:[{id:50,lane:1,position:0.9}],
    objects:[{id:51,kind:'barrier',lane:0,position:0.22,speed:0,contacted:false}]});
  let boosted=setup(5), plain=setup(0);
  for(let i=0;i<96;i++) { boosted=advanceGame(boosted,1/120,0); plain=advanceGame(plain,1/120,0); }
  assert.equal(boosted.crashes,0); assert.equal(boosted.lives,3); assert.equal(boosted.coinsCollected,1);
  assert.equal(plain.crashes,1); assert.equal(plain.coinsCollected,0,'without nitro a coin in another lane is missed');
});

test('a captured coin homes into the car without drifting back, even when nitro ends mid-flight',()=>{
  for(const lane of [-1,1]) {
    // Nitro lasts only long enough to capture the coin, which is still well ahead.
    let state={...createRun(11),nitroUntil:0.05,objects:[],coins:[{id:60,lane,position:1.3}]};
    let previous=Math.abs(lane), steps=0;
    for(;steps<120 && state.coinsCollected===0;steps++) {
      state=advanceGame(state,1/120,0);
      const coin=state.coins[0];
      if(!coin) break;
      const offset=Math.abs(coin.lateral ?? coin.lane);
      assert.ok(offset<=previous+1e-9,`coin moved back toward its lane (${previous} → ${offset})`);
      previous=offset;
    }
    assert.equal(state.nitroUntil,0,'the nitro ended before the coin arrived');
    assert.equal(state.coinsCollected,1);
    assert.equal(state.coins.length,0);
  }
});

test('a collision preserves vocabulary streak and its future reward',()=>{
  let state=createRun(11);
  state={...state,streak:2,coins:[],objects:[{id:12,lane:0,kind:'barrier',position:0.1,speed:0,contacted:false}]};
  state=advanceGame(state,0.2,0);
  assert.equal(state.crashes,1); assert.equal(state.streak,2);
});

test('visible player width grows 20–25 percent and still fits one lane at every size',()=>{
  for(const [width,height] of [[320,568],[390,844],[540,911]]) {
    const layout=createSceneLayout(width,height,{top:20,bottom:20,left:0,right:0},3);
    const lane=layout.camera.nearLaneWidth/layout.playerDepth;
    const visible=layout.player.width*(scene.player.contentRight-scene.player.contentLeft);
    const previous=lane*.78*(1172/1254);
    assert.ok(visible/previous>=1.20 && visible/previous<=1.25);
    assert.ok(visible<lane); assert.ok(gameplay.playerHalfWidth*2<visible/lane);
    assert.equal(layout.player.width,layout.player.height);
  }
});

test('all three answers remain reachable after every traffic exit without any collision corridor',()=>{
  for(let seed=1;seed<=30;seed++) {
    const initial=toQuestion(createRun(seed*657));
    for(const lane of [-1,0,1]) {
      let state=initial;
      for(let i=0;i<481;i++) state=advanceGame(state,1/120,lane);
      assert.equal(state.selectedLane,lane); assert.equal(state.correct+state.errors,1);
      assert.equal(state.crashes,0); assert.equal(state.objects.length+state.coins.length,0);
    }
  }
});
