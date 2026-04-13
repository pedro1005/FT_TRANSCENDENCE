// eslint-disable-next-line @typescript-eslint/no-require-imports
const Strategy = require('passport-42');
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FtStrategy extends PassportStrategy(Strategy, '42') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('FT_CLIENT_ID'),
      clientSecret: configService.get<string>('FT_CLIENT_SECRET'),
      callbackURL: configService.get<string>('FT_REDIRECT_URI'),
      scope: ['public'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any) {
    return {
      email: profile.emails?.[0]?.value || `${profile.username}@42.fr`,
      username: profile.username,
      intraId: profile.id,
    };
  }
}
