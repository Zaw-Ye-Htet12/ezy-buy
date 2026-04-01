// src/common/utils/file-upload.util.ts
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { readFileSync, existsSync, renameSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';

export const ALLOWED_IMAGE_TYPES = /\.(jpg|jpeg|png|gif|webp)$/i;
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
export const MAX_IMAGES_PER_PRODUCT = 5;

export const imageFileFilter = (req: any, file: any, callback: any) => {
  if (!file.originalname.match(ALLOWED_IMAGE_TYPES)) {
    return callback(
      new BadRequestException(
        'Only image files are allowed (jpg, jpeg, png, gif, webp)',
      ),
      false,
    );
  }
  callback(null, true);
};

export const editFileName = (req: any, file: any, callback: any) => {
  // Always write to unique UUID path first
  // Content-based dedup happens after via hashFileName()
  const { v4: uuidv4 } = require('uuid');
  callback(null, `${uuidv4()}${extname(file.originalname)}`);
};

export function hashFileName(filePath: string): string {
  const content = readFileSync(filePath);
  const hash = createHash('sha256')
    .update(content)
    .digest('hex')
    .slice(0, 16);
  const extension = extname(filePath);
  const hashedName = `${hash}${extension}`;
  const hashedPath = join(dirname(filePath), hashedName);

  if (filePath === hashedPath) return hashedName;

  if (existsSync(hashedPath)) {
    unlinkSync(filePath); // duplicate — remove new file
  } else {
    renameSync(filePath, hashedPath);
  }

  return hashedName;
}