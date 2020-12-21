import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MovieContent } from 'src/app/base/content-row/content-types/movie-row';
import { Movie } from 'src/models/content';
import { RequestActionType } from 'src/models/requests';
import { MovieService } from 'src/services/movie.service';

@Component({
  selector: 'app-movies',
  templateUrl: './movies.component.html',
  styleUrls: ['./movies.component.scss'],
})
export class MoviesComponent implements OnInit {

  public movies: Array<Movie> = [];

  constructor(
    private movie: MovieService,
    private router: Router
  ) {}

  ngOnInit() {
    this.fetchAllMovies();
  }

  ngOnDestroy() {
    this.movies = [];
  }
  
  searchChange(e) {
    (e == '' || !e) 
        ? this.fetchAllMovies()
        : this.searchMovies(e.detail);
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

  public showContent(movie: Movie): void {
    this.router.navigate([RequestActionType.MOVIE, movie.id])
  }
}
