import { Injectable } from '@angular/core';
import { Movie } from 'src/models/item';
import { MovieSearchType } from 'src/models/movie';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class MovieService {

  constructor(
    private api: ApiService
  ) { }

  public list(type: MovieSearchType = MovieSearchType.POPULAR): Promise<Array<Movie>> {
    return this.api.get(`/search/Movie/${type}`, {}, {})
      .then(this.format)
  }

  public search(term: string): Promise<Array<Movie>> {
    return this.api.post('/search/Movie/', {}, {
        searchTerm: term,
        languageCode: 'en'
      })
      .then(this.format)
  }

  private format(results: Array<any>): Array<Movie> {
    return results.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.overview,
        posterUrl: `https://image.tmdb.org/t/p/w300${r.posterPath}`,
        request: {
            id: r.requestId,
            requested: r.requested,
            approved: r.approved,
            denied: r.denied
        },
        available: r.available
      }) as Movie
    )
  }
}
