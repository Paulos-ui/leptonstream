(function () {
  // LeptonStream embed — drop onto any Owncast page:
  // <script src="https://<app>/embed.js" data-payee="0x..." data-server="https://your.owncast"></script>
  var script = document.currentScript ||
    (function () {
      var ss = document.querySelectorAll('script[src*="/embed.js"]');
      return ss[ss.length - 1] || null;
    })();
  if (!script) return;
  var payee = script.getAttribute("data-payee");
  var server = script.getAttribute("data-server") || "";
  if (!payee) return;

  var origin = new URL(script.src).origin;
  var supportUrl =
    origin + "/watch/" + payee + (server ? "?server=" + encodeURIComponent(server) : "");

  var box = document.createElement("div");
  box.style.cssText =
    "position:fixed;bottom:20px;right:20px;z-index:2147483000;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;" +
    "background:#16100C;color:#F4ECDD;border:1px solid rgba(244,236,221,.14);border-radius:16px;" +
    "padding:14px 16px;width:248px;box-shadow:0 12px 40px rgba(0,0,0,.45)";

  box.innerHTML =
    '<div style="font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:rgba(244,236,221,.45)">stream support</div>' +
    '<div id="ls-amt" style="font-size:22px;color:#F6A92B;margin-top:4px;font-variant-numeric:tabular-nums">$0.000000</div>' +
    '<div style="font-size:10px;color:rgba(244,236,221,.4);margin-bottom:10px">received on Arc</div>' +
    '<a href="' + supportUrl + '" target="_blank" rel="noopener" ' +
    'style="display:block;text-align:center;background:#F6A92B;color:#16100C;text-decoration:none;' +
    'border-radius:999px;padding:9px 0;font-size:13px">Support per-second →</a>' +
    '<div style="font-size:9px;color:rgba(244,236,221,.3);margin-top:8px;text-align:center">powered by LeptonStream</div>';

  document.body.appendChild(box);

  function poll() {
    fetch(origin + "/api/balance/" + payee)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d && d.available != null) {
          var el = document.getElementById("ls-amt");
          if (el) el.textContent = "$" + Number(d.available).toFixed(6);
        }
      })
      .catch(function () {});
  }
  poll();
  setInterval(poll, 15000);
})();
