import { Component, OnInit } from '@angular/core';
import { TvContent } from 'src/app/base/content-row/content-types/tv-row';
import { TvShow } from 'src/models/content';
import { TvService } from 'src/services/tv.service';

@Component({
  selector: 'app-tv',
  templateUrl: './tv.component.html',
  styleUrls: ['./tv.component.scss'],
})
export class TvComponent implements OnInit {

  public shows: Array<TvShow> = [];
  private searchTerm: string = '';

  constructor(
    private tv: TvService
  ) {}

  ngOnInit() {
    this.fetchAllShows();
  }  

  ngOnDestroy() {
    this.shows = [];
  }
  
  searchChange(e) {
    this.searchTerm = e;
    (e == '' || !e) 
        ? this.fetchAllShows()
        : this.searchShows();
  }

  public fetchAllShows() {
    this.tv.list().then((shows) => this.shows = shows);
  }

  public searchShows() {
    this.tv.search(this.searchTerm).then((shows) => this.shows = shows);
  }

  public content(show: TvShow) {
    return new TvContent(show);
  }

}
