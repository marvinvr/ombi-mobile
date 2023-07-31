import { Injectable } from '@angular/core';
import { Movie, OverviewContent } from 'src/models/content';
import { ApiService } from './api.service';
import { getPoster } from 'src/utils/poster.utils';

@Injectable({
  providedIn: 'root',
})
export class MovieService {
  private movieCache: { [key: string]: Movie } = {};
  private popularCache: OverviewContent[] = [];

  constructor(private api: ApiService) { }

  public get(id: string, force = false): Promise<Movie> {
    if (this.movieCache[id] && !force) {
      return Promise.resolve(this.movieCache[id]);
    }
    return this.api
      .get(`/search/Movie/${id}`, {}, {})
      .then(this.formatResult)
      .then(res => this.cacheMovie(res));
  }

  public getPopular(force: boolean = false): Promise<OverviewContent[]> {
    if (this.popularCache.length > 0 && !force) {
      return Promise.resolve(this.popularCache);
    }

    return this.api
      .get(`/search/Movie/popular/0/20`, {}, {})
      .then(this.toOverviewContent)
      .then(res => this.cachePopular(res));
  }

  private cacheMovie(movie: Movie): Movie {
    this.movieCache[movie.id] = movie;
    return movie;
  }

  private cachePopular(items: OverviewContent[]): OverviewContent[] {
    this.popularCache = items;
    return items;
  }

  private formatResult(r: any): Movie {
    return {
      mediaType: 'movie',
      id: r.id,
      title: r.title,
      description: r.overview,
      posterUrl: getPoster(r.posterPath),
      request: {
        id: r.requestId,
        requested: r.requested,
        approved: r.approved,
        denied: r.denied,
      },
      genres: r.genres?.map((g) => g.name),
      releaseDate: new Date(r.releaseDate),
      available: r.available,
      rating: Math.round(r.voteAverage),
    } as Movie;
  }

  private toOverviewContent(results: any[]): OverviewContent[] {
    return results.map((result) => ({
      mediaType: 'movie',
      id: result.id,
      title: result.title,
      description: result.overview,
      posterUrl: getPoster(result.posterPath),
      rating: Math.round(result?.voteAverage),
    }));
  }
}
