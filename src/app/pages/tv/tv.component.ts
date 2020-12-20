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
  public contentPage: boolean = false;
  public selectedShow: TvContent;

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
    (e == '' || !e) 
        ? this.fetchAllShows()
        : this.searchShows(e.detail);
  }

  public fetchAllShows() {
    this.tv.list().then((shows) => this.shows = shows);
  }

  public searchShows(term: string) {
    this.tv.search(term).then((shows) => this.shows = shows);
  }

  public content(show: TvShow) {
    return new TvContent(show);
  }

  public showContent(show: TvShow): void {
    this.contentPage = true;
    this.selectedShow = this.content(show);
  }

  public hideContent(): void {
    this.contentPage = false;
    this.selectedShow = null;
  }

}
