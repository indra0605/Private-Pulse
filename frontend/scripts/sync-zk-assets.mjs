import { cp, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(process.cwd());
const source = resolve(root, 'contract/src/managed/anonymous-feedback');
const target = resolve(root, 'public/zk/anonymous-feedback');

await mkdir(target, { recursive: true });
await cp(resolve(source, 'keys'), resolve(target, 'keys'), { recursive: true, force: true });
await cp(resolve(source, 'zkir'), resolve(target, 'zkir'), { recursive: true, force: true });

console.log('ZK assets synced to public/zk/anonymous-feedback');
