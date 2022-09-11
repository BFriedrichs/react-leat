import { gatherScope } from './scope';

type VerifyOptions = {
  allowGlobals: boolean;
};

const defaultOptions = {
  allowGlobals: true,
};

export const verify = (
  func: Function,
  paramOptions: Partial<VerifyOptions> = {}
) => {
  const options = { ...defaultOptions, ...paramOptions };
  const scope = gatherScope(func);

  let outOfScope = [...scope.outOfScope];
  if (options.allowGlobals) {
    outOfScope = outOfScope.filter((v) => !(v in { ...globalThis, window: 1 }));
  }

  if (!scope.contained && outOfScope.length > 0) {
    throw new Error(
      `Identifier(s) ${outOfScope
        .map((s) => `"${s}"`)
        .join(
          ', '
        )} have not been initialised in the current scope. All variables must be supplied via function parameters.`
    );
  }

  // TODO: Fix issue with return in props reporting here
  // if (scope.hasReturn) {
  //   console.warn(
  //     'A return value for the script function is useless as it will be executed in global context.'
  //   );
  // }
};
