const assert=require('node:assert/strict');
const {test}=require('node:test');
const {makeTrafficPlan,validateRoute,routeTarget,phaseSpeed,trafficPace,maneuverStart,objectsForPlan}=require('../../.qa/geometry/gameplay/patterns.js');
const {createRun,advanceGame}=require('../../.qa/geometry/gameplay/engine.js');
const {gameplay}=require('../../.qa/geometry/config/gameplay.js');
const {driving}=require('../../.qa/geometry/config/driving.js');
const {createSceneLayout}=require('../../.qa/geometry/geometry/perspective.js');
const {objectProjection}=require('../../.qa/geometry/geometry/entities.js');

test('patterns are reproducible, vary safe lanes, and never immediately repeat',()=>{
  const used=new Set(),safe=new Set(); let previous=null;
  for(let seed=1;seed<=150;seed++) {
    const p=makeTrafficPlan(seed*12713,0,8,previous);
    assert.deepEqual(p,makeTrafficPlan(seed*12713,0,8,previous));
    assert.notEqual(p.pattern,previous); previous=p.pattern; used.add(p.pattern);
    p.route.forEach(l=>safe.add(l));
    assert.equal(p.route.length,p.encounters.length);
    assert.ok(p.encounters.every(e=>e.obstacles.length<3));
  }
  assert.deepEqual([...used].sort(),['coinDetour','double','stagger','sweep']);
  assert.equal(safe.size,3);
});

test('generated routes survive the actual engine from all lanes and mid-transition positions',()=>{
  for(let seed=1;seed<=45;seed++) for(const lateral of [-1,-0.4,0,0.4,1]) {
    let state=createRun(seed*5879);
    const plan=makeTrafficPlan(state.seed,lateral,seed%9,null);
    const {objectsForPlan}=require('../../.qa/geometry/gameplay/patterns.js');
    state={...state,lateral,plan,objects:objectsForPlan(plan,0,1)};
    for(let t=0;t<12 && state.phase==='traffic';t+=1/120) {
      state=advanceGame(state,1/120,routeTarget(plan,lateral,state.phaseTime));
    }
    assert.equal(state.phase,'question'); assert.equal(state.crashes,0,`seed ${seed}, x ${lateral}`);
    assert.equal(state.metrics.encounters,plan.encounters.length);
  }
});

test('validator rejects no-free-lane rows and impossible opposite-lane transitions',()=>{
  const obstacle=lane=>({lane,kind:'barrier'});
  assert.equal(validateRoute([{time:2,obstacles:[-1,0,1].map(obstacle)}],0),null);
  assert.equal(validateRoute([{time:2.2,obstacles:[0,1].map(obstacle)},
    {time:2.8,obstacles:[-1,0].map(obstacle)}],-1),null);
  assert.ok(validateRoute([{time:2.2,obstacles:[0,1].map(obstacle)},
    {time:4.4,obstacles:[-1,0].map(obstacle)}],-1));
});

test('driving blocks stay short so words come often: three, four, five, then six encounters',()=>{
  for(let seed=1;seed<70;seed++) {
    const intro=makeTrafficPlan(seed*41,0,0,null);
    assert.ok(intro.duration>=4.9 && intro.duration<=5.2);
    assert.equal(intro.encounters.length,gameplay.firstRoundEncounters);
    assert.equal(intro.encounters.filter(e=>e.obstacles.length===2).length,2);
    assert.equal(makeTrafficPlan(seed*41,0,1,null).encounters.length,4);
    assert.equal(makeTrafficPlan(seed*41,0,2,null).encounters.length,5);
    const more=makeTrafficPlan(seed*41,0,3,null);
    assert.equal(more.encounters.length,gameplay.advancedEncounters);
    assert.equal(makeTrafficPlan(seed*41,0,9,null).encounters.length,gameplay.advancedEncounters);
    assert.ok(more.encounters.filter(e=>e.obstacles.length===2).length>=5);
    assert.ok(more.encounters.flatMap(e=>e.obstacles).length<=gameplay.maxObjects);
    assert.equal(phaseSpeed('traffic',0,intro.duration),driving.speed);
    assert.equal(phaseSpeed('question',0,intro.duration),gameplay.decisionSpeed);
    assert.ok(Math.abs(phaseSpeed('traffic',intro.duration,intro.duration)-gameplay.decisionSpeed)<1e-8);
    assert.ok(Math.abs(phaseSpeed('feedback',gameplay.feedbackSeconds,0)-driving.speed)<1e-8);
  }
});

