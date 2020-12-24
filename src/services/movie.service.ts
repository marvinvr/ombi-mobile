import { Injectable } from '@angular/core';
import { Movie } from 'src/models/content';
import { MovieSearchType } from 'src/models/movie';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class MovieService {

  private movieCache: {[key: string]: Movie} = {}

  constructor(
    private api: ApiService
  ) { }

  public list(type: MovieSearchType = MovieSearchType.POPULAR): Promise<Array<Movie>> {
    return this.api.get(`/search/Movie/${type}`, {}, {})
      .then(this.format)
      .then((movies) => this.cacheResults(movies));
  }

  public search(term: string): Promise<Array<Movie>> {
    return this.api.post('/search/Movie/', {}, {
        searchTerm: term,
        languageCode: 'en'
      })
      .then(this.format)
      .then((movies) => this.cacheResults(movies));
  }

  public get movies(): {[key: string]: Movie} {
    return this.movieCache;
  }

  cache(movie: Movie) {
    this.movieCache[movie.id] = movie;
  }

  private cacheResults(movies: Movie[]): Movie[] {
    movies.forEach((movie) => this.movieCache[movie.id] = movie);
    return movies;
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
        releaseDate: r.releaseDate,
        available: r.available
      }) as Movie
    )
  }
}
