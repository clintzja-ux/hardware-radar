import assert from 'node:assert/strict';
import {scoreDataForSeoProductCandidate,resolveDataForSeoProductCandidates} from '../index.js';

const atlasProduct={
  identity:{atlasProductId:'ram_corsair_cmk32gx5m2b6000z30',brand:'Corsair',manufacturerPartNumber:'CMK32GX5M2B6000Z30'},
  extension:{data:{
    classification:{memoryType:'DDR5'},
    capacity:{capacityGb:32,moduleCount:2,capacityPerModuleGb:16},
    performance:{dataRateMtps:6000,casLatency:30,primaryTimings:'30-36-36-76'},
    physical:{color:'GREY',rgbLighting:false}
  }}
};

const timingTitle={title:'Corsair CMK32GX5M2B6000Z30 VENGEANCE DDR5 32GB 2x16GB 6000MT/s 30-36-36-76 Gray',data_docid:'timing'};
const timingScore=scoreDataForSeoProductCandidate({atlasProduct,item:timingTitle});
assert.equal(timingScore.signals.find(x=>x.name==='PRIMARY_TIMINGS').matched,true);
assert.equal(timingScore.signals.find(x=>x.name==='CAS_LATENCY').matched,true,'primary timing tCL must support CL identity');
assert.equal(timingScore.signals.find(x=>x.name==='COLOR').matched,true,'GRAY and GREY must normalize together');

const wrongColor=scoreDataForSeoProductCandidate({atlasProduct,item:{title:'Corsair CMK32GX5M2B6000Z30 DDR5 32GB 2x16GB 6000 CL30 Black'}});
assert.ok(wrongColor.contradictions.includes('COLOR_CONFLICT:BLACK'));
assert.equal(wrongColor.outcome,'REJECTED');

const rgb=scoreDataForSeoProductCandidate({atlasProduct,item:{title:'Corsair CMK32GX5M2B6000Z30 Vengeance RGB DDR5 32GB 2x16GB 6000 CL30 Gray'}});
assert.ok(rgb.contradictions.includes('RGB_CONFLICT'));
assert.equal(rgb.outcome,'REJECTED');

const resolution=resolveDataForSeoProductCandidates({atlasProduct,items:[
  {title:'Corsair CMK32GX5M2B6000Z30 Vengeance DDR5 32GB (2x16GB) DDR5 6000MHz CL30 AMD Expo Intel XMP iCUE Computer Memory - Gray',data_docid:'3844868436216882408',price:588.99},
  {title:'Corsair CMK32GX5M2B6000Z30 VENGEANCE DDR5 32GB2x16GB Memory Kit 6000MT/s 30-36-36-76 Std PMIC AMD EXPO 1.4V Black',data_docid:'17540895125310173539',price:549.99},
  {title:'Corsair Vengeance RGB DDR5 Memory Kit CMH32GX5M2B6000C30',data_docid:'3350666287623798193',price:232}
]});
assert.equal(resolution.recommendationStatus,'RECOMMENDED');
assert.equal(resolution.recommendedCandidate.item.dataDocId,'3844868436216882408');
assert.ok(resolution.recommendedCandidate.score > (resolution.runnerUp?.score ?? -Infinity));
assert.equal(resolution.candidates.find(x=>x.item.dataDocId==='17540895125310173539').outcome,'REJECTED','exact MPN does not override explicit canonical color conflict');
assert.equal(resolution.candidates.find(x=>x.item.dataDocId==='3350666287623798193').outcome,'REJECTED');
console.log('Product candidate resolver evidence enhancement tests passed.');
