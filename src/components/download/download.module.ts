import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DownloadService } from './download.service';

@Module({
  imports: [ConfigModule],
  providers: [DownloadService],
  exports: [DownloadService],
})
export class DownloadModule {}
