import assert from 'node:assert/strict';
import { createAcquisitionBudgetPolicy, createAcquisitionOperatorModel } from '../index.js';

const enabled=createAcquisitionBudgetPolicy({enabled:true});
const dry=createAcquisitionOperatorModel({mode:'DRY_RUN',policy:enabled,paidTransportReachable:false});
assert.equal(dry.paidAcquisitionPolicyEnabled,true);
assert.equal(dry.paidTransportReachable,false);
assert.equal(dry.paidExecutionPossible,false);
assert.equal(dry.killSwitchEngaged,false);

const liveNoTransport=createAcquisitionOperatorModel({mode:'LIVE',policy:enabled,paidTransportReachable:false});
assert.equal(liveNoTransport.paidExecutionPossible,false);
const liveNotAuthorized=createAcquisitionOperatorModel({mode:'LIVE',policy:enabled,paidTransportReachable:true});
assert.equal(liveNotAuthorized.authorizationState,'LIVE_NOT_AUTHORIZED');
assert.equal(liveNotAuthorized.paidExecutionPossible,false);
const live=createAcquisitionOperatorModel({mode:'LIVE',policy:enabled,paidTransportReachable:true,liveAuthorizationStatus:'LIVE_AUTHORIZED'});
assert.equal(live.paidExecutionPossible,true);

const disabled=createAcquisitionBudgetPolicy({enabled:false});
const liveKilled=createAcquisitionOperatorModel({mode:'LIVE',policy:disabled,paidTransportReachable:true});
assert.equal(liveKilled.killSwitchEngaged,true);
assert.equal(liveKilled.paidExecutionPossible,false);

assert.throws(()=>createAcquisitionOperatorModel({mode:'DRY_RUN',policy:enabled,paidTransportReachable:true}),/PAID_TRANSPORT_NOT_ALLOWED_OUTSIDE_LIVE_MODE/);
console.log('Acquisition operator runtime capability tests passed.');
