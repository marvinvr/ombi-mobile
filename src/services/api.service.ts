import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { RequestParameters, Headers, HttpRequestType } from 'src/models/http';
import { ToastType } from 'src/models/toast';
import { CredentialsService } from './credentials.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  constructor(
    private http: HttpClient,
    private credentialsService: CredentialsService,
    private router: Router,
    private toast: ToastService
  ) { }

  public get(
    path: string,
    headers: Headers,
    parameters: RequestParameters,
    customBaseUrl?: string,
    version?: string,
    showError: boolean = true): Promise<any> {
    return this.performRequest(
      HttpRequestType.GET,
      path + '?' + Object.keys(parameters).map((p) => [p, parameters[p]].join('=')).join('&'),
      headers,
      undefined,
      customBaseUrl,
      version,
      showError);
  }

  public post(path: string, headers: Headers, parameters: RequestParameters, customBaseUrl?: string, version?: string): Promise<any> {
    return this.performRequest(HttpRequestType.POST, path, headers, parameters, customBaseUrl, version);
  }

  public put(path: string, headers: Headers, parameters: RequestParameters): Promise<any> {
    return this.performRequest(HttpRequestType.PUT, path, headers, parameters);
  }

  public delete(path: string, headers: Headers): Promise<any> {
    return this.performRequest(HttpRequestType.DELETE, path, headers);
  }

  private performRequest(
    type: HttpRequestType,
    path: string,
    headers: Headers,
    parameters?: RequestParameters,
    customBaseUrl?: string,
    version?: string,
    showError: boolean = true): Promise<any> {
    return (parameters ?
            this.http[type as string]((
              customBaseUrl || (this.credentialsService.baseUrl + this.getApiExtension(version))) + path,
              parameters,
              {headers: this.formatHeaders(headers)})
            : this.http[type as string]((
              customBaseUrl || (this.credentialsService.baseUrl + this.getApiExtension(version))) + path,
              {headers: this.formatHeaders(headers)}))
            .toPromise()
            .catch((err) => {
              if(err.status === 401) {
                this.credentialsService.token = '';
                this.router.navigate(['config']);
                this.toast.show(ToastType.WARNING, 'You have been signed out.');
              } else {
                if(showError) {
                  this.toast.show(err.status >= 400 ? ToastType.ERROR : ToastType.WARNING, `${err.status} - ${err.statusText}`);
                }
              }
              throw new Error(err);
            });
  }

  private getApiExtension(version: string = '2'): string {
    return `/api/v${version}`;
  }

  private formatHeaders(headers: Headers): HttpHeaders {
    const httpHeaders = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${this.credentialsService.token}`,
      ...headers
    });
    return httpHeaders;
  }
}
