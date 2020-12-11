import { Injectable } from '@angular/core';
import { TvShow } from 'src/models/content';
import { TvSearchType } from 'src/models/tv';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class TvService {

  constructor(
    private api: ApiService
  ) { }

  list(type: TvSearchType = TvSearchType.POPULAR): Promise<Array<TvShow>> {
    return this.api.get(`/search/Tv/${type}`, {}, {}).then(this.format);
  }

  search(term: string): Promise<Array<TvShow>> {
    return this.api.get(`/search/Tv/${term}`, {}, {}).then(this.format);
  }

  getImage(id: string): Promise<string> {
    return this.api.get(`/Images/tv/${id}`, {}, {});
  }

  getInfo(id: string): Promise<any> {
    return this.api.get(`/search/Tv/info/${id}`, {}, {});
  }

  private format(results): Array<TvShow> {
    return results.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.overview,
        request: {
          id: r.requestId,
          requested: r.requested,
          approved: r.approved,
          denied: r.denied,
          type: {
            all: r.requestAll,
            firstSeason: r.firstSeason,
            latestSeason: r.latestSeason
          },
          seasons: r.seasonRequests
        },
        network: r.network,
        status: r.status,
        aired: r.firstAired,
        available: r.available,
        partlyAvailable: r.partlyAvailable
      }) as TvShow
    )
  }
}
