import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { RequestActionType } from 'src/models/requests';
import { Settings } from 'src/models/settings';
import { ApiService } from './api.service';
import { CredentialsService } from './credentials.service';
import { SettingsService } from './settings.service';
import { hasProtocol } from 'src/utils/credentials.utils';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private apiService: ApiService,
    private credentials: CredentialsService,
    private settings: SettingsService,
    private router: Router
  ) {
    this.updateAuthConfig();
  }

  public fetchToken(): Promise<any> {
    if(!this.credentials.username
      || !this.credentials.password
      || !this.credentials.baseUrl) {
        return new Promise<any>((resolve, reject) => reject(false));
      }
    return this.apiService.post(
      '/token',
      {},
      {
        username: this.credentials.username,
        password: this.credentials.password,
        rememberMe: true,
        usePlexOAuth: false,
      },
      null,
      '1'
    ).then(t => this.credentials.token = t?.access_token)
    .then(() => {
      if(this.settings.get(Settings.IS_SIGNED_IN)) {
        this.router.navigate(['search']);
      } else {
        this.router.navigate(['config']);
      }
      this.settings.set(Settings.USE_PLEX_OAUTH, false);
    });
  }

  public updateAuthConfig(): void {
    const originalBaseUrl = this.credentials.baseUrl;

    if (!hasProtocol(originalBaseUrl)) {
      this.credentials.baseUrl = `https://${originalBaseUrl}`;
      this.apiService.get(
        '/Settings/Authentication',
        {},
        {},
        undefined,
        '1',
        false
      )
        .then(res => {
          this.settings.set(Settings.URL_IS_VALID, true);
          this.settings.set(Settings.URL_HAS_OAUTH, res?.enableOAuth);
        })
        .catch(() => {
          this.credentials.baseUrl = `http://${originalBaseUrl}`;
          this.apiService.get(
            '/Settings/Authentication',
            {},
            {},
            undefined,
            '1',
            false
          )
            .then(res => {
              this.settings.set(Settings.URL_IS_VALID, true);
              this.settings.set(Settings.URL_HAS_OAUTH, res?.enableOAuth);
            })
            .catch(() => {
              this.settings.set(Settings.URL_IS_VALID, false);
              this.credentials.baseUrl = originalBaseUrl;
            });
        });
    } else {
      this.apiService.get(
        '/Settings/Authentication',
        {},
        {},
        undefined,
        '1',
        false
      )
        .then(res => {
          this.settings.set(Settings.URL_IS_VALID, true);
          this.settings.set(Settings.URL_HAS_OAUTH, res?.enableOAuth);
        })
        .catch(() => {
          this.settings.set(Settings.URL_IS_VALID, false);
        });
    }
  }

  public triggerPlexOauth(): Promise<any> {
    if(!this.credentials.baseUrl) {
      return new Promise<any>((resolve, reject) => reject(false));
    }
    const windowReference = window.open();
    return new Promise<any>((resolve, reject) => {
      this.apiService.post(
        '/api/v2/pins?strong=true',
        {
          'X-Plex-Client-Identifier': '97bcef7bfeea499984dd16220453a3bf',
          'X-Plex-Device': 'Ombi (Web)',
          'X-Plex-Platform': 'Web',
          'X-Plex-Product': 'Ombi',
          'X-Plex-Version': '3'
        },
        {},
        'https://plex.tv')
        .then( pinResponse => {
          this.apiService.post(
            '/token',
            {},
            {
              username: '',
              password: '',
              rememberMe: true,
              usePlexOauth: true,
              plexTvPin: pinResponse
            },
            null,
            '1'
          ).then(tokenResponse => {
            windowReference.location = tokenResponse.url;
            let numAttempts = 0;
            const interval = setInterval(() => {
              if(numAttempts > 100) {
                clearInterval(interval);
                reject({errorMessage: 'Sign in with Plex timed out'});
              }
              this.apiService.get(
                `/token/${tokenResponse.pinId}`,
                {},
                {},
                null,
                '1',
              )
                .then(accessTokenResponse => {
                  if(accessTokenResponse.access_token) {
                    this.credentials.token = accessTokenResponse.access_token;
                    clearInterval(interval);
                    resolve(true);
                    windowReference.close();
                    if(this.settings.get(Settings.IS_SIGNED_IN)) {
                      this.router.navigate(['search']);
                    } else {
                      this.router.navigate(['config']);
                    }
                    this.settings.set(Settings.USE_PLEX_OAUTH, true);
                  }
                });
              numAttempts++;
            }, 1000);
          }).catch( err => reject(err));
        }).catch( err => reject(err));
    });
  }
}
