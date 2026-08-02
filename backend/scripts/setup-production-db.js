const { execSync } = require('child_process');
const path = require('path');

console.log('--- Starting Gamesato Production Database Setup ---');

try {
  console.log('\n1. Running Database Migrations & Schemas...');
  execSync('node run-migration.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('\n2. Seeding Users, Games, Categories, Likes & Analytics...');
  execSync('node optimize_and_seed.js', { stdio: 'inherit', cwd: path.join(__dirname, '..') });

  console.log('\nSUCCESS: Production database setup & data seeding completed 100%!');
} catch (err) {
  console.error('\nDatabase setup failed:', err.message);
  process.exit(1);
}
