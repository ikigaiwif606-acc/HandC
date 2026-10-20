(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HandCFinance = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const prices = {fullDay:70,sunrise:30,sunset:30,weekly:200,monthly:500,founding:3000};
  const startup = [
    {id:'design',name:'Survey, design and approvals allowance',amount:15000},
    {id:'fitout',name:'Fit-out, waterproofing, plumbing and drainage',amount:110000},
    {id:'pools',name:'Two custom pools, chillers and water treatment',amount:120000},
    {id:'sauna',name:'Commercial sauna, heater and installation',amount:50000},
    {id:'electrical',name:'Electrical works, ventilation and hot water',amount:35000},
    {id:'fixtures',name:'Showers, changing rooms, basins and lockers',amount:20000},
    {id:'bar',name:'Juice-bar equipment, POS and opening technology',amount:20000},
    {id:'launch',name:'Pre-opening rent, training and launch marketing',amount:12000},
    {id:'deposits',name:'Refundable rent and utility deposits',amount:18000},
    {id:'stock',name:'Opening drinks, merch and consumables stock',amount:8000}
  ];
  const defaults = {
    days:30,hours:12,equity:500000,contingency:0.10,reserveMonths:3,
    rent:4800,staffWages:14200,payrollLoad:0.15,founderPay:5000,
    kwhPerDay:300,electricityRate:0.5068,electricityRetail:20,electricityBuffer:0.10,
    water:900,service:1800,cleaning:1000,insurance:500,software:900,marketing:2000,repairs:1500,
    visitCost:3,weeklyVisits:4,monthlyVisits:10,foundingVisits:10,
    juicePrice:16,juiceCogs:0.40,merchPrice:59,merchCogs:0.50,eventPrice:90,eventCogs:0.35,
    paymentRate:0.03,paymentFlat:1,averageStay:1.5,peakFactor:2,approvedCapacity:0,
    startupMultiplier:1
  };
  const scenarios = [
    {id:'conservative',name:'Conservative',description:'Slower adoption; protect cash and validate repeat visits.',fullDay:4,sunrise:6,sunset:6,weeklyOrders:8,monthlyMembers:20,foundingMembers:40,juiceAttach:0.30,merchUnits:10,events:1,eventGuests:10,extraWages:0,energyMultiplier:1,extraMarketing:0,startDemand:0.35,rampMonths:9},
    {id:'base',name:'Base case',description:'A repeat customer base with steady day-pass demand.',fullDay:7,sunrise:8,sunset:9,weeklyOrders:16,monthlyMembers:35,foundingMembers:80,juiceAttach:0.40,merchUnits:25,events:2,eventGuests:12,extraWages:0,energyMultiplier:1,extraMarketing:0,startDemand:0.40,rampMonths:6},
    {id:'growth',name:'Growth',description:'Stronger demand, with extra staffing and energy budget.',fullDay:12,sunrise:12,sunset:14,weeklyOrders:30,monthlyMembers:60,foundingMembers:140,juiceAttach:0.50,merchUnits:50,events:4,eventGuests:14,extraWages:4400,energyMultiplier:1.20,extraMarketing:1000,startDemand:0.50,rampMonths:6}
  ];
  const sum = values => values.reduce((total,value) => total+value,0);
  const number = (value, fallback, min=0, max=Infinity) => Number.isFinite(Number(value)) ? Math.min(max,Math.max(min,Number(value))) : fallback;
  function config(overrides={}) {
    const c={...defaults};
    for(const key of Object.keys(c)) if(key in overrides) c[key]=number(overrides[key],c[key]);
    c.days=number(c.days,30,1,30);c.hours=number(c.hours,12,1,24);
    for(const key of ['contingency','payrollLoad','juiceCogs','merchCogs','eventCogs','paymentRate']) c[key]=number(c[key],defaults[key],0,1);
    c.averageStay=number(c.averageStay,1.5,0.25,12);c.peakFactor=number(c.peakFactor,2,1,5);
    return c;
  }
  function caseConfig(id,overrides={}) {
    const source=scenarios.find(s=>s.id===id)||scenarios[1];
    const s={...source};
    for(const key of Object.keys(source)) if(typeof source[key]==='number' && key in overrides) s[key]=number(overrides[key],source[key]);
    s.foundingMembers=Math.min(200,Math.floor(s.foundingMembers));
    s.juiceAttach=number(s.juiceAttach,source.juiceAttach,0,1);
    s.startDemand=number(s.startDemand,source.startDemand,0,1);
    s.rampMonths=Math.round(number(s.rampMonths,source.rampMonths,1,12));
    return s;
  }
  function launch(c,overrides={}) {
    const lines=startup.map(line=>({...line,amount:number(overrides[line.id],line.amount)*c.startupMultiplier}));
    const subtotal=sum(lines.map(line=>line.amount));
    const contingency=subtotal*c.contingency;
    return {lines,subtotal,contingency,total:subtotal+contingency,equityOnlyCash:c.equity-subtotal-contingency};
  }
  function fixedCosts(c,s) {
    // A 30-day planning month includes closed days: chillers and pumps still run.
    const electricity=(30*c.kwhPerDay*s.energyMultiplier*c.electricityRate+c.electricityRetail)*(1+c.electricityBuffer);
    const wages=c.staffWages+s.extraWages;
    const lines=[
      ['Rent',c.rent],['Staff wages',wages],['Employer on-cost allowance',wages*c.payrollLoad],
      ['Working founders: total loaded pay budget',c.founderPay],['Electricity, including budget buffer',electricity],
      ['Water and sewerage allowance',c.water],['Pool / sauna servicing',c.service],['Cleaning and waste',c.cleaning],
      ['Insurance allowance',c.insurance],['Software, internet and bookkeeping',c.software],['Marketing',c.marketing+s.extraMarketing],
      ['Repairs and small replacements allowance',c.repairs]
    ].map(([name,amount])=>({name,amount}));
    return {lines,electricity,total:sum(lines.map(line=>line.amount))};
  }
  function month(c,s,demand=1) {
    const f=Math.min(1,Math.max(0,demand));
    const fullEntries=s.fullDay*c.days*f,sunriseEntries=s.sunrise*c.days*f,sunsetEntries=s.sunset*c.days*f;
    const dayEntries=fullEntries+sunriseEntries+sunsetEntries;
    const weeklyOrders=s.weeklyOrders*f,monthlyMembers=s.monthlyMembers*f;
    const weeklyEntries=weeklyOrders*c.weeklyVisits,monthlyEntries=monthlyMembers*c.monthlyVisits,foundingEntries=s.foundingMembers*c.foundingVisits;
    // Event guests are additional visits; their pass includes access, so no day pass is sold again.
    const eventGuests=s.events*s.eventGuests*f;
    const visits=dayEntries+weeklyEntries+monthlyEntries+foundingEntries+eventGuests;
    const drinks=visits*s.juiceAttach,merchUnits=s.merchUnits*f;
    const revenue={fullDay:fullEntries*prices.fullDay,sunrise:sunriseEntries*prices.sunrise,sunset:sunsetEntries*prices.sunset,
      weekly:weeklyOrders*prices.weekly,monthly:monthlyMembers*prices.monthly,founding:s.foundingMembers*prices.founding/12,
      juice:drinks*c.juicePrice,merch:merchUnits*c.merchPrice,events:eventGuests*c.eventPrice};
    const earnedRevenue=sum(Object.values(revenue));
    const cashRevenue=earnedRevenue-revenue.founding;
    // Separate checkouts per pass, drink, merchandise unit and event ticket: conservative fee allowance.
    const transactions=dayEntries+weeklyOrders+monthlyMembers+drinks+merchUnits+eventGuests;
    const variableLines=[['Laundry and visit consumables',visits*c.visitCost],['Juice ingredients, packaging and waste',revenue.juice*c.juiceCogs],
      ['Merchandise replenishment',revenue.merch*c.merchCogs],['Event host and delivery costs',revenue.events*c.eventCogs],
      ['Payment fees on recurring receipts',cashRevenue*c.paymentRate+transactions*c.paymentFlat]].map(([name,amount])=>({name,amount}));
    const variableCosts=sum(variableLines.map(line=>line.amount));
    const fixed=fixedCosts(c,s),costs=fixed.total+variableCosts;
    const cashSurplus=cashRevenue-costs,earnedResult=earnedRevenue-costs;
    const contribution=cashRevenue-variableCosts;
    const cashBreakEven=contribution>0&&cashRevenue>0?fixed.total/(contribution/cashRevenue):null;
    return {revenue,earnedRevenue,cashRevenue,costs,cashSurplus,earnedResult,netBurn:Math.max(0,-cashSurplus),
      visits,visitsPerDay:visits/c.days,drinks,merchUnits,eventGuests,dayEntries,transactions,fixed,variableLines,variableCosts,
      dailyCosts:costs/c.days,dailyFixed:fixed.total/c.days,cashBreakEven,
      breakEvenVisitsPerDay:contribution>0?fixed.total/contribution*visits/c.days:null,
      averageConcurrent:visits/c.days*c.averageStay/c.hours,
      peakConcurrent:visits/c.days*c.averageStay/c.hours*c.peakFactor,
      margins:{juice:revenue.juice*(1-c.juiceCogs),merch:revenue.merch*(1-c.merchCogs),events:revenue.events*(1-c.eventCogs)}};
  }
  function project(id='base',commonOverrides={},scenarioOverrides={},startupOverrides={}) {
    const c=config(commonOverrides),s=caseConfig(id,scenarioOverrides),setup=launch(c,startupOverrides),steady=month(c,s);
    const prepaidGross=s.foundingMembers*prices.founding;
    const prepaidFees=prepaidGross*c.paymentRate+s.foundingMembers*c.paymentFlat;
    const prepaidNet=prepaidGross-prepaidFees;
    let balance=setup.equityOnlyCash+prepaidNet,balanceWithoutPrepay=setup.equityOnlyCash;
    const openingBalance=balance;
    const months=[];
    for(let i=0;i<12;i++) {
      const demand=s.rampMonths===1?1:s.startDemand+(1-s.startDemand)*Math.min(1,i/(s.rampMonths-1));
      const m=month(c,s,demand);
      balance+=m.cashSurplus;balanceWithoutPrepay+=m.cashSurplus;
      months.push({...m,month:i+1,demand,balance,balanceWithoutPrepay,deferredFounding:Math.max(0,prepaidGross-(i+1)*prepaidGross/12)});
    }
    const minimumBalance=Math.min(openingBalance,...months.map(m=>m.balance));
    const minimumWithoutPrepay=Math.min(setup.equityOnlyCash,...months.map(m=>m.balanceWithoutPrepay));
    return {config:c,scenario:s,setup,steady,prepaidGross,prepaidFees,prepaidNet,openingBalance,months,minimumBalance,minimumWithoutPrepay,
      reserve:steady.fixed.total*c.reserveMonths,recommendedFunding:setup.total+steady.fixed.total*c.reserveMonths,
      fundingGap:Math.max(0,setup.total+steady.fixed.total*c.reserveMonths-c.equity),
      grossRunway:setup.equityOnlyCash>0?setup.equityOnlyCash/steady.fixed.total:0,
      firstYear:{earnedRevenue:sum(months.map(m=>m.earnedRevenue)),cashReceipts:prepaidGross+sum(months.map(m=>m.cashRevenue)),
        operatingCosts:sum(months.map(m=>m.costs)),operatingCash:sum(months.map(m=>m.cashSurplus)),
        earnedResult:sum(months.map(m=>m.earnedResult)),closingCash:balance,closingWithoutPrepay:balanceWithoutPrepay}};
  }
  return {prices,startup,defaults,scenarios,config,caseConfig,launch,fixedCosts,month,project};
});
