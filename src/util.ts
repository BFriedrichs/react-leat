import ReactDOM from 'react-dom/server';

export const addToSet = (list: string[], item: string | string[]) => {
  if (Array.isArray(item)) {
    item.forEach((i) => addToSet(list, i));
    return;
  }
  if (!list.includes(item)) {
    list.push(item);
  }
};

export const encodeProps = (data: any): string => {
  if (typeof data !== 'object') {
    return data;
  }

  if (data.$$typeof && data.$$typeof.toString() === 'Symbol(react.element)') {
    const rendered = ReactDOM.renderToString(data);
    return `(() => {const dummy = document.createElement('div');dummy.innerHTML='${rendered.replace(
      /"/g,
      '\\"'
    )}';return dummy.childNodes[0];})()`;
  }

  const encoded = Object.entries(data)
    .map(([key, value]) => {
      return `'${key}':${encodeProps(value)}`;
    })
    .join(',');
  return `{${encoded}}`;
};
