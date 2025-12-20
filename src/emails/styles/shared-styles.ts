/**
 * @module Emails/Styles
 * @remarks Shared responsive styles for all email templates.
 * Design System: Mobile-first approach, consistent spacing (8px grid), typography scale, color palette, and reusable components.
 */

// ==================== BASE STYLES ====================

export const base = {
  main: {
    backgroundColor: '#f8fafc',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    WebkitFontSmoothing: 'antialiased' as const,
    MozOsxFontSmoothing: 'grayscale' as const,
    padding: '0',
    margin: '0',
  },

  container: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '0',
    width: '100%',
    maxWidth: '600px',
    border: '1px solid #e2e8f0',
  },
};

// ==================== HEADER STYLES ====================

export const headers = {
  success: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #10b981 100%)',
    padding: '24px 16px',
    textAlign: 'center' as const,
  },

  info: {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)',
    padding: '24px 16px',
    textAlign: 'center' as const,
  },

  warning: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #f97316 100%)',
    padding: '24px 16px',
    textAlign: 'center' as const,
  },

  neutral: {
    background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
    padding: '24px 16px',
    textAlign: 'center' as const,
  },

  primary: {
    background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
    padding: '24px 16px',
    textAlign: 'center' as const,
  },
};

export const headerElements = {
  emoji: {
    fontSize: '32px',
    lineHeight: '1',
    margin: '0 0 8px 0',
    display: 'block',
  },

  title: {
    color: '#ffffff',
    fontSize: '24px',
    fontWeight: 'bold' as const,
    margin: '0',
    lineHeight: '1.2',
  },
};

// ==================== CONTENT STYLES ====================

export const content = {
  section: {
    padding: '32px 16px',
  },

  h1: {
    color: '#1e293b',
    fontSize: '24px',
    fontWeight: 'bold' as const,
    textAlign: 'center' as const,
    margin: '0 0 24px 0',
    lineHeight: '1.3',
  },

  h2: {
    color: '#1e293b',
    fontSize: '20px',
    fontWeight: 'bold' as const,
    margin: '0 0 16px 0',
    lineHeight: '1.3',
  },

  greeting: {
    color: '#475569',
    fontSize: '16px',
    lineHeight: '1.5',
    margin: '0 0 16px 0',
  },

  paragraph: {
    color: '#475569',
    fontSize: '16px',
    lineHeight: '1.6',
    margin: '0 0 16px 0',
  },

  strong: {
    color: '#1e293b',
    fontWeight: '600' as const,
  },
};

// ==================== BADGE/CARD STYLES ====================

export const badges = {
  success: {
    backgroundColor: '#f0fdf4',
    border: '2px solid #86efac',
    borderRadius: '12px',
    padding: '24px 16px',
    margin: '0 0 24px 0',
    textAlign: 'center' as const,
  },

  info: {
    backgroundColor: '#eff6ff',
    border: '2px solid #93c5fd',
    borderRadius: '12px',
    padding: '24px 16px',
    margin: '0 0 24px 0',
    textAlign: 'center' as const,
  },

  warning: {
    backgroundColor: '#fef3c7',
    border: '2px solid #fbbf24',
    borderRadius: '12px',
    padding: '24px 16px',
    margin: '0 0 24px 0',
  },

  neutral: {
    backgroundColor: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    padding: '24px 16px',
    margin: '0 0 24px 0',
  },
};

export const badgeElements = {
  icon: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: '32px',
    width: '56px',
    height: '56px',
    lineHeight: '56px',
    borderRadius: '50%',
    display: 'inline-block',
    margin: '0 auto 12px',
    textAlign: 'center' as const,
  },

  title: {
    color: '#166534',
    fontSize: '20px',
    fontWeight: 'bold' as const,
    margin: '0 0 8px 0',
    lineHeight: '1.3',
  },

  text: {
    color: '#15803d',
    fontSize: '15px',
    margin: '0',
    lineHeight: '1.5',
  },
};

// ==================== BOX STYLES ====================

