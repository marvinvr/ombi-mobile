import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { RequestActionType } from 'src/models/requests';
import { Settings } from 'src/models/settings';
import { ApiService } from './api.service';
import { CredentialsService } from './credentials.service';
import { SettingsService } from './settings.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private apiService: ApiService,
    private credentials: CredentialsService,
    private settings: SettingsService,
    private router: Router
  ) { }

  public fetchToken(): Promise<any> {
    if(!this.credentials.username || !this.credentials.password || !this.credentials.baseUrl) return new Promise<any>((resolve, reject) => reject(false));
    return this.apiService.post(
      '/token',
      {},
      {
        'username': this.credentials.username,
        'password': this.credentials.password,
        'rememberMe': true,
        'usePlexOAuth': false,
      }
    ).then(t => this.credentials.token = t?.access_token)
    .then(() => {
      if(this.settings.get(Settings.IS_SIGNED_IN)) this.router.navigate([RequestActionType.MOVIE])
      else this.router.navigate(['config'])
      this.settings.set(Settings.USE_PLEX_OAUTH, false)
    })
  }

  public triggerPlexOauth(): Promise<any> {
    if(!this.credentials.baseUrl) return new Promise<any>((resolve, reject) => reject(false));
    var windowReference = window.open();
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
        .then( res => {
          this.apiService.post(
            '/token',
            {},
            {
              'username': '',
              'password': '',
              'rememberMe': true,
              'usePlexOauth': true,
              'plexTvPin': res
            }
          ).then(res => {
            windowReference.location = res.url;
            let numAttempts: number = 0;
            let interval = setInterval(() => {
              if(numAttempts > 100) {
                clearInterval(interval);
                reject({errorMessage: 'Sign in with Plex timed out'})
              }
              this.apiService.get(
                `/token/${res.pinId}`,
                {},
                {}
              )
                .then(res => {
                  if(res.access_token) {
                    this.credentials.token = res.access_token
                    clearInterval(interval)
                    resolve(true);
                    if(this.settings.get(Settings.IS_SIGNED_IN)) this.router.navigate([RequestActionType.MOVIE])
                    else this.router.navigate(['config'])
                    this.settings.set(Settings.USE_PLEX_OAUTH, true)
                  } 
                })
              numAttempts++;
            }, 1000)
          }).catch( err => reject(err))
        }).catch( err => reject(err))
    })
  }
}
