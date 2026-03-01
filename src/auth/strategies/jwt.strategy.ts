import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'soegih-jwt-secret-key';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: JwtStrategy.extractJwt(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: any) {
    return {
      id: payload.sub,
      username: payload.username,
    };
  }

  private static extractJwt() {
    return (req: Request) => {
      // Try to extract from Authorization header first (Bearer token)
      const bearerToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
      if (bearerToken) {
        return bearerToken;
      }

      // Fall back to extracting from cookies (access_token)
      if (req.cookies && req.cookies.access_token) {
        return req.cookies.access_token;
      }

      return null;
    };
  }
}
