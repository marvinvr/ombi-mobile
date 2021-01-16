import { Component, OnInit } from '@angular/core';
import { RequestContent } from 'src/app/base/content-row/content-types/request-row';
import { Request } from 'src/models/content';
import { RequestType } from 'src/models/requests';
import { RequestsService } from 'src/services/requests.service';
import { sort } from 'src/utils/requests.utils';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss'],
})
export class RequestsComponent implements OnInit {

  public contentList: Array<Request> = [];

  public selectedRequestType: RequestType = RequestType.MOVIE;
  public searchTerm: string = '';
  public noRequestsFound: boolean = false;

  constructor(
    public request: RequestsService
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
    this.searchTerm = e;
    if(this.searchTerm == '' || !this.searchTerm) this.fetchAllRequests()
    else this.searchRequests();
  }

  private fetchAllRequests(): Promise<Request[]> {
    return Promise.all(
        [
          this.request.list(RequestType.MOVIE),
          this.request.list(RequestType.TV)
        ]
    )
      .then(res => {
        this.handleEmptyResult(res);
        this.contentList = sort(res);
        return this.contentList;
      })  
   }

  private searchRequests(): Promise<Request[]> {
    return Promise.all(
        [
          this.request.search(RequestType.MOVIE, this.searchTerm),
          this.request.search(RequestType.TV, this.searchTerm)
        ]
    ).then(res => {
      this.handleEmptyResult(res);
      this.contentList = sort(res);
      return this.contentList;
    })
  }

  public content(content: any): RequestContent {
    return new RequestContent(content);
  }

  public get requestType(): typeof RequestType {
    return RequestType;
  }

  public refresh(event) {
    (this.searchTerm == '' ?
      this.fetchAllRequests()
      : this.searchRequests())
      .then(() => event.target.complete())
  }

  private handleEmptyResult(res: [Request[], Request[]]) {
    if(res[0].length == 0 && res[1].length == 0) this.noRequestsFound = true;
  }
}
