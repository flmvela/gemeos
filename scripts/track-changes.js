#!/usr/bin/env node

/**
 * Change tracking utility for Gemeos project
 * Tracks changes to code and Supabase edge functions
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CHANGELOG_PATH = path.join(__dirname, '..', 'CHANGELOG.md');
const EDGE_FUNCTIONS_PATH = path.join(__dirname, '..', 'supabase', 'functions');
const DEPLOYMENT_LOG_PATH = path.join(__dirname, '..', 'deployments.log');

class ChangeTracker {
  constructor() {
    this.ensureFiles();
  }

  ensureFiles() {
    // Ensure deployment log exists
    if (!fs.existsSync(DEPLOYMENT_LOG_PATH)) {
      fs.writeFileSync(DEPLOYMENT_LOG_PATH, '# Deployment Log\n\n');
    }
  }

  /**
   * Get current git information
   */
  getGitInfo() {
    try {
      const branch = execSync('git rev-parse --abbrev-ref HEAD').toString().trim();
      const commit = execSync('git rev-parse --short HEAD').toString().trim();
      const author = execSync('git config user.name').toString().trim();
      const email = execSync('git config user.email').toString().trim();
      return { branch, commit, author, email };
    } catch (error) {
      console.error('Error getting git info:', error.message);
      return { branch: 'unknown', commit: 'unknown', author: 'unknown', email: 'unknown' };
    }
  }

  /**
   * Get modified edge functions
   */
  getModifiedEdgeFunctions() {
    try {
      const modified = execSync('git diff --name-only HEAD^ HEAD')
        .toString()
        .split('\n')
        .filter(file => file.startsWith('supabase/functions/') && !file.includes('_shared'));
      
      return modified.map(file => {
        const parts = file.split('/');
        return parts[2]; // Function name
      }).filter((v, i, a) => a.indexOf(v) === i); // Unique
    } catch (error) {
      return [];
    }
  }

  /**
   * Log edge function deployment
   */
  logEdgeFunctionDeployment(functionName, description = '') {
    const gitInfo = this.getGitInfo();
    const timestamp = new Date().toISOString();
    
    const logEntry = `
## ${timestamp}
- **Function**: ${functionName}
- **Branch**: ${gitInfo.branch}
- **Commit**: ${gitInfo.commit}
- **Author**: ${gitInfo.author} <${gitInfo.email}>
- **Description**: ${description || 'No description provided'}
---
`;

    fs.appendFileSync(DEPLOYMENT_LOG_PATH, logEntry);
    console.log(`✅ Deployment logged for ${functionName}`);
  }

  /**
   * Generate a summary of recent changes
   */
  generateChangeSummary() {
    try {
      const recentCommits = execSync('git log --oneline -10').toString();
      const modifiedFiles = execSync('git diff --stat HEAD~5 HEAD').toString();
      
      const summary = `
# Change Summary - ${new Date().toISOString()}

## Recent Commits
\`\`\`
${recentCommits}
\`\`\`

## Modified Files (last 5 commits)
\`\`\`
${modifiedFiles}
\`\`\`

## Modified Edge Functions
${this.getModifiedEdgeFunctions().map(fn => `- ${fn}`).join('\n') || 'None'}
`;

      const summaryPath = path.join(__dirname, '..', 'change-summary.md');
      fs.writeFileSync(summaryPath, summary);
      console.log(`✅ Change summary generated at ${summaryPath}`);
    } catch (error) {
      console.error('Error generating summary:', error.message);
    }
  }

  /**
   * Track file changes with detailed diff
   */
  trackFileChanges(filePath) {
    try {
      const diff = execSync(`git diff HEAD ${filePath}`).toString();
      const timestamp = new Date().toISOString();
      const gitInfo = this.getGitInfo();
      
      const trackingPath = path.join(__dirname, '..', '.change-tracking', `${timestamp.split('T')[0]}.log`);
      const dir = path.dirname(trackingPath);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const trackingEntry = `
=== ${timestamp} ===
File: ${filePath}
Author: ${gitInfo.author}
Commit: ${gitInfo.commit}

${diff}
================
`;
      
      fs.appendFileSync(trackingPath, trackingEntry);
      console.log(`✅ Changes tracked for ${filePath}`);
    } catch (error) {
      console.error(`Error tracking changes for ${filePath}:`, error.message);
    }
  }
}

// CLI Usage
if (require.main === module) {
  const tracker = new ChangeTracker();
  const command = process.argv[2];
  const arg = process.argv[3];
  
  switch (command) {
    case 'deploy':
      if (!arg) {
        console.error('Usage: node track-changes.js deploy <function-name> [description]');
        process.exit(1);
      }
      tracker.logEdgeFunctionDeployment(arg, process.argv[4]);
      break;
    
    case 'summary':
      tracker.generateChangeSummary();
      break;
    
    case 'track':
      if (!arg) {
        console.error('Usage: node track-changes.js track <file-path>');
        process.exit(1);
      }
      tracker.trackFileChanges(arg);
      break;
    
    default:
      console.log(`
Usage:
  node track-changes.js deploy <function-name> [description]  - Log edge function deployment
  node track-changes.js summary                               - Generate change summary
  node track-changes.js track <file-path>                    - Track changes to specific file
      `);
  }
}

module.exports = ChangeTracker;