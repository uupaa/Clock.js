# Clock.js [![Build Status](https://travis-ci.org/uupaa/Clock.js.svg)](https://travis-ci.org/uupaa/Clock.js)

[![npm](https://nodei.co/npm/uupaa.clock.js.svg?downloads=true&stars=true)](https://nodei.co/npm/uupaa.clock.js/)

Master/Base Clock, Virtual timer.

## Document

- Clock.js made of [WebModule](https://github.com/uupaa/WebModule).
- [Spec](https://github.com/uupaa/Clock.js/wiki/Clock)

## Browser and NW.js(node-webkit)

```js
<script src="<your-install-dir>/lib/WebModule.js"></script>
<script src="<your-install-dir>/lib/Clock.js"></script>
<script>
var clock = new WebModule.Clock([tick], { vsync: true, start: true });

function tick(timeStamp, deltaTime) {
    // your task
}
</script>
```

## WebWorkers

```js
importScripts("<your-install-dir>lib/WebModule.js");
importScripts("<your-install-dir>lib/Clock.js");

```

## Node.js

```js
require("<your-install-dir>lib/WebModule.js");
require("<your-install-dir>lib/Clock.js");

```

