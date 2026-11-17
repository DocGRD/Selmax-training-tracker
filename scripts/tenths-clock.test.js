const assert = require("assert");
const {
  formatTenths,
  formatClock,
} = require("../public/clock/clock-logic.js");

function at(hour, minute, second) {
  return new Date(2026, 10, 17, hour, minute, second || 0);
}

function expected24(hour, minute, second) {
  const into = minute * 60 + (second || 0);
  const bands = [
    [0, 180, 0],
    [180, 540, 1],
    [540, 900, 2],
    [900, 1260, 3],
    [1260, 1620, 4],
    [1620, 1980, 5],
    [1980, 2340, 6],
    [2340, 2700, 7],
    [2700, 3060, 8],
    [3060, 3420, 9],
  ];
  for (const [start, end, tenth] of bands) {
    if (into >= start && into < end) return hour + "." + tenth;
  }
  return ((hour + 1) % 24) + ".0";
}

const cases = [
  ["6:02:59 → 6.0", at(6, 2, 59), "6.0"],
  ["6:03:00 → 6.1", at(6, 3, 0), "6.1"],
  ["6:57:00 → 7.0", at(6, 57, 0), "7.0"],
  ["23:57:00 → 0.0", at(23, 57, 0), "0.0"],
  ["8:59 stays .1", at(6, 8, 59), "6.1"],
  ["9:00 becomes .2", at(6, 9, 0), "6.2"],
  ["56:59 stays .9", at(6, 56, 59), "6.9"],
  ["midnight 2:59 stays 0.0", at(0, 2, 59), "0.0"],
  ["midnight 3:00 becomes 0.1", at(0, 3, 0), "0.1"],
];

let passed = 0;
function check(name, actual, expected) {
  assert.strictEqual(actual, expected, name + " — got " + actual + ", expected " + expected);
  passed += 1;
}

for (const [name, date, expected] of cases) {
  check(name, formatTenths(date, "24"), expected);
  check(name + " matches the band table", expected, expected24(date.getHours(), date.getMinutes(), date.getSeconds()));
}

check("12:57 PM rounds to 1.0 PM", formatTenths(at(12, 57, 0), "12"), "1.0 PM");
check("11:57 PM rounds to 12.0 AM", formatTenths(at(23, 57, 0), "12"), "12.0 AM");
check("11:57 AM rounds to 12.0 PM", formatTenths(at(11, 57, 0), "12"), "12.0 PM");
check("12:02 PM stays 12.0 PM", formatTenths(at(12, 2, 59), "12"), "12.0 PM");
check("12:03 PM becomes 12.1 PM", formatTenths(at(12, 3, 0), "12"), "12.1 PM");
check("12:57 AM rounds to 1.0 AM", formatTenths(at(0, 57, 0), "12"), "1.0 AM");

check("12-hour clock keeps seconds and AM/PM", formatClock(at(13, 52, 7), "12"), "1:52:07 PM");
check("12-hour midnight", formatClock(at(0, 5, 9), "12"), "12:05:09 AM");
check("12-hour noon", formatClock(at(12, 0, 0), "12"), "12:00:00 PM");
check("24-hour clock is 00–23", formatClock(at(6, 2, 59), "24"), "06:02:59");
check("24-hour midnight is 00", formatClock(at(0, 5, 9), "24"), "00:05:09");
check("24-hour 23", formatClock(at(23, 57, 0), "24"), "23:57:00");
check("clock line does not round 12:57 PM", formatClock(at(12, 57, 0), "12"), "12:57:00 PM");

for (let hour = 0; hour < 24; hour += 1) {
  for (let minute = 0; minute < 60; minute += 1) {
    for (const second of [0, 59]) {
      const date = at(hour, minute, second);
      check(
        "band " + hour + ":" + minute + ":" + second,
        formatTenths(date, "24"),
        expected24(hour, minute, second)
      );
    }
  }
}

console.log("tenths clock: " + passed + " checks passed");
