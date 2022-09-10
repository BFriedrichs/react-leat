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

### \<Leat\> Element
By utilising the `<Leat>` element hydrations can be directly included in your code.

```js
import { Leat } from 'react-leat';

const logSearchParameter = () => {
  console.log(window.location.search);
}

export const App = () => {
  return <div>
    <Leat script={logSearchParameter}/>
  </div>
}
```

Props have to be added manually since scope cannot be resolved manually. 
```js
import { Leat } from 'react-leat';

const logTest = ({ test }) => {
  console.log(test);
}

export const App = () => {
  const test = 1;
  return <div>
    <Leat
      script={logSearchParameter}
      props={{ test }}
    />
  </div>
}
```

A children function can be supplied which offers `addRef` to references the DOM as HTMLElements.
```js
import { Leat } from 'react-leat';

const logChange = ({ element }) => {
  element.addEventListener('change', (event) => {
    console.log(event.target.value);
  });
}

export const App = () => {
  return <Leat
    script={logChange}
  >
    ({ addRef }) => (
      <input {...addRef('element')} />
    )
  </Leat>;
}
```

<br />

### Docs

| Props          | Type      | Description |
| :-------------- | :-------- | :-- |
| `script`| `Function` | Any function. Warning! The scope has to be contained to itself. |
| `props` optional     | `Record<string, any>` | Any props to make available in the function itself. Has to be JSON encodable. |
| `children` optional   | `(hydrationProps: HydrationProps) => ReactNode` | A function which takes `HydrationProps` and return other JSX elements. |


<br />

---

<br />

### useClientSideScript
You can also inject scripts programmatically via the `useClientSideScript` hook.

```js
import { useClientSideScript } from 'react-leat';

const logSearchParameter = () => {
  console.log(window.location.search);
}

export const App = () => {
  const useClientSideScript(logSearchParameter)

  return <div></div>;
}
```

or with an element

```js
import { useClientSideScript } from 'react-leat';

const logChange = ({ inputElem }) => {
  inputElem.addEventListener('change', (event) => {
    console.log(event.target.value);
  });
}

export const App = () => {
  const { addRef } = useClientSideScript(logSearchParameter)

  return <input {...addRef('inputElem')} />;
}
```

### Docs

```js
useClientSideScript(script: Function, props?: Record<string, any>)
```

| Arguments          | Type      | Description |
| :-------------- | :-------- | :-- |
| `script`| `Function` | Any function. Warning! The scope has to be contained to itself. |
| `props` optional     | `Record<string, any>` | Any props to make available in the function itself. Has to be JSON encodable. |

<br />

---

<br />

## ServerScriptRenderer
On the server utilise the `ServerScriptRenderer` class to collect and retrieve all scripts.
Make sure to wrap your app component with `.collectScripts` before calling `.getScriptTag` or `.getScripts`.

```js
import ReactDOM from 'react-dom';
import React from 'react';
import { ServerScriptRenderer } from 'react-leat';

import { App } from 'client/dist/index.js'; // After some build step

const leat = new ServerScriptRenderer()

const renderedApp = ReactDOM.renderToString(leat.collectScripts(App));
const scriptTag = leat.getScriptTag();

const index = `<html>
  <body>
    ${renderedApp}
    ${scriptTag}
  </body>
</html>`;
```

### Docs
| Member          | Type      | Description |
| :-------------- | :-------- | :-- |
| `collectScripts`| `(node: React.Node) => React.Node` | Gathers all scripts during the render step. |
| `getScripts`    | `() => string[]` | Returns a list of IIFEs with all props encoded in it's parameter. |
| `getScriptTag`  | `() => string` | Returns all scripts inside a `<script>` tag which can immediately be injected into a HTML response. |