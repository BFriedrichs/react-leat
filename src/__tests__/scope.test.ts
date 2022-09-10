import { gatherScope } from '../scope';
import { verify } from '../verify';

describe('verify scope', () => {
  test('basic function is valid', () => {
    const testFunction = () => {
      1;
    };

    expect(() => verify(testFunction)).not.toThrowError();
  });

  test('local var is valid', () => {
    const testFunction = () => {
      const x = 2;
      x + 4;
    };

    expect(() => verify(testFunction)).not.toThrowError();
  });

  test('function param is valid', () => {
    const testFunction = (a: number) => {
      a;
    };

    expect(() => verify(testFunction)).not.toThrowError();
  });

  test('function param extraction is valid', () => {
    const testFunction = ({ b }: { b: number }) => {
      b;
    };

    expect(() => verify(testFunction)).not.toThrowError();
  });

  test('local nested var is valid', () => {
    const testFunction = () => {
      const x = 3;
      {
        x + 4;
      }
    };

    expect(() => verify(testFunction)).not.toThrowError();
  });

  test('out of scope function fails', () => {
    const x = 10;
    const testFunction = () => {
      1 + x;
    };

    expect(() => verify(testFunction)).toThrowError();
  });

  test('accessing out of scope local var is invalid', () => {
    const x = 3;
    const testFunction = () => {
      {
        const x = 1;
      }
      x + 4;
    };

    expect(() => verify(testFunction)).toThrowError();
  });

  test('catching a useless return statement', () => {
    const testFunction = () => {
      return 1;
    };

    expect(gatherScope(testFunction).hasReturn).toBe(true);
  });

  // test('test', () => {
  //   const y = 1;
  //   const testFunction = () => {
  //     const x = () => 1 + 2 + y;
  //   };

  //   expect(gatherScope(testFunction).hasReturn).toBe(true);
  // });
});
