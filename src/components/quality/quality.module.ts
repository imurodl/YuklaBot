import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QualityService } from './quality.service';

@Module({
  imports: [ConfigModule],
  providers: [QualityService],
  exports: [QualityService],
})
export class QualityModule {}
