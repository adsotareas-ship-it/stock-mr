import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export const BCRYPT_COST = 12;

// Hash of a random value, compared against when the e-mail is unknown so that
// "wrong e-mail" and "wrong password" take the same time.
export const DUMMY_HASH = bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), BCRYPT_COST);

const WINDOW_MS = 15 * 60 * 1000;
const LOCK_MS = 15 * 60 * 1000;
const MAX_PAIR_FAILS = 5;      // same IP + same e-mail
const MAX_IP_FAILS = 20;       // same IP, any e-mail
const MAX_ACCOUNT_FAILS = 40;  // same e-mail, any IP (distributed attack)

const store = new Map();

const getEntry = (key, now) => {
  let e = store.get(key);
  if (!e || (e.lockedUntil <= now && now - e.first > WINDOW_MS)) {
    e = { count: 0, first: now, lockedUntil: 0 };
    store.set(key, e);
  }
  return e;
};

const keysFor = (ip, email) => {
  const mail = String(email).trim().toLowerCase();
  return [
    [`pair:${ip}|${mail}`, MAX_PAIR_FAILS],
    [`ip:${ip}`, MAX_IP_FAILS],
    [`acct:${mail}`, MAX_ACCOUNT_FAILS],
  ];
};

setInterval(() => {
  const now = Date.now();
  for (const [k, e] of store) {
    if (e.lockedUntil <= now && now - e.first > WINDOW_MS) store.delete(k);
  }
}, 60 * 1000).unref();

export const loginGuard = {
  /** Seconds the caller must wait, or 0 if allowed. */
  check(ip, email) {
    const now = Date.now();
    let wait = 0;
    for (const [key] of keysFor(ip, email)) {
      const e = store.get(key);
      if (e && e.lockedUntil > now) wait = Math.max(wait, Math.ceil((e.lockedUntil - now) / 1000));
    }
    return wait;
  },
  /** Registers a failure. Returns true if this failure triggered a new lock. */
  fail(ip, email) {
    const now = Date.now();
    let justLocked = false;
    for (const [key, max] of keysFor(ip, email)) {
      const e = getEntry(key, now);
      e.count += 1;
      if (e.count >= max && e.lockedUntil <= now) {
        e.lockedUntil = now + LOCK_MS;
        e.count = 0;
        e.first = now;
        justLocked = true;
      }
    }
    return justLocked;
  },
  success(ip, email) {
    store.delete(`pair:${ip}|${String(email).trim().toLowerCase()}`);
  },
};

const COMMON_PASSWORDS = new Set([
  'admin123', 'admin1234', 'password', 'password1', 'password123', '123456789', '1234567890',
  'qwerty123', 'qwertyuiop', 'contraseña', 'contrasena1', 'welcome123', 'letmein123',
  'administrador', 'enterprise', 'abc123456', 'iloveyou1',
]);

/** Returns an error message, or null if the password is acceptable. */
export function validatePassword(pw, email = '') {
  if (typeof pw !== 'string') return 'La contraseña no es válida.';
  if (pw.length < 10) return 'La contraseña debe tener al menos 10 caracteres.';
  if (pw.length > 128) return 'La contraseña no puede superar los 128 caracteres.';
  if (!/[a-z]/.test(pw) || !/[A-Z]/.test(pw) || !/\d/.test(pw)) {
    return 'La contraseña debe incluir mayúsculas, minúsculas y números.';
  }
  const lower = pw.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) return 'Esa contraseña es demasiado común.';
  const local = String(email).split('@')[0].toLowerCase();
  if (local.length >= 4 && lower.includes(local)) return 'La contraseña no puede contener tu correo.';
  return null;
}

export const isDefaultPassword = (pw) => COMMON_PASSWORDS.has(String(pw).toLowerCase());

/** Token fingerprint: changes whenever the stored password hash changes. */
export const passwordVersion = (hash) =>
  crypto.createHash('sha256').update(String(hash)).digest('hex').slice(0, 16);

export const newLogId = () => `LOG-${Date.now().toString(36).toUpperCase()}${crypto.randomBytes(2).toString('hex').toUpperCase()}`;

export const sleep = (ms) => new Promise(r => setTimeout(r, ms));
