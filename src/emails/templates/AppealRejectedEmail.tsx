import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Hr,
  Section,
  Button,
} from '@react-email/components';
import * as React from 'react';
import * as styles from '../styles/shared-styles.js';

interface AppealRejectedEmailProps {
  name?: string;
  message?: string;
}

/**
 * React component for the appeal rejected email.
 * Fully responsive design with mobile-first approach.
 */
export const AppealRejectedEmail = ({
  name = 'Usuario',
  message,
}: AppealRejectedEmailProps): React.ReactElement => (
  <Html>
    <Head />
    <Preview>Actualización sobre tu solicitud en UpSkill</Preview>
    <Body style={styles.base.main}>
      <Container style={styles.base.container}>
        {/* Header con gradiente warning */}
        <Section style={styles.headers.warning}>
          <Text style={styles.headerElements.emoji}>📋</Text>
          <Heading style={styles.headerElements.title}>UpSkill</Heading>
        </Section>

        {/* Contenido principal */}
        <Section style={styles.content.section}>
          <Heading style={styles.content.h1}>Actualización de Solicitud</Heading>
          
          <Text style={styles.content.greeting}>Hola {name},</Text>
          
          <Text style={styles.content.paragraph}>
            Lamentablemente, tu solicitud para convertirte en profesor no ha sido aceptada
            en esta ocasión.
          </Text>

          {/* Warning badge */}
          <Section style={styles.badges.warning}>
            <div style={warningIconStyle}>⚠️</div>
            <Heading style={warningTitleStyle}>Solicitud No Aprobada</Heading>
            <Text style={warningTextStyle}>
              Hemos revisado cuidadosamente tu solicitud, pero no cumple con los requisitos actuales.
            </Text>
          </Section>

          {message && (
            <Section style={styles.boxes.highlight}>
              <Text style={styles.boxElements.label}>Mensaje del administrador:</Text>
              <Text style={messageContentStyle}>{message}</Text>
            </Section>
          )}

          <Text style={styles.content.paragraph}>
            Te animamos a revisar los requisitos y volver a intentarlo en el futuro.
            Si tienes alguna pregunta, no dudes en contactarnos.
          </Text>

          {/* Próximos pasos */}
          <Section style={styles.boxes.info}>
            <Heading style={styles.boxElements.title}>¿Qué puedes hacer?</Heading>
            <table style={styles.table.base}>
              <tbody>
                <tr>
                  <td style={styles.table.numberCell}>
                    <span style={infoNumberStyle}>1</span>
                  </td>
                  <td style={styles.table.textCell}>
                    <Text style={styles.tableElements.text}>Revisa los requisitos para profesores</Text>
                  </td>
                </tr>
                <tr>
                  <td style={styles.table.numberCell}>
                    <span style={infoNumberStyle}>2</span>
                  </td>
                  <td style={styles.table.textCell}>
                    <Text style={styles.tableElements.text}>Mejora tu perfil y experiencia</Text>
                  </td>
                </tr>
                <tr>
                  <td style={styles.table.numberCell}>
                    <span style={infoNumberStyle}>3</span>
                  </td>
                  <td style={styles.table.textCell}>
                    <Text style={styles.tableElements.text}>Vuelve a solicitar cuando estés listo</Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={styles.buttons.section}>
            <Button style={styles.buttons.neutral} href={`${process.env.NGROK_FRONTEND_URL}/contact`}>
              Contactar Soporte
            </Button>
          </Section>
        </Section>

        {/* Footer */}
        <Hr style={styles.footer.hr} />
        <Section style={styles.footer.section}>
          <Text style={styles.footer.text}>Plataforma de Cursos UpSkill</Text>
          <Text style={styles.footer.subtext}>Aprende sin límites</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default AppealRejectedEmail;

// Estilos customizados para este template
const warningIconStyle = {
  ...styles.badgeElements.icon,
  backgroundColor: '#f59e0b',
  fontSize: '28px',
};

const warningTitleStyle = {
  color: '#92400e',
  fontSize: '20px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px 0',
  lineHeight: '1.3',
};

const warningTextStyle = {
  color: '#b45309',
  fontSize: '15px',
  margin: '0',
  lineHeight: '1.5',
};

const messageContentStyle = {
  color: '#b45309',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const infoNumberStyle = {
  ...styles.tableElements.number,
  backgroundColor: '#3b82f6',
};
