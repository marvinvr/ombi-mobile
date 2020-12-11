import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Tag, TvShow } from 'src/models/content';
import { TvService } from 'src/services/tv.service';

@Component({
  selector: 'app-tv-show-content-row',
  templateUrl: './tv-show-content-row.component.html',
  styleUrls: ['./tv-show-content-row.component.scss'],
})
export class TvShowContentRowComponent implements OnInit {

  @Input() tvShow!: TvShow;
  
  @Output() click: EventEmitter<void> = new EventEmitter<void>();

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
        color: this.available ? 'success' : this.requested ? 'warning' : this.partlyAvailable ? 'warning' : 'danger',
        text: this.available ? 'Available' : this.requested ? 'Requested' : this.partlyAvailable ? 'Partly Available' : 'Not Requested'
      },
      {
        color: 'primary',
        text: new Date(this.tvShow.aired).toLocaleDateString()
      },
      {
        color: 'tertiary',
        text: this.tvShow.network
      }
    ]
  }

  public emitClick(event) {
    event?.stopPropagation();
    this.click.emit();
  }

  private get available(): boolean {
    return this.tvShow.available;
  }

  private get partlyAvailable(): boolean {
    return this.tvShow.partlyAvailable;
  }

  private get requested(): boolean {
    return this.tvShow.request.requested;
  }
}
