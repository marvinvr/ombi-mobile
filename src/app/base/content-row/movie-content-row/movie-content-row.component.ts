import { Component, Input, OnInit } from '@angular/core';
import { Movie, Tag } from 'src/models/content';

@Component({
  selector: 'app-movie-content-row',
  templateUrl: './movie-content-row.component.html',
  styleUrls: ['./movie-content-row.component.scss'],
})
export class MovieContentRowComponent implements OnInit {

  @Input() movie!: Movie;

  constructor() { }

  ngOnInit() {}

  get posterUrl(): string {
    return this.movie.posterUrl
  }

  get title(): string {
    return this.movie.title
  }

  get description(): string {
    return this.movie.description
  }

  get tags(): Array<Tag> {
    return [
      {
        color: 'primary',
        text: 'Test'
      }
    ]
  }

}
