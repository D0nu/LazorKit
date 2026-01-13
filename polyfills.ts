import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  window.global = window;
  window.Buffer = Buffer;
  window.process = window.process || ({
    env: {},
    version: '',
    nextTick: (fn: Function) => setTimeout(fn, 0),
  } as any);
}