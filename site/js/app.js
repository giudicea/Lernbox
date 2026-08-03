(() => {
  'use strict';

  // ─── static reference data (ported from the Elektro-Toolbox prototype) ───
  const NORM = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240];
  const SECTIONS = NORM;
  const MU0 = 4 * Math.PI * 1e-7;
  const IZ = {
    A1: { l2: [14.5,19,26,34,46,61,80.5,99,120,151,183,210,241,272,319], l3: [13.5,18,24,31,42,56,73,89,108,136,164,188,216,245,286] },
    A2: { l2: [14,18.5,25,32,43,57,75,92,110,139,167,192,219,248,291], l3: [13,17.5,23,29,39,52,68,83,99,125,150,172,196,223,261] },
    B1: { l2: [17.5,24,32,41,57,76,101,125,151,192,232,269,309,353,415], l3: [15.5,21,28,36,50,68,89,110,134,171,207,239,275,314,370] },
    B2: { l2: [16.5,23,30,38,52,69,90,111,133,168,201,232,258,294,344], l3: [15,20,27,34,46,62,80,99,118,149,179,206,225,255,297] },
    C:  { l2: [19.5,27,36,46,63,85,112,138,168,213,258,299,344,392,461], l3: [17.5,24,32,41,57,76,96,119,144,184,223,259,299,341,403] },
    D1: { l2: [19,26,32,41,53.5,68.5,88,105,124,153,181,205,232,260,300], l3: [18,24,30,38,50,64,82,98,116,143,169,192,217,243,280] },
    D2: { l2: [21,28.5,35,45,59,75,97,116,136,168,199,226,255,286,330], l3: [19.5,26,33,42,55,70,90,108,128,157,186,211,239,267,308] },
    E:  { l2: [22,30,40,51,70,94,119,148,180,232,282,328,379,434,514], l3: [18.5,25,34,43,60,80,101,126,153,196,238,276,319,364,430] },
    F:  { l2: [24,33,44,56,77,103,131,162,196,251,304,352,406,463,546], l3: [20,27,37,47,65,87,110,137,167,216,264,308,356,409,485] }
  };
  const FUSES = [6, 10, 13, 16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400];
  const RAUMTYPEN = [
    { key: 'flure', label: 'Verkehrsflächen, Flure', e: 100 },
    { key: 'treppen', label: 'Treppenhäuser, Rolltreppen', e: 100 },
    { key: 'lager', label: 'Lager- und Vorratsräume', e: 100 },
    { key: 'pausen', label: 'Pausenräume', e: 100 },
    { key: 'garderobe', label: 'Garderoben, Bäder, Toiletten', e: 200 },
    { key: 'archiv', label: 'Archive', e: 200 },
    { key: 'versand', label: 'Versand-/Verpackungsbereiche', e: 300 },
    { key: 'empfang', label: 'Empfangstheke', e: 300 },
    { key: 'verkauf', label: 'Verkaufsbereich (Laden)', e: 300 },
    { key: 'unterricht', label: 'Unterrichts-/Seminarräume', e: 300 },
    { key: 'buero', label: 'Büro: Schreiben, Lesen, Datenverarbeitung', e: 500 },
    { key: 'konferenz', label: 'Konferenz-/Besprechungsräume', e: 500 },
    { key: 'bibliothek', label: 'Bibliothek: Lesebereich', e: 500 },
    { key: 'kueche', label: 'Küchen', e: 500 },
    { key: 'labor', label: 'Präzisionsmessräume, Laboratorien', e: 500 },
    { key: 'montage_grob', label: 'Montage grob (z. B. Transformatoren)', e: 300 },
    { key: 'montage_mittel', label: 'Montage mittelfein (z. B. Schalttafeln)', e: 500 },
    { key: 'montage_fein', label: 'Montage fein (z. B. Telefone, IT)', e: 750 },
    { key: 'montage_sfein', label: 'Montage sehr fein (Messinstrumente, Leiterplatten)', e: 1000 },
    { key: 'zeichnen', label: 'Technisches Zeichnen', e: 750 }
  ];
  const ETAB_OPTS = [
    { v: '0.3', label: 'Sehr schlecht – hoher Raum (>6 m), dunkle Wände' },
    { v: '0.4', label: 'Schlecht – hoher Raum (4–6 m), dunkle Wände' },
    { v: '0.45', label: 'Mässig – mittlere Höhe (3–4 m)' },
    { v: '0.5', label: 'Standard ungünstig – 3 m, normale Wände' },
    { v: '0.55', label: 'Standard – 2.5–3 m, helle Wände (~50–70%)' },
    { v: '0.6', label: 'Gut – 2.5–3 m, helle Wände + Decke' },
    { v: '0.65', label: 'Sehr gut – niedriger Raum, helle Wände + Decke' },
    { v: '0.7', label: 'Optimal – niedriger Raum, sehr helle Wände' },
    { v: '0.75', label: 'Sehr optimal – ideale Geometrie' },
    { v: '0.8', label: 'Top – Labor/Reinraum, alles optimiert' }
  ];
  const WF_OPTS = [
    { v: '0.9', label: 'Sehr sauber' },
    { v: '0.8', label: 'Büro' },
    { v: '0.7', label: 'Industrie' },
    { v: '0.6', label: 'Staubig' },
    { v: '0.5', label: 'Starke Verschmutzung' }
  ];

  const state = {
    tool: 'kabel', menuOpen: false,
    netz: '3ph', dcU: '24', mode: 'P', wert: '5000', cosphi: '0.9', laenge: '25', maxDrop: '3', mat: 'cu', verlegeart: 'C', fuseSel: 'auto',
    given: 'I', N: '1200', givenVal: '58', len: '35', area: '', mur: '1', murCustom: '', u: '24', wireA: '0.8', wmat: 'cu',
    q_v: '400000', q_t1: '10', q_t2: '3',
    ri_u0: '1.57', ri_uk: '1.48', ri_i: '0.32',
    p_v: '720', p_h: '15', p_t: '1', p_eta: '80',
    e_u: '230', e_r: '70.533', e_t: '41.33', e_price: '15',
    c_i: '12.7', c_l: '34', c_u: '230', c_max: '4',
    t_goal: 'R', t_r20: '300', t_third: '360', t_alpha: '0.0039',
    tr_a: '', tr_b: '', formelTopic: 'alle',
    raumtyp: 'buero', raumtypCustomE: '500', lichtA: '40', lichtPhiL: '3400', lichtNvorh: '8',
    etaB: '0.6', etaBCustom: '0.6', wf: '0.8', wfCustom: '0.8'
  };

  const $ = (id) => document.getElementById(id);
  function fmt(x, d) { return isFinite(x) ? x.toLocaleString('de-CH', { maximumFractionDigits: d ?? 1 }) : '–'; }
  function fmt3(x, d) { return isFinite(x) ? x.toLocaleString('de-CH', { maximumFractionDigits: d ?? 2 }) : '–'; }
  function fmt2(x, d) {
    if (!isFinite(x)) return '–';
    return x.toLocaleString('de-CH', { minimumFractionDigits: d ?? 0, maximumFractionDigits: d ?? 1 });
  }
  function setText(id, v) { const el = $(id); if (el) el.textContent = v; }
  function setHidden(id, hidden) { const el = $(id); if (el) el.classList.toggle('hidden', hidden); }
  function setVal(id, v) { const el = $(id); if (el && el.value !== v) el.value = v; }
  function setChecked(id, v) { const el = $(id); if (el) el.checked = v; }

  // ─── Kabelquerschnitt ───
  function renderKabel() {
    const s = state;
    const isDc = s.netz === 'dc', is3 = s.netz === '3ph';
    const U = is3 ? 400 : (isDc ? Number(s.dcU) : 230);
    const cos = isDc ? 1 : Math.min(1, Math.max(0.1, parseFloat(s.cosphi) || 1));
    const L = parseFloat(s.laenge);
    const maxDrop = parseFloat(s.maxDrop) || 3;
    const wert = parseFloat(s.wert);
    const gamma = s.mat === 'cu' ? 56 : 35;
    const matFactor = s.mat === 'cu' ? 1 : 0.78;
    const minSection = s.mat === 'al' ? 16 : 0;

    let Ib = NaN;
    if (isFinite(wert) && wert > 0) {
      if (s.mode === 'I') { Ib = wert; }
      else { const P = wert; Ib = is3 ? P / (Math.sqrt(3) * U * cos) : P / (U * cos); }
    }
    const valid = isFinite(Ib) && Ib > 0 && isFinite(L) && L > 0;
    const autoFuse = FUSES.find(f => f >= Ib) ?? null;
    const fuse = s.fuseSel === 'auto' ? autoFuse : Number(s.fuseSel);
    const fuseTooSmall = valid && fuse !== null && s.fuseSel !== 'auto' && fuse < Ib;
    const izCol = is3 ? 'l3' : 'l2';
    const izBase = IZ[s.verlegeart][izCol];
    const dropFactor = is3 ? Math.sqrt(3) : 2;

    const rows = []; let rec = null, minAmp = null, minDrop = null;
    if (valid) {
      SECTIONS.forEach((A, i) => {
        if (A < minSection) return;
        const Iz = izBase[i] * matFactor;
        const duV = dropFactor * Ib * L * cos / (gamma * A);
        const duP = duV / U * 100;
        const loss = (is3 ? 3 : 2) * Ib * Ib * L / (gamma * A);
        const okAmp = fuse !== null && Iz >= fuse;
        const okDrop = duP <= maxDrop;
        if (okAmp && minAmp === null) minAmp = A;
        if (okDrop && minDrop === null) minDrop = A;
        if (okAmp && okDrop && rec === null) rec = { A, Iz, duV, duP, loss };
        rows.push({ A, Iz, duV, duP, loss, okAmp, okDrop });
      });
    }
    const limitierend = rec === null ? '' :
      (minDrop > minAmp ? 'Spannungsfall massgebend' : minAmp > minDrop ? 'Belastbarkeit massgebend' : 'beide Kriterien erfüllt');

    // field visibility
    setHidden('dcU-field', !isDc);
    setHidden('cosphi-field', isDc);
    setText('wertLabel', s.mode === 'P' ? 'Leistung (W)' : 'Strom (A)');
    setHidden('fuseWarn', !fuseTooSmall);
    setText('fuseWarnText', fuseTooSmall ? 'Gewählte Sicherung (' + fuse + ' A) ist kleiner als der Betriebsstrom (' + fmt2(Ib, 1) + ' A) — Sicherung löst aus.' : '');

    const hasResult = valid && rec !== null;
    setHidden('kabel-result', !hasResult);
    setHidden('kabel-empty', hasResult);
    setText('kabel-emptyMsg', !valid
      ? 'Bitte gültige Werte für ' + (s.mode === 'P' ? 'Leistung' : 'Strom') + ' und Leitungslänge eingeben.'
      : 'Kein Normquerschnitt bis 240 mm² erfüllt beide Kriterien — Länge, Spannungsfall-Grenze oder Netz prüfen.');

    if (hasResult) {
      setText('qsText', fmt2(rec.A) + ' mm²');
      setText('limitierend', limitierend);
      setText('qsSub', (s.mat === 'cu' ? 'Kupfer' : 'Aluminium') + ', Verlegeart ' + s.verlegeart + (is3 ? ', 3 belastete Leiter' : ', 2 belastete Leiter') + ', ' + fmt2(U) + ' V');
      setText('ibText', fmt2(Ib, 1) + ' A');
      setText('fuseText', fuse ? fuse + ' A' + (s.fuseSel === 'auto' ? '' : ' (gewählt)') : '> 400 A');
      setText('dropText', fmt2(rec.duP, 2) + ' %');
      setText('dropVText', fmt2(rec.duV, 2) + ' V bei ' + fmt2(L) + ' m');
      setText('lossText', rec.loss >= 1000 ? fmt2(rec.loss / 1000, 2) + ' kW' : fmt2(rec.loss, 1) + ' W');
      setText('minAmpText', minAmp !== null ? fmt2(minAmp) + ' mm²' : 'keiner');
      setText('minDropText', minDrop !== null ? fmt2(minDrop) + ' mm²' : 'keiner');
      setText('maxDropEcho', s.maxDrop);
      setText('izText', fmt2(rec.Iz, 1) + ' A');
      setText('bedingungText', fuse !== null ? (Ib <= fuse && fuse <= rec.Iz ? '✓ erfüllt' : '✗ nicht erfüllt') : '');

      $('kabel-rows').innerHTML = rows.map(r => {
        const status = r.okAmp && r.okDrop ? (rec && r.A === rec.A ? '★ empfohlen' : '✓') : (!r.okAmp && !r.okDrop ? '✗ IZ + ΔU' : !r.okAmp ? '✗ IZ zu klein' : '✗ ΔU zu gross');
        const style = rec && r.A === rec.A
          ? 'background:color-mix(in srgb, var(--color-accent) 14%, transparent);color:var(--color-accent-200)'
          : (r.okAmp && r.okDrop ? '' : 'opacity:0.45');
        return `<tr style="${style}"><td style="font-weight:500">${fmt2(r.A)} mm²</td><td>${fmt2(r.Iz, 0)} A</td><td>${fmt2(r.duV, 2)} V</td><td>${fmt2(r.duP, 2)} %</td><td>${fmt2(r.loss, 0)} W</td><td>${status}</td></tr>`;
      }).join('');
    }
  }

  // ─── Magnetismus ───
  function renderMagnet() {
    const s = state;
    const N = parseFloat(s.N);
    const g = parseFloat(s.givenVal);
    const lM = parseFloat(s.len) / 100;
    const aM = parseFloat(s.area) / 1e4;
    const mur = s.mur === 'custom' ? (parseFloat(s.murCustom) || 1) : Number(s.mur);
    const U = parseFloat(s.u), wA = parseFloat(s.wireA);
    const gammaW = s.wmat === 'cu' ? 56 : 35;

    let I = NaN, H = NaN, B = NaN, theta = NaN;
    const okBase = isFinite(N) && N > 0 && isFinite(g) && g > 0;
    const okLen = isFinite(lM) && lM > 0;
    if (okBase) {
      if (s.given === 'I') { I = g / 1000; theta = N * I; if (okLen) H = theta / lM; }
      else if (s.given === 'H') { H = g; if (okLen) { theta = H * lM; I = theta / N; } }
      else { B = g; H = B / (MU0 * mur); if (okLen) { theta = H * lM; I = theta / N; } }
      if (!isFinite(B) && isFinite(H)) B = MU0 * mur * H;
    }
    const flux = isFinite(B) && isFinite(aM) && aM > 0 ? B * aM : NaN;
    let wireLen = NaN, R = NaN;
    if (isFinite(U) && U > 0 && isFinite(I) && I > 0 && isFinite(wA) && wA > 0) {
      R = U / I; wireLen = R * gammaW * wA;
    }
    const has = isFinite(theta);

    setText('givenLabel', s.given === 'I' ? 'Strom I (mA)' : s.given === 'H' ? 'Feldstärke H (A/m)' : 'Flussdichte B (T)');
    setHidden('murCustom', s.mur !== 'custom');
    setText('wmatText', s.wmat === 'cu' ? 'Kupfer, γ = 56 m/(Ω·mm²)' : 'Aluminium, γ = 35 m/(Ω·mm²)');
    setText('wmatShort', s.wmat === 'cu' ? 'Cu' : 'Al');

    setHidden('magnet-result', !has);
    setHidden('magnet-empty', has);
    if (has) {
      setText('thetaText', fmt(theta, 2) + ' A');
      setText('iText', isFinite(I) ? (I < 1 ? fmt(I * 1000, 1) + ' mA' : fmt(I, 3) + ' A') : '–');
      setText('hText', isFinite(H) ? fmt(H, 1) + ' A/m' : '– (Länge fehlt)');
      setText('hCmText', isFinite(H) ? '= ' + fmt(H / 100, 2) + ' A/cm' : '');
      setText('bText', isFinite(B) ? (B < 0.01 ? fmt(B * 1000, 3) + ' mT' : fmt(B, 3) + ' T') : '–');
      setText('fluxText', isFinite(flux) ? fmt(flux * 1000, 3) + ' mWb' : '– (Fläche A fehlt)');
      setText('wireText', isFinite(wireLen) ? fmt(wireLen, 1) + ' m' : '–');
      setText('wireSub', isFinite(R) ? 'R = ' + fmt(R, 1) + ' Ω bei ' + fmt(U, 1) + ' V' : 'U, I und Draht-A nötig');
    }
  }

  // ─── Beleuchtung ───
  function renderLicht() {
    const s = state;
    const raumtypObj = RAUMTYPEN.find(r => r.key === s.raumtyp);
    const E = s.raumtyp === 'custom' ? parseFloat(s.raumtypCustomE) : (raumtypObj ? raumtypObj.e : NaN);
    const A = parseFloat(s.lichtA);
    const phiL = parseFloat(s.lichtPhiL);
    const etaB = s.etaB === 'custom' ? parseFloat(s.etaBCustom) : parseFloat(s.etaB);
    const wf = s.wf === 'custom' ? parseFloat(s.wfCustom) : parseFloat(s.wf);
    const nVorh = parseFloat(s.lichtNvorh);
    const valid = isFinite(E) && E > 0 && isFinite(A) && A > 0 && isFinite(phiL) && phiL > 0 && isFinite(etaB) && etaB > 0 && isFinite(wf) && wf > 0;
    const nErf = valid ? Math.ceil(E * A / (phiL * etaB * wf)) : NaN;
    const phiGesamt = valid ? E * A / (etaB * wf) : NaN;
    const hasNvorh = valid && isFinite(nVorh) && nVorh >= 0;
    const eErreicht = hasNvorh ? (nVorh * phiL * etaB * wf) / A : NaN;
    const zusatz = hasNvorh ? Math.max(0, nErf - nVorh) : NaN;
    const erreicht = hasNvorh ? eErreicht >= E : null;

    setHidden('raumtypCustomE', s.raumtyp !== 'custom');
    setHidden('etaBCustom', s.etaB !== 'custom');
    setHidden('wfCustom', s.wf !== 'custom');

    setHidden('licht-result', !valid);
    setHidden('licht-empty', valid);
    if (valid) {
      setText('lNText', String(nErf));
      const eText = isFinite(E) ? fmt2(E, 0) + ' lx' : '–';
      setText('lEText', eText);
      setText('lEText2', eText);
      setText('lSub', fmt2(A) + ' m², ΦL ' + fmt2(phiL, 0) + ' lm, ηB ' + fmt3(etaB, 2) + ', WF ' + fmt3(wf, 2));
      setText('lPhiGesamtText', isFinite(phiGesamt) ? fmt2(phiGesamt, 0) + ' lm' : '–');
      setText('lNvorhText', hasNvorh ? String(nVorh) : '–');
      setText('lZusatzText', isFinite(zusatz) ? String(zusatz) : '–');
      setHidden('licht-bewertung', !hasNvorh);
      if (hasNvorh) {
        setText('lEErreichtText', isFinite(eErreicht) ? fmt2(eErreicht, 0) + ' lx' : '–');
        setText('lBewertungText', erreicht ? '✓ erreicht' : '✗ nicht erreicht');
        const tag = $('lBewertungTag');
        tag.classList.toggle('tag-accent', !!erreicht);
        tag.classList.toggle('tag-neutral', !erreicht);
      }
    }
  }

  // ─── Formelsammlung ───
  function renderFormeln() {
    const s = state;
    const n = (v) => parseFloat(v);
    const V = n(s.q_v), t1 = n(s.q_t1), t2 = n(s.q_t2);
    const m = V / 1000;
    const Q = isFinite(m) && isFinite(t1) && isFinite(t2) ? m * 4187 * Math.abs(t1 - t2) : NaN;
    const Ri = (n(s.ri_u0) - n(s.ri_uk)) / n(s.ri_i);
    const pV = n(s.p_v) / 1000, ph = n(s.p_h), pt = n(s.p_t) * 60, eta = n(s.p_eta) / 100;
    const Phydr = isFinite(pV) && isFinite(ph) && isFinite(pt) && pt > 0 ? (1000 * pV * 9.81 * ph) / pt : NaN;
    const Pmotor = isFinite(Phydr) && eta > 0 ? Phydr / eta : NaN;
    const eu = n(s.e_u), er = n(s.e_r), et = n(s.e_t), eprice = n(s.e_price);
    const P = eu * eu / er, W = P * et, cost = W / 1000 * eprice;
    const ci = n(s.c_i), cl = n(s.c_l), cu = n(s.c_u), cmax = n(s.c_max);
    const dUmax = cu * cmax / 100;
    const Acalc = isFinite(ci) && isFinite(cl) && isFinite(dUmax) && dUmax > 0 ? 2 * ci * cl / (56 * dUmax) : NaN;
    const Anorm = isFinite(Acalc) ? NORM.find(x => x >= Acalc) : NaN;
    const goalR = s.t_goal === 'R';
    const r20 = n(s.t_r20), alpha = n(s.t_alpha), third = n(s.t_third);
    let tResult = NaN;
    if (goalR) tResult = r20 * (1 + alpha * (third - 20));
    else tResult = 20 + (third / r20 - 1) / alpha;
    const a = n(s.tr_a), b = n(s.tr_b);
    const c = isFinite(a) && isFinite(b) ? Math.sqrt(a * a + b * b) : NaN;
    const beta = isFinite(a) && isFinite(b) && a > 0 ? Math.atan(b / a) * 180 / Math.PI : NaN;

    const topic = s.formelTopic;
    setHidden('show-waerme', !(topic === 'alle' || topic === 'waerme'));
    setHidden('show-innenwiderstand', !(topic === 'alle' || topic === 'innenwiderstand'));
    setHidden('show-pumpe', !(topic === 'alle' || topic === 'pumpe'));
    setHidden('show-energie', !(topic === 'alle' || topic === 'energie'));
    setHidden('show-kabel', !(topic === 'alle' || topic === 'kabel'));
    setHidden('show-temperatur', !(topic === 'alle' || topic === 'temperatur'));
    setHidden('show-trigonometrie', !(topic === 'alle' || topic === 'trigonometrie'));

    setText('q_result', isFinite(Q) ? (Q >= 1e6 ? fmt(Q / 1e6, 2) + ' MJ' : fmt(Q / 1000, 1) + ' kJ') : '–');
    setText('ri_result', isFinite(Ri) ? fmt(Ri, 3) + ' Ω' : '–');
    setText('p_hydr', isFinite(Phydr) ? fmt(Phydr, 1) + ' W' : '–');
    setText('p_result', isFinite(Pmotor) ? fmt(Pmotor, 1) + ' W' : '–');
    setText('e_p', isFinite(P) ? fmt(P, 1) + ' W' : '–');
    setText('e_w', isFinite(W) ? fmt(W / 1000, 3) + ' kWh' : '–');
    setText('e_cost', isFinite(cost) ? fmt(cost, 1) + ' Rp.' : '–');
    setText('c_calc', isFinite(Acalc) ? fmt(Acalc, 2) + ' mm²' : '–');
    setText('c_norm', isFinite(Anorm) ? fmt(Anorm) + ' mm²' : '–');
    setText('t_thirdLabel', goalR ? 'Temperatur ϑ (°C)' : 'Rϑ (Ω)');
    setText('t_resultLabel', goalR ? 'Widerstand Rϑ' : 'Temperatur ϑ');
    setText('t_result', isFinite(tResult) ? fmt(tResult, 2) + (goalR ? ' Ω' : ' °C') : '–');
    setText('tr_c', isFinite(c) ? fmt(c, 3) : '–');
    setText('tr_beta', isFinite(beta) ? fmt(beta, 2) + ' °' : '–');
  }

  // ─── Kraftwerk (Idle-Game) ───
  const IDLE_KEY = 'elektro-toolbox-idle';
  const IDLE_OFFLINE_CAP = 8 * 3600;   // max. 8 h Offline-Gutschrift
  const COST_GROWTH = 1.15;
  const GENERATORS = [
    { id: 'kurbel', name: 'Handkurbel',         cost: 15,       out: 0.1  },
    { id: 'solar',  name: 'Solarpanel',         cost: 100,      out: 1    },
    { id: 'wind',   name: 'Windrad',            cost: 1100,     out: 8    },
    { id: 'wasser', name: 'Wasserkraftwerk',    cost: 12000,    out: 47   },
    { id: 'bhkw',   name: 'Blockheizkraftwerk', cost: 130000,   out: 260  },
    { id: 'kern',   name: 'Kernkraftwerk',      cost: 1400000,  out: 1400 },
    { id: 'fusion', name: 'Fusionsreaktor',     cost: 20000000, out: 7800 }
  ];
  const UPGRADES = [
    { id: 'click', name: 'Stärkerer Impuls',   desc: '+1 Basisleistung pro Klick', baseCost: 50,  growth: 3 },
    { id: 'eff',   name: 'Wirkungsgrad +10 %', desc: 'Alle Kraftwerke leisten mehr', baseCost: 800, growth: 4 }
  ];

  const idle = {
    energy: 0, total: 0, gens: {}, clickLevel: 0, effLevel: 0,
    prestige: 0, lastSave: Date.now(), buyAmount: '1', started: false
  };
  GENERATORS.forEach(g => { idle.gens[g.id] = 0; });

  function idleFmt(n) {
    if (!isFinite(n)) return '∞';
    if (n < 0) return '0';
    if (n < 1000) return Number.isInteger(n) ? String(n) : n.toFixed(n < 10 ? 2 : 1);
    const units = ['', 'K', 'Mio.', 'Mrd.', 'Bio.', 'Brd.', 'Trd.', 'Qa', 'Qi', 'Sx'];
    let i = 0;
    while (n >= 1000 && i < units.length - 1) { n /= 1000; i++; }
    return n.toFixed(n < 10 ? 2 : n < 100 ? 1 : 0) + ' ' + units[i];
  }
  function idlePrestigeMult() { return 1 + 0.02 * idle.prestige; }
  function idleGlobalMult() { return idlePrestigeMult() * Math.pow(1.1, idle.effLevel); }
  function idlePerSecond() {
    let base = 0;
    for (const g of GENERATORS) base += idle.gens[g.id] * g.out;
    return base * idleGlobalMult();
  }
  function idleClickGain() { return (1 + idle.clickLevel) * idleGlobalMult() + 0.05 * idlePerSecond(); }
  function idlePrestigePotential() { return Math.floor(Math.sqrt(idle.total / 1e6)); }
  function idlePrestigeGain() { return Math.max(0, idlePrestigePotential() - idle.prestige); }

  // Gesamtkosten für `count` Einheiten ab `owned` (geometrische Reihe)
  function idleGenCost(g, owned, count) {
    const first = g.cost * Math.pow(COST_GROWTH, owned);
    return first * (Math.pow(COST_GROWTH, count) - 1) / (COST_GROWTH - 1);
  }
  function idleMaxAffordable(g, owned, energy) {
    const first = g.cost * Math.pow(COST_GROWTH, owned);
    if (energy < first) return 0;
    const n = Math.log(energy * (COST_GROWTH - 1) / first + 1) / Math.log(COST_GROWTH);
    return Math.max(0, Math.floor(n + 1e-9));
  }
  function idleUpgradeCost(u) {
    const lvl = u.id === 'click' ? idle.clickLevel : idle.effLevel;
    return u.baseCost * Math.pow(u.growth, lvl);
  }

  // — DOM einmalig aufbauen —
  let idleBuilt = false;
  function buildIdle() {
    if (idleBuilt) return;
    const gc = $('idle-generators');
    gc.innerHTML = GENERATORS.map(g => `
      <div class="idle-row idle-locked" id="genrow-${g.id}">
        <div class="idle-row-info">
          <div class="idle-row-title">
            <span class="idle-row-name">${g.name}</span>
            <span class="idle-row-owned" id="genowned-${g.id}">×0</span>
          </div>
          <div class="idle-row-sub" id="genout-${g.id}"></div>
        </div>
        <button class="idle-buy-btn" id="genbuy-${g.id}">
          <span id="genlbl-${g.id}">Kaufen</span>
          <span class="cost" id="gencost-${g.id}"></span>
        </button>
      </div>`).join('');
    GENERATORS.forEach(g => { $('genbuy-' + g.id).addEventListener('click', () => idleBuyGen(g.id)); });

    const uc = $('idle-upgrades');
    uc.innerHTML = UPGRADES.map(u => `
      <div class="idle-row" id="uprow-${u.id}">
        <div class="idle-row-info">
          <div class="idle-row-title">
            <span class="idle-row-name">${u.name}</span>
            <span class="idle-row-owned" id="uplvl-${u.id}">Stufe 0</span>
          </div>
          <div class="idle-row-sub">${u.desc}</div>
        </div>
        <button class="idle-buy-btn" id="upbuy-${u.id}">
          <span>Kaufen</span>
          <span class="cost" id="upcost-${u.id}"></span>
        </button>
      </div>`).join('');
    UPGRADES.forEach(u => { $('upbuy-' + u.id).addEventListener('click', () => idleBuyUpgrade(u.id)); });

    idleBuilt = true;
  }

  function idleBuyGen(id) {
    const g = GENERATORS.find(x => x.id === id);
    const owned = idle.gens[id];
    const n = idle.buyAmount === 'max'
      ? idleMaxAffordable(g, owned, idle.energy)
      : parseInt(idle.buyAmount, 10);
    if (n < 1) return;
    const cost = idleGenCost(g, owned, n);
    if (idle.energy < cost - 1e-6) return;
    idle.energy -= cost;
    idle.gens[id] += n;
    idle.started = true;
    $('genbuy-' + id).classList.remove('idle-pulse');
    void $('genbuy-' + id).offsetWidth;
    $('genbuy-' + id).classList.add('idle-pulse');
    renderIdleView();
    saveIdle();
  }

  function idleBuyUpgrade(id) {
    const u = UPGRADES.find(x => x.id === id);
    const cost = idleUpgradeCost(u);
    if (idle.energy < cost - 1e-6) return;
    idle.energy -= cost;
    if (id === 'click') idle.clickLevel++; else idle.effLevel++;
    renderIdleView();
    saveIdle();
  }

  function idleDoPrestige() {
    const gain = idlePrestigeGain();
    if (gain < 1) return;
    if (!window.confirm(`Netzausbau: +${gain} Ausbaupunkt(e) für dauerhaft +${(gain * 2)} % Leistung.\nEnergie, Kraftwerke und Upgrades werden zurückgesetzt. Fortfahren?`)) return;
    idle.prestige += gain;
    idle.energy = 0;
    idle.clickLevel = 0;
    idle.effLevel = 0;
    GENERATORS.forEach(g => { idle.gens[g.id] = 0; });
    renderIdleView();
    saveIdle();
  }

  function idleClick() {
    idle.energy += idleClickGain();
    idle.total += idleClickGain();
    idle.started = true;
    renderIdleView();
  }

  function idleResetSave() {
    if (!window.confirm('Spielstand wirklich unwiderruflich löschen?')) return;
    idle.energy = 0; idle.total = 0; idle.clickLevel = 0; idle.effLevel = 0;
    idle.prestige = 0; idle.buyAmount = '1'; idle.started = false;
    GENERATORS.forEach(g => { idle.gens[g.id] = 0; });
    document.querySelector('input[name="idle-buy"][value="1"]').checked = true;
    localStorage.removeItem(IDLE_KEY);
    renderIdleView();
  }

  // — Anzeige aktualisieren —
  function renderIdleView() {
    if (!idleBuilt) return;
    const perSec = idlePerSecond();
    setText('idle-energy', idleFmt(idle.energy) + ' ⚡');
    setText('idle-rate', idleFmt(perSec));
    setText('idle-total', idleFmt(idle.total) + ' ⚡');
    setText('idle-prestige-mult', '×' + idleGlobalMult().toFixed(2));
    setText('idle-clickgain', '+' + idleFmt(idleClickGain()));

    let prevOwned = 1;
    for (const g of GENERATORS) {
      const owned = idle.gens[g.id];
      const revealed = owned > 0 || idle.energy >= g.cost * 0.4 || prevOwned > 0;
      const row = $('genrow-' + g.id);
      row.classList.toggle('idle-locked', !revealed);
      setText('genowned-' + g.id, '×' + owned);
      setText('genout-' + g.id,
        idleFmt(g.out * idleGlobalMult()) + ' ⚡/s' +
        (owned > 0 ? '  ·  ∑ ' + idleFmt(owned * g.out * idleGlobalMult()) + ' ⚡/s' : ''));

      const n = idle.buyAmount === 'max'
        ? Math.max(1, idleMaxAffordable(g, owned, idle.energy))
        : parseInt(idle.buyAmount, 10);
      const cost = idleGenCost(g, owned, n);
      const affordable = idle.energy >= cost - 1e-6 &&
        (idle.buyAmount !== 'max' || idleMaxAffordable(g, owned, idle.energy) >= 1);
      setText('genlbl-' + g.id, idle.buyAmount === 'max' ? `Kaufen ×${n}` : `Kaufen ×${n}`);
      setText('gencost-' + g.id, idleFmt(cost) + ' ⚡');
      $('genbuy-' + g.id).disabled = !affordable;
      prevOwned = owned;
    }

    for (const u of UPGRADES) {
      const lvl = u.id === 'click' ? idle.clickLevel : idle.effLevel;
      const cost = idleUpgradeCost(u);
      setText('uplvl-' + u.id, 'Stufe ' + lvl);
      setText('upcost-' + u.id, idleFmt(cost) + ' ⚡');
      $('upbuy-' + u.id).disabled = idle.energy < cost - 1e-6;
    }

    const pg = idlePrestigeGain();
    setText('idle-prestige-gain', '+' + pg);
    setText('idle-prestige-have', idle.prestige);
    $('idle-prestige').disabled = pg < 1;
  }

  // — Speichern / Laden —
  function saveIdle() {
    idle.lastSave = Date.now();
    try {
      localStorage.setItem(IDLE_KEY, JSON.stringify({
        energy: idle.energy, total: idle.total, gens: idle.gens,
        clickLevel: idle.clickLevel, effLevel: idle.effLevel,
        prestige: idle.prestige, lastSave: idle.lastSave, buyAmount: idle.buyAmount
      }));
    } catch (e) { /* Speicher voll o. deaktiviert */ }
  }
  function loadIdle() {
    let raw;
    try { raw = localStorage.getItem(IDLE_KEY); } catch (e) { return; }
    if (!raw) return;
    let s;
    try { s = JSON.parse(raw); } catch (e) { return; }
    idle.energy = +s.energy || 0;
    idle.total = +s.total || 0;
    idle.clickLevel = +s.clickLevel || 0;
    idle.effLevel = +s.effLevel || 0;
    idle.prestige = +s.prestige || 0;
    idle.buyAmount = s.buyAmount === '10' || s.buyAmount === 'max' ? s.buyAmount : '1';
    idle.lastSave = +s.lastSave || Date.now();
    idle.started = true;
    if (s.gens) GENERATORS.forEach(g => { idle.gens[g.id] = +s.gens[g.id] || 0; });

    // Offline-Gutschrift
    const elapsed = Math.min(IDLE_OFFLINE_CAP, Math.max(0, (Date.now() - idle.lastSave) / 1000));
    const gain = idlePerSecond() * elapsed;
    if (gain > 0) {
      idle.energy += gain;
      idle.total += gain;
      const note = $('idle-offline');
      if (note) {
        const mins = Math.round(elapsed / 60);
        note.textContent = `Willkommen zurück: +${idleFmt(gain)} ⚡ in ${mins < 60 ? mins + ' min' : (elapsed / 3600).toFixed(1) + ' h'} offline`;
        note.classList.remove('hidden');
        setTimeout(() => note.classList.add('hidden'), 8000);
      }
    }
  }

  // — Spiel-Loop —
  let idleLast = 0;
  let idleSaveAcc = 0;
  function idleTick(now) {
    if (!idleLast) idleLast = now;
    const dt = Math.min(1, (now - idleLast) / 1000);
    idleLast = now;
    const gain = idlePerSecond() * dt;
    if (gain > 0) { idle.energy += gain; idle.total += gain; }
    idleSaveAcc += dt;
    if (idleSaveAcc >= 10) { idleSaveAcc = 0; saveIdle(); }
    if (state.tool === 'kraftwerk') renderIdleView();
    requestAnimationFrame(idleTick);
  }

  function initIdle() {
    buildIdle();
    loadIdle();
    $('idle-click').addEventListener('click', idleClick);
    $('idle-prestige').addEventListener('click', idleDoPrestige);
    $('idle-reset').addEventListener('click', idleResetSave);
    document.querySelectorAll('input[name="idle-buy"]').forEach(el => {
      el.checked = el.value === idle.buyAmount;
      el.addEventListener('change', (e) => { idle.buyAmount = e.target.value; renderIdleView(); saveIdle(); });
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) saveIdle(); });
    window.addEventListener('beforeunload', saveIdle);
    renderIdleView();
    requestAnimationFrame(idleTick);
  }

  // ─── nav / menu / tool switching ───
  const NAMES = { kabel: 'Kabelquerschnitt', magnet: 'Magnetismus', licht: 'Beleuchtung', formeln: 'Formelsammlung', kraftwerk: 'Kraftwerk' };
  const SUBS = { kabel: 'Planungstool · nach NIN (SN 411000)', magnet: 'Rechner für magnetische Grössen', licht: 'Beleuchtungsberechnung · nach EN 12464-1', formeln: 'Formel + eigene Werte eintragen', kraftwerk: 'Idle-Game · Strom erzeugen' };

  function renderNav() {
    setText('toolName', NAMES[state.tool]);
    setText('toolSub', SUBS[state.tool]);
    ['kabel', 'magnet', 'licht', 'formeln', 'kraftwerk'].forEach(t => {
      setHidden('tool-' + t, state.tool !== t);
      const mark = document.querySelector(`[data-mark="${t}"]`);
      if (mark) mark.textContent = state.tool === t ? '●' : '○';
    });
    setHidden('menuPanel', !state.menuOpen);
  }

  function render() {
    renderNav();
    renderKabel();
    renderMagnet();
    renderLicht();
    renderFormeln();
  }

  function pickTool(t) {
    state.tool = t;
    state.menuOpen = false;
    localStorage.setItem('elektro-toolbox-tool', t);
    render();
  }

  // ─── wiring ───
  function bindRadio(ids, key) {
    ids.forEach(([id, value]) => {
      $(id).checked = state[key] === value;
      $(id).addEventListener('change', () => { state[key] = value; render(); });
    });
  }
  function bindSelect(id, key, onChange) {
    $(id).value = state[key];
    $(id).addEventListener('change', (e) => { state[key] = e.target.value; if (onChange) onChange(); render(); });
  }
  function bindNumber(id, key) {
    $(id).value = state[key];
    $(id).addEventListener('input', (e) => { state[key] = e.target.value; render(); });
  }

  function fillOptions(id, items, valueKey, labelFn) {
    const el = $(id);
    el.innerHTML = items.map(it => `<option value="${it[valueKey]}">${labelFn(it)}</option>`).join('')
      + '<option value="custom">Eigener Wert …</option>';
  }

  function init() {
    const saved = localStorage.getItem('elektro-toolbox-tool');
    if (['kabel', 'magnet', 'licht', 'formeln', 'kraftwerk'].includes(saved)) state.tool = saved;

    // menu
    $('menuToggle').addEventListener('click', () => { state.menuOpen = !state.menuOpen; render(); });
    document.querySelectorAll('[data-pick]').forEach(btn => {
      btn.addEventListener('click', () => pickTool(btn.dataset.pick));
    });

    // Kabelquerschnitt
    bindRadio([['netz-3ph', '3ph'], ['netz-1ph', '1ph'], ['netz-dc', 'dc']], 'netz');
    document.querySelectorAll('input[name="netz"]').forEach(el => el.addEventListener('change', render));
    bindSelect('dcU', 'dcU');
    bindRadio([['mode-p', 'P'], ['mode-i', 'I']], 'mode');
    bindNumber('wert', 'wert');
    bindNumber('cosphi', 'cosphi');
    bindNumber('laenge', 'laenge');
    bindNumber('maxDrop', 'maxDrop');
    bindRadio([['mat-cu', 'cu'], ['mat-al', 'al']], 'mat');
    bindSelect('fuseSel', 'fuseSel');
    bindSelect('verlegeart', 'verlegeart');

    // Magnetismus
    bindRadio([['given-i', 'I'], ['given-h', 'H'], ['given-b', 'B']], 'given');
    document.querySelectorAll('input[name="given"]').forEach(el => el.addEventListener('change', (e) => {
      const defaults = { I: '58', H: '4500', B: '1' };
      state.givenVal = defaults[e.target.value];
      $('givenVal').value = state.givenVal;
    }));
    bindNumber('N', 'N');
    bindNumber('givenVal', 'givenVal');
    bindNumber('len', 'len');
    bindNumber('area', 'area');
    bindSelect('mur', 'mur');
    bindNumber('murCustom', 'murCustom');
    bindRadio([['wmat-cu', 'cu'], ['wmat-al', 'al']], 'wmat');
    bindNumber('u', 'u');
    bindNumber('wireA', 'wireA');

    // Beleuchtung
    fillOptions('raumtyp', RAUMTYPEN, 'key', r => r.label);
    bindSelect('raumtyp', 'raumtyp');
    bindNumber('raumtypCustomE', 'raumtypCustomE');
    bindNumber('lichtA', 'lichtA');
    bindNumber('lichtPhiL', 'lichtPhiL');
    bindNumber('lichtNvorh', 'lichtNvorh');
    fillOptions('etaB', ETAB_OPTS, 'v', o => `${o.label} (${o.v})`);
    bindSelect('etaB', 'etaB');
    bindNumber('etaBCustom', 'etaBCustom');
    fillOptions('wf', WF_OPTS, 'v', o => `${o.label} (${o.v})`);
    bindSelect('wf', 'wf');
    bindNumber('wfCustom', 'wfCustom');

    // Formelsammlung
    bindSelect('formelTopic', 'formelTopic');
    bindNumber('q_v', 'q_v'); bindNumber('q_t1', 'q_t1'); bindNumber('q_t2', 'q_t2');
    bindNumber('ri_u0', 'ri_u0'); bindNumber('ri_uk', 'ri_uk'); bindNumber('ri_i', 'ri_i');
    bindNumber('p_v', 'p_v'); bindNumber('p_h', 'p_h'); bindNumber('p_t', 'p_t'); bindNumber('p_eta', 'p_eta');
    bindNumber('e_u', 'e_u'); bindNumber('e_r', 'e_r'); bindNumber('e_t', 'e_t'); bindNumber('e_price', 'e_price');
    bindNumber('c_i', 'c_i'); bindNumber('c_l', 'c_l'); bindNumber('c_u', 'c_u'); bindNumber('c_max', 'c_max');
    bindRadio([['tgoal-r', 'R'], ['tgoal-t', 'T']], 't_goal');
    document.querySelectorAll('input[name="tgoal"]').forEach(el => el.addEventListener('change', render));
    bindNumber('t_r20', 't_r20'); bindNumber('t_third', 't_third'); bindNumber('t_alpha', 't_alpha');
    bindNumber('tr_a', 'tr_a'); bindNumber('tr_b', 'tr_b');

    // Kraftwerk (Idle-Game)
    initIdle();

    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
