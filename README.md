# React Leat

A library for small scale hydration of server side rendered react code.

This enables a website to be completely written in React without requiring to ship the entire framework for hydration.

## Installation

### npm
```
npm install react-leat
```

### yarn
```
yarn add react-leat
```

## Usage
A function can be passed to `useClientSideScript`.


```js
// client/index.js
import { useClientSideScript } from 'react-leat';

const logSearchParameter = () => {
  console.log(window.location);
}

export const App = () => {
  useClientSideScript(logSearchParameter)

  return <div></div>;
}


// server/index.js
import ReactDOM from 'react-dom';
import React from 'react';
import { LeatProvider, getClientScript } from 'react-leat';

import { App } from 'client/dist/index.js'; // After some build step

const element = React.createElement(
  LeatProvider,
  {},
  React.createElement(App)
);

const renderedApp = ReactDOM.renderToString(element)
const script = getClientScript();
const index = `<html>
  <head>
    <script>${script}</script>
  </head>
  <body>
    ${renderedApp}
  </body>
</html>`;
```

