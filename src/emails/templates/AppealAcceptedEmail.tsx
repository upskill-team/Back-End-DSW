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

interface AppealAcceptedEmailProps {
  name?: string;
  message?: string;
}

/**
 * React component for the appeal accepted email.
 * Fully responsive design with mobile-first approach.
 */
export const AppealAcceptedEmail = ({
  name = 'Usuario',
  message,
}: AppealAcceptedEmailProps): React.ReactElement => (
  <Html>
    <Head />
    <Preview>¡Felicitaciones! Tu solicitud ha sido aceptada en UpSkill</Preview>
    <Body style={styles.base.main}>
      <Container style={styles.base.container}>
        {/* Header con gradiente success */}
        <Section style={styles.headers.success}>
          <Text style={styles.headerElements.emoji}>🎓</Text>
          <Heading style={styles.headerElements.title}>UpSkill</Heading>
        </Section>

        {/* Contenido principal */}
        <Section style={styles.content.section}>
          <Heading style={styles.content.h1}>¡Solicitud Aceptada!</Heading>
          
          <Text style={styles.content.greeting}>Hola {name},</Text>
          
          <Text style={styles.content.paragraph}>
            ¡Tenemos excelentes noticias! Tu solicitud para convertirte en profesor ha sido aprobada.
          </Text>

          {/* Success badge */}
          <Section style={styles.badges.success}>
            <div style={styles.badgeElements.icon}>✓</div>
            <Heading style={styles.badgeElements.title}>Bienvenido al equipo de profesores</Heading>
            <Text style={styles.badgeElements.text}>
              Has sido aprobado para crear y publicar cursos en la plataforma.
            </Text>
          </Section>

          {message && (
            <Section style={styles.boxes.message}>
              <Text style={styles.boxElements.label}>Mensaje del administrador:</Text>
              <Text style={styles.boxElements.content}>{message}</Text>
            </Section>
          )}

          {/* Próximos pasos con tabla responsive */}
          <Section style={styles.boxes.steps}>
            <Heading style={styles.boxElements.title}>Próximos pasos</Heading>
            <table style={styles.table.base}>
              <tbody>
                <tr>
                  <td style={styles.table.numberCell}>
                    <span style={styles.tableElements.number}>1</span>
                  </td>
                  <td style={styles.table.textCell}>
                    <Text style={styles.tableElements.text}>Inicia sesión en tu cuenta</Text>
                  </td>
                </tr>
                <tr>
                  <td style={styles.table.numberCell}>
                    <span style={styles.tableElements.number}>2</span>
                  </td>
                  <td style={styles.table.textCell}>
                    <Text style={styles.tableElements.text}>Crea tu primer curso</Text>
                  </td>
                </tr>
                <tr>
                  <td style={styles.table.numberCell}>
                    <span style={styles.tableElements.number}>3</span>
                  </td>
                  <td style={styles.table.textCell}>
                    <Text style={styles.tableElements.text}>Comienza a enseñar</Text>
                  </td>
                </tr>
              </tbody>
            </table>
          </Section>

          <Section style={styles.buttons.section}>
            <Button style={styles.buttons.success} href={`${process.env.NGROK_FRONTEND_URL}/login`}>
              Acceder a la Plataforma
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

export default AppealAcceptedEmail;
