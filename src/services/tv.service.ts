import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TvSearchType } from 'src/models/tv';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class TvService {

  constructor(
    private api: ApiService
  ) { }

  list(type: TvSearchType): Observable<Object> {
    return this.api.getRequest(`/search/Tv/${type}`, {}, {});
  }

  search(term: string): Observable<Object> {
    return this.api.getRequest(`/search/Tv/${term}`, {}, {});
  }

  getImage(id: string): Observable<Object> {
    return this.api.getRequest(`/Images/tv/${id}`, {}, {});
  }

  getInfo(id: string): Observable<Object> {
    return this.api.getRequest(`/search/Tv/info/${id}`, {}, {});
  }
}
