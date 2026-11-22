/* Defensa del anteproyecto: navegación, regla de progreso y modo presentador.
   Sin dependencias. Funciona abriendo index.html directo desde el disco. */
(function () {
  'use strict';

  var W = 1920, H = 1080;
  var LIMITE = 10 * 60;          // tiempo máximo de la presentación, en segundos
  var stage = document.getElementById('stage');
  var slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  var ayuda = document.getElementById('ayuda');
  var actual = 0;
  var presentador = null;
  var inicio = null, acumulado = 0, reloj = null;
  var tamNotas = 21;             // tamaño de letra de las notas, en px (se ajusta con A− / A+)
  try { tamNotas = parseInt(localStorage.getItem('defensa-letra-notas'), 10) || tamNotas; } catch (e) { /* sin almacenamiento */ }

  /* La ventana de notas muestra esta misma página en miniatura (index.html?mini=1#N):
     en ese modo no hay teclado, clics, animaciones ni ventana de notas propia. */
  var MINI = /[?&]mini=1/.test(location.search);
  var BASE = location.href.replace(/[?#].*$/, '');
  if (MINI) document.documentElement.classList.add('mini');

  /* ---------- Escalar el lienzo a la ventana ---------- */
  function ajustar() {
    var s = Math.min(window.innerWidth / W, window.innerHeight / H);
    stage.style.transform = 'scale(' + s + ') translate(-50%, -50%)';
  }

  /* ---------- Regla de progreso ---------- */
  function tramos() {
    var lista = [];
    slides.forEach(function (sl, i) {
      var nombre = sl.dataset.section || '';
      var ult = lista[lista.length - 1];
      if (!ult || ult.nombre !== nombre) {
        ult = { nombre: nombre, orador: sl.dataset.speaker || '', indices: [] };
        lista.push(ult);
      }
      ult.indices.push(i);
    });
    return lista;
  }

  function dosDigitos(n) { return (n < 10 ? '0' : '') + n; }

  function armarReglas() {
    var ts = tramos();
    slides.forEach(function (sl, i) {
      var regla = document.createElement('div');
      regla.className = 'regla';
      regla.setAttribute('aria-hidden', 'true');
      ts.forEach(function (t) {
        var tramo = document.createElement('div');
        tramo.className = 'tramo' + (t.indices.indexOf(i) >= 0 ? ' aqui' : '');
        tramo.style.flex = t.indices.length + ' 1 0';
        var rotulo = document.createElement('span');
        rotulo.textContent = t.nombre;
        var ticks = document.createElement('div');
        ticks.className = 'ticks';
        t.indices.forEach(function (j) {
          var tick = document.createElement('div');
          tick.className = 'tick' + (j < i ? ' hecho' : '') + (j === i ? ' aqui' : '');
          ticks.appendChild(tick);
        });
        tramo.appendChild(rotulo);
        tramo.appendChild(ticks);
        regla.appendChild(tramo);
      });
      var num = document.createElement('div');
      num.className = 'num';
      num.textContent = dosDigitos(i + 1) + ' / ' + dosDigitos(slides.length);
      regla.appendChild(num);
      sl.appendChild(regla);
    });
  }

  /* ---------- Navegación ---------- */
  function ir(n, sinHash) {
    n = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach(function (sl, i) { sl.classList.toggle('active', i === n); });
    actual = n;
    if (!sinHash) { try { history.replaceState(null, '', '#' + (n + 1)); } catch (e) { location.hash = '#' + (n + 1); } }
    actualizarPresentador();
  }
  function siguiente() { if (actual < slides.length - 1) { arrancarReloj(); ir(actual + 1); } }
  function anterior() { if (actual > 0) ir(actual - 1); }
  function desdeHash() {
    var n = parseInt((location.hash || '').replace('#', ''), 10);
    return isNaN(n) ? 0 : n - 1;
  }

  function pantallaCompleta() {
    if (document.fullscreenElement) document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
  }

  function tecla(e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ': case 'Enter':
        e.preventDefault(); siguiente(); break;
      case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace':
        e.preventDefault(); anterior(); break;
      case 'Home': e.preventDefault(); ir(0); break;
      case 'End': e.preventDefault(); ir(slides.length - 1); break;
      case 'p': case 'P': e.preventDefault(); abrirPresentador(); break;
      case 'f': case 'F': e.preventDefault(); pantallaCompleta(); break;
    }
  }

  /* ---------- Cronómetro ---------- */
  function segundos() { return acumulado + (inicio ? (Date.now() - inicio) / 1000 : 0); }
  function arrancarReloj() {
    if (inicio) return;
    inicio = Date.now();
    if (!reloj) reloj = setInterval(pintarReloj, 500);
    pintarReloj();
  }
  function pausarReloj() { if (inicio) { acumulado = segundos(); inicio = null; } pintarReloj(); }
  function reiniciarReloj() { acumulado = 0; inicio = null; pintarReloj(); }
  function formato(s) { s = Math.floor(s); return Math.floor(s / 60) + ':' + dosDigitos(s % 60); }
  function pintarReloj() {
    if (!presentador || presentador.closed) return;
    var d = presentador.document, s = segundos();
    var el = d.getElementById('reloj');
    if (!el) return;
    el.textContent = formato(s);
    el.className = s >= LIMITE ? 'pasado' : (s >= LIMITE - 60 ? 'cerca' : '');
    d.getElementById('pausa').textContent = inicio ? 'Pausar' : (s > 0 ? 'Seguir' : 'Iniciar');
  }

  /* ---------- Modo presentador (tecla P) ---------- */
  function titulo(sl) {
    var t = sl.querySelector('h1, h2') || sl.querySelector('.eyebrow');
    return t ? t.textContent.replace(/\s+/g, ' ').trim() : '';
  }

  var PAGINA = '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Notas del orador</title><style>' +
    '*{box-sizing:border-box;margin:0}html,body{height:100%}' +
    'body{background:#111a22;color:#f3f0e9;font:17px/1.5 "IBM Plex Sans","Helvetica Neue",Arial,sans-serif;display:flex;flex-direction:column}' +
    'header{flex:none;border-bottom:1px solid #2c3944;padding:14px 24px;display:flex;align-items:center;gap:24px}' +
    '.quien,.rot{font:500 13px/1.3 ui-monospace,Menlo,Consolas,monospace;letter-spacing:.07em;text-transform:uppercase}' +
    '.quien{color:#7fd1c2}.rot{color:#8f9ca6;font-size:12px}' +
    'h1{font:500 22px/1.2 Georgia,serif;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.izq{flex:1;min-width:0}.der{flex:none;text-align:right}' +
    '#reloj{font:500 40px/1 ui-monospace,Menlo,Consolas,monospace;font-variant-numeric:tabular-nums}' +
    '#reloj.cerca{color:#f2c14e}#reloj.pasado{color:#f2876b}.lim{font:13px/1 ui-monospace,Menlo,monospace;color:#8f9ca6;margin-top:6px}' +
    'main{flex:1;min-height:0;display:grid;grid-template-columns:minmax(340px,46%) 1fr;gap:28px;padding:20px 24px 24px}' +
    '.vista{display:flex;flex-direction:column;gap:10px;min-width:0;min-height:0;overflow:auto}' +
    '.marco{position:relative;flex:none;aspect-ratio:16/9;width:100%;background:#0a0f14;border:1px solid #3a4853;border-radius:6px;overflow:hidden}' +
    '.marco.ahora{border:2px solid #7fd1c2}' +
    '.marco iframe{position:absolute;inset:0;width:100%;height:100%;border:0;pointer-events:none}' +
    '.prox{display:grid;grid-template-columns:42% 1fr;gap:16px;align-items:center;margin-top:10px}' +
    '.sig{font-size:15px;line-height:1.35;color:#a9b6bf}.sig b{display:block;color:#f3f0e9;font-weight:500;font-size:18px;line-height:1.3;margin:4px 0}.sig .cambio{color:#f2c14e}' +
    '.texto{display:flex;flex-direction:column;min-width:0;min-height:0}' +
    '.barra{display:flex;align-items:center;gap:8px;margin-bottom:10px}.barra .rot{flex:1}' +
    '#notas{flex:1;min-height:160px;overflow:auto;line-height:1.55;white-space:pre-wrap;background:#f3f0e9;color:#111a22;border-radius:8px;padding:24px 28px}' +
    '#notas .or{font-weight:700;color:#0b6b62}' +
    '.botones{flex:none;display:flex;gap:10px;margin-top:16px;flex-wrap:wrap}' +
    'button{font:500 15px/1 inherit;font-family:inherit;border:1px solid #3a4853;background:#1b2731;color:#f3f0e9;border-radius:6px;padding:11px 16px;cursor:pointer}' +
    'button:hover{background:#24323d}button.p{background:#0b6b62;border-color:#0b6b62}button:disabled{opacity:.4;cursor:default}button.ch{padding:7px 10px;font-size:13px}.esp{flex:1}' +
    '.pista{flex:none;margin-top:12px;font-size:13px;color:#8f9ca6}' +
    '@media (max-width:860px){html,body{height:auto}main{display:block}.vista{overflow:visible;margin-bottom:20px}#notas{min-height:0}}' +
    '</style></head><body><header><div class="izq"><div class="quien" id="quien"></div><h1 id="titulo"></h1></div>' +
    '<div class="der"><div id="reloj">0:00</div><div class="lim">límite 10:00</div></div></header>' +
    '<main><section class="vista"><div class="rot">En pantalla ahora</div>' +
    '<div class="marco ahora"><iframe id="mini" title="Diapositiva en pantalla" tabindex="-1"></iframe></div>' +
    '<div class="prox"><div class="marco" id="marco2"><iframe id="mini2" title="Diapositiva siguiente" tabindex="-1"></iframe></div><div class="sig" id="sig"></div></div></section>' +
    '<section class="texto"><div class="barra"><span class="rot">Notas del orador</span>' +
    '<button class="ch" id="menos" title="Achicar la letra">A−</button><button class="ch" id="mas" title="Agrandar la letra">A+</button></div>' +
    '<div id="notas"></div>' +
    '<div class="botones"><button id="ant">← Anterior</button><button id="sigb" class="p">Siguiente →</button><span class="esp"></span>' +
    '<button id="pausa">Iniciar</button><button id="cero">Reiniciar reloj</button></div>' +
    '<p class="pista">Las flechas también funcionan en esta ventana. El reloj arranca solo al pasar de la primera diapositiva.</p></section></main></body></html>';

  function abrirPresentador() {
    if (presentador && !presentador.closed) { presentador.focus(); actualizarPresentador(); return; }
    presentador = window.open('', 'defensa-notas', 'popup=yes,width=1180,height=760,resizable=yes,scrollbars=yes');
    if (!presentador) { avisar('El navegador bloqueó la ventana de notas: permití ventanas emergentes y volvé a tocar P'); return; }
    var d = presentador.document;
    d.open(); d.write(PAGINA); d.close();
    d.getElementById('ant').addEventListener('click', anterior);
    d.getElementById('sigb').addEventListener('click', siguiente);
    d.getElementById('pausa').addEventListener('click', function () { if (inicio) pausarReloj(); else arrancarReloj(); });
    d.getElementById('cero').addEventListener('click', reiniciarReloj);
    d.getElementById('menos').addEventListener('click', function () { letraNotas(-2); });
    d.getElementById('mas').addEventListener('click', function () { letraNotas(2); });
    presentador.addEventListener('keydown', tecla);
    if (!reloj) reloj = setInterval(pintarReloj, 500);
    letraNotas(0);
    actualizarPresentador();
  }

  function letraNotas(delta) {
    tamNotas = Math.max(16, Math.min(44, tamNotas + delta));
    try { localStorage.setItem('defensa-letra-notas', String(tamNotas)); } catch (e) { /* sin almacenamiento */ }
    if (presentador && !presentador.closed) presentador.document.getElementById('notas').style.fontSize = tamNotas + 'px';
  }

  /* Muestra la diapositiva n en una miniatura (un iframe con esta misma página). */
  function miniatura(frame, n) {
    var url = BASE + '?mini=1#' + (n + 1);
    if (frame.dataset.url === url) return;
    var primera = !frame.dataset.url;
    frame.dataset.url = url;
    if (!primera) {
      try { frame.contentWindow.location.replace(url); return; } catch (e) { /* cae al src */ }
    }
    frame.src = url;
  }

  function actualizarPresentador() {
    if (!presentador || presentador.closed) return;
    var d = presentador.document, sl = slides[actual];
    if (!d.getElementById('notas')) return;
    var nota = sl.querySelector('.notes');
    var partes = [dosDigitos(actual + 1) + ' / ' + dosDigitos(slides.length)];
    if (sl.dataset.speaker) partes.push(sl.dataset.speaker);
    if (nota && nota.dataset.time) partes.push(nota.dataset.time);
    d.getElementById('quien').textContent = partes.join(' · ');
    d.getElementById('titulo').textContent = titulo(sl);
    var caja = d.getElementById('notas');
    caja.textContent = '';
    if (sl.dataset.speaker) {              // «Jorge: …» para ver de un vistazo quién habla
      var quien = d.createElement('b');
      quien.className = 'or';
      quien.textContent = sl.dataset.speaker + ': ';
      caja.appendChild(quien);
    }
    caja.appendChild(d.createTextNode(nota ? nota.textContent.trim() : '(sin notas)'));
    caja.scrollTop = 0;
    miniatura(d.getElementById('mini'), actual);

    var prox = slides[actual + 1], sig = d.getElementById('sig');
    sig.innerHTML = '';
    d.getElementById('marco2').style.display = prox ? '' : 'none';
    if (prox) {
      miniatura(d.getElementById('mini2'), actual + 1);
      var b = d.createElement('b');
      b.textContent = titulo(prox);
      sig.appendChild(d.createTextNode('Sigue'));
      sig.appendChild(b);
      if (prox.dataset.speaker && prox.dataset.speaker !== sl.dataset.speaker) {
        var c = d.createElement('span');
        c.className = 'cambio';
        c.textContent = 'Pasa a ' + prox.dataset.speaker;
        sig.appendChild(c);
      }
    } else {
      sig.textContent = 'Última diapositiva.';
    }
    d.getElementById('ant').disabled = actual === 0;
    d.getElementById('sigb').disabled = actual === slides.length - 1;
    pintarReloj();
  }

  /* ---------- Ayuda ---------- */
  var ocultar = null;
  function avisar(texto) {
    if (texto) ayuda.textContent = texto;
    ayuda.classList.add('ver');
    clearTimeout(ocultar);
    ocultar = setTimeout(function () { ayuda.classList.remove('ver'); }, 4200);
  }

  /* ---------- Inicio ---------- */
  armarReglas();
  ajustar();
  ir(desdeHash(), true);

  window.addEventListener('resize', ajustar);
  window.addEventListener('hashchange', function () { ir(desdeHash(), true); });
  if (MINI) return;              // la miniatura solo muestra: sin teclado ni clics

  avisar();
  window.addEventListener('keydown', tecla);
  stage.addEventListener('click', function (e) {
    if (e.target.closest('a')) return;
    var r = stage.getBoundingClientRect();
    if (e.clientX - r.left < r.width * 0.25) anterior(); else siguiente();
  });
  var x0 = null;
  stage.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (x0 === null) return;
    var dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 50) { if (dx < 0) siguiente(); else anterior(); }
  });
  window.addEventListener('beforeunload', function () { if (presentador && !presentador.closed) presentador.close(); });
})();
