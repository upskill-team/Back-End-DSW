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

interface ResetPasswordEmailProps {
  name?: string;
  resetUrl: string;
}

/**
 * React component for the password reset email.
 * Fully responsive design with mobile-first approach.
 * @param {ResetPasswordEmailProps} props - The props for the component.
 * @param {string} [props.name='Usuario'] - The name of the user.
 * @param {string} props.resetUrl - The URL to the password reset page.
 * @returns {React.ReactElement} The email component.
 */
export const ResetPasswordEmail = ({
  name = 'Usuario',
  resetUrl,
}: ResetPasswordEmailProps): React.ReactElement => (
  <Html>
    <Head />
    <Preview>Restablece tu contraseña de UpSkill</Preview>
    <Body style={styles.base.main}>
      <Container style={styles.base.container}>
        {/* Header con gradiente neutral */}
        <Section style={styles.headers.neutral}>
          <Text style={styles.headerElements.emoji}>🔒</Text>
          <Heading style={styles.headerElements.title}>UpSkill</Heading>
        </Section>

        {/* Contenido principal */}
        <Section style={styles.content.section}>
          <Heading style={styles.content.h1}>Restablece tu Contraseña</Heading>
          
          <Text style={styles.content.greeting}>Hola {name},</Text>
          
          <Text style={styles.content.paragraph}>
            Alguien ha solicitado restablecer la contraseña de tu cuenta en UpSkill.
            Si no has sido tú, puedes ignorar este correo de forma segura.
          </Text>

          {/* Badge de seguridad */}
          <Section style={securityBadgeStyle}>
            <div style={securityIconStyle}>🔐</div>
            <Heading style={securityTitleStyle}>Solicitud de Restablecimiento</Heading>
            <Text style={securityTextStyle}>
              Este enlace es válido por 15 minutos y solo se puede usar una vez.
            </Text>
          </Section>

          <Text style={styles.content.paragraph}>
            Para continuar, haz clic en el botón de abajo. Este enlace expirará en <Text style={styles.content.strong}>15 minutos</Text>.
          </Text>

          <Section style={styles.buttons.section}>
            <Button style={styles.buttons.primary} href={resetUrl}>
              Restablecer Contraseña
            </Button>
          </Section>

          {/* Advertencias de seguridad */}
          <Section style={styles.boxes.highlight}>
            <Heading style={warningTitleStyle}>⚠️ Importante - Seguridad</Heading>
            <table style={styles.table.base}>
              <tbody>
                <tr>
                  <td style={styles.table.numberCell}>
                    <span style={warningNumberStyle}>1</span>
                  </td>
                  <td style={styles.table.textCell}>
                    <Text style={styles.tableElements.text}>No compartas este enlace con nadie</Text>
                  </td>
                </tr>
                <tr>
                  <td style={styles.table.numberCell}>
                    <span style={warningNumberStyle}>2</span>
                  </td>
                  <td style={styles.table.textCell}>
                    <Text style={styles.tableElements.text}>El enlace expira en 15 minutos</Text>
                  </td>
                </tr>
                <tr>
                  <td style={styles.table.numberCell}>
                    <span style={warningNumberStyle}>3</span>
                  </td>
                  <td style={styles.table.textCell}>
                    <Text style={styles.tableElements.text}>Si no solicitaste esto, cambia tu contraseña inmediatamente</Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={styles.boxes.info}>
            <Text style={styles.boxElements.content}>
              🛡️ <Text style={styles.content.strong}>Nota:</Text> UpSkill nunca te pedirá tu contraseña por correo electrónico o mensaje directo.
            </Text>
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

export default ResetPasswordEmail;

// Estilos customizados para este template
const securityBadgeStyle = {
  backgroundColor: '#f8fafc',
  border: '2px solid #cbd5e1',
  borderRadius: '12px',
  padding: '24px 16px',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const securityIconStyle = {
  ...styles.badgeElements.icon,
  backgroundColor: '#64748b',
  fontSize: '28px',
};

const securityTitleStyle = {
  color: '#334155',
  fontSize: '20px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px 0',
  lineHeight: '1.3',
};

const securityTextStyle = {
  color: '#475569',
  fontSize: '15px',
  margin: '0',
  lineHeight: '1.5',
};

const warningTitleStyle = {
  color: '#92400e',
  fontSize: '18px',
  fontWeight: 'bold' as const,
  margin: '0 0 16px 0',
};

const warningNumberStyle = {
  ...styles.tableElements.number,
  backgroundColor: '#f59e0b',
};
