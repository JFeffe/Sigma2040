import test from 'node:test';
import assert from 'node:assert/strict';
import {domeRaw} from '../dist/client/dome-projection.js';
test('Dome geography stays invertible across the atlas and allowed orientations',()=>{
 for(const yaw of [-10,0,10])for(const pitch of [-4,0,4]){
  const raw=domeRaw(yaw,pitch);
  for(let lon=-179;lon<180;lon+=7)for(let lat=-89;lat<90;lat+=7){
   const expected=[lon*Math.PI/180,lat*Math.PI/180],actual=raw.invert(...raw(...expected));
   assert.ok(actual,'Every location remains on the visible cap');
   assert.ok(Math.abs(expected[0]-actual[0])<1e-8&&Math.abs(expected[1]-actual[1])<1e-8,'Raster and vector geography must agree');
  }
  assert.equal(raw.invert(2,2),null,'Outside the cap has no geographic location');
 }
});
