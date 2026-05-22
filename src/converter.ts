export type Base = 'text' | 'binary' | 'octal' | 'decimal' | 'hex' | 'base32' | 'base64' | 'base64url';

export interface BaseInfo {
  id: Base;
  shortLabel: string;
  prefix?: string;
}

export const BASES: BaseInfo[] = [
  { id: 'text',      shortLabel: 'TEXT' },
  { id: 'binary',    shortLabel: 'BIN',  prefix: '0b' },
  { id: 'octal',     shortLabel: 'OCT',  prefix: '0o' },
  { id: 'decimal',   shortLabel: 'DEC' },
  { id: 'hex',       shortLabel: 'HEX',  prefix: '0x' },
  { id: 'base32',    shortLabel: 'B32' },
  { id: 'base64',    shortLabel: 'B64' },
  { id: 'base64url', shortLabel: 'B64U' },
];

/* ── Typed errors ───────────────────────────────────────────── */
export type ConvertError =
  | { code: 'EMPTY_INPUT' }
  | { code: 'INVALID_BINARY' }
  | { code: 'INVALID_OCTAL' }
  | { code: 'INVALID_DECIMAL' }
  | { code: 'INVALID_HEX' }
  | { code: 'INVALID_BASE32_CHAR'; char: string }
  | { code: 'INVALID_BASE64_POS'; pos: number };

class ConvertException extends Error {
  constructor(public readonly convertError: ConvertError) { super(convertError.code); }
}

function fail(e: ConvertError): never { throw new ConvertException(e); }

/* ── Alphabets ──────────────────────────────────────────────── */
const BASE32_ALPHA    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const BASE64_ALPHA    = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const BASE64URL_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/* ── Prefix stripping ───────────────────────────────────────── */
export function stripPrefix(value: string, base: Base): string {
  const lower = value.toLowerCase();
  if (base === 'binary' && lower.startsWith('0b')) return value.slice(2);
  if (base === 'octal'  && lower.startsWith('0o')) return value.slice(2);
  if (base === 'hex'    && lower.startsWith('0x')) return value.slice(2);
  return value;
}

/* ── Parse → bytes ──────────────────────────────────────────── */
export function parseToBytes(value: string, base: Base): Uint8Array {
  const stripped = stripPrefix(value.trim(), base);

  switch (base) {
    case 'text': {
      return new TextEncoder().encode(value);
    }
    case 'binary': {
      if (!stripped) fail({ code: 'EMPTY_INPUT' });
      if (!/^[01]+$/.test(stripped)) fail({ code: 'INVALID_BINARY' });
      const padded = stripped.padStart(Math.ceil(stripped.length / 8) * 8, '0');
      const bytes = new Uint8Array(padded.length / 8);
      for (let i = 0; i < bytes.length; i++)
        bytes[i] = parseInt(padded.slice(i * 8, i * 8 + 8), 2);
      return bytes;
    }
    case 'octal': {
      if (!stripped) fail({ code: 'EMPTY_INPUT' });
      if (!/^[0-7]+$/.test(stripped)) fail({ code: 'INVALID_OCTAL' });
      return bigintToBytes(BigInt('0o' + stripped));
    }
    case 'decimal': {
      if (!stripped) fail({ code: 'EMPTY_INPUT' });
      if (!/^\d+$/.test(stripped)) fail({ code: 'INVALID_DECIMAL' });
      return bigintToBytes(BigInt(stripped));
    }
    case 'hex': {
      if (!stripped) fail({ code: 'EMPTY_INPUT' });
      if (!/^[0-9a-fA-F]+$/.test(stripped)) fail({ code: 'INVALID_HEX' });
      const padded = stripped.length % 2 ? '0' + stripped : stripped;
      const bytes = new Uint8Array(padded.length / 2);
      for (let i = 0; i < bytes.length; i++)
        bytes[i] = parseInt(padded.slice(i * 2, i * 2 + 2), 16);
      return bytes;
    }
    case 'base32': {
      if (!stripped) fail({ code: 'EMPTY_INPUT' });
      return base32Decode(stripped.toUpperCase().replace(/=/g, ''));
    }
    case 'base64': {
      if (!stripped) fail({ code: 'EMPTY_INPUT' });
      return base64Decode(stripped, false);
    }
    case 'base64url': {
      if (!stripped) fail({ code: 'EMPTY_INPUT' });
      return base64Decode(stripped, true);
    }
  }
}

/* ── Bytes → base ───────────────────────────────────────────── */
export function bytesToBase(bytes: Uint8Array, base: Base): string {
  switch (base) {
    case 'text':      return new TextDecoder().decode(bytes);
    case 'binary': {
      const n = bytesToBigInt(bytes);
      return n === 0n ? '0' : n.toString(2);
    }
    case 'octal':     return bytesToBigInt(bytes).toString(8);
    case 'decimal':   return bytesToBigInt(bytes).toString(10);
    case 'hex':
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    case 'base32':    return base32Encode(bytes);
    case 'base64':    return base64Encode(bytes, false);
    case 'base64url': return base64Encode(bytes, true);
  }
}

