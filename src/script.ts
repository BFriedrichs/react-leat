import { LEAT_SELECTOR } from './util';

export type ScriptOptions = {
  autoLoadProps: boolean;
};
export type ScriptProps = Record<string, any>;
type HydrationProps = { [key: `data-leat-element-${string}`]: string };

const defaultScriptOptions: ScriptOptions = {
  autoLoadProps: true,
};

export class Script {
  index: number;
  func: Function;
  props: ScriptProps;
  options: ScriptOptions;
  refs: string[];

  constructor(
    index: number,
    func: Function,
    props: ScriptProps,
    options: Partial<ScriptOptions> = {}
  ) {
    const scriptOptions = { ...defaultScriptOptions, ...options };

    this.index = index;
    this.func = func;
    this.props = props;
    this.options = scriptOptions;
    this.refs = [];

    this.addRef = this.addRef.bind(this);
  }

  addRef(refName: string): HydrationProps {
    this.refs.push(refName);
    const elementAttribute = `${LEAT_SELECTOR}-${this.index}`;

    return { [elementAttribute]: refName };
  }
}
