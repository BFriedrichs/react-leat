import React, { useState } from 'react';
import ReactDOM from 'react-dom/server';
import UglifyJS from 'uglify-js';
import { Script, ScriptProps, ScriptOptions } from './script';

import { verify } from './verify';
import { LEAT_SELECTOR } from './util';

type LeatContextType = {
  addScript: (
    func: Script['func'],
    props?: Script['props'],
    options?: Partial<Script['options']>
  ) => Script;
};

let context: React.Context<LeatContextType> | null = null;

type RenderableReactElement = React.ReactElement<
  any,
  string | React.JSXElementConstructor<any>
>;

type ServerOptions = {
  minify: boolean;
  skipVerify: boolean;
  renderToString: (component: RenderableReactElement) => string;
};

const defaultRenderToString = (component: RenderableReactElement) => {
  const rendered = ReactDOM.renderToString(component);
  return rendered;
};

export class ServerScriptRenderer {
  private options: ServerOptions;
  private scripts: Script[];

  constructor(propOptions: Partial<ServerOptions> = {}) {
    this.options = {
      minify: true,
      skipVerify: false,
      renderToString: defaultRenderToString,
      ...propOptions,
    };

    this.scripts = [];
    this.addScript = this.addScript.bind(this);
    this.encodeProps = this.encodeProps.bind(this);
  }

  private encodeProps(
    data: any,
    callback?: (data: { type: string; data: string }) => void
  ): string {
    if (typeof data !== 'object') {
      return data;
    }

    if (data.$$typeof && data.$$typeof.toString() === 'Symbol(react.element)') {
      const leat = new ServerScriptRenderer(this.options);
      const rendered = this.options.renderToString(
        leat.collectScripts(data) as RenderableReactElement
      );
      const innerScript = leat.getScripts();
      if (innerScript.length > 0) {
        callback && callback({ type: 'script', data: innerScript.join('\n') });
      }
      return `(() => {const dummy = document.createElement('div');dummy.innerHTML='${rendered.replace(
        /"/g,
        '\\"'
      )}';return dummy.childNodes[0];})()`;
    }

    const encoded = Object.entries(data)
      .map(([key, value]) => {
        return `'${key}':${this.encodeProps(value, callback)}`;
      })
      .join(',');
    return `{${encoded}}`;
  }

  private addScript(
    func: Function,
    props: ScriptProps = {},
    options: Partial<ScriptOptions> = {}
  ) {
    if (!this.options.skipVerify) {
      verify(func);
    }
    const currentIndex = this.scripts.length;
    const script = new Script(currentIndex, func, props, options);
    this.scripts.push(script);

    return script;
  }

  collectScripts(node: React.ReactNode): React.ReactNode {
    const contextValue = {
      addScript: this.addScript,
    };
    context = React.createContext<LeatContextType>(contextValue);

    return React.createElement(context.Provider, {
      value: contextValue,
      children: node,
    });
  }

  getScripts(): string[] {
    const { minify } = this.options;

    const extractedScripts: string[] = [];
    const addExtractedScript = (cbData: { type: string; data: string }) => {
      if (cbData.type === 'script') {
        extractedScripts.push(cbData.data);
      }
    };

    const mappedScripts = this.scripts.map((script, i) => {
      const { props, options } = script;

      let scriptProps: ScriptProps = Object.fromEntries(
        Object.entries(props).map(([k, v]) => {
          if (typeof v === 'function') {
            v = v(script);
          }
          return [k, v];
        })
      );

      if (!options.autoLoadProps) {
        scriptProps = {
          loadProps: `() => (${this.encodeProps(
            scriptProps,
            addExtractedScript
          )})`,
        };
      }

      scriptProps['getRef'] = `(refName) =>
        document.querySelector('[${LEAT_SELECTOR}-${i}="'+refName+'"]')`;

      const encodedProps = this.encodeProps(scriptProps, addExtractedScript);
      const scriptString = script.func.toString().trim();
      const scriptData = `(${scriptString})(${encodedProps});`;

      return minify ? UglifyJS.minify(scriptData).code : scriptData;
    });

    if (extractedScripts.length > 0) {
      const extracted = extractedScripts.join('\n');
      mappedScripts.push(minify ? UglifyJS.minify(extracted).code : extracted);
    }

    return mappedScripts;
  }

  getScriptTag() {
    return `<script>${this.getScripts().join('\n\n')}</script>`;
  }
}

const nonContextScripts: Script[] = [];
export const useClientSideScript = (
  func: Function,
  props?: ScriptProps,
  options?: Partial<ScriptOptions>
) => {
  if (!context) {
    const script = new Script(nonContextScripts.length, () => null, {});
    nonContextScripts.push(script);
    return script;
  }

  const { addScript } = React.useContext(context);
  const [scriptMods] = useState(() => {
    const scriptMods = addScript(func, props, options);

    return scriptMods;
  });

  return scriptMods;
};

type LeatProps = {
  children: React.ReactNode | ((script: Script) => React.ReactNode);
  script: Function;
  props?: ScriptProps;
} & ScriptOptions;

export const Leat = ({ children, script, props, ...options }: LeatProps) => {
  const scriptUpdater = useClientSideScript(script, props, options);

  if (!children) return;
  if (typeof children === 'function') {
    return children(scriptUpdater);
  }
  return children;
};
