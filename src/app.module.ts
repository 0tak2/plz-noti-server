import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { CurrentWeatherRepository } from './app.weather.repository';
import { SubscriberRepository } from './app.subscriber.repository';

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [AppController],
  providers: [AppService, CurrentWeatherRepository, SubscriberRepository],
})
export class AppModule {}
