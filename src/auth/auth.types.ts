export interface AuthUser {
  id: string;
  username: string;
  created_at: number; // Unix epoch
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface JwtPayload {
  sub: string; // user id
  username: string;
  iat?: number;
  exp?: number;
}
