import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TvContent } from 'src/app/base/content-row/content-types/tv-row';
import { TvShow } from 'src/models/content';
import { RequestActionType } from 'src/models/requests';
import { TvService } from 'src/services/tv.service';

@Component({
  selector: 'app-tv',
  templateUrl: './tv.component.html',
  styleUrls: ['./tv.component.scss'],
})
export class TvComponent implements OnInit, OnDestroy {

  public shows: Array<TvShow> = [];
  public isLoading = false;

  private searchTerm = '';

  constructor(
    private tv: TvService,
    private router: Router
  ) {}

  ngOnInit() {
    this.fetchAllShows();
  }

  ngOnDestroy() {
    this.shows = [];
  }

  searchChange(e) {
    if(typeof e !== 'string') {
      return;
    }
    this.searchTerm = e;
    if(e === '' || !e) {
      this.fetchAllShows();
    } else {
      this.searchShows();
    }
  }

  public fetchAllShows(): Promise<TvShow[]> {
    this.isLoading = true;
    return this.tv.list().then((shows) => {
      this.shows = shows;
      this.isLoading = false;
      return this.shows;
    });
  }

  public searchShows(): Promise<TvShow[]> {
    this.isLoading = true;
    return this.tv.search(this.searchTerm).then((shows) => {
      this.shows = shows;
      this.isLoading = false;
      return this.shows;
    });
  }

  public content(show: TvShow) {
    return new TvContent(show);
  }

  public showContent(show: TvShow): void {
    this.router.navigate([RequestActionType.TV, show.id]);
  }

  public refresh(event) {
    (this.searchTerm === '' ?
      this.fetchAllShows()
      : this.searchShows())
      .then(() => event.target.complete());
  }

}
