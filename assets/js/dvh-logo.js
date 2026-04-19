/*!
 * dvh-logo.js — animated 3D embedding logo mark for Dong Viet Hoang
 * Zero dependencies. Pure SVG + requestAnimationFrame.
 *
 * Usage:
 *   <div id="logo"></div>
 *   <script src="dvh-logo.js"></script>
 *   <script>
 *     DVHLogo.mount('#logo', { size: 220, gridN: 5, clusterRadius: 1.2 });
 *   </script>
 *
 * Options:
 *   size           – px (default 220)
 *   gridN          – points per side in the 3D lattice (default 5)
 *   clusterRadius  – how many neighbors join the accent cluster (default 1.2)
 *   speed          – rotation speed multiplier (default 1)
 *   parallax       – follow cursor in 3D (default true)
 *   accent         – accent color (default 'oklch(0.55 0.14 240)')
 *   ink            – outer point color (default 'oklch(0.18 0.01 250)')
 *   rotate         – auto-rotate (default true)
 */
(function (global) {
  'use strict';

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var DEFAULTS = {
    size: 220,
    gridN: 5,
    clusterRadius: 1.2,
    speed: 1,
    parallax: true,
    accent: 'oklch(0.55 0.14 240)',
    ink: 'oklch(0.18 0.01 250)',
    rotate: true,
  };

  function el(name, attrs) {
    var n = document.createElementNS(SVG_NS, name);
    if (attrs) for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function mount(target, userOpts) {
    var host = typeof target === 'string' ? document.querySelector(target) : target;
    if (!host) throw new Error('DVHLogo: target not found');

    var opts = Object.assign({}, DEFAULTS, userOpts || {});
    var vb = 2.4;

    // Build lattice points in [-1, 1]^3
    var points = [];
    var step = 2 / (opts.gridN - 1);
    var cx = Math.floor(opts.gridN / 2);
    for (var i = 0; i < opts.gridN; i++) {
      for (var j = 0; j < opts.gridN; j++) {
        for (var k = 0; k < opts.gridN; k++) {
          var dx = i - cx, dy = j - cx, dz = k - cx;
          var dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          var isAccent = dist <= opts.clusterRadius;
          points.push({
            x: -1 + i * step, y: -1 + j * step, z: -1 + k * step,
            accent: isAccent,
            accentStrength: isAccent ? Math.max(0, 1 - dist / (opts.clusterRadius + 0.01)) : 0,
            i: i, j: j, k: k,
          });
        }
      }
    }

    // Precompute cluster edges (grid-adjacent pairs)
    var accentPts = points.filter(function (p) { return p.accent; });
    var edgePairs = [];
    for (var a = 0; a < accentPts.length; a++) {
      for (var b = a + 1; b < accentPts.length; b++) {
        var pa = accentPts[a], pb = accentPts[b];
        var d = Math.abs(pa.i - pb.i) + Math.abs(pa.j - pb.j) + Math.abs(pa.k - pb.k);
        if (d === 1) edgePairs.push([pa, pb]);
      }
    }

    // Build SVG
    var svg = el('svg', {
      width: opts.size, height: opts.size,
      viewBox: '-' + vb + ' -' + vb + ' ' + (vb * 2) + ' ' + (vb * 2),
    });
    svg.style.display = 'block';
    svg.style.overflow = 'hidden';

    // Bounding cube group
    var cubeG = el('g');
    var cubeEdges = [
      [0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],
      [0,4],[1,5],[2,6],[3,7],
    ].map(function (pair) {
      var ln = el('line', { stroke: opts.ink, 'stroke-width': '0.008' });
      cubeG.appendChild(ln);
      return { pair: pair, node: ln };
    });
    svg.appendChild(cubeG);

    // Edge lines between accent points
    var edgeG = el('g');
    var edgeNodes = edgePairs.map(function () {
      var ln = el('line', { stroke: opts.accent, 'stroke-linecap': 'round' });
      edgeG.appendChild(ln);
      return ln;
    });
    svg.appendChild(edgeG);

    // Point circles (one outer halo for accent, one inner dot for every point)
    var haloG = el('g');
    var dotG = el('g');
    svg.appendChild(haloG);
    svg.appendChild(dotG);

    var nodes = points.map(function (p) {
      var dot = el('circle', { fill: p.accent ? opts.accent : opts.ink });
      dotG.appendChild(dot);
      var halo = null;
      if (p.accent) {
        halo = el('circle', { fill: opts.accent });
        haloG.appendChild(halo);
      }
      return { p: p, dot: dot, halo: halo };
    });

    host.appendChild(svg);

    // Cube verts (static)
    var s = 1.35;
    var cubeVerts = [
      [-s,-s,-s],[s,-s,-s],[s,s,-s],[-s,s,-s],
      [-s,-s,s],[s,-s,s],[s,s,s],[-s,s,s],
    ];

    // Mouse parallax state
    var mouseX = 0, mouseY = 0;
    var onMove = null, onLeave = null;
    if (opts.parallax) {
      onMove = function (e) {
        var r = svg.getBoundingClientRect();
        var ccx = r.left + r.width / 2;
        var ccy = r.top + r.height / 2;
        mouseX = (e.clientX - ccx) / r.width;
        mouseY = (e.clientY - ccy) / r.height;
      };
      onLeave = function () { mouseX = 0; mouseY = 0; };
      window.addEventListener('mousemove', onMove);
      svg.addEventListener('mouseleave', onLeave);
    }

    // Animation loop
    var rafId = null;
    var t0 = performance.now();
    var persp = 3.2;

    function frame(now) {
      var tick = (now - t0) * 0.001 * opts.speed;
      var ry = tick * 0.35 + mouseX * 0.6;
      var rx = Math.sin(tick * 0.2) * 0.15 + mouseY * 0.35;
      var cosY = Math.cos(ry), sinY = Math.sin(ry);
      var cosX = Math.cos(rx), sinX = Math.sin(rx);
      var breath = (Math.sin(tick * 1.3) + 1) / 2;
      var pulse = 0.85 + breath * 0.3;

      // Project every point
      var projected = new Array(points.length);
      for (var pi = 0; pi < points.length; pi++) {
        var pt = points[pi];
        var X = pt.x * cosY - pt.z * sinY;
        var Z = pt.x * sinY + pt.z * cosY;
        var Y = pt.y;
        var Y2 = Y * cosX - Z * sinX;
        var Z2 = Y * sinX + Z * cosX;
        var scale = persp / (persp - Z2);
        projected[pi] = { sx: X * scale, sy: Y2 * scale, depth: Z2, scale: scale, p: pt };
      }

      // Cube
      for (var ci = 0; ci < cubeEdges.length; ci++) {
        var ce = cubeEdges[ci];
        var v0 = cubeVerts[ce.pair[0]], v1 = cubeVerts[ce.pair[1]];
        var p0 = project(v0, cosX, sinX, cosY, sinY, persp);
        var p1 = project(v1, cosX, sinX, cosY, sinY, persp);
        var dmid = (p0.depth + p1.depth) / 2;
        var op = 0.04 + ((dmid + 1.5) / 3) * 0.08;
        ce.node.setAttribute('x1', p0.sx);
        ce.node.setAttribute('y1', p0.sy);
        ce.node.setAttribute('x2', p1.sx);
        ce.node.setAttribute('y2', p1.sy);
        ce.node.setAttribute('opacity', op);
      }

      // Edges — each flickers independently
      for (var ei = 0; ei < edgePairs.length; ei++) {
        var pa2 = edgePairs[ei][0], pb2 = edgePairs[ei][1];
        var projA = projected[points.indexOf(pa2)];
        var projB = projected[points.indexOf(pb2)];
        var avgD = (projA.depth + projB.depth) / 2;
        var baseOp = 0.15 + ((avgD + 1) / 2) * 0.55;
        var eSeed = (pa2.i * 131 + pa2.j * 29 + pa2.k * 7) ^ ((pb2.i * 257 + pb2.j * 61 + pb2.k * 13) << 1);
        var ePhase = (Math.abs(eSeed) % 1000) / 1000 * Math.PI * 2;
        var eFreq = 1.1 + (Math.abs(eSeed * 17) % 1000) / 1000 * 2.6;
        var eSharp = Math.sin(tick * eFreq + ePhase);
        var eBlink = Math.pow(Math.max(0, eSharp * 0.5 + 0.5), 0.9);
        var eFlash = eSharp > 0.88 ? (eSharp - 0.88) * 8 : 0;
        var finalOp = Math.min(1, (baseOp * (0.15 + eBlink * 0.95) + eFlash * 0.25) * pulse);
        var sw = (0.015 + ((avgD + 1) / 2) * 0.015) * (0.7 + eBlink * 0.6 + eFlash * 0.8);
        var ln = edgeNodes[ei];
        ln.setAttribute('x1', projA.sx);
        ln.setAttribute('y1', projA.sy);
        ln.setAttribute('x2', projB.sx);
        ln.setAttribute('y2', projB.sy);
        ln.setAttribute('stroke-width', sw);
        ln.setAttribute('opacity', finalOp);
      }

      // Depth-sort for correct layering (back to front)
      var order = projected.slice().sort(function (x, y) { return x.depth - y.depth; });
      // Re-append dots in order (this sorts the DOM for painter's algorithm)
      for (var oi = 0; oi < order.length; oi++) {
        var proj = order[oi];
        var ni = points.indexOf(proj.p);
        var node = nodes[ni];
        var depthT = (proj.depth + 1) / 2;
        if (proj.p.accent) {
          var seed = proj.p.i * 131 + proj.p.j * 29 + proj.p.k * 7;
          var phase = (seed % 100) / 100 * Math.PI * 2;
          var freq = 1.6 + ((seed * 37) % 100) / 100 * 2.2;
          var sharp = Math.sin(tick * freq + phase);
          var blink = Math.pow(Math.max(0, sharp * 0.5 + 0.5), 0.6);
          var flash = sharp > 0.92 ? (sharp - 0.92) * 12 : 0;
          var r = (0.055 + proj.p.accentStrength * 0.035) * proj.scale * pulse * (0.85 + blink * 0.3);
          var baseOp2 = 0.55 + depthT * 0.45;
          var op2 = Math.min(1, baseOp2 * (0.55 + blink * 0.65) + flash * 0.3);
          var haloOp = (0.08 + blink * 0.22 + flash * 0.4) * pulse;
          node.dot.setAttribute('cx', proj.sx);
          node.dot.setAttribute('cy', proj.sy);
          node.dot.setAttribute('r', r);
          node.dot.setAttribute('opacity', op2);
          if (node.halo) {
            node.halo.setAttribute('cx', proj.sx);
            node.halo.setAttribute('cy', proj.sy);
            node.halo.setAttribute('r', r * (2.2 + flash * 1.5));
            node.halo.setAttribute('opacity', haloOp);
          }
        } else {
          var r2 = 0.028 * proj.scale;
          var op3 = 0.12 + depthT * 0.45;
          node.dot.setAttribute('cx', proj.sx);
          node.dot.setAttribute('cy', proj.sy);
          node.dot.setAttribute('r', r2);
          node.dot.setAttribute('opacity', op3);
        }
      }

      rafId = requestAnimationFrame(frame);
    }

    function project(v, cosX, sinX, cosY, sinY, persp) {
      var X = v[0] * cosY - v[2] * sinY;
      var Z = v[0] * sinY + v[2] * cosY;
      var Y = v[1];
      var Y2 = Y * cosX - Z * sinX;
      var Z2 = Y * sinX + Z * cosX;
      var scale = persp / (persp - Z2);
      return { sx: X * scale, sy: Y2 * scale, depth: Z2 };
    }

    if (opts.rotate) rafId = requestAnimationFrame(frame);
    else frame(performance.now()); // render one static frame

    // Return a destroy handle
    return {
      destroy: function () {
        if (rafId) cancelAnimationFrame(rafId);
        if (onMove) window.removeEventListener('mousemove', onMove);
        if (onLeave) svg.removeEventListener('mouseleave', onLeave);
        host.removeChild(svg);
      },
      svg: svg,
    };
  }

  global.DVHLogo = { mount: mount };
})(typeof window !== 'undefined' ? window : this);
