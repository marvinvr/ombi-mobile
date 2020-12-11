import { Component, OnInit } from '@angular/core';
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
    this.movie.list().then((movies) => this.movies = movies);
  }

}
