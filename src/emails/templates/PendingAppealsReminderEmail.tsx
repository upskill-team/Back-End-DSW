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
import * as styles from '../styles/shared-styles.js';

interface PendingAppealsReminderEmailProps {
  name?: string;
  pendingCount: number;
  appealsUrl: string;
  oldestAppealDate: Date;
}

/**
 * React component for the pending appeals reminder email (for admins).
 * Fully responsive design with mobile-first approach.
 */
export const PendingAppealsReminderEmail = ({
  name = 'Administrador',
  pendingCount,
  appealsUrl,
  oldestAppealDate,
}: PendingAppealsReminderEmailProps): React.ReactElement => {
  const daysSinceOldest = Math.floor(
    (Date.now() - new Date(oldestAppealDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Html>
      <Head />
      <Preview>{`Recordatorio: ${pendingCount} solicitudes pendientes`}</Preview>
      <Body style={styles.base.main}>
        <Container style={styles.base.container}>
          {/* Header con gradiente warning */}
          <Section style={styles.headers.warning}>
            <Text style={styles.headerElements.emoji}>⚠️</Text>
            <Heading style={styles.headerElements.title}>UpSkill Admin</Heading>
          </Section>

          {/* Contenido principal */}
          <Section style={styles.content.section}>
            <Heading style={styles.content.h1}>Solicitudes Pendientes</Heading>
            
            <Text style={styles.content.greeting}>Hola {name},</Text>
            
            <Text style={styles.content.paragraph}>
              Este es un recordatorio diario sobre las solicitudes de profesor pendientes
              de revisión en la plataforma.
            </Text>

            {/* Badge de urgencia */}
            <Section style={urgencyBadgeStyle}>
              <div style={urgencyIconStyle}>{pendingCount}</div>
              <Heading style={urgencyTitleStyle}>
                {pendingCount} {pendingCount === 1 ? 'Solicitud Pendiente' : 'Solicitudes Pendientes'}
              </Heading>
              <Text style={urgencyTextStyle}>
                La solicitud más antigua lleva {daysSinceOldest}{' '}
                {daysSinceOldest === 1 ? 'día' : 'días'} esperando revisión.
              </Text>
            </Section>

            {/* Estadísticas */}
            <Section style={styles.boxes.neutral}>
              <Heading style={styles.boxElements.title}>Estadísticas</Heading>
              <table style={statsTableStyle}>
                <tbody>
                  <tr style={tableRowStyle}>
                    <td><Text style={styles.tableElements.label}>Total pendientes:</Text></td>
                    <td><Text style={statValueStyle}>{pendingCount}</Text></td>
                  </tr>
                  <tr style={tableRowStyle}>
                    <td><Text style={styles.tableElements.label}>Más antigua:</Text></td>
                    <td><Text style={statWarningStyle}>{daysSinceOldest} {daysSinceOldest === 1 ? 'día' : 'días'}</Text></td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Text style={styles.content.paragraph}>
              Por favor, revisa las solicitudes pendientes y toma una decisión para cada una.
              Los usuarios están esperando tu respuesta.
            </Text>

            {/* Acciones recomendadas */}
            <Section style={styles.boxes.info}>
              <Heading style={styles.boxElements.title}>Acciones Recomendadas</Heading>
              <table style={styles.table.base}>
                <tbody>
                  <tr>
                    <td style={styles.table.numberCell}>
                      <span style={warningNumberStyle}>1</span>
                    </td>
                    <td style={styles.table.textCell}>
                      <Text style={styles.tableElements.text}>Revisa las solicitudes más antiguas primero</Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.table.numberCell}>
                      <span style={warningNumberStyle}>2</span>
                    </td>
                    <td style={styles.table.textCell}>
                      <Text style={styles.tableElements.text}>Evalúa la experiencia y calificaciones</Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.table.numberCell}>
                      <span style={warningNumberStyle}>3</span>
                    </td>
                    <td style={styles.table.textCell}>
                      <Text style={styles.tableElements.text}>Aprueba o rechaza con mensaje personalizado</Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Section style={styles.buttons.section}>
              <Button style={styles.buttons.warning} href={appealsUrl}>
                Ver Solicitudes Pendientes
              </Button>
            </Section>

            <Section style={styles.boxes.highlight}>
              <Text style={reminderTextStyle}>
                💡 <Text style={styles.content.strong}>Recordatorio:</Text> Es importante responder en un plazo de 3-5 días para mantener una buena experiencia del usuario.
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Hr style={styles.footer.hr} />
          <Section style={styles.footer.section}>
            <Text style={styles.footer.text}>Sistema de Notificaciones - UpSkill</Text>
            <Text style={styles.footer.subtext}>Notificación automática diaria</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PendingAppealsReminderEmail;

// Estilos customizados para este template
const urgencyBadgeStyle = {
  backgroundColor: '#fef3c7',
  border: '2px solid #fbbf24',
  borderRadius: '12px',
  padding: '24px 16px',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const urgencyIconStyle = {
  ...styles.badgeElements.icon,
  backgroundColor: '#f59e0b',
  fontSize: '24px',
  fontWeight: 'bold' as const,
};

const urgencyTitleStyle = {
  color: '#92400e',
  fontSize: '20px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px 0',
  lineHeight: '1.3',
};

const urgencyTextStyle = {
  color: '#b45309',
  fontSize: '15px',
  margin: '0',
  lineHeight: '1.5',
};

const statsTableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const tableRowStyle = {
  padding: '10px 0',
  borderBottom: '1px solid #f1f5f9',
};

const statValueStyle = {
  color: '#1e293b',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  margin: '0',
  textAlign: 'right' as const,
};

const statWarningStyle = {
  color: '#f59e0b',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  margin: '0',
  textAlign: 'right' as const,
};

const warningNumberStyle = {
  ...styles.tableElements.number,
  backgroundColor: '#f59e0b',
};

const reminderTextStyle = {
  color: '#b45309',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};
