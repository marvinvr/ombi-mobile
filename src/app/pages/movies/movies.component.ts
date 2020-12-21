import { Component, OnInit, ViewChild } from '@angular/core';
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
  private searchTerm: string = '';
  public contentPage: boolean = false;
  public selectedMovie: MovieContent;

  constructor(
    private movie: MovieService
  ) {}

  ngOnInit() {
    this.fetchAllMovies();
  }

  ngOnDestroy() {
    this.movies = [];
    this.contentPage = false;
    this.selectedMovie = undefined;
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
    this.contentPage = true;
    this.selectedMovie = this.content(movie);
  }

  public hideContent(): void {
    this.contentPage = false;
    this.selectedMovie = null;
  }
}
