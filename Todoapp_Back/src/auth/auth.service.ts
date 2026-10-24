import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import argon2 from 'argon2';
import type { Response } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import { IsNull, LessThan, QueryFailedError, Repository } from 'typeorm';
import { CredentialsDto } from './dto/credentials.dto.js';
import { RefreshToken } from './refresh-token.entity.js';
import { User } from './user.entity.js';

const REFRESH_COOKIE = 'refresh_token';
const REFRESH_TTL_MS = 7 * 24 * 3600 * 1000; // 7 days
// Two tabs reloading at once send the same cookie; the second one inside this
// window is a normal race, not a stolen token
const REUSE_GRACE_MS = 10_000;

// Unknown emails are checked against this, so they take as long as real ones
// and response time does not reveal which emails have accounts
const dummyHash = argon2.hash('not-a-real-password');

// The cookie is only sent to /api/auth, and JavaScript can never read it
export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // localhost is plain http
  sameSite: 'lax',
  path: '/api/auth',
} as const;

// Refresh tokens are 32 random bytes, so a fast sha256 is enough (no guessing)
const hashToken = (token: string) =>
  createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    private readonly jwt: JwtService,
  ) {}

  async signup(dto: CredentialsDto) {
    const email = dto.email.toLowerCase();
    if (await this.users.existsBy({ email })) {
      throw new ConflictException('Email taken');
    }
    const passwordHash = await argon2.hash(dto.password);
    try {
      const user = await this.users.save({ email, passwordHash });
      // Return less: never send the password hash back
      return { id: user.id, email: user.email };
    } catch (err) {
      // Two signups racing past the check above: the unique index catches it
      if (
        err instanceof QueryFailedError &&
        err.driverError?.code === '23505'
      ) {
        throw new ConflictException('Email taken');
      }
      throw err;
    }
  }

  async login(dto: CredentialsDto) {
    const user = await this.users.findOne({
      where: { email: dto.email.toLowerCase() },
      select: { id: true, passwordHash: true },
    });
    const ok =
      (await argon2.verify(
        user?.passwordHash ?? (await dummyHash),
        dto.password,
      )) && user;
    // Same message for a wrong email and a wrong password
    if (!ok) throw new UnauthorizedException('Invalid credentials');
    return user.id;
  }

  // Short access token in the body; long refresh token in an HttpOnly cookie
  async issueTokens(userId: number, res: Response) {
    // Drop this user's dead rows so the table does not grow forever
    await this.refreshTokens.delete({
      userId,
      expiresAt: LessThan(new Date()),
    });
    const refresh = randomBytes(32).toString('base64url');
    await this.refreshTokens.save({
      userId,
      tokenHash: hashToken(refresh),
      expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
    });
    res.cookie(REFRESH_COOKIE, refresh, {
      ...refreshCookieOptions,
      maxAge: REFRESH_TTL_MS,
    });
    return { accessToken: await this.jwt.signAsync({ sub: userId }) };
  }

  // Rotation: each refresh token works once. Seeing a used one again (after the
  // grace window) means it was copied, so every session of that user ends.
  async useRefresh(token: string | undefined): Promise<number> {
    const row = await this.findRefresh(token);
    if (!row || row.expiresAt < new Date()) {
      throw new UnauthorizedException('Please log in again');
    }
    if (row.revokedAt) {
      if (Date.now() - row.revokedAt.getTime() < REUSE_GRACE_MS) {
        return row.userId;
      }
      await this.revokeAll(row.userId);
      throw new UnauthorizedException('Please log in again');
    }
    // Conditional update: if a parallel request just used it, that is the race above
    await this.refreshTokens.update(
      { id: row.id, revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
    return row.userId;
  }

  // Logout works from the cookie alone, so an expired access token cannot block it
  async logout(token: string | undefined) {
    const row = await this.findRefresh(token);
    if (row) await this.revokeAll(row.userId);
  }

  // Rows are deleted, not marked, so no grace window can bring them back
  async revokeAll(userId: number) {
    await this.refreshTokens.delete({ userId });
  }

  private findRefresh(token: string | undefined) {
    return token
      ? this.refreshTokens.findOneBy({ tokenHash: hashToken(token) })
      : Promise.resolve(null);
  }

  readRefreshCookie(cookies: Record<string, string | undefined>) {
    return cookies[REFRESH_COOKIE];
  }

  clearRefreshCookie(res: Response) {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
  }

  me(id: number) {
    return this.users.findOneByOrFail({ id });
  }
}
