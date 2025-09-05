/**
 * Base Email Template
 * Common layout for all email templates
 */

import React from 'react';

interface BaseTemplateProps {
  children: React.ReactNode;
  previewText?: string;
  footerText?: string;
}

export const BaseTemplate: React.FC<BaseTemplateProps> = ({
  children,
  previewText = '',
  footerText = 'Gemeos - Educational Excellence Platform',
}) => {
  return (
    <html>
      <head>
        <meta content="text/html; charset=UTF-8" httpEquiv="Content-Type" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        {previewText && (
          <>
            <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>
              {previewText}
            </div>
            <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>
              &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
              &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
            </div>
          </>
        )}
      </head>
      <body style={styles.body}>
        <table align="center" style={styles.container}>
          <tbody>
            <tr>
              <td>
                {/* Header */}
                <table style={styles.header}>
                  <tbody>
                    <tr>
                      <td align="center">
                        <h1 style={styles.logo}>Gemeos</h1>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Main Content */}
                <table style={styles.content}>
                  <tbody>
                    <tr>
                      <td>{children}</td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer */}
                <table style={styles.footer}>
                  <tbody>
                    <tr>
                      <td align="center">
                        <p style={styles.footerText}>{footerText}</p>
                        <p style={styles.footerLinks}>
                          <a href="#" style={styles.footerLink}>Privacy Policy</a>
                          {' • '}
                          <a href="#" style={styles.footerLink}>Terms of Service</a>
                          {' • '}
                          <a href="#" style={styles.footerLink}>Help Center</a>
                        </p>
                        <p style={styles.copyright}>
                          © {new Date().getFullYear()} Gemeos. All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </body>
    </html>
  );
};

const styles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: 0,
    padding: 0,
    WebkitTextSizeAdjust: '100%',
    msTextSizeAdjust: '100%',
  },
  container: {
    backgroundColor: '#f6f9fc',
    margin: '0 auto',
    padding: '20px 0',
    width: '100%',
    maxWidth: '600px',
  },
  header: {
    backgroundColor: '#ffffff',
    borderRadius: '8px 8px 0 0',
    padding: '32px 48px',
    borderBottom: '1px solid #e6ebf1',
  },
  logo: {
    color: '#8b5cf6',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: 0,
    textDecoration: 'none',
  },
  content: {
    backgroundColor: '#ffffff',
    padding: '48px',
  },
  footer: {
    backgroundColor: '#ffffff',
    borderRadius: '0 0 8px 8px',
    borderTop: '1px solid #e6ebf1',
    padding: '32px 48px',
  },
  footerText: {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '1.5',
    margin: '0 0 10px',
  },
  footerLinks: {
    color: '#8898aa',
    fontSize: '12px',
    margin: '0 0 10px',
  },
  footerLink: {
    color: '#8b5cf6',
    textDecoration: 'none',
  },
  copyright: {
    color: '#8898aa',
    fontSize: '12px',
    margin: 0,
  },
};