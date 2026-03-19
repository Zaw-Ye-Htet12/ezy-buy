import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal Server Error';

    // Log complete error details for internal debugging
    this.logger.error(
      `${request.method} ${request.url}`,
      exception instanceof Error ? exception.stack : 'Unknown error stack',
      'AllExceptionsFilter',
    );

    // Prepare standardized error response structure
    const errorResponse = {
      success: false,
      message: typeof message === 'string' ? message : (message as any).message || 'An error occurred',
      error: {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        details: typeof message === 'object' ? (message as any).error : null,
        validation: typeof message === 'object' ? (message as any).message : null,
      },
    };

    response.status(status).json(errorResponse);
  }
}
