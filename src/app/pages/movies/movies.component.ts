import { Component, OnInit } from '@angular/core';
import { MovieContent } from 'src/app/base/content-row/content-types/movie-row';
import { Movie } from 'src/models/content';
import { MovieService } from 'src/services/movie.service';

@Component({
  selector: 'app-movies',
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.scss'],
})
export class MoviesComponent implements OnInit {

  public movies: Array<Movie> = [];

  constructor(
    private movie: MovieService
  ) {}

  ngOnInit() {
    this.fetchAllMovies();
  }

  ngOnDestroy() {
    this.movies = [];
  }

  searchChange(e): void {
    if(e == '' || !e) this.fetchAllMovies()
    else this.searchMovies(e);
  }

  private fetchAllMovies(): void {
    this.movie.list().then((movies) => this.movies = movies);
  }

  private searchMovies(term: string): void {
    this.movie.search(term).then((movies) => this.movies = movies);
  }

  public content(movie: Movie): MovieContent {
    return new MovieContent(movie);
  }
}
