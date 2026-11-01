import test from 'node:test';import assert from 'node:assert/strict';import {quote,overlaps,escapeHTML} from '../backend/domain.mjs';
const input={car_id:'sx4',start:'2030-01-01T10:00:00+03:00',end:'2030-01-02T10:00:00+03:00'};
test('24 hours billed as one day and price comes from server',()=>{assert.equal(quote({...input,total:1},0).total,3500);});
test('extra minute starts next day',()=>assert.equal(quote({...input,end:'2030-01-02T10:01:00+03:00'},0).days,2));
test('reject reverse, unknown car, missing zone and past',()=>{for(const p of [{...input,end:input.start},{...input,car_id:'bad'},{...input,start:'2030-01-01T10:00:00'}])assert.throws(()=>quote(p,0));assert.throws(()=>quote(input,Date.parse('2031-01-01')));});
test('adjacent periods do not overlap',()=>assert.equal(overlaps({start:1,end:2},{start:2,end:3}),false));
test('contract values escape HTML',()=>assert.equal(escapeHTML('<script>'), '&lt;script&gt;'));

