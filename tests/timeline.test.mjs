import test from 'node:test';
import assert from 'node:assert/strict';
import {domainToASCII, domainToUnicode} from 'node:url';
import {Timeline, slideAt, DESTINATION, DURATION_MS} from '../dist/timeline.js';

test('destination is HTTPS and has no Chinese punctuation', () => {
  assert.equal(DESTINATION, 'https://www.hkust-gz.edu.cn/');
  assert.equal(new URL(DESTINATION).pathname, '/');
});
test('no readiness before four seconds of visible animation', () => {
  const timeline = new Timeline();
  for (let time = 0; time < 4000; time += 10) timeline.tick(time);
  assert.equal(timeline.complete, false);
  assert.equal(timeline.elapsed, 3990);
  timeline.tick(4000);
  assert.equal(timeline.complete, true);
  assert.equal(timeline.progress, 1);
  assert.equal(DURATION_MS, 4000);
});
test('hidden time and sleeping-device gaps cannot skip the animation', () => {
  const timeline = new Timeline();
  timeline.tick(0); timeline.tick(50); timeline.suspend();
  timeline.tick(10000); assert.equal(timeline.elapsed, 50);
  timeline.tick(50000); assert.equal(timeline.elapsed, 150);
  timeline.tick(50020, false); timeline.tick(60000);
  assert.equal(timeline.elapsed, 150);
});
test('all five images play in order and finish fully still', () => {
  const seen = new Set();
  for (let index = 0; index <= 1000; index++) {
    const pose = slideAt(index / 1000);
    seen.add(pose.index);
    assert.ok(pose.mix >= 0 && pose.mix <= 1);
    assert.equal(slideAt(index / 1000, 5, true).x, 0);
  }
  assert.deepEqual([...seen], [0,1,2,3,4]);
  assert.deepEqual(slideAt(1), {index:4,next:4,mix:0,x:0,y:0,rotation:0});
  assert.ok(slideAt(.18).mix > 0);
});
test('Chinese IDN round-trips through ASCII within DNS label limits', () => {
  const domain = '香港奶蛙大学-广州.com';
  const ascii = domainToASCII(domain);
  assert.equal(ascii, 'xn----4b1bljz4elweu1ac71fii5bhj9a.com');
  assert.equal(domainToUnicode(ascii), domain);
  assert.ok(ascii.split('.').every(label => label.length <= 63));
});
