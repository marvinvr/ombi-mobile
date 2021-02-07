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
  public searchTerm: string = '';
  public isLoading: boolean = false;

  constructor(
    public request: RequestsService
  ) {}

  ngOnInit() {
    this.fetchAllRequests();
  }

  ngOnDestroy() {
    this.contentList = [];
  }

  searchChange(e): void {
    this.searchTerm = e;
    if(typeof e !== 'string') return;
    if(this.searchTerm == '' || !this.searchTerm) this.fetchAllRequests()
    else this.searchRequests();
  }

  private fetchAllRequests(): Promise<Request[]> {
    this.isLoading = true;
    return Promise.all(
        [
          this.request.list(RequestType.MOVIE),
          this.request.list(RequestType.TV)
        ]
    )
      .then(res => {
        this.contentList = sort(res);
        this.isLoading = false;
        return this.contentList;
      })  
   }

  private searchRequests(): Promise<Request[]> {
    this.isLoading = true;
    return Promise.all(
        [
          this.request.search(RequestType.MOVIE, this.searchTerm),
          this.request.search(RequestType.TV, this.searchTerm)
        ]
    ).then(res => {
      this.contentList = sort(res);
      this.isLoading = false;
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
}