/* ── Helpers ────────────────────────────────────────────────── */
function bigintToBytes(n: bigint): Uint8Array {
  if (n === 0n) return new Uint8Array([0]);
  const hex = n.toString(16);
  const padded = hex.length % 2 ? '0' + hex : hex;
  const bytes = new Uint8Array(padded.length / 2);
  for (let i = 0; i < bytes.length; i++)
    bytes[i] = parseInt(padded.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

function bytesToBigInt(bytes: Uint8Array): bigint {
  let result = 0n;
  for (const byte of bytes) result = (result << 8n) | BigInt(byte);
  return result;
}

function base32Encode(bytes: Uint8Array): string {
  let bits = 0, value = 0, output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte; bits += 8;
    while (bits >= 5) { output += BASE32_ALPHA[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) output += BASE32_ALPHA[(value << (5 - bits)) & 31];
  while (output.length % 8 !== 0) output += '=';
  return output;
}

function base32Decode(input: string): Uint8Array {
  let bits = 0, value = 0;
  const output: number[] = [];
  for (const char of input) {
    const idx = BASE32_ALPHA.indexOf(char);
    if (idx === -1) fail({ code: 'INVALID_BASE32_CHAR', char });
    value = (value << 5) | idx; bits += 5;
    if (bits >= 8) { output.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return new Uint8Array(output);
}

function base64Encode(bytes: Uint8Array, urlSafe: boolean): string {
  const alpha = urlSafe ? BASE64URL_ALPHA : BASE64_ALPHA;
  let output = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1] ?? 0, c = bytes[i + 2] ?? 0;
    output += alpha[a >> 2];
    output += alpha[((a & 3) << 4) | (b >> 4)];
    if (i + 1 < bytes.length) output += alpha[((b & 15) << 2) | (c >> 6)];
    else if (!urlSafe) output += '=';
    if (i + 2 < bytes.length) output += alpha[c & 63];
    else if (!urlSafe) output += '=';
  }
  return output;
}

function base64Decode(input: string, urlSafe: boolean): Uint8Array {
  const alpha = urlSafe ? BASE64URL_ALPHA : BASE64_ALPHA;
  const stripped = input.replace(/=/g, '').replace(/\s/g, '');
  if (!stripped) return new Uint8Array(0);
  const output: number[] = [];
  for (let i = 0; i < stripped.length; i += 4) {
    const a = alpha.indexOf(stripped[i]);
    const b = stripped[i + 1] ? alpha.indexOf(stripped[i + 1]) : -1;
    const c = stripped[i + 2] ? alpha.indexOf(stripped[i + 2]) : -1;
    const d = stripped[i + 3] ? alpha.indexOf(stripped[i + 3]) : -1;
    if (a === -1 || b === -1) fail({ code: 'INVALID_BASE64_POS', pos: i });
    output.push((a << 2) | (b >> 4));
    if (c !== -1) output.push(((b & 15) << 4) | (c >> 2));
    if (d !== -1) output.push(((c & 3) << 6) | d);
  }
  return new Uint8Array(output);
}

/* ── Public conversion entry point ─────────────────────────── */
export interface ConversionResult {
  bytes: Uint8Array | null;
  error: ConvertError | null;
  outputs: Record<Base, string>;
  bitLength: number;
  byteLength: number;
}

export function convertAll(value: string, base: Base): ConversionResult {
  const empty = Object.fromEntries(BASES.map(b => [b.id, ''])) as Record<Base, string>;

  if (!value.trim() && base !== 'text')
    return { bytes: null, error: null, outputs: empty, bitLength: 0, byteLength: 0 };

  let bytes: Uint8Array;
  try {
    bytes = parseToBytes(value, base);
  } catch (e) {
    const ce = e instanceof Error && 'convertError' in e
      ? (e as unknown as { convertError: ConvertError }).convertError
      : { code: 'EMPTY_INPUT' as const };
    return { bytes: null, error: ce, outputs: empty, bitLength: 0, byteLength: 0 };
  }

  const outputs = Object.fromEntries(
    BASES.map(b => { try { return [b.id, bytesToBase(bytes, b.id)]; } catch { return [b.id, '']; } })
  ) as Record<Base, string>;

  const binStr = outputs['binary'] ?? '';
  const significantBits = binStr.replace(/^0+/, '').length || (bytes.length > 0 ? 1 : 0);

  return { bytes, error: null, outputs, bitLength: significantBits, byteLength: bytes.length };
}
