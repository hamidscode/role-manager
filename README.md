# Role Management Microservice

A robust **Role Management Microservice** built with **NestJS**, **MongoDB**, and **Redis** for high-performance permission management.

## Features

### Core Functionality

1. **Manage Permissions (CRUD)**
   - Create, Read, Update, Delete permissions
   - Each permission has a unique `slug` and optional `meta` field

2. **Manage Roles (CRUD)**
   - Create, Read, Update, Delete roles
   - Each role has a unique `name` and an array of `permissions`

3. **Resolve Permissions Endpoint**
   - High-performance endpoint to resolve the union of permissions for given role names
   - Returns unique permission slugs across all specified roles
   - Implemented with Redis caching for optimal performance

### Technical Specifications

#### Database Collections

**Permission Collection:**
- `slug` (String, unique, indexed) - Unique identifier for the permission
- `meta` (Object) - Additional metadata for the permission
- `createdAt`, `updatedAt` - Timestamps

**Role Collection:**
- `name` (String, unique, indexed) - Unique name for the role
- `permissions` (Array of ObjectId) - References to Permission documents
- `createdAt`, `updatedAt` - Timestamps

#### Caching Strategy

- **Redis** is used for caching resolved permissions
- Cache keys are generated based on sorted role names
- **Cache TTL**: 5 minutes (300 seconds)
- **Cache Invalidation**: Automatic invalidation when:
  - A permission is created, updated, or deleted
  - A role is created, updated, or deleted
  - Cache invalidation uses pattern matching to clear related entries

## Installation

```bash
npm install
```

## Configuration

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/role-manager
REDIS_HOST=localhost
REDIS_PORT=6379
PORT=3000
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The application will be available at `http://localhost:3000`

## API Endpoints

### Permissions

#### Create Permission
```http
POST /permissions
Content-Type: application/json

{
  "slug": "users.read",
  "meta": {
    "description": "Read user information"
  }
}
```

#### Get All Permissions
```http
GET /permissions
```

#### Get Permission by ID
```http
GET /permissions/:id
```

#### Update Permission
```http
PATCH /permissions/:id
Content-Type: application/json

{
  "slug": "users.write",
  "meta": {
    "description": "Write user information"
  }
}
```

#### Delete Permission
```http
DELETE /permissions/:id
```

### Roles

#### Create Role
```http
POST /roles
Content-Type: application/json

{
  "name": "admin",
  "permissions": ["<permission_id_1>", "<permission_id_2>"]
}
```

#### Get All Roles
```http
GET /roles
```

#### Get Role by ID
```http
GET /roles/:id
```

#### Update Role
```http
PATCH /roles/:id
Content-Type: application/json

{
  "name": "super-admin",
  "permissions": ["<permission_id_1>"]
}
```

#### Delete Role
```http
DELETE /roles/:id
```

#### Resolve Permissions (High-Performance)
```http
POST /roles/resolve-permissions
Content-Type: application/json

{
  "roleNames": ["admin", "editor", "viewer"]
}
```

**Response:**
```json
{
  "permissions": [
    "users.read",
    "users.write",
    "posts.read",
    "posts.write",
    "comments.read"
  ]
}
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Architecture

### Modules

- **AppModule**: Main application module
- **PermissionsModule**: Handles all permission-related operations
- **RolesModule**: Handles all role-related operations
- **RedisModule**: Global module for Redis caching

### Services

- **PermissionsService**: Business logic for permission management
- **RolesService**: Business logic for role management and permission resolution
- **RedisService**: Redis client wrapper for caching operations

### Cache Invalidation Strategy

The microservice implements intelligent cache invalidation:

1. **Permission Changes**: When any permission is modified, all cached role permission resolutions are invalidated
2. **Role Changes**: When a role is modified, its specific cache entry is invalidated
3. **Pattern-based Invalidation**: Uses Redis pattern matching to clear multiple related cache entries efficiently

### Performance Optimizations

1. **Redis Caching**: Frequently accessed permission resolutions are cached
2. **Database Indexing**: Unique indexes on `slug` (Permission) and `name` (Role) for fast lookups
3. **Efficient Query**: Uses MongoDB's populate feature to fetch role permissions in a single query
4. **Union Operation**: Implements Set data structure for O(1) permission deduplication

## Development

```bash
# Format code
npm run format

# Lint code
npm run lint

# Watch mode
npm run start:dev
```

## Project Structure

```
src/
├── common/
│   └── redis/
│       ├── redis.module.ts
│       └── redis.service.ts
├── permissions/
│   ├── dto/
│   │   ├── create-permission.dto.ts
│   │   └── update-permission.dto.ts
│   ├── schemas/
│   │   └── permission.schema.ts
│   ├── permissions.controller.ts
│   ├── permissions.module.ts
│   └── permissions.service.ts
├── roles/
│   ├── dto/
│   │   ├── create-role.dto.ts
│   │   ├── update-role.dto.ts
│   │   └── resolve-permissions.dto.ts
│   ├── schemas/
│   │   └── role.schema.ts
│   ├── roles.controller.ts
│   ├── roles.module.ts
│   └── roles.service.ts
├── app.module.ts
└── main.ts
```

## Technologies Used

- **NestJS** - Progressive Node.js framework
- **MongoDB** - NoSQL database with Mongoose ODM
- **Redis** - In-memory caching
- **TypeScript** - Type-safe development
- **class-validator** - DTO validation
- **class-transformer** - Object transformation

## License

ISC
