import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
export class MoviesComponent implements OnInit, OnDestroy {

  public movies: Array<Movie> = [];
  public isLoading = false;
  private searchTerm = '';

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
    if(typeof e !== 'string') {
      return;
    }
    this.searchTerm = e;
    if(e === '' || !e) {
      this.fetchAllMovies();
    } else {
      this.searchMovies();
    }
  }

  public content(movie: Movie): MovieContent {
    return new MovieContent(movie);
  }

  public showContent(movie: Movie): void {
    this.router.navigate([RequestActionType.MOVIE, movie.id]);
  }

  public refresh(event) {
    (this.searchTerm === '' ?
      this.fetchAllMovies()
      : this.searchMovies())
      .then(() => event.target.complete());
  }

  private fetchAllMovies(): Promise<Movie[]> {
    this.isLoading = true;
    return this.movie.list().then((movies) => {
      this.movies = movies;
      this.isLoading = false;
      return movies;
    });
  }

  private searchMovies(): Promise<Movie[]> {
    this.isLoading = true;
    return this.movie.search(this.searchTerm).then((movies) => {
      this.movies = movies;
      this.isLoading = false;
      return movies;
    });
  }
}
