# Contributing to Role Manager

Thank you for your interest in contributing to the Role Manager microservice!

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/hamidscode/role-manager.git
   cd role-manager
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your local configuration
   ```

4. **Start dependencies with Docker**
   ```bash
   # Start only MongoDB and Redis
   docker-compose up mongodb redis -d
   ```

5. **Run the application**
   ```bash
   npm run start:dev
   ```

## Development Workflow

### Running Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov

# Run E2E tests (requires MongoDB and Redis)
npm run test:e2e
```

### Building

```bash
# Build the application
npm run build

# Run production build
npm run start:prod
```

### Code Quality

```bash
# Format code
npm run format

# Lint code
npm run lint
```

## Project Structure

```
src/
├── common/           # Shared modules (e.g., Redis)
├── permissions/      # Permission module
├── roles/           # Role module
├── app.module.ts    # Root module
└── main.ts          # Entry point
```

## Coding Standards

### TypeScript
- Use TypeScript strict mode
- Prefer interfaces over types for object shapes
- Use async/await over promises
- Always handle errors appropriately

### NestJS
- Follow NestJS module structure
- Use dependency injection
- Keep controllers thin, put logic in services
- Use DTOs for request/response validation

### Testing
- Write unit tests for all services
- Write E2E tests for all API endpoints
- Aim for >80% code coverage
- Use descriptive test names

### Git Commits
- Use conventional commit messages
- Keep commits atomic and focused
- Write descriptive commit messages

## Adding New Features

1. **Create a new branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement your feature**
   - Add tests first (TDD approach recommended)
   - Implement the feature
   - Update documentation

3. **Test your changes**
   ```bash
   npm test
   npm run build
   ```

4. **Submit a pull request**
   - Provide a clear description
   - Reference any related issues
   - Ensure CI passes

## Common Tasks

### Adding a New Permission Field

1. Update the schema: `src/permissions/schemas/permission.schema.ts`
2. Update DTOs: `src/permissions/dto/*.dto.ts`
3. Update service logic if needed
4. Add tests
5. Update documentation

### Adding a New Role Field

1. Update the schema: `src/roles/schemas/role.schema.ts`
2. Update DTOs: `src/roles/dto/*.dto.ts`
3. Update service logic if needed
4. Invalidate cache appropriately
5. Add tests
6. Update documentation

### Modifying Cache Strategy

1. Update `src/common/redis/redis.service.ts`
2. Update cache invalidation in service methods
3. Update TTL values if needed
4. Add tests to verify caching behavior
5. Document changes in README

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `docker-compose up mongodb -d`
- Check connection string in `.env`
- Verify network connectivity

### Redis Connection Issues
- Ensure Redis is running: `docker-compose up redis -d`
- Check Redis host/port in `.env`
- Test Redis connection: `redis-cli ping`

### Test Failures
- Ensure MongoDB and Redis are running for E2E tests
- Clear test database if needed
- Check for port conflicts

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Mongoose Documentation](https://mongoosejs.com/)
- [Redis Node Documentation](https://github.com/redis/node-redis)
- [TypeScript Documentation](https://www.typescriptlang.org/)

## Questions?

If you have questions or need help, please:
1. Check existing documentation
2. Search existing issues
3. Create a new issue with a clear description

Thank you for contributing! 🎉
