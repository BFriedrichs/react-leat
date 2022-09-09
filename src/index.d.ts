declare module 'esprima' {
  import ESTree from 'estree';

  export function parse(
    input: string,
    config?: ParseOptions,
    delegate?: (node: ESTree.Node, meta: any) => void
  ): ESTree.Node;
}