test('each driving block accelerates to a cap and reduces time between encounters, preserving question time',()=>{
  const speeds=[];
  for(let round=0;round<9;round++) {
    const pace=trafficPace(round); speeds.push(pace.cruiseSpeed);
    assert.ok(pace.encounterGap>=gameplay.minimumEncounterGapSeconds);
    assert.equal(phaseSpeed('question',2,7,pace.cruiseSpeed),gameplay.decisionSpeed);
    assert.ok(Math.abs(phaseSpeed('feedback',gameplay.feedbackSeconds,7,pace.cruiseSpeed)-pace.cruiseSpeed)<1e-8);
    const plan=makeTrafficPlan(741,0,round,null);
    assert.equal(plan.cruiseSpeed,pace.cruiseSpeed,'speed does not require a clean streak');
  }
  assert.deepEqual(speeds.map(s=>+s.toFixed(1)),[1.8,2.1,2.4,2.7,3,3.3,3.3,3.3,3.3]);
  assert.ok(trafficPace(0).encounterGap>trafficPace(3).encounterGap);
});

test('no lane stays empty for a complete block and the next block starts on a different lane',()=>{
  for(let seed=1;seed<=100;seed++) {
    let previous;
    for(let round=0;round<10;round++) {
      const plan=makeTrafficPlan(seed*7319+round,0,round,previous?.pattern??null,previous);
      const used=new Set(plan.encounters.flatMap(row=>row.obstacles.map(o=>o.lane)));
      assert.equal(used.size,3,`unused lane for ${seed}/${round}`);
      assert.ok(new Set(plan.route).size>1,'the safe route must require a change');
      if(previous) assert.notEqual(plan.encounters[0].obstacles[0].lane,previous.encounters[0].obstacles[0].lane);
      for(let i=1;i<plan.encounters.length;i++) {
        assert.notDeepEqual(plan.encounters[i].obstacles.map(o=>o.lane),plan.encounters[i-1].obstacles.map(o=>o.lane));
      }
      previous=plan;
    }
  }
});

// Explore every possible free-lane sequence, independently of the planner's chosen route.
function fewestRequiredChanges(encounters) {
  let routes=[{lane:-1,changes:0},{lane:0,changes:0},{lane:1,changes:0}];
  for(let i=0;i<encounters.length;i++) {
    routes=routes.flatMap(route=>[-1,0,1]
      .filter(lane=>!encounters[i].obstacles.some(o=>o.lane===lane))
      .map(lane=>({lane,changes:route.changes+(i>0 && lane!==route.lane?1:0)})));
  }
  return Math.min(...routes.map(r=>r.changes));
}

test('even the easiest route requires repeated maneuvers from the first block',()=>{
  for(let seed=1;seed<=100;seed++) for(let round=0;round<10;round++) {
    const plan=makeTrafficPlan(seed*7319,0,round,null);
    // Do not count the initial move: these are unavoidable changes BETWEEN encounters.
    assert.ok(fewestRequiredChanges(plan.encounters)>=plan.encounters.length-2,`easy corridor ${seed}/${round}`);
    assert.ok(plan.encounters.flatMap(e=>e.obstacles).length<=gameplay.maxObjects);
    assert.equal(plan.route.length,plan.encounters.length);
    for(let i=1;i<plan.route.length;i++) if(Math.abs(plan.route[i]-plan.route[i-1])===2) {
      assert.ok(plan.encounters[i].time-plan.encounters[i-1].time>=gameplay.doubleChangeLeadSeconds-1e-8);
    }
  }
});

