import { Controller, Get, INestApplication, UseGuards } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CurrentUser } from './decorators/current-user.decorator';
import { Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { JwtStrategy } from './strategies/jwt.strategy';
import type { AuthenticatedUser } from './types/auth.types';
import { UsersService } from '../users/users.service';
import { UserRole } from '../../generated/prisma/enums';

const SECRET = 'integration-access-secret';

@Controller()
class TestController {
  @Get('protected')
  @UseGuards(JwtAuthGuard)
  protectedRoute(@CurrentUser() user: AuthenticatedUser) {
    return user;
  }

  @Get('admin-only')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  adminOnly() {
    return { ok: true };
  }
}

@Controller('class-role')
@UseGuards(JwtAuthGuard, RolesGuard)
class ClassRolesController {
  @Get('admin-only')
  @Roles(UserRole.ADMIN)
  adminOnly() {
    return { ok: true };
  }
}

describe('Protected routes (integration)', () => {
  let app: INestApplication;
  let jwt: JwtService;

  const sign = (role: UserRole, id = 'u1') =>
    jwt.signAsync(
      { sub: id, email: 'user@example.com', role },
      { secret: SECRET, expiresIn: '15m' },
    );

  beforeAll(async () => {
    const users = {
      findById: jest.fn(async (id: string) => ({
        id,
        email: 'user@example.com',
        name: id === 'admin-u1' ? 'Admin User' : 'User',
        role: id === 'admin-u1' ? UserRole.ADMIN : UserRole.AUTHOR,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    };

    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ JWT_SECRET: SECRET })],
        }),
        PassportModule,
        JwtModule.register({}),
      ],
      controllers: [TestController, ClassRolesController],
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: users },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    jwt = moduleRef.get(JwtService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects a request with no token (401)', () => {
    return request(app.getHttpServer()).get('/protected').expect(401);
  });

  it('rejects a request with an invalid token (401)', () => {
    return request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401);
  });

  it('allows a request with a valid token and exposes the current user', async () => {
    const token = await sign(UserRole.AUTHOR);
    const res = await request(app.getHttpServer())
      .get('/protected')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(res.body).toEqual({
      id: 'u1',
      email: 'user@example.com',
      role: UserRole.AUTHOR,
    });
  });

  it('forbids an authenticated non-admin from an admin-only route (403)', async () => {
    const token = await sign(UserRole.AUTHOR);
    return request(app.getHttpServer())
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
  });

  it('allows an admin through the role guard (200)', async () => {
    const token = await sign(UserRole.ADMIN, 'admin-u1');
    return request(app.getHttpServer())
      .get('/admin-only')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
  });

  it('enforces class-level role metadata for admin-only routes', async () => {
    const adminToken = await sign(UserRole.ADMIN, 'admin-u1');
    const authorToken = await sign(UserRole.AUTHOR, 'u1');

    await request(app.getHttpServer())
      .get('/class-role/admin-only')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/class-role/admin-only')
      .set('Authorization', `Bearer ${authorToken}`)
      .expect(403);
  });
});
