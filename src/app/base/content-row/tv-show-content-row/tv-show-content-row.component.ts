import { Component, Input, OnInit } from '@angular/core';
import { Tag, TvShow } from 'src/models/content';
import { TvService } from 'src/services/tv.service';

@Component({
  selector: 'app-tv-show-content-row',
  templateUrl: './tv-show-content-row.component.html',
  styleUrls: ['./tv-show-content-row.component.scss'],
})
export class TvShowContentRowComponent implements OnInit {

  @Input() tvShow!: TvShow;

  public posterUrl: string = '';

  constructor(
    private tv: TvService
  ) { }

  ngOnInit() {
    this.tv.getInfo(this.tvShow.id)
      .then((info) => this.posterUrl = info.banner);
  }

  get title(): string {
    return this.tvShow.title
  }

  get description(): string {
    return this.tvShow.description
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
