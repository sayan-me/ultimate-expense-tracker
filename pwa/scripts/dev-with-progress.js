#!/usr/bin/env node

const { spawn } = require('child_process');
const readline = require('readline');

console.log('🚀 Starting Ultimate Expense Tracker PWA...');
console.log('📦 Loading dependencies and environment...');

let startupPhase = 0;
const phases = [
  '⚙️  Initializing Next.js',
  '🔥 Loading Firebase configuration', 
  '📝 Parsing TypeScript files',
  '🎨 Processing Tailwind CSS',
  '🔧 Setting up development server',
  '✅ Ready for development'
];

// Show progress phases
const progressInterval = setInterval(() => {
  if (startupPhase < phases.length - 1) {
    console.log(phases[startupPhase]);
    startupPhase++;
  }
}, 1000);

// Start Next.js dev server
const nextProcess = spawn('npx', ['next', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: process.platform === 'win32'
});

let serverReady = false;

// Handle stdout
nextProcess.stdout.on('data', (data) => {
  const output = data.toString();
  
  // Clear progress when server is ready
  if (output.includes('Ready') || output.includes('started server') || output.includes('Local:')) {
    if (!serverReady) {
      clearInterval(progressInterval);
      console.log('\n✅ Development server is ready!');
      console.log('🌐 Open your browser to: http://localhost:3000');
      console.log('📋 Check browser console for Firebase auth status');
      console.log('─'.repeat(50));
      serverReady = true;
    }
  }
  
  // Always show Next.js output
  process.stdout.write(output);
});

// Handle stderr
nextProcess.stderr.on('data', (data) => {
  const output = data.toString();
  
  // Don't show certain verbose warnings
  if (!output.includes('Duplicate atom key') && 
      !output.includes('Warning: ')) {
    process.stderr.write(output);
  }
});

// Handle process exit
nextProcess.on('close', (code) => {
  clearInterval(progressInterval);
  console.log(`\n🛑 Development server stopped (exit code: ${code})`);
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping development server...');
  nextProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  nextProcess.kill('SIGTERM');
});