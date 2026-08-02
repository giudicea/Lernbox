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

  // ─── nav / menu / tool switching ───
  const NAMES = { kabel: 'Kabelquerschnitt', magnet: 'Magnetismus', licht: 'Beleuchtung', formeln: 'Formelsammlung' };
  const SUBS = { kabel: 'Planungstool · nach NIN (SN 411000)', magnet: 'Rechner für magnetische Grössen', licht: 'Beleuchtungsberechnung · nach EN 12464-1', formeln: 'Formel + eigene Werte eintragen' };

  function renderNav() {
    setText('toolName', NAMES[state.tool]);
    setText('toolSub', SUBS[state.tool]);
    ['kabel', 'magnet', 'licht', 'formeln'].forEach(t => {
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
    if (saved === 'kabel' || saved === 'magnet' || saved === 'licht' || saved === 'formeln') state.tool = saved;

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

    render();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
