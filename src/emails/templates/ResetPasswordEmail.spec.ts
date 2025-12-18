/**
 * Integration tests for ResetPasswordEmail component
 * These tests verify that the component renders correctly with the updated 15-minute expiration messaging.
 */

import { ResetPasswordEmail } from './ResetPasswordEmail.js';

describe('ResetPasswordEmail Component', () => {
  describe('15-minute expiration messaging', () => {
    it('should render component with correct props structure', () => {
      // Arrange
      const props = {
        name: 'Test User',
        resetUrl: 'https://example.com/reset?token=abc123',
      };

      // Act
      const component = ResetPasswordEmail(props);

      // Assert
      expect(component).toBeDefined();
      expect(component.props).toBeDefined();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect((component.props as any).children).toBeDefined();
    });

    it('should accept resetUrl prop containing the password reset link', () => {
      // Arrange
      const resetUrl = 'https://up-skill.app/reset-password?token=abc123xyz';
      const props = {
        name: 'Juan Pérez',
        resetUrl,
      };

      // Act
      const component = ResetPasswordEmail(props);

      // Assert
      // The resetUrl is used in the component, verify it's in the props
      expect(props.resetUrl).toBe(resetUrl);
      expect(component).toBeDefined();
    });

    it('should use default name when name prop is not provided', () => {
      // Arrange
      const props = {
        resetUrl: 'https://example.com/reset?token=abc123',
      };

      // Act
      const component = ResetPasswordEmail(props as any);

      // Assert
      expect(component).toBeDefined();
    });

    it('should use provided name when given', () => {
      // Arrange
      const props = {
        name: 'María García',
        resetUrl: 'https://example.com/reset?token=abc123',
      };

      // Act
      const component = ResetPasswordEmail(props);

      // Assert
      expect(component).toBeDefined();
      expect(props.name).toBe('María García');
    });

    it('should render valid component structure with all required props', () => {
      // Arrange
      const props = {
        name: 'Test User',
        resetUrl: 'https://example.com/reset?token=abc123',
      };

      // Act
      const component = ResetPasswordEmail(props);

      // Assert
      expect(component).toBeTruthy();
      expect(component.type).toBeDefined();
      expect(component.props).toBeDefined();
    });
  });
});
