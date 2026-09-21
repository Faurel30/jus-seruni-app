import 'dotenv/config';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { join } from 'node:path';

const required = ['DB_HOST', 'DB_USER', 'DB_NAME'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) throw new Error('Missing database configuration: ' + missing.join(', '));

const backupDir = join(process.cwd(), 'backups');
await mkdir(backupDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputPath = join(backupDir, process.env.DB_NAME + '-' + stamp + '.sql');
const command = process.env.MYSQLDUMP_PATH || 'mysqldump';
const args = [
  '--host=' + process.env.DB_HOST,
  '--port=' + (process.env.DB_PORT || 3306),
  '--user=' + process.env.DB_USER,
  '--single-transaction',
  '--routines',
  '--events',
  '--result-file=' + outputPath,
  process.env.DB_NAME,
];

const child = spawn(command, args, {
  stdio: 'inherit',
  env: { ...process.env, MYSQL_PWD: process.env.DB_PASSWORD || '' },
});

child.once('error', (error) => {
  console.error('Unable to run mysqldump:', error.message);
  process.exitCode = 1;
});
child.once('exit', (code) => {
  if (code !== 0) process.exitCode = code || 1;
  else console.log('Database backup created: ' + outputPath);
});
