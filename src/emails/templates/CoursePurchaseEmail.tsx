import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
  Hr,
  Section,
} from '@react-email/components';
import * as React from 'react';
import * as styles from '../styles/shared-styles.js';

interface CoursePurchaseEmailProps {
  name?: string;
  courseName: string;
  courseImageUrl?: string;
  amount: number;
  transactionId: string;
  purchaseDate: Date;
  courseUrl: string;
}

/**
 * React component for the course purchase confirmation email.
 * Fully responsive design with mobile-first approach.
 */
export const CoursePurchaseEmail = ({
  name = 'Usuario',
  courseName,
  courseImageUrl,
  amount,
  transactionId,
  purchaseDate,
  courseUrl,
}: CoursePurchaseEmailProps): React.ReactElement => {
  const formattedAmount = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
  }).format(amount);

  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(purchaseDate));

  return (
    <Html>
      <Head />
      <Preview>Confirmación de compra: {courseName}</Preview>
      <Body style={styles.base.main}>
        <Container style={styles.base.container}>
          {/* Header con gradiente info */}
          <Section style={styles.headers.info}>
            <Text style={styles.headerElements.emoji}>🎫</Text>
            <Heading style={styles.headerElements.title}>UpSkill</Heading>
          </Section>

          {/* Contenido principal */}
          <Section style={styles.content.section}>
            <Heading style={styles.content.h1}>¡Compra Confirmada!</Heading>
            
            <Text style={styles.content.greeting}>Hola {name},</Text>
            
            <Text style={styles.content.paragraph}>
              ¡Gracias por tu compra! Tu pago ha sido procesado exitosamente.
            </Text>

            {/* Imagen del curso responsive */}
            {courseImageUrl && (
              <Section style={styles.images.section}>
                <Img
                  src={courseImageUrl}
                  alt={courseName}
                  style={styles.images.responsive}
                />
              </Section>
            )}

            {/* Badge de compra exitosa */}
            <Section style={purchaseBadgeStyle}>
              <div style={purchaseIconStyle}>✓</div>
              <Heading style={purchaseTitleStyle}>Pago Procesado</Heading>
              <Text style={purchaseTextStyle}>
                Tu acceso al curso ha sido activado inmediatamente.
              </Text>
            </Section>

            {/* Detalles de la compra en tabla */}
            <Section style={styles.boxes.neutral}>
              <Heading style={styles.boxElements.title}>Detalles de la Compra</Heading>
              <table style={purchaseTableStyle}>
                <tbody>
                  <tr style={tableRowStyle}>
                    <td><Text style={styles.tableElements.label}>Curso:</Text></td>
                    <td><Text style={valueStyle}>{courseName}</Text></td>
                  </tr>
                  <tr style={tableRowStyle}>
                    <td><Text style={styles.tableElements.label}>Monto:</Text></td>
                    <td><Text style={valueHighlightStyle}>{formattedAmount}</Text></td>
                  </tr>
                  <tr style={tableRowStyle}>
                    <td><Text style={styles.tableElements.label}>Transacción:</Text></td>
                    <td><Text style={valueStyle}>{transactionId}</Text></td>
                  </tr>
                  <tr style={tableRowStyle}>
                    <td><Text style={styles.tableElements.label}>Fecha:</Text></td>
                    <td><Text style={valueStyle}>{formattedDate}</Text></td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Text style={styles.content.paragraph}>
              Ya puedes acceder al contenido completo del curso. ¡Comienza tu aprendizaje ahora!
            </Text>

            <Section style={styles.buttons.section}>
              <Button style={styles.buttons.info} href={courseUrl}>
                Ir al Curso
              </Button>
            </Section>

            <Section style={styles.boxes.info}>
              <Text style={styles.boxElements.content}>
                💳 <Text style={styles.content.strong}>Recibo:</Text> Conserva este correo como comprobante de tu compra.
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
};

export default CoursePurchaseEmail;

// Estilos customizados para este template
const purchaseBadgeStyle = {
  backgroundColor: '#eff6ff',
  border: '2px solid #93c5fd',
  borderRadius: '12px',
  padding: '24px 16px',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const purchaseIconStyle = {
  ...styles.badgeElements.icon,
  backgroundColor: '#8b5cf6',
  fontSize: '28px',
};

const purchaseTitleStyle = {
  color: '#1e40af',
  fontSize: '20px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px 0',
  lineHeight: '1.3',
};

const purchaseTextStyle = {
  color: '#2563eb',
  fontSize: '15px',
  margin: '0',
  lineHeight: '1.5',
};

const purchaseTableStyle = {
  width: '100%',
  borderCollapse: 'collapse' as const,
};

const tableRowStyle = {
  padding: '10px 0',
  borderBottom: '1px solid #f1f5f9',
};

const valueStyle = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '500' as const,
  margin: '0',
  textAlign: 'right' as const,
};

const valueHighlightStyle = {
  color: '#8b5cf6',
  fontSize: '16px',
  fontWeight: 'bold' as const,
  margin: '0',
  textAlign: 'right' as const,
};
