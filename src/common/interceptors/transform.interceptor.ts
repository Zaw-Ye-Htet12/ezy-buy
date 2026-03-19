import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ZOD_SERIALIZER_KEY } from '../decorators/zod-serializer.decorator';

export interface Response<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>> {
  constructor(private reflector: Reflector) { }

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const schema = this.reflector.get(ZOD_SERIALIZER_KEY, context.getHandler());

    return next.handle().pipe(
      map((data) => {
        // If a Zod schema is provided via @ZodSerializer, use it to strip unwanted fields
        let processedData = data;
        if (schema && data && typeof data === 'object') {
          // We use safeParse to avoid throwing errors in the interceptor at this stage,
          // but you could also use .parse() if you want strict outgoing validation.
          const result = schema.safeParse(data);
          if (result.success) {
            processedData = result.data;
          }
        }

        const message = processedData?.message || 'Operation successful';

        // Handle common message-inclusive patterns
        let finalData = processedData;
        if (processedData && typeof processedData === 'object' && 'message' in processedData) {
          const { message: _, ...rest } = processedData;
          finalData = Object.keys(rest).length > 0 ? rest : null;
        }

        return {
          success: true,
          message,
          data: finalData,
        };
      }),
    );
  }
}
