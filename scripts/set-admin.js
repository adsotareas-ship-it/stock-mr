// Creates or updates the administrator account in Postgres. Interactive: the password is
// typed hidden and never stored in shell history or logs.
//
//   node --env-file=.env scripts/set-admin.js
import readline from 'readline';
import pg from 'pg';
import bcrypt from 'bcryptjs';
import { BCRYPT_COST, validatePassword } from '../backend/security.js';

if (!process.env.DATABASE_URL) {
  console.error('Falta DATABASE_URL. Ejecuta: node --env-file=.env scripts/set-admin.js');
  process.exit(1);
}

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
let muted = false;
const origWrite = rl._writeToOutput.bind(rl);
rl._writeToOutput = (s) => { if (!muted) origWrite(s); else if (s.includes('\n')) origWrite('\n'); };

const ask = (q, hidden = false) => new Promise((resolve) => {
  rl.question(q, (a) => { muted = false; resolve(a); });
  muted = hidden;
});

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

try {
  await pool.query('CREATE TABLE IF NOT EXISTS users (email TEXT PRIMARY KEY, name TEXT, password TEXT NOT NULL)');
  const { rows } = await pool.query('SELECT email, name FROM users ORDER BY email LIMIT 1');
  const current = rows[0];

  const email = (await ask(`Correo del administrador${current ? ` [${current.email}]` : ''}: `)).trim() || current?.email;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Correo no válido.');
  const name = (await ask(`Nombre${current ? ` [${current.name}]` : ' [Administrador]'}: `)).trim() || current?.name || 'Administrador';

  const pw = await ask('Nueva contraseña (oculta): ', true);
  const problem = validatePassword(pw, email);
  if (problem) throw new Error(problem);
  const pw2 = await ask('Repite la contraseña: ', true);
  if (pw !== pw2) throw new Error('Las contraseñas no coinciden.');

  const hash = bcrypt.hashSync(pw, BCRYPT_COST);
  if (current) {
    await pool.query('UPDATE users SET email = $2, name = $3, password = $4 WHERE email = $1', [current.email, email, name, hash]);
  } else {
    await pool.query('INSERT INTO users (email, name, password) VALUES ($1, $2, $3)', [email, name, hash]);
  }
  console.log('\nListo. Las sesiones anteriores quedan invalidadas.');
} catch (err) {
  console.error(`\nError: ${err.message}`);
  process.exitCode = 1;
} finally {
  rl.close();
  await pool.end();
}
