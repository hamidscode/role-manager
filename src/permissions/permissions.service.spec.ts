import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PermissionsService } from './permissions.service';
import { Permission } from './schemas/permission.schema';
import { RedisService } from '../common/redis/redis.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('PermissionsService', () => {
  let service: PermissionsService;
  let mockPermissionModel: any;
  let mockRedisService: any;

  beforeEach(async () => {
    mockPermissionModel = {
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

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionsService,
        {
          provide: getModelToken(Permission.name),
          useValue: mockPermissionModel,
        },
        {
          provide: RedisService,
          useValue: mockRedisService,
        },
      ],
    }).compile();

    service = module.get<PermissionsService>(PermissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of permissions', async () => {
      const mockPermissions = [
        { slug: 'test.read', meta: {} },
        { slug: 'test.write', meta: {} },
      ];
      
      mockPermissionModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPermissions),
      });

      const result = await service.findAll();
      expect(result).toEqual(mockPermissions);
      expect(mockPermissionModel.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a permission by id', async () => {
      const mockPermission = { _id: '123', slug: 'test.read', meta: {} };
      
      mockPermissionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPermission),
      });

      const result = await service.findOne('123');
      expect(result).toEqual(mockPermission);
    });

    it('should throw NotFoundException when permission not found', async () => {
      mockPermissionModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('999')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findBySlug', () => {
    it('should return a permission by slug', async () => {
      const mockPermission = { _id: '123', slug: 'test.read', meta: {} };
      
      mockPermissionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPermission),
      });

      const result = await service.findBySlug('test.read');
      expect(result).toEqual(mockPermission);
    });

    it('should throw NotFoundException when permission not found', async () => {
      mockPermissionModel.findOne.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findBySlug('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
