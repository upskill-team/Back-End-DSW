import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from '@react-email/components';
import * as React from 'react';

interface ResetPasswordEmailProps {
  name?: string;
  resetUrl: string;
}

/**
 * React component for the password reset email.
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
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>UpSkill</Heading>
        <Text style={text}>
          Hola {name},
        </Text>
        <Text style={text}>
          Alguien ha solicitado restablecer la contraseña de tu cuenta en UpSkill.
          Si no has sido tú, puedes ignorar este correo de forma segura.
        </Text>
        <Text style={text}>
          Para continuar, haz clic en el botón de abajo. Este enlace expirará en 1 hora.
        </Text>
        <Button
          style={button}
          href={resetUrl}
        >
          Restablecer Contraseña
        </Button>
        <Text style={footer}>
          Plataforma de Cursos UpSkill
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ResetPasswordEmail;

// --- Styles for the email component ---
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: 'Arial, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '30px 0',
  padding: '0',
};

const text = {
  color: '#525f7f',
  fontSize: '16px',
  lineHeight: '24px',
  textAlign: 'left' as const,
  padding: '0 40px',
};

const button = {
  backgroundColor: '#3b82f6',
  borderRadius: '5px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '12px',
  margin: '32px auto',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};