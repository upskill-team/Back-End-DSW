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

interface CourseEnrollmentEmailProps {
  name?: string;
  courseName: string;
  courseImageUrl?: string;
  courseUrl: string;
  enrollmentDate: Date;
  professorName: string;
}

/**
 * React component for the free course enrollment email.
 * Fully responsive design with mobile-first approach.
 */
export const CourseEnrollmentEmail = ({
  name = 'Usuario',
  courseName,
  courseImageUrl,
  courseUrl,
  enrollmentDate,
  professorName,
}: CourseEnrollmentEmailProps): React.ReactElement => {
  const formattedDate = new Intl.DateTimeFormat('es-AR', {
    dateStyle: 'long',
  }).format(new Date(enrollmentDate));

  return (
    <Html>
      <Head />
      <Preview>¡Bienvenido al curso: {courseName}!</Preview>
      <Body style={styles.base.main}>
        <Container style={styles.base.container}>
          {/* Header con gradiente primary */}
          <Section style={styles.headers.primary}>
            <Text style={styles.headerElements.emoji}>🎉</Text>
            <Heading style={styles.headerElements.title}>UpSkill</Heading>
          </Section>

          {/* Contenido principal */}
          <Section style={styles.content.section}>
            <Heading style={styles.content.h1}>¡Inscripción Exitosa!</Heading>
            
            <Text style={styles.content.greeting}>Hola {name},</Text>
            
            <Text style={styles.content.paragraph}>
              ¡Te has inscrito exitosamente en el curso! Estamos emocionados de tenerte
              con nosotros.
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

            {/* Badge de éxito con info del curso */}
            <Section style={styles.badges.success}>
              <div style={enrollIconStyle}>📚</div>
              <Heading style={enrollTitleStyle}>{courseName}</Heading>
              <table style={courseInfoTable}>
                <tbody>
                  <tr style={styles.table.infoRow}>
                    <td><Text style={styles.tableElements.label}>Profesor:</Text></td>
                    <td><Text style={styles.tableElements.value}>{professorName}</Text></td>
                  </tr>
                  <tr style={styles.table.infoRow}>
                    <td><Text style={styles.tableElements.label}>Inscripción:</Text></td>
                    <td><Text style={styles.tableElements.value}>{formattedDate}</Text></td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Text style={styles.content.paragraph}>
              Ya puedes comenzar a explorar el contenido del curso. ¡Mucha suerte en tu
              aprendizaje!
            </Text>

            {/* Próximos pasos */}
            <Section style={styles.boxes.steps}>
              <Heading style={styles.boxElements.title}>Comienza tu Aprendizaje</Heading>
              <table style={styles.table.base}>
                <tbody>
                  <tr>
                    <td style={styles.table.numberCell}>
                      <span style={styles.tableElements.number}>1</span>
                    </td>
                    <td style={styles.table.textCell}>
                      <Text style={styles.tableElements.text}>Explora las unidades del curso</Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.table.numberCell}>
                      <span style={styles.tableElements.number}>2</span>
                    </td>
                    <td style={styles.table.textCell}>
                      <Text style={styles.tableElements.text}>Completa las actividades</Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={styles.table.numberCell}>
                      <span style={styles.tableElements.number}>3</span>
                    </td>
                    <td style={styles.table.textCell}>
                      <Text style={styles.tableElements.text}>Obtén tu certificado</Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            </Section>

            <Section style={styles.buttons.section}>
              <Button style={styles.buttons.success} href={courseUrl}>
                Comenzar el Curso
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

export default CourseEnrollmentEmail;

// Estilos customizados para este template
const enrollIconStyle = {
  ...styles.badgeElements.icon,
  backgroundColor: '#10b981',
  fontSize: '28px',
};

const enrollTitleStyle = {
  color: '#166534',
  fontSize: '20px',
  fontWeight: 'bold' as const,
  margin: '12px 0 16px 0',
  lineHeight: '1.3',
};

const courseInfoTable = {
  width: '100%',
  maxWidth: '400px',
  margin: '0 auto',
  borderCollapse: 'collapse' as const,
};
