import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RequestParameters, Headers } from 'src/models/http';
import { CredentialsService } from './credentials.service';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private http: HttpClient,
    private credentialsService: CredentialsService,
  ) { }

  public getRequest(path: string, headers: Headers, parameters: RequestParameters): Promise<any> {
    return this.http.get(
      this.credentialsService.baseUrl + path + '?' + Object.keys(parameters).map((p) => [p, parameters[p]].join('=')).join('&'),
      {headers: this.formatHeaders(headers)}
    ).toPromise();
  }

  public postRequest(path: string, headers: Headers, parameters: RequestParameters): Promise<any> {
    return this.http.post(this.credentialsService.baseUrl + path, parameters, {headers: this.formatHeaders(headers)}).toPromise();
  }

  public putRequest(path: string, headers: Headers, parameters: RequestParameters): Promise<any> {
    return this.http.put(this.credentialsService.baseUrl + path, parameters, {headers: this.formatHeaders(headers)}).toPromise();
  }

  public deleteRequest(path: string, headers: Headers): Promise<any> {
    return this.http.delete(this.credentialsService.baseUrl + path, {headers: this.formatHeaders(headers)}).toPromise();
  }

  private formatHeaders(headers: Headers): HttpHeaders {
    let httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${this.credentialsService.token}`
    });
    Object.keys(headers).forEach((key) => httpHeaders.append(key, headers[key]));
    return httpHeaders;
  }
}
