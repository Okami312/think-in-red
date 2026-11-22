import { detectImageType } from './image-type';

/** Header bytes followed by padding, so files pass the minimum length check. */
const file = (...parts: (number[] | string)[]) =>
  Buffer.concat([
    ...parts.map((p) =>
      typeof p === 'string' ? Buffer.from(p) : Buffer.from(p),
    ),
    Buffer.alloc(16),
  ]);

describe('detectImageType', () => {
  it.each([
    ['image/jpeg', file([0xff, 0xd8, 0xff, 0xe0])],
    ['image/png', file([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
    ['image/webp', file('RIFF', [0, 0, 0, 0], 'WEBP')],
    ['image/gif', file('GIF89a')],
    ['image/avif', file([0, 0, 0, 0x1c], 'ftypavif')],
    ['image/avif', file([0, 0, 0, 0x1c], 'ftypavis')],
  ])('recognises %s from its signature', (type, buf) => {
    expect(detectImageType(buf)).toBe(type);
  });

  it.each([
    [
      'SVG (can carry scripts)',
      file('<svg xmlns="http://www.w3.org/2000/svg">'),
    ],
    ['HTML', file('<!doctype html><script>')],
    [
      'a RIFF file that is not WebP (e.g. WAV audio)',
      file('RIFF', [0, 0, 0, 0], 'WAVE'),
    ],
    [
      'an ftyp container that is not AVIF (e.g. MP4 video)',
      file([0, 0, 0, 0x1c], 'ftypisom'),
    ],
    ['a PNG with a damaged signature', file([0x89, 0x50, 0x4e, 0x47, 0x00])],
  ])('rejects %s', (_label, buf) => {
    expect(detectImageType(buf)).toBeNull();
  });

  it('rejects files too short to identify', () => {
    expect(detectImageType(Buffer.from([0xff, 0xd8, 0xff]))).toBeNull();
    expect(detectImageType(Buffer.alloc(0))).toBeNull();
  });
});
