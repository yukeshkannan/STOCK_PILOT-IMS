#!/usr/bin/env node
/**
 * StockPilot SaaS — Cryptographic Secret Generator
 * Generates cryptographically secure 256-bit hex keys for JWT, refresh tokens, and session secrets.
 *
 * Usage:
 *   node scripts/generate-secrets.js
 *   node scripts/generate-secrets.js --apply   (Appends/updates .env file safely)
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function generateSecureKey(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function generateSecurePassword(length = 16) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    password += chars[randomBytes[i] % chars.length];
  }
  return password;
}

const jwtSecret = generateSecureKey(32); // 64-char hex string
const jwtRefreshSecret = generateSecureKey(32);
const sessionSecret = generateSecureKey(32);
const superadminPassword = generateSecurePassword(18);
const dbPassword = generateSecurePassword(16);

console.log('================================================================');
console.log('🛡️  StockPilot Production Cryptographic Secrets Generator');
console.log('================================================================\n');

console.log('Generated Cryptographically Strong Production Credentials:\n');
console.log(`JWT_SECRET=${jwtSecret}`);
console.log(`JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
console.log(`SESSION_SECRET=${sessionSecret}`);
console.log(`SUPERADMIN_PASSWORD=${superadminPassword}`);
console.log(`DB_PASSWORD=${dbPassword}\n`);

const shouldApply = process.argv.includes('--apply');
const envPath = path.resolve(__dirname, '../.env');

if (shouldApply) {
  try {
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    
    // Replace or append JWT_SECRET
    if (envContent.includes('JWT_SECRET=')) {
      envContent = envContent.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${jwtSecret}`);
    } else {
      envContent += `\nJWT_SECRET=${jwtSecret}`;
    }

    // Replace or append JWT_REFRESH_SECRET
    if (envContent.includes('JWT_REFRESH_SECRET=')) {
      envContent = envContent.replace(/^JWT_REFRESH_SECRET=.*$/m, `JWT_REFRESH_SECRET=${jwtRefreshSecret}`);
    } else {
      envContent += `\nJWT_REFRESH_SECRET=${jwtRefreshSecret}`;
    }

    fs.writeFileSync(envPath, envContent, 'utf8');
    console.log(`✅ Successfully updated ${envPath} with new cryptographic JWT secrets!`);
  } catch (err) {
    console.error(`❌ Failed to update .env: ${err.message}`);
  }
} else {
  console.log('💡 TIP: Run with "--apply" to automatically write these JWT secrets into your .env file:');
  console.log('   node scripts/generate-secrets.js --apply\n');
}

console.log('================================================================');
