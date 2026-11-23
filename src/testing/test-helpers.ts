/**
 * Test-runner agnostic helpers (no jasmine/vitest specific APIs), so the specs work
 * unchanged regardless of the unit test runner.
 */

export interface Spy<A extends any[] = any[], R = any> {
  (...args: A): R;
  calls: A[];
  lastArgs: () => A | undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const spyFn = <R = any>(impl?: (...args: any[]) => R): Spy<any[], R> => {
  const spy = ((...args: any[]) => {
    spy.calls.push(args);
    return impl ? impl(...args) : (undefined as unknown as R);
  }) as Spy<any[], R>;
  spy.calls = [];
  spy.lastArgs = () => spy.calls[spy.calls.length - 1];
  return spy;
};

export class FakeRouter {
  public url = '/';
  public navigate = spyFn((commands: any[]) => Promise.resolve(true));
}

export class FakeToastService {
  public show = spyFn((type: string, message: string) => Promise.resolve());
}

/** Resolves after pending promise callbacks (microtasks) and a macrotask turn. */
export const flushPromises = () => new Promise<void>(resolve => setTimeout(resolve, 0));

const b64url = (v: object) => btoa(JSON.stringify(v)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');

export const makeJwt = (payload: object): string =>
  `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.c2ln`;
