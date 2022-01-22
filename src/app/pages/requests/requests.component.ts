import { Component, OnDestroy, OnInit } from '@angular/core';
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
export class RequestsComponent implements OnInit, OnDestroy {

  public contentList: Array<Request> = [];
  public searchTerm = '';
  public isLoading = false;

  constructor(
    public request: RequestsService
  ) {}

  public get requestType(): typeof RequestType {
    return RequestType;
  }

  ngOnInit() {
    this.fetchAllRequests();
  }

  ngOnDestroy() {
    this.contentList = [];
  }

  public content(content: any): RequestContent {
    return new RequestContent(content);
  }

  public refresh(event) {
      this.fetchAllRequests()
        .then(() => event.target.complete());
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
      });
   }
}
