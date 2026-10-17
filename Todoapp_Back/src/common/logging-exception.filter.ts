import {
  ArgumentsHost,
  Catch,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import type { Request } from 'express';

// Logs rejected and failed requests, then lets Nest send its normal response.
// Only method, path, IP and status are logged: never request bodies.
@Catch()
export class LoggingExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('Security');

  catch(exception: unknown, host: ArgumentsHost) {
    const req = host.switchToHttp().getRequest<Request>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const line = `${status} ${req.method} ${req.path} from ${req.ip}`;

    if (status >= 500) this.logger.error(line, (exception as Error)?.stack);
    else if (status === 400 || status === 429) this.logger.warn(line);

    super.catch(exception, host);
  }
}
