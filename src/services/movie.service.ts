import { Injectable } from '@angular/core';
import { MovieSearchType } from 'src/models/movie';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class MovieService {

  constructor(
    private api: ApiService
  ) { }

  public list(type: MovieSearchType = MovieSearchType.POPULAR): Promise<Array<Item>> {
    return this.api.getRequest(`/search/Movie/${type}`, {}, {})
      .then(this.toItems)
  }

  public search(term: string): Promise<Array<Item>> {
    return this.api.postRequest('/search/Movie/', {}, {
        searchTerm: term,
        languageCode: 'en'
      })
      .then(this.toItems)
  }

  private toItems(results: Array<any>): Array<Item> {
    return results.map((item) => {
      return {
        id: item.theMovieDbId,
        title: item.originalTitle,
        posterUrl: `https://image.tmdb.org/t/p/w300${item.posterPath}`,
        description: item.overview,
        requested: item.requested
      }
    })
  }
}
