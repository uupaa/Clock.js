# Clock.js [![Build Status](https://travis-ci.org/uupaa/Clock.js.png)](http://travis-ci.org/uupaa/Clock.js)

[![npm](https://nodei.co/npm/uupaa.clock.js.png?downloads=true&stars=true)](https://nodei.co/npm/uupaa.clock.js/)

Master/Base Clock, Virtual timer.

## Document

- [Clock.js wiki](https://github.com/uupaa/Clock.js/wiki/Clock)
- [WebModule](https://github.com/uupaa/WebModule)
    - [Slide](http://uupaa.github.io/Slide/slide/WebModule/index.html)
    - [Development](https://github.com/uupaa/WebModule/wiki/Development)

## Run on

### Browser and node-webkit

```js
<script src="lib/Clock.js"></script>
<script>
var clock = new Clock([tick], { vsync: true, start: true });

function tick(timeStamp, deltaTime) {
    // your task
}
</script>
```

### WebWorkers

```js
importScripts("lib/Clock.js");

```

### Node.js

```js
require("lib/Clock.js");

```

