# Clock.js [![Build Status](https://travis-ci.org/uupaa/Clock.js.svg)](https://travis-ci.org/uupaa/Clock.js)

[![npm](https://nodei.co/npm/uupaa.clock.js.svg?downloads=true&stars=true)](https://nodei.co/npm/uupaa.clock.js/)

Master/Base Clock, Virtual timer.


This module made of [WebModule](https://github.com/uupaa/WebModule).

## Documentation
- [Spec](https://github.com/uupaa/Clock.js/wiki/)
- [API Spec](https://github.com/uupaa/Clock.js/wiki/Clock)

## Browser, NW.js and Electron

```js
<script src="<module-dir>/lib/WebModule.js"></script>
<script src="<module-dir>/lib/Clock.js"></script>
<script>
var clock = new WebModule.Clock([tick], { vsync: true, start: true });

function tick(timeStamp, deltaTime) {
    // your task
}
</script>
```

## WebWorkers

```js
importScripts("<module-dir>lib/WebModule.js");
importScripts("<module-dir>lib/Clock.js");

```

## Node.js

```js
require("<module-dir>lib/WebModule.js");
require("<module-dir>lib/Clock.js");

```

