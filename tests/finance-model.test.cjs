const test=require('node:test');
const assert=require('node:assert/strict');
const F=require('../business-summary/private/finance-model.js');
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} != ${expected}`);

test('prices match the six live HandC offers',()=>{
  assert.deepEqual(F.prices,{fullDay:70,sunrise:30,sunset:30,weekly:200,monthly:500,founding:3000});
});
test('startup includes deposits, stock and contingency, then a separate fixed-cost reserve',()=>{
  const p=F.project();
  near(p.setup.subtotal,408000);near(p.setup.contingency,40800);near(p.setup.total,448800);
  near(p.setup.equityOnlyCash,51200);near(p.steady.fixed.total,39769.32);
  near(p.recommendedFunding,568107.96);near(p.fundingGap,68107.96);
});
test('base-case visits do not charge members again for their entries',()=>{
  const p=F.project(),m=p.steady;
  near(m.visits,720+64+350+800+24);
  near(m.revenue.monthly,35*500);near(m.revenue.founding,80*3000/12);
  near(m.cashRevenue,66866.2);near(m.costs,55758.486);near(m.cashSurplus,11107.714);
});
test('annual-only receipts occur once; recognition and payment fees are not repeated',()=>{
  const p=F.project('base',{}, {fullDay:0,sunrise:0,sunset:0,weeklyOrders:0,monthlyMembers:0,foundingMembers:10,juiceAttach:0,merchUnits:0,events:0});
  near(p.prepaidGross,30000);near(p.prepaidFees,910);near(p.prepaidNet,29090);
  near(p.steady.cashRevenue,0);near(p.steady.earnedRevenue,2500);
  near(p.steady.variableLines.find(l=>l.name.startsWith('Payment')).amount,0);
  near(p.firstYear.cashReceipts,30000);near(p.firstYear.earnedRevenue,30000);
  near(p.months[11].deferredFounding,0);
});
test('event tickets already include admission and are counted once',()=>{
  const p=F.project('base',{}, {fullDay:0,sunrise:0,sunset:0,weeklyOrders:0,monthlyMembers:0,foundingMembers:0,juiceAttach:0,merchUnits:0,events:2,eventGuests:12});
  near(p.steady.visits,24);near(p.steady.revenue.events,2160);near(p.steady.dayEntries,0);
  near(p.steady.revenue.fullDay+p.steady.revenue.sunrise+p.steady.revenue.sunset,0);
});
test('growth pays for additional staff and energy, including employer loading',()=>{
  const p=F.project('growth');
  near(p.steady.fixed.lines.find(l=>l.name==='Staff wages').amount,18600);
  near(p.steady.fixed.lines.find(l=>l.name==='Employer on-cost allowance').amount,2790);
  near(p.steady.fixed.electricity,(30*300*1.2*.5068+20)*1.1);
  near(p.steady.fixed.total,46832.784);
});
test('closed days reduce day-pass trading but do not switch off monthly plant costs',()=>{
  const normal=F.project(),short=F.project('base',{days:26});
  near(short.steady.fixed.electricity,normal.steady.fixed.electricity);
  near(short.steady.fixed.total,normal.steady.fixed.total);
  near(short.steady.dayEntries,24*26);
  assert.ok(short.steady.dailyFixed>normal.steady.dailyFixed);
});
test('opening and monthly cash reconcile, with and without annual advances',()=>{
  for(const s of F.scenarios){
    const p=F.project(s.id);
    near(p.firstYear.closingCash,p.config.equity-p.setup.total+p.firstYear.cashReceipts-p.prepaidFees-p.firstYear.operatingCosts);
    near(p.firstYear.closingCash-p.firstYear.closingWithoutPrepay,p.prepaidNet);
    near(p.firstYear.earnedResult,p.firstYear.earnedRevenue-p.firstYear.operatingCosts);
  }
});
test('ordinary demand ramps while founding visits begin at opening',()=>{
  const p=F.project();
  near(p.months[0].demand,.4);near(p.months[5].demand,1);
  near(p.months[11].cashRevenue,p.steady.cashRevenue);
  near(p.months[0].revenue.founding,p.steady.revenue.founding);
  assert.ok(p.months[0].cashRevenue<p.steady.cashRevenue);
});
test('founding allocation is capped at 200 and zero-sales cash shortfalls stay finite',()=>{
  assert.equal(F.project('base',{}, {foundingMembers:500}).scenario.foundingMembers,200);
  const p=F.project('base',{}, {fullDay:0,sunrise:0,sunset:0,weeklyOrders:0,monthlyMembers:0,foundingMembers:0,juiceAttach:0,merchUnits:0,events:0});
  assert.equal(p.steady.cashBreakEven,null);assert.equal(p.steady.breakEvenVisitsPerDay,null);
  assert.ok(p.months.every(m=>Number.isFinite(m.balance)));assert.ok(p.minimumBalance<0);
});
test('quoted startup replacements and downside losses flow through the model',()=>{
  const q=F.project('base',{}, {},{pools:150000});near(q.setup.total,481800);
  const p=F.project('conservative');near(p.steady.netBurn,10218.828);assert.ok(p.firstYear.closingCash<0);
});
