import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

// Shared by main.ts and the e2e tests so both run the same app
export function setupApp(app: INestApplication) {
  // Every route starts with /api, e.g. GET /api/todos
  app.setGlobalPrefix('api');

  // Standard security headers (nosniff, frameguard, HSTS, ...)
  app.use(helmet());

  // React on :5173 and NestJS on :3000 are different origins
  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  });

  // Validate every request body against its DTO: bad input -> 400
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}