test('rapid alternating gates are survivable at 30, 60 and 120 Hz',()=>{
  const {objectsForPlan}=require('../../.qa/geometry/gameplay/patterns.js');
  for(const round of [0,2,4,8]) for(const hz of [30,60,120]) for(const lane of [-1,0,1]) {
    const plan=makeTrafficPlan(94661,lane,round,null);
    let state={...createRun(94661),lateral:lane,plan,coins:[],objects:objectsForPlan(plan,0,1)};
    for(let i=0;i<hz*15 && state.phase==='traffic';i++) {
      state=advanceGame(state,1/hz,routeTarget(plan,lane,state.phaseTime));
    }
    assert.equal(state.phase,'question');
    assert.equal(state.crashes,0,`unfair sequence at ${hz} Hz / round ${round} / lane ${lane}`);
    assert.equal(state.lives,3);
  }
});

test('fallback keeps a reachable changing corridor instead of returning to easy isolated obstacles',()=>{
  const attempts=gameplay.plannerAttempts;
  try {
    gameplay.plannerAttempts=-1; // Exercise the deterministic last-resort construction.
    for(const round of [0,2,4,8]) for(const initial of [-1,-0.4,0,0.4,1]) {
      const plan=makeTrafficPlan(9842,initial,round,null);
      assert.equal(plan.route.length,plan.encounters.length);
      assert.ok(fewestRequiredChanges(plan.encounters)>=plan.encounters.length-2);
      assert.deepEqual(validateRoute(plan.encounters,initial,undefined,plan.cruiseSpeed),plan.route);
    }
  } finally { gameplay.plannerAttempts=attempts; }
});

test('scheduled arrivals use the chosen speed for both moving cars and fixed barriers',()=>{
  const {objectsForPlan}=require('../../.qa/geometry/gameplay/patterns.js');
  for(const round of [0,1,2,3,4,9]) {
    const plan=makeTrafficPlan(12371,0,round,null);
    const objects=objectsForPlan(plan,40,1);
    let index=0;
    for(const row of plan.encounters) for(const _ of row.obstacles) {
      const object=objects[index++];
      assert.ok(Math.abs((object.position-40)/(plan.cruiseSpeed-object.speed)-row.time)<1e-8);
    }
  }
});

test('mandatory obstacles have a recognizable silhouette before the reaction margin on narrow screens',()=>{
  const layout=createSceneLayout(320,568,{top:20,bottom:16,left:0,right:0});
  for(const kind of ['traffic','barrier']) {
    const speed=kind==='traffic'?gameplay.trafficCarSpeed:0;
    const object={id:1,kind,lane:0,position:(driving.speed-speed)*gameplay.encounterGapSeconds,speed,contacted:false};
    assert.ok(objectProjection(layout,object,0).visibleWidth>=30);
  }
});

test('holding any one lane for a whole block causes a contact at every speed level',()=>{
  const {objectsForPlan}=require('../../.qa/geometry/gameplay/patterns.js');
  for(let round=0;round<7;round++) for(const lane of [-1,0,1]) {
    const plan=makeTrafficPlan(4213+round, lane, round, null);
    let state={...createRun(4213+round), lateral:lane, plan, coins:[],objects:objectsForPlan(plan,0,1)};
    for(let i=0;i<1500 && state.phase==='traffic';i++) state=advanceGame(state,1/120,lane);
    assert.ok(state.crashes>0,`parking lane ${lane} solved round ${round}`);
  }
});

