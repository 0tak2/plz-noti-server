import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface IKmaCurrentWeatherResponse {
  response: {
    header: {
      resultCode: string;
      resultMsg: string;
    };
    body: {
      dataType: string;
      items: {
        item: IKmaCurrentWeatherResponseItem[];
      };
    };
  };
}

interface IKmaCurrentWeatherResponseItem {
  baseDate: string;
  baseTime: string;
  category: string;
  nx: number;
  ny: number;
  obsrValue: string;
}

enum PrecipitaionType {
  NOTHING, // 없음
  RAIN, // 비
  RAIN_OR_SNOW, // 비/눈
  SNOW, // 눈
  MUCH_RAIN, // 빗방울
  MUCH_RAIN_AND_SNOW, // 빗방울눈날림
  MUCH_SNOW, // 눈날림
}

const ordToPrecipitaionType = {
  0: PrecipitaionType.NOTHING,
  1: PrecipitaionType.RAIN,
  2: PrecipitaionType.RAIN_OR_SNOW,
  3: PrecipitaionType.SNOW,
  4: PrecipitaionType.MUCH_RAIN,
  5: PrecipitaionType.MUCH_RAIN_AND_SNOW,
  6: PrecipitaionType.MUCH_SNOW,
};

export interface ICurrentWeather {
  timestamp: Date;
  temperature: number; // T1H
  precipAmountPerHour: number; // RN1
  humidity: number; // REH,
  precipType: PrecipitaionType; // PTY
  windSpeed: number; // WSD
}

@Injectable()
export class CurrentWeatherRepository {
  constructor(private readonly config: ConfigService<{KMA_SERVICE_KEY: string}>) {
    this.SERVICE_KEY = config.get("KMA_SERVICE_KEY");
  }

  private readonly logger = new Logger(CurrentWeatherRepository.name);
  private readonly SERVICE_KEY;
  private readonly KMA_CURRENT_WEATHER_BASEURL =
    'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst';

  private mapKmaResponseToDomain(
    kmaResponse: IKmaCurrentWeatherResponse,
  ): ICurrentWeather {
    const responseItems = kmaResponse.response.body.items.item;

    // timestamp
    const baseDateStr = responseItems[0].baseDate;
    const baseYear = Number(baseDateStr.slice(0, 4));
    const baseMonths = Number(baseDateStr.slice(4, 6)) - 1;
    const baseDay = Number(baseDateStr.slice(6));

    const baseTimeStr = responseItems[0].baseTime;
    const baseHour = Number(baseTimeStr.slice(0, 2));
    const baseMinutes = Number(baseTimeStr.slice(2));

    const baseDatetime = new Date(
      baseYear,
      baseMonths,
      baseDay,
      baseHour,
      baseMinutes,
    );

    // temperature
    const temperatureResponse = responseItems.find((i) => i.category === 'T1H');

    // precipAmountPerHour
    const precipAmountResponse = responseItems.find(
      (i) => i.category === 'RN1',
    );

    // humidity
    const humidityResoonse = responseItems.find((i) => i.category === 'REH');

    // precipType
    const precipTypeResponse = responseItems.find((i) => i.category === 'PTY');

    // windSpeed
    const windSpeedResponse = responseItems.find((i) => i.category === 'WSD');

    return {
      timestamp: baseDatetime,
      temperature: Number(temperatureResponse.obsrValue),
      precipAmountPerHour: Number(precipAmountResponse.obsrValue),
      humidity: Number(humidityResoonse.obsrValue),
      precipType: ordToPrecipitaionType[Number(precipTypeResponse.obsrValue)],
      windSpeed: Number(windSpeedResponse.obsrValue),
    };
  }

  private numberToStr(num: number, length: number) {
    let numberStr = num.toString();
    while (numberStr.length < length) {
      numberStr = '0' + numberStr;
    }

    return numberStr;
  }

  private async requestWeatherInfo(
    nx: number,
    ny: number,
    datetime: Date,
  ): Promise<IKmaCurrentWeatherResponse> {
    const baseTime = this.numberToStr(datetime.getHours(), 2) + '00';
    const baseDate =
      datetime.getFullYear().toString() +
      this.numberToStr(datetime.getMonth() + 1, 2) +
      this.numberToStr(datetime.getDate(), 2);

    const endpoint = `${this.KMA_CURRENT_WEATHER_BASEURL}?serviceKey=${this.SERVICE_KEY}&pageNo=1&numOfRows=1000&dataType=JSON&base_date=${baseDate}&base_time=${baseTime}&nx=${nx}&ny=${ny}`;

    const response = await fetch(endpoint);
    const jsonData: IKmaCurrentWeatherResponse = await response.json();

    return jsonData;
  }

  async getWeatherInfo(
    nx: number,
    ny: number,
    datetime: Date,
  ): Promise<ICurrentWeather> {
    let responseData = await this.requestWeatherInfo(nx, ny, datetime);

    // NO_DATA
    if (responseData.response.header.resultCode === '03') {
      this.logger.debug(
        '기상청 데이터가 없습니다. 1시간 전 날씨로 다시 요청합니다.',
      );
      datetime.setHours(datetime.getHours() - 1);
      responseData = await this.requestWeatherInfo(nx, ny, datetime);
    }

    return this.mapKmaResponseToDomain(responseData);
  }

  getCurrentWeather(nx: number, ny: number): Promise<ICurrentWeather> {
    return this.getWeatherInfo(nx, ny, new Date());
  }
}
