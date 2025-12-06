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

interface NewAssessmentEmailProps {
  name?: string;
  courseName: string;
  assessmentTitle: string;
  availableFrom?: Date;
  availableUntil?: Date;
  assessmentUrl: string;
}

/**
 * React component for the new assessment notification email.
 * Fully responsive design with mobile-first approach.
 */
export const NewAssessmentEmail = ({
  name = 'Usuario',
  courseName,
  assessmentTitle,
  availableFrom,
  availableUntil,
  assessmentUrl,
}: NewAssessmentEmailProps): React.ReactElement => {
  const formatDate = (date: Date | undefined) => {
    if (!date) return null;
    return new Intl.DateTimeFormat('es-AR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(date));
  };

  // Calcular días restantes
  const daysRemaining = availableUntil 
    ? Math.ceil((new Date(availableUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <Html>
      <Head />
      <Preview>Nueva evaluación disponible: {assessmentTitle}</Preview>
      <Body style={styles.base.main}>
        <Container style={styles.base.container}>
          {/* Header con gradiente info */}
          <Section style={styles.headers.info}>
            <Text style={styles.headerElements.emoji}>📝</Text>
            <Heading style={styles.headerElements.title}>UpSkill</Heading>
          </Section>

          {/* Contenido principal */}
          <Section style={styles.content.section}>
            <Heading style={styles.content.h1}>Nueva Evaluación Disponible</Heading>
            
            <Text style={styles.content.greeting}>Hola {name},</Text>
            
            <Text style={styles.content.paragraph}>
              ¡Hay una nueva evaluación disponible en tu curso <Text style={styles.content.strong}>{courseName}</Text>!
            </Text>

            {/* Badge de evaluación */}
            <Section style={assessmentBadgeStyle}>
              <div style={assessmentIconStyle}>📋</div>
              <Heading style={assessmentTitleStyle}>{assessmentTitle}</Heading>
              <Text style={assessmentTextStyle}>
                Demuestra tus conocimientos y avanza en el curso.
              </Text>
            </Section>

            {/* Detalles de la evaluación */}
            <Section style={styles.boxes.neutral}>
              <Heading style={styles.boxElements.title}>Detalles de la Evaluación</Heading>
              <table style={detailsTableStyle}>
                <tbody>
                  <tr style={tableRowStyle}>
                    <td><Text style={styles.tableElements.label}>Curso:</Text></td>
                    <td><Text style={valueStyle}>{courseName}</Text></td>
                  </tr>
                  <tr style={tableRowStyle}>
                    <td><Text style={styles.tableElements.label}>Evaluación:</Text></td>
                    <td><Text style={valueStyle}>{assessmentTitle}</Text></td>
                  </tr>
                  {availableFrom && (
                    <tr style={tableRowStyle}>
                      <td><Text style={styles.tableElements.label}>Disponible desde:</Text></td>
                      <td><Text style={valueStyle}>{formatDate(availableFrom)}</Text></td>
                    </tr>
                  )}
                  {availableUntil && (
                    <tr style={tableRowStyle}>
                      <td><Text style={styles.tableElements.label}>Disponible hasta:</Text></td>
                      <td><Text style={dueDateStyle}>{formatDate(availableUntil)}</Text></td>
                    </tr>
                  )}
                </tbody>
              </table>
            </Section>

            {/* Urgencia */}
            {daysRemaining !== null && daysRemaining <= 3 && daysRemaining > 0 && (
              <Section style={styles.boxes.highlight}>
                <Text style={urgencyTextStyle}>
                  ⚠️ <Text style={styles.content.strong}>Atención:</Text> Solo quedan {daysRemaining} {daysRemaining === 1 ? 'día' : 'días'} para completar esta evaluación.
                </Text>
              </Section>
            )}

            <Text style={styles.content.paragraph}>
              No olvides completar la evaluación dentro del período establecido.
              ¡Mucha suerte!
            </Text>

            {/* Próximos pasos */}
            <Section style={styles.boxes.info}>
              <Heading style={styles.boxElements.title}>Cómo Proceder</Heading>
              <table style={styles.table.base}>
                <tbody>
                  <tr>
                    <td style={styles.table.numberCell}>
                      <span style={infoNumberStyle}>1</span>
                    </td>
                    <td style={styles.table.textCell}>
                      <Text style={styles.tableElements.text}>Lee cuidadosamente las instrucciones</Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.table.numberCell}>
                      <span style={infoNumberStyle}>2</span>
                    </td>
                    <td style={styles.table.textCell}>
                      <Text style={styles.tableElements.text}>Responde todas las preguntas</Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.table.numberCell}>
                      <span style={infoNumberStyle}>3</span>
                    </td>
                    <td style={styles.table.textCell}>
                      <Text style={styles.tableElements.text}>Envía antes de la fecha límite</Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Section style={styles.buttons.section}>
              <Button style={styles.buttons.info} href={assessmentUrl}>
                Ver Evaluación
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
};

export default NewAssessmentEmail;

// Estilos customizados para este template
const assessmentBadgeStyle = {
  backgroundColor: '#eff6ff',
  border: '2px solid #93c5fd',
  borderRadius: '12px',
  padding: '24px 16px',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
};

const assessmentIconStyle = {
  ...styles.badgeElements.icon,
  backgroundColor: '#8b5cf6',
  fontSize: '28px',
};

const assessmentTitleStyle = {
  color: '#1e40af',
  fontSize: '20px',
  fontWeight: 'bold' as const,
  margin: '0 0 8px 0',
  lineHeight: '1.3',
};

const assessmentTextStyle = {
  color: '#2563eb',
  fontSize: '15px',
  margin: '0',
  lineHeight: '1.5',
};

const detailsTableStyle = {
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

const dueDateStyle = {
  color: '#f59e0b',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  margin: '0',
  textAlign: 'right' as const,
};

const urgencyTextStyle = {
  color: '#b45309',
  fontSize: '15px',
  lineHeight: '1.6',
  margin: '0',
};

const infoNumberStyle = {
  ...styles.tableElements.number,
  backgroundColor: '#8b5cf6',
};
