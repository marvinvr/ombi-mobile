import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RequestParameters, Headers, HttpRequestType } from 'src/models/http';
import { ToastType } from 'src/models/toast';
import { CredentialsService } from './credentials.service';
import { ToastService } from './toast.service';

const API_EXTENSION = '/api/v1';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private http: HttpClient,
    private credentialsService: CredentialsService,
    private toast: ToastService
  ) { }

  public get(path: string, headers: Headers, parameters: RequestParameters): Promise<any> {
    return this.performRequest(
      HttpRequestType.GET,
      path + '?' + Object.keys(parameters).map((p) => [p, parameters[p]].join('=')).join('&'),
      headers)
  }

  public post(path: string, headers: Headers, parameters: RequestParameters): Promise<any> {
    return this.performRequest(HttpRequestType.POST, path, headers, parameters);
  }

  public put(path: string, headers: Headers, parameters: RequestParameters): Promise<any> {
    return this.performRequest(HttpRequestType.PUT, path, headers, parameters);
  }

  public delete(path: string, headers: Headers): Promise<any> {
    return this.performRequest(HttpRequestType.DELETE, path, headers);
  }

  private performRequest(type: HttpRequestType, path: string, headers: Headers, parameters?: RequestParameters): Promise<any> {
    return (parameters ? 
            this.http[type as string](this.credentialsService.baseUrl + API_EXTENSION + path, parameters, {headers: this.formatHeaders(headers)})
            : this.http[type as string](this.credentialsService.baseUrl + API_EXTENSION + path, {headers: this.formatHeaders(headers)}))
            .toPromise()
            .catch((err) => {
              this.toast.show(err.status > 399 ? ToastType.ERROR: ToastType.WARNING, `${err.status} - ${err.statusText}`);
              throw new Error(err);
            });
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
