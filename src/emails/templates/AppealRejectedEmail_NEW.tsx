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

interface AppealRejectedEmailProps {
  name?: string;
  message?: string;
}

/**
 * React component for the appeal rejected email.
 */
export const AppealRejectedEmail = ({
  name = 'Usuario',
  message,
}: AppealRejectedEmailProps): React.ReactElement => (
  <Html>
    <Head />
    <Preview>Actualización sobre tu solicitud en UpSkill</Preview>
    <Body style={main}>
      <Container style={container}>
        {/* Header con logo y gradiente */}
        <Section style={header}>
          <div style={logoContainer}>
            <div style={logo}>
              <Text style={logoText}>🎓</Text>
            </div>
            <Heading style={brandName}>UpSkill</Heading>
          </div>
        </Section>

        {/* Contenido principal */}
        <Section style={content}>
          <Heading style={h1}>Actualización de tu Solicitud</Heading>
          
          <Text style={text}>Hola {name},</Text>
          
          <Text style={text}>
            Gracias por tu interés en unirte como profesor a nuestra plataforma. 
            Después de revisar tu solicitud, lamentablemente no hemos podido aprobarla en este momento.
          </Text>

          {message && (
            <Section style={messageBox}>
              <Text style={messageLabel}>Mensaje del administrador:</Text>
              <Text style={messageText}>{message}</Text>
            </Section>
          )}

          {/* Información adicional */}
          <Section style={infoBox}>
            <Heading style={infoTitle}>¿Qué puedes hacer ahora?</Heading>
            <div style={infoItem}>
              <span style={bullet}>•</span>
              <Text style={infoText}>
                Revisa los requisitos necesarios para ser profesor en la plataforma
              </Text>
            </div>
            <div style={infoItem}>
              <span style={bullet}>•</span>
              <Text style={infoText}>
                Puedes presentar una nueva solicitud en el futuro
              </Text>
            </div>
            <div style={infoItem}>
              <span style={bullet}>•</span>
              <Text style={infoText}>
                Mientras tanto, puedes continuar aprendiendo con nuestros cursos
              </Text>
            </div>
          </Section>

          <Text style={text}>
            Apreciamos tu comprensión y te animamos a seguir desarrollando tus habilidades.
          </Text>

          <Button style={button} href={`${process.env.NGROK_FRONTEND_URL}`}>
            Explorar Cursos
          </Button>
        </Section>

        {/* Footer */}
        <Hr style={hr} />
        <Section style={footer}>
          <Text style={footerText}>Plataforma de Cursos UpSkill</Text>
          <Text style={footerSubtext}>Aprende sin límites</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default AppealRejectedEmail;

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
  background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
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

const text = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px 0',
};

const messageBox = {
  backgroundColor: '#fef3c7',
  border: '2px solid #fbbf24',
  borderRadius: '12px',
  padding: '24px',
  margin: '32px 0',
};

const messageLabel = {
  color: '#92400e',
  fontSize: '13px',
  fontWeight: 'bold',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
  margin: '0 0 8px 0',
};

const messageText = {
  color: '#92400e',
  fontSize: '15px',
  lineHeight: '26px',
  margin: '0',
};

const infoBox = {
  backgroundColor: '#f8fafc',
  borderLeft: '4px solid #64748b',
  borderRadius: '8px',
  padding: '24px',
  margin: '32px 0',
};

const infoTitle = {
  color: '#1e293b',
  fontSize: '18px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
};

const infoItem = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: '12px',
  margin: '12px 0',
};

const bullet = {
  color: '#64748b',
  fontWeight: 'bold',
  fontSize: '18px',
  lineHeight: '28px',
  flexShrink: '0',
};

const infoText = {
  color: '#475569',
  fontSize: '15px',
  lineHeight: '28px',
  margin: '0',
};

const button = {
  backgroundColor: '#64748b',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '14px 28px',
  margin: '32px 0',
  boxShadow: '0 4px 6px rgba(100, 116, 139, 0.25)',
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
