#!/usr/bin/env node

/**
 * Secure Auth Kit — Interactive CLI Initializer & Configurator
 * Automatically connects database credentials and installs AI security rules.
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function main() {
  console.log('\n======================================================');
  console.log('🛡️  SECURE AUTH KIT — PRODUCTION SETUP WIZARD');
  console.log('======================================================\n');
  console.log('Welcome! This wizard will configure your database credentials,');
  console.log('harden email validation, and install the AI security skill.\n');

  try {
    const provider = await askQuestion('1. Select Auth Backend [1: Supabase (Default), 2: Custom REST]: ') || '1';
    
    let supabaseUrl = '';
    let supabaseKey = '';

    if (provider.trim() === '1' || provider.trim().toLowerCase().includes('supa')) {
      supabaseUrl = await askQuestion('\n2. Enter Supabase Project URL (e.g. https://your-id.supabase.co): ');
      supabaseKey = await askQuestion('3. Enter Supabase Anon Public Key: ');
    }

    const installSkill = await askQuestion('\n4. Install AI Security Skill (.agents/skills/login-security-checks)? [Y/n]: ') || 'y';

    // 1. Generate / Update .env.local
    const cwd = process.cwd();
    const envPath = path.join(cwd, '.env.local');
    const envContent = [
      '# Secure Auth Kit — Environment Variables',
      `NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl.trim() || 'https://your-project.supabase.co'}`,
      `NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseKey.trim() || 'your-anon-key-here'}`,
      ''
    ].join('\n');

    fs.writeFileSync(envPath, envContent, 'utf-8');
    console.log('\n✅ Created .env.local with credentials');

    // 2. Install AI Security Skill for AI Coding Assistants
    if (installSkill.trim().toLowerCase() !== 'n') {
      const targetSkillDir = path.join(cwd, '.agents', 'skills', 'login-security-checks');
      fs.mkdirSync(targetSkillDir, { recursive: true });

      const sourceSkillPath = path.join(__dirname, '..', 'skills', 'login-security-checks', 'SKILL.md');
      const targetSkillPath = path.join(targetSkillDir, 'SKILL.md');

      if (fs.existsSync(sourceSkillPath)) {
        fs.copyFileSync(sourceSkillPath, targetSkillPath);
      } else {
        const fallbackSkillContent = `---
name: login-security-checks
description: Enforces Gmail canonicalization, disposable email filtering, and header injection prevention.
---
# Login Security Checks
- Enforce Gmail dot-trick & plus-trick stripping.
- Block disposable/temp-mail domains.
- Block multi-recipient email header injections.`;
        fs.writeFileSync(targetSkillPath, fallbackSkillContent, 'utf-8');
      }
      console.log('✅ Installed AI Security Skill to .agents/skills/login-security-checks/SKILL.md');
    }

    console.log('\n======================================================');
    console.log('🎉 SETUP COMPLETE! Your auth engine is ready.');
    console.log('======================================================');
    console.log('👉 Next Steps:');
    console.log('   npm run dev      # Start development server at http://localhost:3001');
    console.log('   npm run build    # Compile production build');
    console.log('======================================================\n');

  } catch (err) {
    console.error('Setup error:', err.message);
  } finally {
    rl.close();
  }
}

main();