test('top-speed silhouettes are at least 24 px wide 900 ms before contact on a narrow screen',()=>{
  const layout=createSceneLayout(320,568,{top:20,bottom:16,left:0,right:0});
  const {objectVisuals}=require('../../.qa/geometry/config/gameplay.js');
  for(const kind of ['traffic','barrier']) {
    const speed=kind==='traffic'?gameplay.trafficCarSpeed:0;
    const contactLead=(gameplay.playerFront+objectVisuals[kind].rear)/(gameplay.maximumTrafficSpeed-speed);
    const position=(gameplay.maximumTrafficSpeed-speed)*(.9+contactLead);
    assert.ok(objectProjection(layout,{id:1,kind,lane:0,position,speed,contacted:false},0).visibleWidth>=24);
  }
});

test('advanced sequences contain fast adjacent bursts with readable gaps and safe double gestures',()=>{
  const variants=new Set();
  let demanding=0;
  for(let seed=1;seed<=100;seed++) {
    const plan=makeTrafficPlan(seed*1789,0,8,null);
    variants.add(plan.route.join(','));
    let quickChanges=0, releaseGaps=0;
    for(let i=1;i<plan.encounters.length;i++) {
      const gap=plan.encounters[i].time-plan.encounters[i-1].time;
      assert.ok(gap>=.6-1e-8);
      if(Math.abs(plan.route[i]-plan.route[i-1])===1 && gap<.7) quickChanges++;
      if(gap>.74) releaseGaps++;
    }
    assert.ok(quickChanges>=1,'a high-level block must actually demand fast consecutive changes');
    if(quickChanges>=2) demanding++;
    assert.ok(releaseGaps>=1,'bursts must have relief or room for a double swipe');
    assert.ok(plan.duration>=5.5 && plan.duration<=8,'short sections keep words frequent without an empty road');
  }
  assert.ok(demanding>=90,'almost every high-level block asks for two or more quick changes');
  assert.ok(variants.size>=20,'the route cannot be memorized as four fixed templates');
});

test('planner waits for physical clearance before allowing a reaction and two separate swipe intents',()=>{
  const {objectVisuals}=require('../../.qa/geometry/config/gameplay.js');
  for(const round of [0,2,5]) {
    const plan=makeTrafficPlan(91821,0,round,null);
    for(let i=1;i<plan.encounters.length;i++) for(const obstacle of plan.encounters[i-1].obstacles) {
      const speed=plan.cruiseSpeed-(obstacle.kind==='traffic'?gameplay.trafficCarSpeed:0);
      const clearsAt=plan.encounters[i-1].time+(gameplay.playerRear+objectVisuals[obstacle.kind].front)/speed;
      assert.ok(maneuverStart(plan.encounters,i,plan.cruiseSpeed)>=clearsAt+gameplay.reactionSeconds+.039);
    }
  }
});

test('late reactions have consequences at high rhythm while timely play stays possible',()=>{
  let delayedCrashes=0, earlyDelayedCrashes=0;
  for(let seed=1;seed<=24;seed++) for(const initial of [-1,0,1]) for(const round of [0,8]) {
    const plan=makeTrafficPlan(seed*5879,initial,round,null);
    for(const delay of [0,.15]) {
      let state={...createRun(seed),lateral:initial,round:round+1,plan,coins:[],objects:objectsForPlan(plan,0,1)};
      for(let frame=0;frame<2400&&state.phase==='traffic';frame++)
        state=advanceGame(state,1/120,routeTarget(plan,initial,state.phaseTime-delay));
      if(delay===0) { assert.equal(state.crashes,0); assert.equal(state.phase,'question'); }
      else if(state.crashes>0) { if(round===8) delayedCrashes++; else earlyDelayedCrashes++; }
    }
  }
  assert.ok(delayedCrashes>=60,'at least 60/72 advanced routes punish an added 150 ms delay');
  assert.ok(earlyDelayedCrashes<=8,'the opening still gives a new player room to learn the controls');
});
