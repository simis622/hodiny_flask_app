/* Analogove hodiny s casem serveru.
 *
 * Stranka pri nacteni prevezme od serveru jeho actualni cas (timestamp +
 * hodiny:minuty:ssekundy v casovem pasmu serveru). Z toho spocita posun
 * oproti hodinam prohlizece a podle neho plynule hne ruckama. Kazdych 60 s
 * se muze znovu synchronizovat pres /time. */

(function () {
  "use strict";

  var clockEl = document.getElementById("clock");
  var digitalEl = document.getElementById("digital");
  var handHour = document.getElementById("hand-hour");
  var handMinute = document.getElementById("hand-minute");
  var handSecond = document.getElementById("hand-second");

  // --- ruicky ciferniku (ticky + cislice) ---
  var SVG_NS = "http://www.w3.org/2000/svg";
  var ticks = document.getElementById("ticks");
  var numbers = document.getElementById("numbers");
  var CX = 100, CY = 100;

  function polar(r, angleDeg) {
    var a = (angleDeg - 90) * Math.PI / 180; // 0° = směr nahoru
    return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
  }

  for (var i = 0; i < 60; i++) {
    var major = i % 5 === 0;
    var line = document.createElementNS(SVG_NS, "line");
    var p1 = polar(major ? 88 : 91, i * 6);
    var p2 = polar(96, i * 6);
    line.setAttribute("x1", p1[0]);
    line.setAttribute("y1", p1[1]);
    line.setAttribute("x2", p2[0]);
    line.setAttribute("y2", p2[1]);
    line.setAttribute("class", major ? "tick-major" : "tick-minor");
    ticks.appendChild(line);
  }

  for (var n = 1; n <= 12; n++) {
    var text = document.createElementNS(SVG_NS, "text");
    var pos = polar(76, n * 30);
    text.setAttribute("x", pos[0]);
    text.setAttribute("y", pos[1]);
    text.setAttribute("class", "number");
    text.textContent = n;
    numbers.appendChild(text);
  }

  // --- synchronizace s casem serveru ---
  // offsetMs = cas serveru - cas prohlizece (v ms)
  var offsetMs = 0;

  function wallToEpoch(wall) {
    // "HH:MM:SS" casoveho pasma serveru → epoch tak, jako bychom
    // tento cas cetli v localnim casovem pasmu prohlizece.
    var parts = wall.split(":");
    var d = new Date();
    d.setHours(+parts[0], +parts[1], +parts[2], 0);
    return d.getTime();
  }

  function syncFromServer(wall) {
    offsetMs = wallToEpoch(wall) - Date.now();
  }

  // prvni synchronizace z dat vykreslenych strankou
  syncFromServer(clockEl.dataset.serverWall || "00:00:00");

  // pripadna prubezna re-synchronizace
  function resync() {
    fetch("/time")
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d.wall) syncFromServer(d.wall); })
      .catch(function () { /* server nedostupny – pokracujeme s lokalnim odhadem */ });
  }
  setInterval(resync, 60000);

  // --- vykreslovani ---
  function pad(x) { return String(x).padStart(2, "0"); }

  function render() {
    var now = new Date(Date.now() + offsetMs);
    var h = now.getHours(), m = now.getMinutes(), s = now.getSeconds(), ms = now.getMilliseconds();

    var secDeg = (s + ms / 1000) * 6;
    var minDeg = (m + s / 60) * 6;
    var hourDeg = ((h % 12) + m / 60) * 30;

    handSecond.setAttribute("transform", "rotate(" + secDeg + " 100 100)");
    handMinute.setAttribute("transform", "rotate(" + minDeg + " 100 100)");
    handHour.setAttribute("transform", "rotate(" + hourDeg + " 100 100)");

    digitalEl.textContent = pad(h) + ":" + pad(m) + ":" + pad(s);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
})();
