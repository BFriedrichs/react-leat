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

<br/>

## \<Leat\> Element
By utilising the `<Leat>` element hydrations can be directly included in your code.

```js
import { Leat } from 'react-leat';
```

```js
const logSearchParameter = () => {
  console.log(window.location.search);
}

return <div>
  <Leat script={logSearchParameter}/>
</div>
```

Props have to be added manually since scope cannot be resolved from outside the function.
```js
const logTest = ({ test }) => {
  console.log(test);
}

const test = 1;
return <div>
  <Leat
    script={logSearchParameter}
    props={{ test }}
  />
</div>
```

Props can also be React elements, these will be rendered via a hidden DOM element and are available as a regular `HTMLElement` once the function runs.
```js
const logTest = ({ getRef }) => {
  document.body.appendChild(getRef('element'));
}

return <div>
  <Leat
    script={attachElement}
    props={{
      element: (
        <div>Hello!</div>
      )
    }}
  />
</div>
```

A children or prop function can be supplied which offers `addRef` to references the DOM as HTMLElements. These can then be retrieved using the special parameter `getRef`.
```js
const logChange = ({ getRef }) => {
  // A child can be accessed directly
  getRef('element').addEventListener('change', (event) => {
    console.log(event.target.value);
  });

  // References to elements in prop elements can be accessed after they are added to the dom.
  document.body.appendChild(getRef('propElement'));
  getRef('button').addEventListener('click', (event) => {
    console.log('clicked');
  });
}

return <Leat
  script={logChange}
  props={{
    propElement: ({ addRef }) => (
      <button {...addRef('button')}>Hello!</button>
    )
  }}
>
  {({ addRef }) => (
    <input {...addRef('element')} />
  )}
</Leat>;
```

<br />

### Docs: Leat

| Props          | Type      | Description |
| :-------------- | :-------- | :-- |
| `script`| `Function` | Any function. Warning! The scope has to be contained to itself. |
| `props` optional     | `Record<string, any>` | Any props to make available in the function itself. Has to be JSON encodable. If the prop is a function it will automatically be invoked with a `Script` object. |
| `children` optional   | `(script: Script) => ReactNode` | A function which takes a `Script` and return other JSX elements. |


### Docs: Script
| Props          | Type      | Description |
| :-------------- | :-------- | :-- |
| `addRef`| `(refName: string) => HydrationProps` | Adds the name to the reference pool and adds arguments which need to be added to the object. |


<br />

---

<br />

## useClientSideScript
You can also inject scripts programmatically via the `useClientSideScript` hook.

```js
import { useClientSideScript } from 'react-leat';
```

```js
const logSearchParameter = () => {
  console.log(window.location.search);
}

const useClientSideScript(logSearchParameter)

return <div></div>;
```

or with an element

```js
const logChange = ({ getRef }) => {
  getRef('inputElem').addEventListener('change', (event) => {
    console.log(event.target.value);
  });
}

const { addRef } = useClientSideScript(logSearchParameter)

return <input {...addRef('inputElem')} />;
```

### Docs: useClientScript

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

const leat = new ServerScriptRenderer({ minify: true })

const renderedApp = ReactDOM.renderToString(leat.collectScripts(App));
const scriptTag = leat.getScriptTag();

const index = `<html>
  <body>
    ${renderedApp}
    ${scriptTag}
  </body>
</html>`;
```

### Docs: ServerScriptRenderer

| Options          | Type      | Description |
| :-------------- | :-------- | :-- |
| `minify` default=true | `boolean` | Minify scripts using [UglifyJS](https://www.npmjs.com/package/uglify-js). |
| `skipVerify` default=false | `boolean` | Skip the scope verification step. |

<br />

| Member          | Type      | Description |
| :-------------- | :-------- | :-- |
| `collectScripts`| `(node: React.Node) => React.Node` | Gathers all scripts during the render step. |
| `getScripts`    | `() => string[]` | Returns a list of IIFEs with all props encoded in it's parameter. |
| `getScriptTag`  | `() => string` | Returns all scripts inside a `<script>` tag which can immediately be injected into a HTML response. |

<br />

---

<br />

## Other examples

To disable a script running if you (sometimes) run hydration anyway just set a window variable after hydration and check for it in your supplied scripts where applicable.
```js
// index.js
ReactDOM.hydrateRoot(container, <App />)

window.appIsHydrated = true;

// App.js
const logChange = ({ getRef }) => {
  getRef('element').addEventListener('change', (event) => {
    if (window.appIsHydrated) return;
    console.log(event.target.value);
  });
}

return <Leat
  script={logChange}
>
  {({ addRef }) => (
    <input {...addRef('element')} />
  )}
</Leat>;

```