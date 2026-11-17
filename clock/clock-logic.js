// Factory-floor tenths: one tenth of an hour is 6 minutes.
// Round to the nearest tenth (half up). 0:00–2:59 → .0, 3:00–8:59 → .1,
// …, 51:00–56:59 → .9, and 57:00–59:59 rolls to the next hour .0.
(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.TenthsClock = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function roundHourTenth(date) {
    var hour = date.getHours();
    var into = date.getMinutes() * 60 + date.getSeconds();
    var tenths = Math.round(into / 360);
    if (tenths === 10) {
      tenths = 0;
      hour = (hour + 1) % 24;
    }
    return { hour: hour, tenth: tenths };
  }

  function formatTenths(date, mode) {
    var rounded = roundHourTenth(date);
    var hour = rounded.hour;
    var tenth = rounded.tenth;
    if (mode === "24") return hour + "." + tenth;
    var suffix = hour < 12 ? "AM" : "PM";
    var hour12 = hour % 12;
    if (hour12 === 0) hour12 = 12;
    return hour12 + "." + tenth + " " + suffix;
  }

  function formatClock(date, mode) {
    var minutes = date.getMinutes();
    var seconds = date.getSeconds();
    if (mode === "24") {
      return pad2(date.getHours()) + ":" + pad2(minutes) + ":" + pad2(seconds);
    }
    var hours = date.getHours();
    var hour12 = hours % 12;
    if (hour12 === 0) hour12 = 12;
    return hour12 + ":" + pad2(minutes) + ":" + pad2(seconds) + " " + (hours < 12 ? "AM" : "PM");
  }

  // Seconds until the displayed tenth changes (the next :03, :09, …, :57, or :03 next hour).
  function secondsUntilNextTenth(date) {
    var into = date.getMinutes() * 60 + date.getSeconds();
    var next = null;
    var k;
    for (k = 0; k < 10; k++) {
      var boundary = 180 + 360 * k;
      if (boundary > into) {
        next = boundary;
        break;
      }
    }
    if (next === null) next = 3600 + 180;
    return next - into;
  }

  function formatNextTenth(date) {
    var remain = secondsUntilNextTenth(date);
    return "next tenth in " + Math.floor(remain / 60) + ":" + pad2(remain % 60);
  }

  return {
    roundHourTenth: roundHourTenth,
    formatTenths: formatTenths,
    formatClock: formatClock,
    secondsUntilNextTenth: secondsUntilNextTenth,
    formatNextTenth: formatNextTenth,
  };
});
