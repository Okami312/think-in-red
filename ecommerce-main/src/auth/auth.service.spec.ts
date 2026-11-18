import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { AdminEntity } from '../admins/admin.entity/admin.entity';

describe('AuthService', () => {
  let service: AuthService;
  const repo = { findOne: jest.fn() };
  const jwt = { sign: jest.fn().mockReturnValue('token') };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getRepositoryToken(AdminEntity), useValue: repo },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();
    service = module.get(AuthService);
    repo.findOne.mockResolvedValue({
      id: 1,
      email: 'admin@example.com',
      name: 'Admin',
      password: await bcrypt.hash('admin123', 4),
    });
  });

  it('logs in with the correct password against the bcrypt hash', async () => {
    const result = await service.login('admin@example.com', 'admin123');
    expect(result.access_token).toBe('token');
    expect(result.admin).not.toHaveProperty('password');
  });

  it('rejects a wrong password', async () => {
    await expect(service.login('admin@example.com', 'nope')).rejects.toThrow(
      UnauthorizedException,
    );
  });
});
