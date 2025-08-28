import * as v from 'valibot';

/**
 * Schema to validate the 'forgot password' request payload.
 */
export const ForgotPasswordSchema = v.object({
  mail: v.pipe(v.string(), v.email('Por favor, introduce un correo electrónico válido.')),
});

/**
 * Schema to validate the 'reset password' request payload.
 */
export const ResetPasswordSchema = v.object({
  token: v.pipe(v.string(), v.minLength(1, 'El token es requerido.')),
  password_plaintext: v.pipe(v.string(), v.minLength(8, 'La contraseña debe tener al menos 8 caracteres.')),
});