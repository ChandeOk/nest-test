import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';

interface IToken {
  client_id: string;
  client_secret: string;
  grant_type: string;
  refresh_token: string;
  redirect_uri: string;
}

interface ITokenResponse {
  token_type: string;
  expires_in: number;
  access_token: string;
  refresh_token: string;
}

@Injectable()
export class AmocrmService {
  private refreshToken: string;
  private expiresAt: number;
  private accessToken = process.env.ACCESS_TOKEN;
  private baseURL = 'https://chandeok.amocrm.ru';

  constructor(private readonly httpService: HttpService) {
    this.init();
  }

  async init() {
    await this.doRefreshToken();
  }

  async ensureToken() {
    const hour = 3600;
    if (this.expiresAt - Math.round(Date.now() / 1000) < hour)
      await this.doRefreshToken();
  }

  async doRefreshToken() {
    const body: IToken = {
      client_id: process.env.INTEGRATION_ID,
      client_secret: process.env.SECRET_KEY,
      refresh_token: process.env.REFRESH_TOKEN,
      grant_type: 'refresh_token',
      redirect_uri: 'https://test-v0hu.onrender.com/',
    };
    const { data } = await firstValueFrom(
      this.httpService.post<ITokenResponse>(
        `${this.baseURL}/oauth2/access_token`,
        body,
      ),
    );
    this.accessToken = data.access_token;
    this.refreshToken = data.refresh_token;
    this.expiresAt = Math.round(Date.now() / 1000) + data.expires_in;
    return data;
  }

  async getContactByPhone(phone: string) {
    await this.ensureToken();
    if (!this.accessToken) return;
    const url = `${this.baseURL}/api/v4/contacts?query=${phone}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          Authorization: 'Bearer ' + this.accessToken,
        },
      }),
    );

    return data?._embedded?.contacts[0];
  }

  async getContactByEmail(email: string) {
    await this.ensureToken();
    if (!this.accessToken) return;
    const url = `${this.baseURL}/api/v4/contacts?query=${email}`;
    const { data } = await firstValueFrom(
      this.httpService.get(url, {
        headers: {
          Authorization: 'Bearer ' + this.accessToken,
        },
      }),
    );

    return data?._embedded?.contacts[0];
  }

  async createContact(name: string, phone: string, email: string) {
    await this.ensureToken();
    if (!this.accessToken) return;
    const contact = [
      {
        name,
        custom_fields_values: [
          {
            field_code: 'PHONE',
            values: [
              {
                value: phone,
              },
            ],
          },
          {
            field_code: 'EMAIL',
            values: [
              {
                value: email,
              },
            ],
          },
        ],
      },
    ];
    const url = `${this.baseURL}/api/v4/contacts`;
    const { data } = await firstValueFrom(
      this.httpService.post(url, contact, {
        headers: {
          Authorization: 'Bearer ' + this.accessToken,
        },
      }),
    );

    return data._embedded.contacts[0];
  }

  async updateContact(id: number, name: string, phone: string, email: string) {
    await this.ensureToken();
    if (!this.accessToken) return;
    const contact = {
      id,
      name,
      custom_fields_values: [
        {
          field_code: 'PHONE',
          values: [
            {
              value: phone,
            },
          ],
        },
        {
          field_code: 'EMAIL',
          values: [
            {
              value: email,
            },
          ],
        },
      ],
    };
    const url = `${this.baseURL}/api/v4/contacts/${contact.id}`;
    const { data } = await firstValueFrom(
      this.httpService.patch(url, contact, {
        headers: {
          Authorization: 'Bearer ' + this.accessToken,
        },
      }),
    );
    return data;
  }

  async createLead(contactId: number, name: string, price: number) {
    await this.ensureToken();
    if (!this.accessToken) return;

    const lead = [
      {
        name,
        price,
        _embedded: {
          contacts: [
            {
              id: contactId,
            },
          ],
        },
      },
    ];
    const url = `${this.baseURL}/api/v4/leads`;
    const { data } = await firstValueFrom(
      this.httpService.post(url, lead, {
        headers: {
          Authorization: 'Bearer ' + this.accessToken,
        },
      }),
    );

    return data?._embedded?.leads;
  }
}
