import { SetMetadata } from '@nestjs/common';
import { z } from 'zod';

export const ZOD_SERIALIZER_KEY = 'zod_serializer_schema';

/**
 * Decorator to specify a Zod schema for response serialization.
 * The interceptor will use this schema to parse and strip unwanted fields
 * from the outgoing response data.
 */
export const ZodSerializer = (schema: z.ZodType<any>) =>
  SetMetadata(ZOD_SERIALIZER_KEY, schema);
