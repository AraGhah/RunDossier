import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import 'dotenv/config';

const envPath = new URL('../.env', import.meta.url);
let env = readFileSync(envPath, 'utf8');
let changed = false;

function setKey(name, minLen, byteLen) {
  const cur = process.env[name]?.trim() ?? '';
  if (cur.length >= minLen) return;
  const val = randomBytes(byteLen).toString('base64');
  const re = new RegExp(`^${name}=.*`, 'm');
  env = re.test(env) ? env.replace(re, `${name}=${val}`) : `${env.trimEnd()}\n${name}=${val}\n`;
  changed = true;
}

setKey('JWT_SECRET', 32, 48);
setKey('JWT_API_KEY', 16, 24);

if (changed) writeFileSync(envPath, env);
console.log(changed ? 'JWT secrets generated in .env' : 'JWT secrets already set');
