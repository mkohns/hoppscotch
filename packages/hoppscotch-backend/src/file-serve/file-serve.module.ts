import { Module } from '@nestjs/common';
import { FileServeController } from './file-serve.controller';

@Module({
  controllers: [FileServeController],
})
export class FileServeModule {}
