import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  constructor() { }

  public get token() {
    return environment.apiKey;
  }
}
