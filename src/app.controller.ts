import { Body, Controller, Get, Logger, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { CurrentWeatherRepository } from './app.weather.repository';
import { getMessaging } from 'firebase-admin/messaging';
import { SubscriberRepository } from './app.subscriber.repository';

class SubscribeDto {
  token: string;
}

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly weatherRepository: CurrentWeatherRepository,
    private readonly subscriberRepository: SubscriberRepository,
  ) {}

  private readonly logger = new Logger(AppController.name);

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('/subscribe')
  newSubscriber(@Body() subscribeDto: SubscribeDto) {
    this.subscriberRepository.addToken(subscribeDto.token);
    return { result: 'success' };
  }

  @Post('/message')
  async pushMessage(): Promise<any> {
    const weatherInfo = await this.weatherRepository.getCurrentWeather(59, 126);

    const messageString = `현재 날씨
- 기온: ${weatherInfo.temperature}℃
- 습도: ${weatherInfo.humidity}%
- 풍속: ${weatherInfo.windSpeed}m/s
`;

    const subscribeTokens = this.subscriberRepository.getTokens();
    this.logger.debug('target tokens: ', subscribeTokens);

    const message = {
      data: {
        message: messageString,
      },
      notification: {
        title: '현재 날씨',
        body: messageString,
      },
      webpush: {
        fcm_options: {
          link: 'https://google.com',
        },
      },
      tokens: subscribeTokens,
    };

    try {
      const response = await getMessaging().sendEachForMulticast(
        message as any,
      );
      this.logger.log('Successfully sent message:', response);
      return { result: 'success' };
    } catch (error) {
      this.logger.error('Error sending message:', error);
      return { result: 'failed' };
    }
  }
}
