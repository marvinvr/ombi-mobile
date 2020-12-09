import { Injectable } from '@angular/core';
import { TvSearchType } from 'src/models/tv';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class TvService {

  constructor(
    private api: ApiService
  ) { }

  list(type: TvSearchType): Promise<any> {
    return this.api.getRequest(`/search/Tv/${type}`, {}, {});
  }

  search(term: string): Promise<any> {
    return this.api.getRequest(`/search/Tv/${term}`, {}, {});
  }

  getImage(id: string): Promise<any> {
    return this.api.getRequest(`/Images/tv/${id}`, {}, {});
  }

  getInfo(id: string): Promise<any> {
    return this.api.getRequest(`/search/Tv/info/${id}`, {}, {});
  }
}
