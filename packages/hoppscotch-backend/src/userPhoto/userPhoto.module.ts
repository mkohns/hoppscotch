import { Module } from '@nestjs/common';
import { UserPhotoController } from './userPhoto.controller';

@Module({
  controllers: [UserPhotoController],
})
export class UserPhotoModule {}
