import { Injectable } from '@angular/core';
import { TvShow } from 'src/models/content';
import { TvSearchType } from 'src/models/tv';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class TvService {

  private showCache: {[key: string]: TvShow} = {};

  constructor(
    private api: ApiService
  ) { }

  public get shows(): {[key: string]: TvShow} {
    return this.showCache;
  }

  list(type: TvSearchType = TvSearchType.POPULAR): Promise<Array<TvShow>> {
    return this.api.get(`/search/Tv/${type}`, {}, {})
            .then(this.format)
            .then((tv) => Promise.all(tv.map( async (t) => {
              t.posterUrl = (await this.getInfo(t.id))?.banner;
              return t;
            })))
            .then((tv) => this.cacheResults(tv));
  }

  search(term: string): Promise<Array<TvShow>> {
    return this.api.get(`/search/Tv/${term}`, {}, {})
            .then(this.format)
            .then((tv) => Promise.all(tv.map( async (t) => {
              t.posterUrl = (await this.getInfo(t.id))?.banner;
              return t;
            })))
            .then((tv) => this.cacheResults(tv));
  }

  getImage(id: string): Promise<string> {
    return this.api.get(`/Images/tv/${id}`, {}, {});
  }

  cache(tv: TvShow) {
    this.showCache[tv.id] = tv;
  }

  getInfo(id: number): Promise<any> {
    return this.api.get(`/search/Tv/info/${id}`, {}, {});
  }

  private cacheResults(shows: TvShow[]): TvShow[] {
    shows.forEach((show) => this.showCache[show.id] = show);
    return shows;
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
        partlyAvailable: r.partlyAvailable,
        rating: Math.round(r.rating)
      }) as TvShow
    );
  }
}
