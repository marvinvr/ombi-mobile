import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MovieContent } from 'src/app/base/content-row/content-types/movie-row';
import { TvContent } from 'src/app/base/content-row/content-types/tv-row';
import { Content, ContentClass, Movie, OverviewContent, TvShow } from 'src/models/content';
import { SearchService } from 'src/services/search.service';

@Component({
  selector: 'app-search-page',
  templateUrl: './search-page.component.html',
  styleUrls: ['./search-page.component.scss'],
})
export class SearchPageComponent implements OnInit {

  public items: Array<OverviewContent> = [];
  public isLoading = false;
  public segment: 'all' | 'movie' | 'tv' = 'all';
  private searchTerm = '';

  constructor(
    private searchService: SearchService,
    private router: Router
  ) {}

  ngOnInit() {
    this.fetchPopular();
  }

  ngOnDestroy() {
    this.items = [];
  }

  searchChange(e) {
    if(typeof e !== 'string') {
      return;
    }
    this.searchTerm = e;
    if(e === '' || !e) {
      this.fetchPopular();
    } else {
      this.search();
    }
  }

  segmentChange(e) {
    this.segment = e.detail.value;
    this.refresh(e, false);
  }

  public showContent(item: OverviewContent): void {
    this.router.navigate([item.mediaType, item.id]);
  }

  public refresh(event, refresh = true) {
    (this.searchTerm === '' ?
      this.fetchPopular()
      : this.search())
      .then(() => refresh ? event.target.complete(): null);
  }

  private fetchPopular(): Promise<OverviewContent[]> {
    this.isLoading = true;
    return this.searchService.getPopular(this.segment).then((items) => {
      this.items = items;
      this.isLoading = false;
      return items;
    });
  }

  private search(): Promise<OverviewContent[]> {
    this.isLoading = true;
    return this.searchService.search(this.searchTerm, this.segment).then((items) => {
      this.items = items;
      this.isLoading = false;
      return items;
    });
  }
}
