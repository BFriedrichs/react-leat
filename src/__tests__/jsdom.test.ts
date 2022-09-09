/**
 * @jest-environment jsdom
 */

import { verify } from '../verify';

describe('verify scope in jsdom environment', () => {
  test('globals allowed', () => {
    const testFunction = () => {
      window.document;
    };

    expect(() => verify(testFunction)).not.toThrowError();
  });

  test('object types allowed', () => {
    const testFunction = () => {
      Object.create({});
    };

    expect(() => verify(testFunction)).not.toThrowError();
  });

  test('option: no globals', () => {
    const testFunction = () => {
      window.document;
    };

    expect(() => verify(testFunction, { allowGlobals: false })).toThrowError();
  });
});
