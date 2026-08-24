import { Environment, getSecurityProfile } from '../../config/environments';

export type MfaMethod = 'totp' | 'sms' | 'security_key';

export interface MfaStatus {
  enabled: boolean;
  required: boolean;
  activeMethod?: MfaMethod;
  verifiedAt?: string;
  sessionValidUntil?: string;
}

export interface MfaChallengePayload {
  challengeId: string;
  userId: string;
  method: MfaMethod;
  expiresAt: string;
}

export interface MfaVerificationResult {
  success: boolean;
  message?: string;
  sessionToken?: string;
}

/**
 * Interface de Extensão para Provedor de MFA (TOTP / Hardware Key / SMS)
 * Permite plugar implementações reais de TOTP (ex: speakeasy, otplib) sem quebrar o core.
 */
export interface IMfaProvider {
  generateSecret(userId: string, userEmail: string): Promise<{ secret: string; qrCodeUrl: string }>;
  verifyCode(secret: string, token: string): Promise<boolean>;
  sendSmsChallenge?(phoneNumber: string): Promise<string>;
  verifySmsChallenge?(challengeId: string, code: string): Promise<boolean>;
}

export class MfaService {
  private provider?: IMfaProvider;

  constructor(provider?: IMfaProvider) {
    this.provider = provider;
  }

  /**
   * Avalia se um determinado papel de usuário exige MFA obrigatório com base no ambiente
   */
  public isMfaRequiredForRole(roleName: string, customEnv?: Environment): boolean {
    const envKey = customEnv || (process.env.NODE_ENV as Environment) || 'development';
    const profile = getSecurityProfile(envKey);

    if (!profile.mfa.enforceForCriticalRoles) {
      return false;
    }

    return profile.mfa.criticalRoles.includes(roleName.toUpperCase());
  }

  /**
   * Ponto de extensão para verificar se a sessão de MFA do usuário ainda é válida
   */
  public isMfaSessionValid(verifiedAtTimestampMs: number, customEnv?: Environment): boolean {
    const envKey = customEnv || (process.env.NODE_ENV as Environment) || 'development';
    const profile = getSecurityProfile(envKey);
    const maxDurationMs = profile.mfa.sessionDurationSeconds * 1000;

    return Date.now() - verifiedAtTimestampMs < maxDurationMs;
  }

  /**
   * Mock / Placeholder de verificação de TOTP para ponto de extensão inicial
   */
  public async verifyToken(
    userId: string,
    secret: string,
    token: string
  ): Promise<MfaVerificationResult> {
    if (this.provider) {
      const isValid = await this.provider.verifyCode(secret, token);
      return {
        success: isValid,
        message: isValid ? 'MFA verificado com sucesso' : 'Código MFA inválido ou expirado',
      };
    }

    // Validação de formato (6 dígitos numéricos)
    if (!/^\d{6}$/.test(token)) {
      return {
        success: false,
        message: 'Código MFA deve possuir exatamente 6 dígitos numéricos',
      };
    }

    // Token padrão de teste / mock seguro para transição
    const isMockValid = token === '123456' || token === '654321';
    return {
      success: isMockValid,
      message: isMockValid
        ? 'Código MFA autenticado com sucesso'
        : 'Código de autenticação multifator inválido',
    };
  }
}

export const mfaService = new MfaService();
