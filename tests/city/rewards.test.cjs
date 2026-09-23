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

test('three correct answers trigger two seconds of cosmetic nitro without changing distance',()=>{
  let state=createRun(751);
  for(let i=0;i<3;i++) state=answer(toQuestion(state));
  assert.equal(state.nitroCount,1);
  assert.ok(Math.abs(state.nitroUntil-state.elapsed-gameplay.nitroSeconds)<1e-8);
  let without={...state,nitroUntil:0};
  for(let i=0;i<260;i++) {
    const target=state.phase==='traffic'?routeTarget(state.plan,state.plan.initialLateral,state.phaseTime):Math.round(state.lateral);
    state=advanceGame(state,1/120,target); without=advanceGame(without,1/120,target);
    assert.equal(state.distance,without.distance);
  }
  assert.ok(state.elapsed>state.nitroUntil);
  const fresh=createRun(751,2); assert.equal(fresh.nitroUntil,0); assert.equal(fresh.nitroCount,0);
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
