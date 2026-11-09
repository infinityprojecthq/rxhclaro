/* RxH Claro core (Perú, 2026). Integer céntimos; half-up rounding to the céntimo (sources don't specify rounding). */
(function (root) {
  var R = { RATE_BP: 800, THRESHOLD: 150000, MONTHLY_LIMIT: 401000, ANNUAL_LIMIT: 4812500, UIT: 550000 };
  function toC(n) { return (typeof n === 'number' && isFinite(n) && n >= 0) ? Math.round(n * 100 + 1e-7) : NaN; }
  // Parse user text. Accepts: 1500 | 1500,01 | 1500.01 | 1,500.01 | 1.500,01 | 1 500,01 | 1,500,000 | 1.500.000 | "S/ 2000".
  // Rejects (ok:false): empty, negative, letters, >2 decimals, bad grouping, and ambiguous "1,500" / "1.500" (single separator + 3 digits).
  function parseMonto(s) {
    var err = function (m) { return { ok: false, error: m }; };
    if (typeof s !== 'string') return err('Ingresa un monto.');
    var t = s.trim().replace(/^S\/\.?\s*/i, '').replace(/\s+/g, ' ');
    if (!t) return err('Ingresa un monto.');
    if (/ /.test(t)) { if (!/^\d{1,3}( \d{3})+([.,]\d{1,2})?$/.test(t)) return err('Formato no válido.'); t = t.replace(/ /g, ''); }
    if (!/^\d[\d.,]*$/.test(t)) return err('Usa solo números, con coma o punto para los céntimos.');
    var dots = (t.match(/\./g) || []).length, commas = (t.match(/,/g) || []).length, intp, dec = '';
    function grouped(x, sep) { return new RegExp('^\\d{1,3}(\\' + sep + '\\d{3})+$').test(x); }
    if (dots && commas) {
      var last = Math.max(t.lastIndexOf('.'), t.lastIndexOf(',')), ds = t[last], ts = ds === '.' ? ',' : '.';
      intp = t.slice(0, last); dec = t.slice(last + 1);
      if (intp.indexOf(ds) >= 0 || !grouped(intp, ts) || !/^\d{1,2}$/.test(dec)) return err('Formato no válido.');
      intp = intp.split(ts).join('');
    } else if (dots + commas === 0) { intp = t; }
    else {
      var sep = dots ? '.' : ',', parts = t.split(sep);
      if (parts.length === 2 && /^\d{1,2}$/.test(parts[1])) { intp = parts[0]; dec = parts[1]; }
      else if (parts.length === 2 && /^\d{3}$/.test(parts[1])) return err('Monto ambiguo: escribe 1500 o 1500,00 (sin separador de miles), o usa dos céntimos.');
      else if (grouped(t, sep)) intp = parts.join('');
      else return err('Formato no válido.');
    }
    if (!/^\d+$/.test(intp)) return err('Formato no válido.');
    var c = Number(intp) * 100 + Number((dec + '00').slice(0, 2));
    return isFinite(c) && c <= 1e13 ? { ok: true, c: c } : err('Monto demasiado grande.');
  }
  function ret(c) { return Math.floor((c * R.RATE_BP + 5000) / 10000); }
  // o.agente: true (payer is agente de retención) | false. o.suspension: valid constancia held by payer.
  function brutoANeto(brutoC, o) {
    o = o || {}; if (o.agente !== true && o.agente !== false) throw new Error('agente must be true/false');
    var r = (o.agente && !o.suspension && brutoC > R.THRESHOLD) ? ret(brutoC) : 0;
    return { bruto: brutoC, retencion: r, neto: brutoC - r, retiene: r > 0 };
  }
  function netoABruto(netoC, o) {
    o = o || {}; if (o.agente !== true && o.agente !== false) throw new Error('agente must be true/false');
    if (!o.agente || o.suspension) return [{ bruto: netoC, retencion: 0, neto: netoC, retiene: false }];
    var out = [];
    if (netoC <= R.THRESHOLD) out.push({ bruto: netoC, retencion: 0, neto: netoC, retiene: false });
    var b = Math.round(netoC * 100 / 92);
    for (var d = -2; d <= 2; d++) { var x = brutoANeto(b + d, { agente: true });
      if (x.retiene && x.neto === netoC) { out.push(x); break; } }
    return out;
  }
  function fmt(c) { var s = (c / 100).toFixed(2).split('.');
    return 'S/ ' + s[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '.' + s[1]; }
  var api = { R: R, toC: toC, parseMonto: parseMonto, brutoANeto: brutoANeto, netoABruto: netoABruto, fmt: fmt };
  if (typeof module !== 'undefined') module.exports = api; else root.RxH = api;
})(this);
