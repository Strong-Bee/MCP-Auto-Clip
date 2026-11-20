#!/usr/bin/env node

/**
 * Auto Clipper Skill Installer
 * Installs the auto-clipper skill for Claude Code and OpenCode
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const SKILL_SOURCE = path.join(__dirname, '..', 'skills', 'auto-clipper');
const CLAUDE_SKILLS_DIR = path.join(os.homedir(), '.claude', 'skills', 'auto-clipper');
const OPENCODE_SKILLS_DIR = path.join(os.homedir(), '.opencode', 'skill', 'auto-clipper');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`Source not found: ${src}`);
    return;
  }

  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`  Copied: ${entry.name}`);
    }
  }
}

function installSkill(targetDir, agentName) {
  console.log(`\n📦 Installing for ${agentName}...`);
  console.log(`   Target: ${targetDir}`);

  try {
    copyRecursive(SKILL_SOURCE, targetDir);
    console.log(`✅ ${agentName} skill installed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to install for ${agentName}:`, error);
    return false;
  }
}

function verifyInstallation(targetDir) {
  const skillFile = path.join(targetDir, 'SKILL.md');
  if (!fs.existsSync(skillFile)) {
    console.error(`   ❌ SKILL.md not found at ${skillFile}`);
    return false;
  }

  const content = fs.readFileSync(skillFile, 'utf-8');
  if (!content.includes('name: auto-clipper')) {
    console.error(`   ❌ Invalid SKILL.md format`);
    return false;
  }

  console.log(`   ✅ Verified: ${skillFile}`);
  return true;
}

function printUsage() {
  console.log(`
Usage: node scripts/install-skill.js [options]

Options:
  --claude      Install for Claude Code only
  --opencode    Install for OpenCode only
  --all         Install for both (default)
  --verify      Verify existing installations
  --help        Show this help

Examples:
  node scripts/install-skill.js
  node scripts/install-skill.js --claude
  node scripts/install-skill.js --verify
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  const installClaude = args.includes('--claude') || (!args.includes('--opencode') && !args.includes('--claude'));
  const installOpenCode = args.includes('--opencode') || (!args.includes('--opencode') && !args.includes('--claude'));
  const verifyOnly = args.includes('--verify');

  console.log('🔧 Auto Clipper Skill Installer');
  console.log('================================');

  if (verifyOnly) {
    console.log('\n🔍 Verifying installations...\n');
    let allOk = true;

    if (fs.existsSync(CLAUDE_SKILLS_DIR)) {
      allOk = verifyInstallation(CLAUDE_SKILLS_DIR) && allOk;
    } else {
      console.log('   ⚠️  Claude Code skill not installed');
    }

    if (fs.existsSync(OPENCODE_SKILLS_DIR)) {
      allOk = verifyInstallation(OPENCODE_SKILLS_DIR) && allOk;
    } else {
      console.log('   ⚠️  OpenCode skill not installed');
    }

    if (allOk) {
      console.log('\n✅ All installations verified');
    } else {
      console.log('\n❌ Some installations failed verification');
      process.exit(1);
    }
    return;
  }

  let success = true;

  if (installClaude) {
    success = installSkill(CLAUDE_SKILLS_DIR, 'Claude Code') && success;
  }

  if (installOpenCode) {
    success = installSkill(OPENCODE_SKILLS_DIR, 'OpenCode') && success;
  }

  if (success) {
    console.log('\n✅ Installation complete!');
    console.log('\nNext steps:');
    console.log('  1. Ensure MCP Auto Clipper server is running');
    console.log('  2. Configure MCP in your agent settings');
    console.log('  3. Use /auto-clipper commands or natural language');
    console.log('\nMCP Server config example:');
    console.log('  {');
    console.log('    "mcpServers": {');
    console.log('      "auto-clipper": {');
    console.log('        "command": "node",');
    console.log(`        "args": ["${path.join(__dirname, '..', 'build', 'index.js')}", "mcp"],`);
    console.log(`        "cwd": "${path.join(__dirname, '..')}"`);
    console.log('      }');
    console.log('    }');
    console.log('  }');
  } else {
    console.log('\n❌ Installation had errors');
    process.exit(1);
  }
}

main().catch(console.error);