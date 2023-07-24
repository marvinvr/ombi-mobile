import { Component, OnDestroy, OnInit } from '@angular/core';
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

  constructor(
    public requestsService: RequestsService
  ) {}

  ngOnInit() {
    this.fetchAllRequests();
  }

  ngOnDestroy() {
    this.contentList = [];
  }

  public refresh(event) {
      this.fetchAllRequests()
        .then(() => event.target.complete());
  }

  public disableButtons(item: OverviewContentRequest) {
    return item.status !== RequestStatus.OPEN;
  }

  public approve(id: number | string, mediaType: string) {
    this.requestsService.performAction(
      RequestAction.APPROVE,
      mediaType as RequestType,
      id
    );
  }

  public deny(id: number | string, mediaType: string) {
    this.requestsService.performAction(
      RequestAction.DENY,
      mediaType as RequestType,
      id
    );
  }

  private fetchAllRequests(): Promise<OverviewContentRequest[]> {
    this.isLoading = true;
    return Promise.all(
        [
          this.requestsService.list(RequestType.MOVIE),
          this.requestsService.list(RequestType.TV)
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
