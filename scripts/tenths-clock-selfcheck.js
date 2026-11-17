// Self-check for the Tenths Clock rounding and 12/24-hour labels.
//   node scripts/tenths-clock-selfcheck.js
/* eslint-disable @typescript-eslint/no-require-imports */
"use strict";

var assert = require("assert");

require("../public/clock/tenths.js");

var tenthsReading = globalThis.tenthsReading;

function pad(n) {
  return (n < 10 ? "0" : "") + n;
}

function expect(hours, minutes, seconds, cycle, text) {
  var got = tenthsReading(hours, minutes, seconds, cycle);
  var stamp = hours + ":" + pad(minutes) + ":" + pad(seconds);
  assert.strictEqual(
    got.text,
    text,
    stamp + " " + cycle + "h rendered " + got.text + ", expected " + text
  );
  console.log(stamp + "  " + cycle + "h  ->  " + got.text);
  return got;
}

expect(6, 56, 59, "24", "6.9");
expect(6, 57, 0, "24", "7.0");
expect(7, 2, 59, "24", "7.0");
expect(7, 3, 0, "24", "7.1");
expect(7, 14, 59, "24", "7.2");
expect(23, 57, 0, "24", "0.0");
expect(23, 57, 0, "12", "12.0 AM");
expect(12, 57, 0, "24", "13.0");
expect(12, 57, 0, "12", "1.0 PM");

expect(11, 57, 0, "12", "12.0 PM");
expect(11, 57, 0, "24", "12.0");
expect(23, 57, 0, "12", "12.0 AM");
expect(12, 57, 0, "12", "1.0 PM");
expect(6, 57, 0, "12", "7.0 AM");

assert.strictEqual(tenthsReading(6, 56, 59, "24").secondsToNext, 1);
assert.strictEqual(tenthsReading(6, 57, 0, "24").secondsToNext, 6 * 60);
assert.strictEqual(tenthsReading(7, 2, 59, "24").secondsToNext, 1);
assert.strictEqual(tenthsReading(7, 3, 0, "24").secondsToNext, 6 * 60);
assert.strictEqual(tenthsReading(7, 14, 59, "24").secondsToNext, 1);
assert.strictEqual(tenthsReading(23, 57, 0, "24").secondsToNext, 6 * 60);
assert.strictEqual(tenthsReading(0, 0, 0, "24").text, "0.0");
assert.strictEqual(tenthsReading(0, 2, 59, "12").text, "12.0 AM");
assert.strictEqual(tenthsReading(0, 3, 0, "24").text, "0.1");

var previous = null;
var boundaryJumps = 0;
for (var elapsed = 0; elapsed < 86400; elapsed++) {
  var hours = Math.floor(elapsed / 3600);
  var minutes = Math.floor(elapsed / 60) % 60;
  var seconds = elapsed % 60;
  var reading = tenthsReading(hours, minutes, seconds, "24");
  var totalMinutes = elapsed / 60;
  var index = Math.floor((totalMinutes + 3) / 6);
  assert.strictEqual(reading.hour24 * 10 + reading.tenth, index % 240);
  assert.strictEqual(reading.secondsToNext, (6 * (index + 1) - 3) * 60 - elapsed);
  assert.ok(reading.secondsToNext >= 1 && reading.secondsToNext <= 360);

  var rounded = Math.round(totalMinutes / 6);
  assert.strictEqual(index, rounded);
  assert.strictEqual(index, Math.floor((elapsed + 180) / 360));

  if (previous && reading.text !== previous.text) {
    assert.strictEqual(previous.secondsToNext, 1);
    assert.strictEqual(reading.secondsToNext, 360);
    boundaryJumps += 1;
  }
  previous = reading;
}

assert.strictEqual(boundaryJumps, 240);
console.log("full-day sweep: 86400 seconds, 240 tenth boundaries, countdown stays on those edges");
console.log("tenths self-check passed");
