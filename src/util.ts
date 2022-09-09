export const addToSet = (list: string[], item: string | string[]) => {
  if (Array.isArray(item)) {
    item.forEach((i) => addToSet(list, i));
    return;
  }
  if (!list.includes(item)) {
    list.push(item);
  }
};
