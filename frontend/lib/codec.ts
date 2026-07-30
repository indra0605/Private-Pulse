export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex: string): Uint8Array {
  const normalized = hex.startsWith('0x') ? hex.slice(2) : hex;
  if (normalized.length % 2 !== 0) throw new Error('Invalid hex string.');
  const bytes = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    bytes[i / 2] = Number.parseInt(normalized.slice(i, i + 2), 16);
  }
  return bytes;
}

export function utf8ByteLength(value: string): number {
  return new TextEncoder().encode(value.trim()).length;
}

export function encodePaddedUtf8(value: string, size: number, label: string): Uint8Array {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} required`);

  const encoded = new TextEncoder().encode(trimmed);
  if (encoded.length > size) {
    throw new Error(`${label} must be ${size} bytes or fewer`);
  }

  const padded = new Uint8Array(size);
  padded.set(encoded);
  return padded;
}

export function decodePaddedUtf8(bytes: Uint8Array): string {
  let end = bytes.length;
  while (end > 0 && bytes[end - 1] === 0) end -= 1;
  return new TextDecoder().decode(bytes.slice(0, end));
}
