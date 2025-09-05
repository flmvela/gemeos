/**
 * Welcome Email Template
 */

import React from 'react';
import { BaseTemplate } from './BaseTemplate';

interface WelcomeTemplateProps {
  userName: string;
  tenantName: string;
  loginLink: string;
  role?: string;
}

export const WelcomeTemplate: React.FC<WelcomeTemplateProps> = ({
  userName,
  tenantName,
  loginLink,
  role = 'member',
}) => {
  const previewText = `Welcome to ${tenantName} on Gemeos!`;

  return (
    <BaseTemplate previewText={previewText}>
      <h2 style={styles.title}>Welcome to Gemeos, {userName}!</h2>
      
      <p style={styles.paragraph}>
        Congratulations! Your account has been successfully created for {' '}
        <strong>{tenantName}</strong>. We're excited to have you as part of our 
        educational community.
      </p>

      <div style={styles.infoBox}>
        <h3 style={styles.infoTitle}>Your Account Details:</h3>
        <p style={styles.infoItem}>
          <strong>Organization:</strong> {tenantName}
        </p>
        <p style={styles.infoItem}>
          <strong>Role:</strong> {role}
        </p>
        <p style={styles.infoItem}>
          <strong>Status:</strong> <span style={styles.statusActive}>Active</span>
        </p>
      </div>

      <h3 style={styles.subtitle}>Get Started with Gemeos</h3>
      
      <p style={styles.paragraph}>
        Here's what you can do with your new account:
      </p>
      
      <div style={styles.featureList}>
        <div style={styles.feature}>
          <div style={styles.featureIcon}>📚</div>
          <div style={styles.featureContent}>
            <h4 style={styles.featureTitle}>Access Curriculum</h4>
            <p style={styles.featureDescription}>
              Browse and explore comprehensive curriculum materials and learning resources.
            </p>
          </div>
        </div>
        
        <div style={styles.feature}>
          <div style={styles.featureIcon}>🎯</div>
          <div style={styles.featureContent}>
            <h4 style={styles.featureTitle}>Track Progress</h4>
            <p style={styles.featureDescription}>
              Monitor learning goals, assessments, and student achievements.
            </p>
          </div>
        </div>
        
        <div style={styles.feature}>
          <div style={styles.featureIcon}>👥</div>
          <div style={styles.featureContent}>
            <h4 style={styles.featureTitle}>Collaborate</h4>
            <p style={styles.featureDescription}>
              Connect with educators and share best practices within your organization.
            </p>
          </div>
        </div>
      </div>

      <table width="100%" cellSpacing="0" cellPadding="0">
        <tbody>
          <tr>
            <td align="center" style={{ padding: '32px 0' }}>
              <a href={loginLink} style={styles.button}>
                Go to Dashboard
              </a>
            </td>
          </tr>
        </tbody>
      </table>

      <div style={styles.helpBox}>
        <h3 style={styles.helpTitle}>Need Help Getting Started?</h3>
        <p style={styles.helpText}>
          Check out our resources to make the most of Gemeos:
        </p>
        <ul style={styles.helpList}>
          <li><a href="#" style={styles.helpLink}>Quick Start Guide</a></li>
          <li><a href="#" style={styles.helpLink}>Video Tutorials</a></li>
          <li><a href="#" style={styles.helpLink}>Help Center</a></li>
          <li><a href="#" style={styles.helpLink}>Contact Support</a></li>
        </ul>
      </div>

      <div style={styles.divider} />

      <p style={styles.paragraph}>
        We're here to support your educational journey. If you have any questions 
        or need assistance, don't hesitate to reach out to our support team.
      </p>

      <p style={styles.paragraph}>
        Welcome aboard!<br />
        The Gemeos Team
      </p>
    </BaseTemplate>
  );
};

const styles: Record<string, React.CSSProperties> = {
  title: {
    color: '#1a1a1a',
    fontSize: '28px',
    fontWeight: 'bold',
    lineHeight: '1.3',
    margin: '0 0 24px',
    textAlign: 'center' as const,
  },
  subtitle: {
    color: '#2d3748',
    fontSize: '20px',
    fontWeight: 'bold',
    lineHeight: '1.3',
    margin: '32px 0 16px',
  },
  paragraph: {
    color: '#4a5568',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 16px',
  },
  infoBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
  },
  infoTitle: {
    color: '#166534',
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 12px',
  },
  infoItem: {
    color: '#15803d',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 8px',
  },
  statusActive: {
    backgroundColor: '#22c55e',
    color: '#ffffff',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  featureList: {
    margin: '24px 0',
  },
  feature: {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  featureIcon: {
    fontSize: '24px',
    marginRight: '16px',
    minWidth: '40px',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    color: '#2d3748',
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 4px',
  },
  featureDescription: {
    color: '#718096',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: 0,
  },
  button: {
    backgroundColor: '#8b5cf6',
    borderRadius: '6px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '14px 32px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  helpBox: {
    backgroundColor: '#faf5ff',
    border: '1px solid '#e9d5ff',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
  },
  helpTitle: {
    color: '#6b21a8',
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 8px',
  },
  helpText: {
    color: '#7c3aed',
    fontSize: '14px',
    margin: '0 0 12px',
  },
  helpList: {
    margin: 0,
    paddingLeft: '20px',
  },
  helpLink: {
    color: '#8b5cf6',
    fontSize: '14px',
    textDecoration: 'none',
  },
  divider: {
    borderTop: '1px solid #e2e8f0',
    margin: '32px 0',
  },
};