export const boxes = {
  message: {
    backgroundColor: '#eff6ff',
    border: '2px solid #93c5fd',
    borderRadius: '12px',
    padding: '16px',
    margin: '0 0 24px 0',
  },

  highlight: {
    backgroundColor: '#fef3c7',
    border: '2px solid #fbbf24',
    borderRadius: '12px',
    padding: '20px 16px',
    margin: '0 0 24px 0',
  },

  steps: {
    backgroundColor: '#f8fafc',
    borderLeft: '4px solid #10b981',
    borderRadius: '8px',
    padding: '20px 16px',
    margin: '0 0 24px 0',
  },

  info: {
    backgroundColor: '#f0f9ff',
    borderLeft: '4px solid #3b82f6',
    borderRadius: '8px',
    padding: '16px',
    margin: '0 0 24px 0',
  },

  neutral: {
    backgroundColor: '#f8fafc',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    padding: '20px 16px',
    margin: '0 0 24px 0',
  },
};

export const boxElements = {
  label: {
    color: '#1e40af',
    fontSize: '11px',
    fontWeight: 'bold' as const,
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
    margin: '0 0 8px 0',
    display: 'block',
  },

  content: {
    color: '#1e40af',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0',
  },

  title: {
    color: '#1e293b',
    fontSize: '18px',
    fontWeight: 'bold' as const,
    margin: '0 0 16px 0',
  },
};

// ==================== TABLE STYLES (for steps/lists) ====================

export const table = {
  base: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },

  numberCell: {
    width: '40px',
    verticalAlign: 'top' as const,
    paddingTop: '4px',
    paddingBottom: '12px',
  },

  textCell: {
    paddingLeft: '12px',
    paddingBottom: '12px',
    verticalAlign: 'top' as const,
  },

  infoRow: {
    padding: '10px 0',
    borderBottom: '1px solid #f1f5f9',
  },
};

export const tableElements = {
  number: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    width: '28px',
    height: '28px',
    lineHeight: '28px',
    borderRadius: '50%',
    display: 'inline-block',
    textAlign: 'center' as const,
    margin: '0',
  },

  text: {
    color: '#475569',
    fontSize: '15px',
    lineHeight: '1.6',
    margin: '0',
    paddingTop: '4px',
  },

  label: {
    color: '#64748b',
    fontSize: '14px',
    fontWeight: '500' as const,
    margin: '0',
  },

  value: {
    color: '#1e293b',
    fontSize: '14px',
    fontWeight: '600' as const,
    margin: '0',
    textAlign: 'right' as const,
  },
};

// ==================== BUTTON STYLES ====================

export const buttons = {
  success: {
    backgroundColor: '#10b981',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 32px',
    width: 'auto',
    minWidth: '200px',
    margin: '0',
  },

  primary: {
    backgroundColor: '#3b82f6',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 32px',
    width: 'auto',
    minWidth: '200px',
    margin: '0',
  },

  warning: {
    backgroundColor: '#f59e0b',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 32px',
    width: 'auto',
    minWidth: '200px',
    margin: '0',
  },

  info: {
    backgroundColor: '#8b5cf6',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 32px',
    width: 'auto',
    minWidth: '200px',
    margin: '0',
  },

  neutral: {
    backgroundColor: '#64748b',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold' as const,
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '14px 32px',
    width: 'auto',
    minWidth: '200px',
    margin: '0',
  },

  section: {
    margin: '24px 0',
    textAlign: 'center' as const,
  },
};

// ==================== IMAGE STYLES ====================

export const images = {
  section: {
    margin: '0 0 24px 0',
    textAlign: 'center' as const,
  },

  responsive: {
    width: '100%',
    maxWidth: '100%',
    height: 'auto',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    display: 'block',
  },
};

// ==================== FOOTER STYLES ====================

export const footer = {
  section: {
    padding: '24px 16px',
    textAlign: 'center' as const,
    backgroundColor: '#f8fafc',
  },

  text: {
    color: '#64748b',
    fontSize: '14px',
    lineHeight: '1.5',
    margin: '0 0 4px 0',
    fontWeight: '600' as const,
  },

  subtext: {
    color: '#94a3b8',
    fontSize: '12px',
    lineHeight: '1.5',
    margin: '0',
  },

  hr: {
    borderColor: '#e2e8f0',
    margin: '0',
  },
};

// ==================== UTILITY STYLES ====================

export const utils = {
  spacer: {
    height: '16px',
    margin: '0',
    padding: '0',
  },

  spacerLarge: {
    height: '24px',
    margin: '0',
    padding: '0',
  },

  divider: {
    borderColor: '#e2e8f0',
    margin: '24px 0',
  },

  textCenter: {
    textAlign: 'center' as const,
  },

  textLeft: {
    textAlign: 'left' as const,
  },

  textRight: {
    textAlign: 'right' as const,
  },
};
