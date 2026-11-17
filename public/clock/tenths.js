// Nearest tenth of an hour. Run the self-check with:
//   node scripts/tenths-clock-selfcheck.js
//
// Each tenth is a six-minute window centered on the six-minute marks.
// 7.0 covers 6:57:00 up to (not including) 7:03:00, 7.1 covers 7:03 to 7:09,
// and 7:57 rolls to 8.0. 23:57 rolls to 0.0.
//
// index = Math.round(totalMinutes / 6), with ties at exactly :03, :09, ...
// going up. Math.floor((totalMinutes + 3) / 6) is that rounding without a
// floating-point half that might land on the wrong side of the tie.
(function (global) {
  function tenthsReading(hours, minutes, seconds, hourCycle) {
    var totalSeconds = hours * 3600 + minutes * 60 + seconds;
    var totalMinutes = totalSeconds / 60;
    var index = Math.floor((totalMinutes + 3) / 6);
    var hour24 = Math.floor(index / 10) % 24;
    var tenth = index % 10;
    var nextBoundarySeconds = (6 * (index + 1) - 3) * 60;
    var secondsToNext = nextBoundarySeconds - totalSeconds;
    var meridiem = hour24 < 12 ? "AM" : "PM";
    var hour12 = hour24 % 12;
    if (hour12 === 0) hour12 = 12;
    var use12 = hourCycle === "12";

    return {
      hour24: hour24,
      hour12: hour12,
      tenth: tenth,
      meridiem: meridiem,
      secondsToNext: secondsToNext,
      text: use12 ? hour12 + "." + tenth + " " + meridiem : hour24 + "." + tenth
    };
  }

  global.tenthsReading = tenthsReading;
})(typeof globalThis !== "undefined" ? globalThis : this);
