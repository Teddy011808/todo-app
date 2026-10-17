import { INestApplication, ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';

// Shared by main.ts and the e2e tests so both run the same app
export function setupApp(app: INestApplication) {
  // Every route starts with /api, e.g. GET /api/todos
  app.setGlobalPrefix('api');

  // Standard security headers (nosniff, frameguard, HSTS, ...)
  app.use(helmet());

  // React (Vite) and NestJS run on different ports, so the browser needs CORS.
  // Without CORS_ORIGIN, any localhost port is allowed (Vite may pick 5174, ...).
  app.enableCors({
    origin:
      process.env.CORS_ORIGIN ?? /^http:\/\/(localhost|127\.0\.0\.1):\d+$/,
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
