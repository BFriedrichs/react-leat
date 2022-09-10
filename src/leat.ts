import React, { useState } from 'react';
import { encodeProps } from './util';

const LEAT_SELECTOR = 'data-leat-element';

type Script = {
  func: Function;
  refs: string[];
  props?: Record<string, any>;
};

type HydrationProps = { [key: `data-leat-element-${string}`]: string };

type ScriptUpdater = {
  addRef: (refName: string) => HydrationProps;
};

type LeatContextType = {
  addScript: (func: Function, props?: Record<string, any>) => ScriptUpdater;
};

let context: React.Context<LeatContextType> | null = null;
export class ServerScriptRenderer {
  private scripts: Script[];
  private addScript: (
    func: Function,
    props?: Record<string, any>
  ) => ScriptUpdater;

  constructor() {
    this.scripts = [];

    this.addScript = this._addScript.bind(this);
  }

  private _addScript(func: Function, props?: Record<string, any>) {
    const script: Script = { func, props, refs: [] };
    this.scripts.push(script);

    const addRef = (refName: string): ReturnType<ScriptUpdater['addRef']> => {
      script.refs.push(refName);
      const elementAttribute = `${LEAT_SELECTOR}-${this.scripts.length - 1}`;

      return { [elementAttribute]: refName };
    };

    return {
      addRef,
    };
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
    return this.scripts.map((script) => {
      const { props = {}, refs } = script;
      const scriptProps = {
        ...props,
      };

      refs.forEach((ref, i) => {
        scriptProps[
          ref
        ] = `document.querySelector('[${LEAT_SELECTOR}-${i}="${ref}"]')`;
      });

      const scriptData = `(${script.func.toString()})(${encodeProps(
        scriptProps
      )});`;

      return scriptData;
    });
  }

  getScriptTag() {
    return `<script>${this.getScripts().join('\n\n')}</script>`;
  }
}

export const useClientSideScript = (
  func: Function,
  props: Record<string, any>
) => {
  if (!context) {
    return {
      addRef: (refName: string) => ({ [LEAT_SELECTOR]: refName }),
    };
  }
  const { addScript } = React.useContext(context);
  const [scriptMods] = useState(() => {
    const scriptMods = addScript(func, props);

    return scriptMods;
  });

  return scriptMods;
};

type LeatProps = {
  children: (hydrationProps: ScriptUpdater) => React.ReactNode;
  script: (props: Record<string, any> & { element: HTMLElement }) => void;
  props?: Record<string, any>;
};

export const Leat = ({ children, script, props = {} }: LeatProps) => {
  const scriptUpdater = useClientSideScript(script, {
    ...props,
  });

  if (!children) return;
  return children(scriptUpdater);
};
