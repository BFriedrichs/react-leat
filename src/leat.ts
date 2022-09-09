import React from 'react';

type LeatContextType = {
  addScript: (script: string) => void;
};

const scripts: string[] = [];
const addScript = (script: string) => {
  scripts.push(script);
};

export const getClientScript = () => {
  return scripts.join('\n\n');
};

export const LeatContext: React.Context<LeatContextType> =
  React.createContext<LeatContextType>({ addScript });

export const LeatProvider = ({ children }: { children: React.ReactNode }) => {
  return React.createElement(
    LeatContext.Provider,
    { value: { addScript } },
    children
  );
};

const encodeProps = (data: Record<string, any>): string => {
  // if (data instanceof HTMLElement) {
  //   const className = 'test-123';
  //   data.classList.add(className);
  //   return `document.getElementsByClassName(${className})[0]`;
  // }
  if (typeof data !== 'object') {
    return data;
  }
  const encoded = Object.entries(data)
    .map(([key, value]) => {
      return `${key}:${encodeProps(value)}`;
    })
    .join(',');
  return `{${encoded}}`;
};

type ClientScriptFunction = (props?: Record<string, any>) => void;

export const useClientSideScript = <T extends ClientScriptFunction>(
  func: T,
  props: Parameters<T>[0]
) => {
  const { addScript } = React.useContext(LeatContext);

  const stringified = `(${func.toString()})(${
    props ? encodeProps(props) : ''
  });`;
  addScript(stringified);

  return stringified;
};
