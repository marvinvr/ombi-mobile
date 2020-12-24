import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';
import { Component, OnInit } from '@angular/core';
import { MovieContent } from 'src/app/base/content-row/content-types/movie-row';
import { TvContent } from 'src/app/base/content-row/content-types/tv-row';
import { ContentClass, Movie, TvShow } from 'src/models/content';
import { RequestType } from 'src/models/requests';
import { RequestsService } from 'src/services/requests.service';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss'],
})
export class RequestsComponent implements OnInit {

  public contentList: Array<ContentClass> = [];

  public selectedRequestType: RequestType | '' = RequestType.MOVIE;
  public searchTerm: string = '';

  constructor(
    private request: RequestsService
  ) {}

  ngOnInit() {
    this.fetchAllRequests();
  }

  ngOnDestroy() {
    this.contentList = [];
  }

  typeChange(e): void {
    this.selectedRequestType = e.detail.value;
    if(this.searchTerm == '' || !this.searchTerm) this.fetchAllRequests()
    else this.searchRequests();
  }

  searchChange(e): void {
    this.searchTerm = e.detail.value;
    if(this.searchTerm == '' || !this.searchTerm) this.fetchAllRequests()
    else this.searchRequests();
  }

  private fetchAllRequests(): void {
    if(this.selectedRequestType != '') this.request.list(this.selectedRequestType).then((requestResult) => this.contentList = requestResult['collection']);
  }

  private searchRequests(): void {
    if(this.selectedRequestType != '') this.request.search(this.selectedRequestType, this.searchTerm).then((requestResult) => this.contentList = requestResult.collection);
  }

  public content(content: any): TvContent | MovieContent {
    console.log(content);
    if(typeof content !== 'undefined') {
      if(this.selectedRequestType == RequestType.MOVIE) return new MovieContent(content);
      return new TvContent(content);
    }
  }

  public get requestType(): typeof RequestType {
    return RequestType;
  }
}
