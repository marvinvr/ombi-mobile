import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OverviewContentRequest, RequestStatus } from 'src/models/content';
import { RequestAction, RequestType } from 'src/models/requests';
import { RequestsService } from 'src/services/requests.service';
import { sort } from 'src/utils/requests.utils';

@Component({
  selector: 'app-requests',
  templateUrl: './requests.component.html',
  styleUrls: ['./requests.component.scss'],
})
export class RequestsComponent implements OnInit, OnDestroy {

  public contentList: OverviewContentRequest[] = [];
  public isLoading = false;
  public segment: 'all' | 'movie' | 'tv' = 'all';

  constructor(
    public requestsService: RequestsService,
    private router: Router
  ) {}

  ngOnInit() {
    this.fetchAllRequests();
  }

  ngOnDestroy() {
    this.contentList = [];
  }

  public refresh(event, refresh = true) {
      this.fetchAllRequests()
        .then(() => refresh ? event.target.complete(): null);
  }

  segmentChange(e) {
    this.segment = e.detail.value;
    this.refresh(e, false);
  }

  public disableButtons(item: OverviewContentRequest) {
    return item.status !== RequestStatus.OPEN;
  }

  public showContent(item: OverviewContentRequest): void {
    this.router.navigate(['request', item.mediaType, item.id]);
  }

  public approve(item: OverviewContentRequest, event: Event) {
    event?.stopPropagation();
    item.request.approved = true;
    item.status = RequestStatus.APPROVED;

    this.requestsService.performAction(
      RequestAction.APPROVE,
      item.mediaType as RequestType,
      item.request.id
    ).catch(() => {
      item.status = RequestStatus.OPEN;
      item.request.approved = null;
    });
  }

  public deny(item: OverviewContentRequest, event: Event) {
    event?.stopPropagation();
    item.request.approved = false;
    item.status = RequestStatus.DENIED;

    this.requestsService.performAction(
      RequestAction.DENY,
      item.mediaType as RequestType,
      item.request.id
    ).catch(() => {
      item.status = RequestStatus.OPEN;
      item.request.approved = null;
    });
  }

  private fetchAllRequests(): Promise<OverviewContentRequest[]> {
    this.isLoading = true;
    return Promise.all(
        [
          this.segment === 'movie' || this.segment === 'all' ? this.requestsService.list(RequestType.MOVIE) : Promise.resolve([]),
          this.segment === 'tv' || this.segment === 'all' ? this.requestsService.list(RequestType.TV) : Promise.resolve([])
        ]
    )
      .then(res => {
        this.contentList = sort(res)
          .map(this.enhance);

        this.isLoading = false;
        return this.contentList;
      });
   }

  private enhance(content: OverviewContentRequest): OverviewContentRequest {
    content.requestedBy = content.request.user?.name || content?.request?.user?.email;
    content.status = content.request.available ? RequestStatus.AVAILABLE
                      : content.request.denied ? RequestStatus.DENIED
                      : content.request.approved ? RequestStatus.APPROVED
                      : RequestStatus.OPEN;

    return content;
  }
}
