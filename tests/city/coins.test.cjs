const assert=require('node:assert/strict');
const {test}=require('node:test');
const {createRun,advanceGame}=require('../../.qa/geometry/gameplay/engine.js');
const {makeTrafficPlan,objectsForPlan,routeTarget}=require('../../.qa/geometry/gameplay/patterns.js');
const {makeCoins}=require('../../.qa/geometry/gameplay/coins.js');
const {gameplay}=require('../../.qa/geometry/config/gameplay.js');

test('coin routes are collectible without damage across patterns, seeds and start lanes',()=>{
  let detours=0;
  for(let seed=1;seed<=100;seed++) for(const lateral of [-1,0,1]) {
    let state=createRun(seed*643);
    const plan=makeTrafficPlan(state.seed,lateral,seed%9,null);
    const reward=makeCoins(plan,0,100);
    assert.equal(reward.coins.length,4);
    assert.equal(new Set(reward.coins.map(c=>c.lane)).size,2,'reward pairs must use different lanes');
    assert.ok(Math.abs((reward.coins[1].position-reward.coins[0].position)/plan.cruiseSpeed-0.3)<1e-8);
    if(reward.route[0]!==plan.route[0]) detours++;
    state={...state,lateral,plan,objects:objectsForPlan(plan,0,1),coins:reward.coins};
    const coinPlan={...plan,route:reward.route};
    for(let i=0;i<1800 && state.phase==='traffic';i++) {
      state=advanceGame(state,1/120,routeTarget(coinPlan,lateral,state.phaseTime));
      assert.ok(state.effects.length<=gameplay.maxEffects);
    }
    assert.equal(state.crashes,0,`unsafe reward: ${seed}/${lateral}`);
    assert.equal(state.coinsCollected,4,`unreachable coins: ${seed}/${lateral}`);
    assert.equal(state.coins.length,0);
  }
  assert.ok(detours>0);
});

test('one coin gives one reward, uses actual position, and stays separate from answer points',()=>{
  let state=createRun(1);
  state={...state,objects:[],coins:[{id:10,lane:-1,position:0.01}],lateral:1};
  state=advanceGame(state,1/120,-1);
  assert.equal(state.coinsCollected,0);
  state={...state,lateral:-1};
  state=advanceGame(state,1/120,-1);
  assert.equal(state.coinsCollected,1); assert.equal(state.coins.length,0);
  assert.equal(state.score,0); assert.equal(state.streak,0);
  for(let i=0;i<100;i++) state=advanceGame(state,1/120,-1);
  assert.equal(state.coinsCollected,1); assert.equal(state.effects.length,0);
});

test('question windows have no coins and restart clears counters and transient effects',()=>{
  let state=createRun(733);
  for(let i=0;i<1500 && state.phase==='traffic';i++) state=advanceGame(state,1/120,
    routeTarget({...state.plan,route:state.coinRoute},0,state.phaseTime));
  assert.equal(state.phase,'question'); assert.equal(state.coins.length,0); assert.equal(state.objects.length,0);
  const fresh=createRun(94,2);
  assert.equal(fresh.coinsCollected,0); assert.equal(fresh.effects.length,0);
  assert.equal(fresh.reviews.length,0); assert.equal(fresh.metrics.encounters,0);
});
