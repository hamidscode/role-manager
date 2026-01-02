# API Usage Examples

This document provides curl examples for all API endpoints.

## Permissions API

### Create a Permission

```bash
curl -X POST http://localhost:3000/permissions \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "users.read",
    "meta": {
      "description": "Read user information",
      "category": "users"
    }
  }'
```

### Get All Permissions

```bash
curl -X GET http://localhost:3000/permissions
```

### Get Permission by ID

```bash
curl -X GET http://localhost:3000/permissions/{permission_id}
```

### Update a Permission

```bash
curl -X PATCH http://localhost:3000/permissions/{permission_id} \
  -H "Content-Type: application/json" \
  -d '{
    "meta": {
      "description": "Updated description"
    }
  }'
```

### Delete a Permission

```bash
curl -X DELETE http://localhost:3000/permissions/{permission_id}
```

## Roles API

### Create a Role

```bash
curl -X POST http://localhost:3000/roles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "admin",
    "permissions": ["permission_id_1", "permission_id_2"]
  }'
```

### Get All Roles

```bash
curl -X GET http://localhost:3000/roles
```

### Get Role by ID

```bash
curl -X GET http://localhost:3000/roles/{role_id}
```

### Update a Role

```bash
curl -X PATCH http://localhost:3000/roles/{role_id} \
  -H "Content-Type: application/json" \
  -d '{
    "name": "super-admin",
    "permissions": ["permission_id_1"]
  }'
```

### Delete a Role

```bash
curl -X DELETE http://localhost:3000/roles/{role_id}
```

### Resolve Permissions (High-Performance Endpoint)

This endpoint resolves the union of all permissions for the given role names.

```bash
curl -X POST http://localhost:3000/roles/resolve-permissions \
  -H "Content-Type: application/json" \
  -d '{
    "roleNames": ["admin", "editor", "viewer"]
  }'
```

**Response Example:**
```json
{
  "permissions": [
    "users.read",
    "users.write",
    "posts.read",
    "posts.write",
    "comments.read",
    "comments.write"
  ]
}
```

## Complete Workflow Example

Here's a complete workflow from creating permissions to resolving them:

```bash
# 1. Create permissions
PERM1=$(curl -s -X POST http://localhost:3000/permissions \
  -H "Content-Type: application/json" \
  -d '{"slug": "users.read", "meta": {"description": "Read users"}}' | jq -r '._id')

PERM2=$(curl -s -X POST http://localhost:3000/permissions \
  -H "Content-Type: application/json" \
  -d '{"slug": "users.write", "meta": {"description": "Write users"}}' | jq -r '._id')

PERM3=$(curl -s -X POST http://localhost:3000/permissions \
  -H "Content-Type: application/json" \
  -d '{"slug": "posts.read", "meta": {"description": "Read posts"}}' | jq -r '._id')

PERM4=$(curl -s -X POST http://localhost:3000/permissions \
  -H "Content-Type: application/json" \
  -d '{"slug": "posts.write", "meta": {"description": "Write posts"}}' | jq -r '._id')

# 2. Create roles with permissions
curl -X POST http://localhost:3000/roles \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"admin\", \"permissions\": [\"$PERM1\", \"$PERM2\", \"$PERM3\", \"$PERM4\"]}"

curl -X POST http://localhost:3000/roles \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"editor\", \"permissions\": [\"$PERM1\", \"$PERM3\", \"$PERM4\"]}"

curl -X POST http://localhost:3000/roles \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"viewer\", \"permissions\": [\"$PERM1\", \"$PERM3\"]}"

# 3. Resolve permissions for multiple roles
curl -X POST http://localhost:3000/roles/resolve-permissions \
  -H "Content-Type: application/json" \
  -d '{"roleNames": ["admin", "editor"]}'

# 4. Test caching - this should be faster (from cache)
curl -X POST http://localhost:3000/roles/resolve-permissions \
  -H "Content-Type: application/json" \
  -d '{"roleNames": ["admin", "editor"]}'
```

## Performance Testing

To test the performance of the resolve-permissions endpoint:

```bash
# Install Apache Bench (if not already installed)
# sudo apt-get install apache2-utils

# Test with 1000 requests, 10 concurrent
ab -n 1000 -c 10 -p payload.json -T application/json \
  http://localhost:3000/roles/resolve-permissions
```

Create `payload.json`:
```json
{
  "roleNames": ["admin", "editor", "viewer"]
}
```

## Cache Testing

To verify cache invalidation:

```bash
# 1. Resolve permissions (creates cache)
curl -X POST http://localhost:3000/roles/resolve-permissions \
  -H "Content-Type: application/json" \
  -d '{"roleNames": ["admin"]}'

# 2. Update a role (invalidates cache)
curl -X PATCH http://localhost:3000/roles/{role_id} \
  -H "Content-Type: application/json" \
  -d '{"permissions": ["new_permission_id"]}'

# 3. Resolve again (fetches from DB and creates new cache)
curl -X POST http://localhost:3000/roles/resolve-permissions \
  -H "Content-Type: application/json" \
  -d '{"roleNames": ["admin"]}'
```
