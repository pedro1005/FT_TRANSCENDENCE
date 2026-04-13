import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FortyTwoApiService {
  private accessToken: string | null = null;
  private tokenExpiresAt: number = 0;

  constructor(private configService: ConfigService) {}

  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.accessToken && now < this.tokenExpiresAt) {
      return this.accessToken;
    }

    const clientId = this.configService.get<string>('FT_CLIENT_ID');
    const clientSecret = this.configService.get<string>('FT_CLIENT_SECRET');

    const response = await fetch('https://api.intra.42.fr/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId || '',
        client_secret: clientSecret || '',
      }),
    });

    if (!response.ok) {
      throw new InternalServerErrorException('Failed to fetch 42 API token');
    }

    const data = await response.json() as { access_token: string; expires_in: number };
    this.accessToken = data.access_token;
    this.tokenExpiresAt = now + data.expires_in * 1000 - 60000; // 1 minute buffer

    return this.accessToken;
  }

  async getUserInfo(login: string): Promise<any> {
    const token = await this.getAccessToken();
    const response = await fetch(`https://api.intra.42.fr/v2/users/${login}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new InternalServerErrorException('Failed to fetch user info from 42 API');
    }

    return response.json();
  }
}
