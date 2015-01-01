(function(global){
'use strict';(function(c) {
  function f(a, b) {
    function e(a) {
      a ? (d.d.i = Date.now(), d.stop()) : (d.d.total += Date.now() - d.d.i, d.d.i = 0, d.start());
    }
    b = b || {};
    var d = this;
    this.e = h;
    this.a = [];
    this.m = b.speed || 16.666;
    this.g = b.pulse || 0;
    this.c = !1;
    this.l = this.b = 0;
    this.h = -1;
    this.j = this.k = 0;
    this.f = p.bind(this);
    this.d = {i:0, total:0};
    (a || []).forEach(m, this);
    b.vsync && (this.e = c.requestAnimationFrame ? k : g);
    if (b.suspend && c.PageVisibilityEvent) {
      c.PageVisibilityEvent.on(e);
    }
    b.start && this.start();
    this.setBaseTime(b.baseTime || 0);
  }
  function p(a) {
    if (this.c) {
      switch(this.e) {
        case g:
          this.b = setTimeout(this.f, 4);
          break;
        case k:
          this.b = c.requestAnimationFrame(this.f);
      }
      if (this.a.length) {
        if (this.e === h || this.e === g) {
          a = Date.now() - this.j;
        }
        a -= this.d.total;
        var b = 0, e = 0, d = this.l++;
        0 > this.h ? this.g && (a = this.g) : this.g ? (a = this.g + this.h, e = this.g) : e = a - this.h;
        this.h = a;
        for (var l = 0, f = this.a.length;l < f;++l) {
          var n = this.a[l];
          n ? n(a, e, d) : ++b;
        }
        if (b) {
          a = [];
          b = 0;
          for (e = this.a.length;b < e;++b) {
            this.a[b] && a.push(this.a[b]);
          }
          this.a = a;
        }
      }
    }
  }
  function m(a) {
    this.has(a) || this.a.push(a);
    return this;
  }
  var h = 1, g = 2, k = 3;
  f.prototype = {constructor:f, setBaseTime:function(a) {
    this.k = a;
    this.j = Date.now() - a;
  }, getBaseTime:function() {
    return this.k;
  }, now:function() {
    return Date.now() - this.j;
  }, start:function() {
    if (!this.c) {
      switch(this.c = !0, this.e) {
        case h:
          this.b = setInterval(this.f, this.m);
          break;
        case g:
          this.b = setTimeout(this.f, 4);
          break;
        case k:
          this.b = c.requestAnimationFrame(this.f);
      }
    }
    return this;
  }, pause:function() {
    this.c ? this.stop() : this.start();
    return this;
  }, stop:function() {
    if (this.c) {
      this.c = !1;
      switch(this.e) {
        case h:
          clearInterval(this.b);
          break;
        case g:
          clearTimeout(this.b);
          break;
        case k:
          c.cancelAnimationFrame(this.b);
      }
      this.b = 0;
    }
    return this;
  }, isActive:function() {
    return this.c;
  }, on:m, off:function(a) {
    a = this.a.indexOf(a);
    0 <= a && (this.a[a] = null);
    return this;
  }, has:function(a) {
    return 0 <= this.a.indexOf(a);
  }, clear:function() {
    for (var a = 0, b = this.a.length;a < b;++a) {
      this.a[a] = null;
    }
    return this;
  }, nth:function(a, b) {
    function e(f, g) {
      c + 1 >= b && d.off(e);
      a(f, g, c++);
    }
    b = b || 1;
    var d = this, c = 0;
    if (this.has(a)) {
      throw new TypeError("callback function already exists");
    }
    return d.on(e);
  }, resetCount:function() {
    this.l = 0;
    return this;
  }, resetTimeStamp:function() {
    this.h = -1;
    this.d = {i:0, total:0};
    return this;
  }};
  "process" in c && (module.exports = f);
  c["Clock" in c ? "Clock_" : "Clock"] = f;
})((this || 0).self || global);

})((this||0).self||global);
