import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, HttpException } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(error: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = (error instanceof HttpException) ? error.getStatus(): HttpStatus.INTERNAL_SERVER_ERROR;

    response.status(status).json({
      errors: [error.message],
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
