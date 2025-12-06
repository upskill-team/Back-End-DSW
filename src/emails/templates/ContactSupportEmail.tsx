import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
  Section,
} from '@react-email/components';
import * as React from 'react';

interface ContactSupportEmailProps {
  name: string;
  email: string;
  subject: string;
  message: string;
  submittedAt: Date;
  ticketId?: string;
}

/**
 * React component for the contact support notification email (internal use).
 * This email is sent to the support team when a user contacts them.
 */
export const ContactSupportEmail = ({
  name,
  email,
  subject,
  message,
  submittedAt,
  ticketId,
}: ContactSupportEmailProps): React.ReactElement => {
  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(submittedAt));

  return (
    <Html>
      <Head />
      <Preview>Nueva solicitud de soporte: {subject}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header con logo */}
          <Section style={header}>
            <div style={logoContainer}>
              <div style={logo}>
                <Text style={logoText}>📧</Text>
              </div>
              <Heading style={brandName}>UpSkill Support</Heading>
            </div>
          </Section>

          {/* Contenido principal */}
          <Section style={content}>
            <Heading style={h1}>Nueva Solicitud de Soporte</Heading>

            {/* Ticket ID */}
            {ticketId && (
              <Section style={ticketBox}>
                <Text style={ticketLabel}>Ticket ID</Text>
                <Text style={ticketNumber}>#{ticketId}</Text>
              </Section>
            )}

            {/* Información del usuario */}
            <Section style={userBox}>
              <Heading style={sectionTitle}>Información del Usuario</Heading>
              <div style={infoRow}>
                <Text style={infoLabel}>Nombre:</Text>
                <Text style={infoValue}>{name}</Text>
              </div>
              <div style={infoRow}>
                <Text style={infoLabel}>Email:</Text>
                <Text style={infoValue}>{email}</Text>
              </div>
              <div style={infoRow}>
                <Text style={infoLabel}>Fecha:</Text>
                <Text style={infoValue}>{formattedDate}</Text>
              </div>
            </Section>

            {/* Asunto */}
            <Section style={subjectBox}>
              <Text style={subjectLabel}>Asunto</Text>
              <Text style={subjectText}>{subject}</Text>
            </Section>

            {/* Mensaje */}
            <Section style={messageBox}>
              <Text style={messageLabel}>Mensaje</Text>
              <Text style={messageText}>{message}</Text>
            </Section>

            {/* Acciones */}
            <Section style={actionsBox}>
              <Heading style={actionsTitle}>Acciones Rápidas</Heading>
              <Button 
                style={actionButton} 
                href={`mailto:${email}?subject=Re: ${subject}${ticketId ? ` [Ticket #${ticketId}]` : ''}`}
              >
                Responder al Usuario
              </Button>
            </Section>

            {/* Info adicional */}
            <Section style={infoBox}>
              <Text style={infoBoxText}>
                💡 Tip: Responde lo antes posible para mantener una buena experiencia del usuario. 
                El tiempo promedio de respuesta debería ser menor a 24 horas.
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>Sistema de Soporte - UpSkill</Text>
            <Text style={footerSubtext}>Notificación automática</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ContactSupportEmail;

// ==================== STYLES ====================

const main = {
  backgroundColor: '#f8fafc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '0',
  maxWidth: '600px',
  border: '1px solid #e2e8f0',
};

const header = {
  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
  padding: '32px 24px',
  textAlign: 'center' as const,
};

const logoContainer = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '12px',
};

const logo = {
  width: '48px',
  height: '48px',
  backgroundColor: 'rgba(255, 255, 255, 0.2)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const logoText = {
  fontSize: '24px',
  margin: '0',
  lineHeight: '48px',
};

const brandName = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '48px',
};

const content = {
  padding: '40px 32px',
};

const h1 = {
  color: '#1e293b',
  fontSize: '28px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 24px 0',
  lineHeight: '1.3',
};

const ticketBox = {
  backgroundColor: '#dbeafe',
  border: '2px dashed #3b82f6',
  borderRadius: '8px',
  padding: '16px',
  margin: '0 0 32px 0',
  textAlign: 'center' as const,
};

const ticketLabel = {
  color: '#1e40af',
  fontSize: '12px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 4px 0',
};

const ticketNumber = {
  color: '#1e40af',
  fontSize: '24px',
  fontWeight: 'bold',
  fontFamily: 'monospace',
  margin: '0',
};

const userBox = {
  backgroundColor: '#f8fafc',
  border: '1px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 24px 0',
};

const sectionTitle = {
  color: '#1e293b',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const infoRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 0',
  borderBottom: '1px solid #f1f5f9',
};

const infoLabel = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0',
  fontWeight: '500',
};

const infoValue = {
  color: '#1e293b',
  fontSize: '14px',
  margin: '0',
  fontWeight: '600',
  textAlign: 'right' as const,
};

const subjectBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #fbbf24',
  borderRadius: '12px',
  padding: '20px',
  margin: '0 0 24px 0',
};

const subjectLabel = {
  color: '#92400e',
  fontSize: '13px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px 0',
};

const subjectText = {
  color: '#92400e',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1.4',
};

const messageBox = {
  backgroundColor: '#ffffff',
  border: '2px solid #e2e8f0',
  borderRadius: '12px',
  padding: '24px',
  margin: '0 0 32px 0',
};

const messageLabel = {
  color: '#475569',
  fontSize: '13px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 12px 0',
};

const messageText = {
  color: '#1e293b',
  fontSize: '15px',
  lineHeight: '26px',
  margin: '0',
  whiteSpace: 'pre-wrap' as const,
};

const actionsBox = {
  margin: '32px 0',
};

const actionsTitle = {
  color: '#1e293b',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  textAlign: 'center' as const,
};

const actionButton = {
  backgroundColor: '#06b6d4',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 28px',
  margin: '0 auto',
  boxShadow: '0 4px 6px rgba(6, 182, 212, 0.25)',
};

const infoBox = {
  backgroundColor: '#f0f9ff',
  borderLeft: '4px solid #3b82f6',
  borderRadius: '8px',
  padding: '16px',
  margin: '32px 0',
};

const infoBoxText = {
  color: '#1e40af',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0',
};

const hr = {
  borderColor: '#e2e8f0',
  margin: '0',
};

const footer = {
  padding: '32px 24px',
  textAlign: 'center' as const,
  backgroundColor: '#f8fafc',
};

const footerText = {
  color: '#64748b',
  fontSize: '14px',
  lineHeight: '20px',
  margin: '0 0 4px 0',
  fontWeight: '600',
};

const footerSubtext = {
  color: '#94a3b8',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0',
};
