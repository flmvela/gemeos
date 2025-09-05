/**
 * Password Reset Email Template
 */

import React from 'react';
import { BaseTemplate } from './BaseTemplate';

interface PasswordResetTemplateProps {
  userName?: string;
  resetLink: string;
  expirationTime?: string;
}

export const PasswordResetTemplate: React.FC<PasswordResetTemplateProps> = ({
  userName,
  resetLink,
  expirationTime = '1 hour',
}) => {
  const previewText = 'Reset your Gemeos password';

  return (
    <BaseTemplate previewText={previewText}>
      <h2 style={styles.title}>Password Reset Request</h2>
      
      <p style={styles.paragraph}>
        Hi {userName || 'there'},
      </p>
      
      <p style={styles.paragraph}>
        We received a request to reset your password for your Gemeos account. 
        If you didn't make this request, you can safely ignore this email.
      </p>

      <p style={styles.paragraph}>
        To reset your password, click the button below:
      </p>

      <table width="100%" cellSpacing="0" cellPadding="0">
        <tbody>
          <tr>
            <td align="center" style={{ padding: '24px 0' }}>
              <a href={resetLink} style={styles.button}>
                Reset Password
              </a>
            </td>
          </tr>
        </tbody>
      </table>

      <p style={styles.smallText}>
        If you're unable to click the button above, copy and paste this link into your browser:
      </p>
      <p style={styles.link}>
        <a href={resetLink} style={styles.linkText}>{resetLink}</a>
      </p>

      <div style={styles.warningBox}>
        <p style={styles.warningTitle}>Important Security Information:</p>
        <ul style={styles.warningList}>
          <li>This link will expire in {expirationTime}</li>
          <li>This link can only be used once</li>
          <li>Never share this link with anyone</li>
        </ul>
      </div>

      <p style={styles.paragraph}>
        If you didn't request a password reset, please contact our support team 
        immediately as someone may be trying to access your account.
      </p>

      <p style={styles.paragraph}>
        For security reasons, we recommend that you:
      </p>
      
      <ul style={styles.list}>
        <li style={styles.listItem}>Use a strong, unique password</li>
        <li style={styles.listItem}>Enable two-factor authentication</li>
        <li style={styles.listItem}>Never share your password with others</li>
      </ul>

      <div style={styles.divider} />

      <p style={styles.paragraph}>
        Best regards,<br />
        The Gemeos Security Team
      </p>

      <p style={styles.footer}>
        This is an automated message. Please do not reply to this email.
      </p>
    </BaseTemplate>
  );
};

const styles: Record<string, React.CSSProperties> = {
  title: {
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: 'bold',
    lineHeight: '1.3',
    margin: '0 0 24px',
  },
  paragraph: {
    color: '#4a5568',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 16px',
  },
  button: {
    backgroundColor: '#ef4444',
    borderRadius: '6px',
    color: '#ffffff',
    display: 'inline-block',
    fontSize: '16px',
    fontWeight: 'bold',
    padding: '14px 28px',
    textDecoration: 'none',
    textAlign: 'center' as const,
  },
  smallText: {
    color: '#718096',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 8px',
  },
  link: {
    margin: '0 0 24px',
  },
  linkText: {
    color: '#ef4444',
    fontSize: '14px',
    wordBreak: 'break-all' as const,
  },
  warningBox: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
  },
  warningTitle: {
    color: '#991b1b',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '0 0 12px',
    textTransform: 'uppercase',
  },
  warningList: {
    color: '#dc2626',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0',
    paddingLeft: '20px',
  },
  list: {
    color: '#4a5568',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 24px',
    paddingLeft: '20px',
  },
  listItem: {
    margin: '0 0 8px',
  },
  divider: {
    borderTop: '1px solid #e2e8f0',
    margin: '32px 0',
  },
  footer: {
    color: '#94a3b8',
    fontSize: '13px',
    fontStyle: 'italic',
    margin: '24px 0 0',
  },
};