import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { RolesService } from './roles.service';
import { Role } from './schemas/role.schema';
import { RedisService } from '../common/redis/redis.service';
import { PermissionsService } from '../permissions/permissions.service';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';

describe('RolesService', () => {
  let service: RolesService;
  let mockRoleModel: any;
  let mockRedisService: any;
  let mockPermissionsService: any;

  beforeEach(async () => {
    mockRoleModel = {
      create: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      prototype: {
        save: jest.fn(),
      },
    };

    mockRedisService = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      delPattern: jest.fn(),
    };

    mockPermissionsService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesService,
        {
          provide: getModelToken(Role.name),
          useValue: mockRoleModel,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: PermissionsService,
          useValue: mockPermissionsService,
        },
      ],
    }).compile();

    service = module.get<RolesService>(RolesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of roles', async () => {
      const mockRoles = [
        { name: 'admin', permissions: [] },
        { name: 'user', permissions: [] },
      ];
      
      mockRoleModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockRoles),
        }),
      });

      const result = await service.findAll();
      expect(result).toEqual(mockRoles);
      expect(mockRoleModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a role by id', async () => {
      const mockRole = { _id: '123', name: 'admin', permissions: [] };
      
      mockRoleModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockRole),
        }),
      });

      const result = await service.findOne('123');
      expect(result).toEqual(mockRole);
    });

    it('should throw NotFoundException when role not found', async () => {
      mockRoleModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(null),
        }),
      });

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('resolvePermissions', () => {
    it('should return cached permissions if available', async () => {
      const cachedPermissions = ['perm1', 'perm2'];
      mockRedisService.get.mockResolvedValue(JSON.stringify(cachedPermissions));

      const result = await service.resolvePermissions(['admin']);
      expect(result.permissions).toEqual(cachedPermissions);
      expect(mockRedisService.get).toHaveBeenCalled();
    });

    it('should fetch and cache permissions if not cached', async () => {
      mockRedisService.get.mockResolvedValue(null);
      
      const mockRoles = [
        {
          name: 'admin',
          permissions: [
            { slug: 'users.read' },
            { slug: 'users.write' },
          ],
        },
      ];
      
      mockRoleModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockRoles),
        }),
      });

      const result = await service.resolvePermissions(['admin']);
      expect(result.permissions).toEqual(['users.read', 'users.write']);
      expect(mockRedisService.set).toHaveBeenCalled();
    });

    it('should return unique permissions from multiple roles', async () => {
      mockRedisService.get.mockResolvedValue(null);
      
      const mockRoles = [
        {
          name: 'admin',
          permissions: [
            { slug: 'users.read' },
            { slug: 'users.write' },
          ],
        },
        {
          name: 'editor',
          permissions: [
            { slug: 'users.read' },
            { slug: 'posts.write' },
          ],
        },
      ];
      
      mockRoleModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockRoles),
        }),
      });

      const result = await service.resolvePermissions(['admin', 'editor']);
      expect(result.permissions).toHaveLength(3);
      expect(result.permissions).toContain('users.read');
      expect(result.permissions).toContain('users.write');
      expect(result.permissions).toContain('posts.write');
    });

    it('should throw NotFoundException when no roles found', async () => {
      mockRedisService.get.mockResolvedValue(null);
      mockRoleModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      });

      await expect(service.resolvePermissions(['nonexistent'])).rejects.toThrow(NotFoundException);
    });
  });
});
