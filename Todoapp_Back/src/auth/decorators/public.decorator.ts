import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC = 'isPublic';

// Routes are protected by default; this opts one out on purpose
export const Public = () => SetMetadata(IS_PUBLIC, true);
