import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import sharp from 'sharp';

@Injectable()
export class FileUploadService {
  private readonly uploadDir: string;

  constructor(private configService: ConfigService) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists() {
    const profilePicsDir = path.join(this.uploadDir, 'profile-pictures');
    try {
      await fs.mkdir(profilePicsDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory', error);
    }
  }

  async processProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<string> {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${userId}_${timestamp}${ext}`;
    const filePath = path.join(this.uploadDir, 'profile-pictures', filename);

    try {
      // Process image with sharp: resize and square crop
      await sharp(file.buffer)
        .resize(512, 512, {
          fit: 'cover',
          position: 'center',
        })
        .toFile(filePath);

      // Return the public URL path
      return `/uploads/profile-pictures/${filename}`;
    } catch (error) {
      console.error('Image processing failed', error);
      throw new InternalServerErrorException('Failed to process image');
    }
  }

  async deleteOldPicture(oldPath: string) {
    if (!oldPath || !oldPath.startsWith('/uploads/')) return;

    // Convert URL path to filesystem path
    const relativePath = oldPath.replace(/^\/uploads\//, '');
    const fullPath = path.join(this.uploadDir, relativePath);

    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // Ignore errors if file doesn't exist
      if ((error as any).code !== 'ENOENT') {
        console.error(`Failed to delete old picture: ${fullPath}`, error);
      }
    }
  }
}
