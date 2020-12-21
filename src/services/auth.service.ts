import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { RequestActionType } from 'src/models/requests';
import { ApiService } from './api.service';
import { CredentialsService } from './credentials.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private apiService: ApiService,
    private credentials: CredentialsService,
    private router: Router
  ) { }

  public fetchToken(): Promise<any> {
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
      if(this.credentials.signedIn) this.router.navigate([RequestActionType.MOVIE])
      else this.router.navigate(['config'])
    });
  }
}
