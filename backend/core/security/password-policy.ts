import { Environment, getSecurityProfile } from '../../config/environments';
import { BadRequestError } from '../errors';

export interface PasswordValidationResult {
  valid: boolean;
  score: number; // 0 to 100
  errors: string[];
}

const COMMON_PASSWORDS = new Set([
  '123456',
  'password',
  '12345678',
  'qwerty',
  '123456789',
  '12345',
  '1234',
  '111111',
  '1234567',
  'dragon',
  'admin',
  'nexus123',
  'mudar123',
  'senha123',
  'admin123',
  'empresa123',
]);

export function validatePassword(
  password: string,
  customEnv?: Environment
): PasswordValidationResult {
  const envKey = customEnv || (process.env.NODE_ENV as Environment) || 'development';
  const profile = getSecurityProfile(envKey);
  const policy = profile.passwordPolicy;

  const errors: string[] = [];
  let score = 0;

  if (!password || typeof password !== 'string') {
    return {
      valid: false,
      score: 0,
      errors: ['A senha não pode ser vazia'],
    };
  }

  // Length check
  if (password.length < policy.minLength) {
    errors.push(`A senha deve conter no mínimo ${policy.minLength} caracteres`);
  } else {
    score += 25;
  }

  if (password.length > policy.maxLength) {
    errors.push(`A senha não pode exceder ${policy.maxLength} caracteres`);
  }

  // Uppercase
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra maiúscula (A-Z)');
  } else if (/[A-Z]/.test(password)) {
    score += 20;
  }

  // Lowercase
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('A senha deve conter pelo menos uma letra minúscula (a-z)');
  } else if (/[a-z]/.test(password)) {
    score += 20;
  }

  // Numbers
  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('A senha deve conter pelo menos um número (0-9)');
  } else if (/[0-9]/.test(password)) {
    score += 20;
  }

  // Special Characters
  if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>_+\-=[\]\\/`~]/.test(password)) {
    errors.push('A senha deve conter pelo menos um caractere especial (!@#$%&*...)');
  } else if (/[!@#$%^&*(),.?":{}|<>_+\-=[\]\\/`~]/.test(password)) {
    score += 15;
  }

  // Consecutive repeats check (e.g. "aaaa")
  const repeatRegex = new RegExp(`(.)\\1{${policy.maxConsecutiveRepeats},}`);
  if (repeatRegex.test(password)) {
    errors.push(`A senha não pode conter mais de ${policy.maxConsecutiveRepeats} caracteres idênticos consecutivos`);
  }

  // Disallow common weak passwords
  if (policy.disallowCommonPasswords && COMMON_PASSWORDS.has(password.toLowerCase())) {
    errors.push('A senha informada é comum e insegura. Escolha uma senha mais forte');
    score = Math.min(score, 10);
  }

  return {
    valid: errors.length === 0,
    score: Math.min(100, score),
    errors,
  };
}

export function assertValidPassword(password: string, customEnv?: Environment): void {
  const validation = validatePassword(password, customEnv);
  if (!validation.valid) {
    throw new BadRequestError(`Política de senha violada: ${validation.errors.join('; ')}`, {
      validationErrors: validation.errors,
      score: validation.score,
    });
  }
}
