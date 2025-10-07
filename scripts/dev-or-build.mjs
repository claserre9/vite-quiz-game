import { spawn } from 'node:child_process';

const isCI = !!process.env.GITHUB_ACTIONS;

// In CI, call the existing build script (tsc && vite build).
// Locally, start the Vite dev server.
const cmd = isCI ? 'npm' : 'vite';
const args = isCI ? ['run', 'build'] : [];

const child = spawn(cmd, args, {
  stdio: 'inherit',
  shell: process.platform === 'win32'
});

child.on('exit', (code) => process.exit(code ?? 0));
