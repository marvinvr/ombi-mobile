import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Movie, Tag } from '../../../../models/content';

@Component({
  selector: 'app-movie-content-row',
  templateUrl: './movie-content-row.component.html',
  styleUrls: ['./movie-content-row.component.scss'],
})
export class MovieContentRowComponent implements OnInit {

  @Input() movie!: Movie;

  @Output() click: EventEmitter<void> = new EventEmitter<void>();

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
        color: this.available ? 'success' : this.requested ? 'warning' : 'danger',
        text: this.available ? 'Available' : this.requested ? 'Requested' : 'Not Requested'
      },
      {
        color: 'primary',
        text: new Date(this.movie.releaseDate).toLocaleDateString()
      }
    ]
  }

  public emitClick(event) {
    event?.stopPropagation();
    this.click.emit();
  }

  private get available(): boolean {
    return this.movie.available;
  }

  private get requested(): boolean {
    return this.movie.request.requested;
  }

}
