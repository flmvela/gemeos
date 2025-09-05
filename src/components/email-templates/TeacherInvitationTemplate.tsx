/**
 * Teacher Invitation Email Template
 */

import React from 'react';
import { BaseTemplate } from './BaseTemplate';

interface TeacherInvitationTemplateProps {
  tenantName: string;
  inviterName: string;
  inviteLink: string;
  expiresAt?: string;
  recipientEmail: string;
}

export const TeacherInvitationTemplate: React.FC<TeacherInvitationTemplateProps> = ({
  tenantName,
  inviterName,
  inviteLink,
  expiresAt,
  recipientEmail,
}) => {
  const previewText = `You've been invited to join ${tenantName} on Gemeos`;

  return (
    <BaseTemplate previewText={previewText}>
      <h2 style={styles.title}>You're Invited to Join {tenantName}!</h2>
      
      <p style={styles.paragraph}>
        Hi there,
      </p>
      
      <p style={styles.paragraph}>
        {inviterName} has invited you to join <strong>{tenantName}</strong> on Gemeos 
        as a teacher. Gemeos is a comprehensive educational platform that helps manage 
        curriculum, learning goals, and student progress.
      </p>

      <div style={styles.highlightBox}>
        <p style={styles.highlightTitle}>Your Invitation Details:</p>
        <p style={styles.highlightItem}>
          <strong>Organization:</strong> {tenantName}
        </p>
        <p style={styles.highlightItem}>
          <strong>Role:</strong> Teacher
        </p>
        <p style={styles.highlightItem}>
          <strong>Invited by:</strong> {inviterName}
        </p>
        {expiresAt && (
          <p style={styles.highlightItem}>
            <strong>Expires:</strong> {expiresAt}
          </p>
        )}
      </div>

      <p style={styles.paragraph}>
        As a teacher in {tenantName}, you'll be able to:
      </p>
      
      <ul style={styles.list}>
        <li style={styles.listItem}>Access curriculum and learning materials</li>
        <li style={styles.listItem}>Track student progress and assessments</li>
        <li style={styles.listItem}>Collaborate with other educators</li>
        <li style={styles.listItem}>Create and manage learning activities</li>
      </ul>

      <table width="100%" cellSpacing="0" cellPadding="0">
        <tbody>
          <tr>
            <td align="center">
              <a href={inviteLink} style={styles.button}>
                Accept Invitation
              </a>
            </td>
          </tr>
        </tbody>
      </table>

      <p style={styles.smallText}>
        If you're unable to click the button above, copy and paste this link into your browser:
      </p>
      <p style={styles.link}>
        <a href={inviteLink} style={styles.linkText}>{inviteLink}</a>
      </p>

      <div style={styles.divider} />

      <p style={styles.note}>
        <strong>Note:</strong> This invitation was sent to {recipientEmail}. 
        If you didn't expect this invitation, you can safely ignore this email.
        {expiresAt && ` This invitation will expire on ${expiresAt}.`}
      </p>

      <p style={styles.paragraph}>
        Need help? Contact our support team or reply to this email.
      </p>

      <p style={styles.paragraph}>
        Best regards,<br />
        The Gemeos Team
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
  highlightBox: {
    backgroundColor: '#f7fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '20px',
    margin: '24px 0',
  },
  highlightTitle: {
    color: '#2d3748',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: '0 0 12px',
    textTransform: 'uppercase',
  },
  highlightItem: {
    color: '#4a5568',
    fontSize: '14px',
    lineHeight: '1.6',
    margin: '0 0 8px',
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
  button: {
    backgroundColor: '#8b5cf6',
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
    margin: '24px 0 8px',
  },
  link: {
    margin: '0 0 24px',
  },
  linkText: {
    color: '#8b5cf6',
    fontSize: '14px',
    wordBreak: 'break-all' as const,
  },
  divider: {
    borderTop: '1px solid #e2e8f0',
    margin: '32px 0',
  },
  note: {
    backgroundColor: '#fef5e7',
    borderLeft: '4px solid #f39c12',
    color: '#856404',
    fontSize: '14px',
    lineHeight: '1.6',
    padding: '12px 16px',
    margin: '0 0 24px',
  },
};