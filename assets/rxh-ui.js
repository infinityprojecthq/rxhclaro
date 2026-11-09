(function () {
  var f = document.getElementById('rxh-form'); if (!f) return;
  var out = document.getElementById('rxh-out');
  function row(o, t) { return '<p><strong>' + t + '</strong><br>Bruto: ' + RxH.fmt(o.bruto) +
    ' · Retención (8%): ' + RxH.fmt(o.retencion) + ' · Neto: ' + RxH.fmt(o.neto) + '</p>'; }
  function one(c, dir, ag, s) {
    if (dir === 'bn') { var r = RxH.brutoANeto(c, { agente: ag, suspension: s });
      return row(r, r.retiene ? 'Te retienen el 8% de todo el recibo' : (!ag ? 'Quien te paga no es agente de retención: sin retención' :
        (s ? 'Con constancia de suspensión: sin retención' : 'Recibo de S/ 1,500 o menos: sin retención')));
    }
    var a = RxH.netoABruto(c, { agente: ag, suspension: s });
    return a.length > 1 ? '<p><strong>Hay dos respuestas posibles.</strong> Entre S/ 1,380.01 y S/ 1,500.00 de neto, depende de si el recibo pasa de S/ 1,500.</p>' +
      row(a[0], 'A) Recibo sin retención') + row(a[1], 'B) Recibo mayor a S/ 1,500, con retención') :
      row(a[0], ag ? 'Monto del recibo' : 'Quien te paga no es agente de retención: el recibo es igual al neto');
  }
  function run() {
    var p = RxH.parseMonto(f.monto.value), dir = f.dir.value, ag = f.agente.value, s = f.susp.checked;
    if (!p.ok) { out.innerHTML = '<p>' + p.error + '</p>'; return; }
    if (p.c <= 0) { out.innerHTML = '<p>Ingresa un monto mayor que cero.</p>'; return; }
    var h;
    if (ag === 'si') h = one(p.c, dir, true, s);
    else if (ag === 'no') h = one(p.c, dir, false, s);
    else h = '<p><strong>No sabes si quien te paga es agente de retención.</strong> Confirma con quien te paga si es agente de retención. Estos son los dos casos:</p>' +
      '<p><em>Si es agente de retención:</em></p>' + one(p.c, dir, true, s) + '<p><em>Si no es agente de retención:</em></p>' + one(p.c, dir, false, s);
    out.innerHTML = h + '<p class="small">Montos redondeados al céntimo. No es asesoría tributaria.</p>';
  }
  f.addEventListener('input', run); f.addEventListener('change', run);
  f.addEventListener('submit', function (e) { e.preventDefault(); run(); }); run();
})();
