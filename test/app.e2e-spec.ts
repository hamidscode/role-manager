import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Role Manager (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Permissions', () => {
    let permissionId: string;
    const testSlug = `test-permission-${Date.now()}`;

    it('/permissions (POST)', () => {
      return request(app.getHttpServer())
        .post('/permissions')
        .send({
          slug: testSlug,
          meta: { description: 'Test permission' },
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.slug).toBe(testSlug);
          permissionId = res.body._id;
        });
    });

    it('/permissions (GET)', () => {
      return request(app.getHttpServer())
        .get('/permissions')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/permissions/:id (GET)', () => {
      return request(app.getHttpServer())
        .get(`/permissions/${permissionId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(permissionId);
          expect(res.body.slug).toBe(testSlug);
        });
    });

    it('/permissions/:id (PATCH)', () => {
      return request(app.getHttpServer())
        .patch(`/permissions/${permissionId}`)
        .send({
          meta: { description: 'Updated test permission' },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.description).toBe('Updated test permission');
        });
    });

    it('/permissions/:id (DELETE)', () => {
      return request(app.getHttpServer())
        .delete(`/permissions/${permissionId}`)
        .expect(200);
    });
  });

  describe('Roles', () => {
    let roleId: string;
    let permissionId1: string;
    let permissionId2: string;
    const testRoleName = `test-role-${Date.now()}`;

    beforeAll(async () => {
      // Create test permissions
      const perm1 = await request(app.getHttpServer())
        .post('/permissions')
        .send({ slug: `perm1-${Date.now()}` });
      permissionId1 = perm1.body._id;

      const perm2 = await request(app.getHttpServer())
        .post('/permissions')
        .send({ slug: `perm2-${Date.now()}` });
      permissionId2 = perm2.body._id;
    });

    it('/roles (POST)', () => {
      return request(app.getHttpServer())
        .post('/roles')
        .send({
          name: testRoleName,
          permissions: [permissionId1, permissionId2],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('_id');
          expect(res.body.name).toBe(testRoleName);
          roleId = res.body._id;
        });
    });

    it('/roles (GET)', () => {
      return request(app.getHttpServer())
        .get('/roles')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('/roles/:id (GET)', () => {
      return request(app.getHttpServer())
        .get(`/roles/${roleId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(roleId);
          expect(res.body.name).toBe(testRoleName);
        });
    });

    it('/roles/resolve-permissions (POST)', () => {
      return request(app.getHttpServer())
        .post('/roles/resolve-permissions')
        .send({
          roleNames: [testRoleName],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('permissions');
          expect(Array.isArray(res.body.permissions)).toBe(true);
          expect(res.body.permissions.length).toBeGreaterThan(0);
        });
    });

    it('/roles/:id (PATCH)', () => {
      return request(app.getHttpServer())
        .patch(`/roles/${roleId}`)
        .send({
          permissions: [permissionId1],
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.permissions.length).toBe(1);
        });
    });

    it('/roles/:id (DELETE)', () => {
      return request(app.getHttpServer())
        .delete(`/roles/${roleId}`)
        .expect(200);
    });
  });
});
