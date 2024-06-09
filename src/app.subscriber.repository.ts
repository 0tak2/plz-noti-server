import { Injectable } from '@nestjs/common';

@Injectable()
export class SubscriberRepository {
  private readonly _tokens: Set<string> = new Set();

  getTokens(): string[] {
    return [...this._tokens];
  }

  addToken(token: string) {
    this._tokens.add(token);
  }
}
