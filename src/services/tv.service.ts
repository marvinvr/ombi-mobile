import { Injectable } from '@angular/core';
import { OverviewContent, TvShow } from 'src/models/content';
import { ApiService } from './api.service';
import { getPoster } from 'src/utils/poster.utils';

@Injectable({
  providedIn: 'root'
})
export class TvService {

  private showCache: {[key: string]: TvShow} = {};
  private popularCache: OverviewContent[] = [];

  constructor(
    private api: ApiService
  ) { }

  public get shows(): {[key: string]: TvShow} {
    return this.showCache;
  }

  public getPopular(force: boolean = false): Promise<Array<OverviewContent>> {
    if(this.popularCache.length > 0 && !force) {
      return Promise.resolve(this.popularCache);
    }

    return this.api.get(`/search/Tv/popular/0/20`, {}, {})
            .then(this.toOverviewContent)
            .then(res => this.cachePopular(res));

  }

  public get(id: string): Promise<TvShow> {
    if(this.showCache[id]) {
      return Promise.resolve(this.showCache[id]);
    }
    return this.api.get(`/search/Tv/${id}`, {}, {}, null, '2')
            .then(this.formatResult)
            .then(res => this.cacheShow(res));
  }

  private cacheShow(tv: TvShow): TvShow {
    this.showCache[tv.id] = tv;
    return tv;
  }

  private cachePopular(items: OverviewContent[]): OverviewContent[] {
    this.popularCache.push(...items);
    return items;
  }

  private formatResult(r: any): TvShow {
    return ({
      mediaType: 'tv',
      id: r.id,
      title: r.title,
      description: r.overview,
      posterUrl: getPoster(r?.images?.original),
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
      genres: r.genres?.map((g) => g.name),
      network: r.network,
      status: r.status,
      releaseDate: new Date(r.firstAired),
      available: r.available,
      partlyAvailable: r.partlyAvailable,
      rating: Math.round(r.rating)
    }) as TvShow;
  }

  private toOverviewContent(results: any[]): OverviewContent[] {
    return results.map((result) => ({
        mediaType: 'tv',
        id: result.id,
        title: result.title,
        description: result.overview,
        posterUrl: getPoster(result.backdropPath),
        rating: Math.round(result?.rating)
    }));
  }
}
