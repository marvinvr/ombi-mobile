import { Component, OnInit } from '@angular/core';
import { TvShow } from 'src/models/content';
import { TvService } from 'src/services/tv.service';

@Component({
  selector: 'app-tv',
  templateUrl: './tv.component.html',
  styleUrls: ['./tv.component.scss'],
})
export class TvComponent implements OnInit {

  public shows: Array<TvShow> = [];

  constructor(
    private tv: TvService
  ) {}

  ngOnInit() {
    this.tv.list().then((shows) => this.shows = shows);
  }

}
