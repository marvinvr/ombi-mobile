import { Injectable } from '@angular/core';
import { OverviewContentRequest, Request } from 'src/models/content';
import { RequestAction, RequestType } from 'src/models/requests';
import { ToastType } from 'src/models/toast';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';
import { getPoster } from 'src/utils/poster.utils';

@Injectable({
  providedIn: 'root'
})
export class RequestsService {

  constructor(
    private api: ApiService,
    private toast: ToastService
  ) { }

  public list(
    type: RequestType = RequestType.MOVIE,
    count: number = 20,
    position: number = 0,
    sort: string = 'requestedDate',
    order: string = 'desc'
  ): Promise<OverviewContentRequest[]> {
    return this.api.get(`/Requests/${type}/${count}/${position}/${sort}/${order}`, {}, {}, null, '2')
            .then((requestResult) => this.formatOverviewContent(requestResult.collection, type));
  }

  public requestMovie(id: number) {
    return this.api.post(`/Request/Movie`, {}, this.requestBody(RequestType.MOVIE, id), null, '1')
            .then((res) => this.toast.show(
              res.isError ? ToastType.ERROR : ToastType.SUCCESS,
              res.isError? res?.errorMessage: `Successfully requested Movie`));
  }

  public requestTv(id: number) {
    return this.api.post(`/Requests/TV`, {}, this.requestBody(RequestType.TV, id), null, '2')
            .then((res) => this.toast.show(
              res.isError ? ToastType.ERROR : ToastType.SUCCESS,
              res.isError? res?.errorMessage: `Successfully requested TV Show`));
  }

  public performAction(action: RequestAction, type: RequestType, id: number | string = 0) {
    return this.api[action === RequestAction.APPROVE ? 'post': 'put'](`/Request/${type}/${action}`, {}, {id}, null, '1')
            .then(() => this.toast.show(
              ToastType.SUCCESS,
              `Successfully ${action === RequestAction.APPROVE ? 'approved' : 'denied'} request`));
  }

  private formatOverviewContent(results, type: RequestType): OverviewContentRequest[] {
    return results.map(r => ({
        mediaType: type as string,
        id: type === RequestType.MOVIE ? r.theMovieDbId : r.parentRequest?.externalProviderId,
        title: r.title,
        description: type === RequestType.MOVIE ? r.overview : r.parentRequest?.overview,
        posterUrl: getPoster(type === RequestType.MOVIE ? r.posterPath : r?.parentRequest?.posterPath),
        date: new Date(r.requestedDate),
        request: this.parseRequest(r, type)
      }) as unknown as OverviewContentRequest);
  }

  private parseRequest(r: any, type: RequestType): RequestInfo {
    return {
      id: r.id,
      requested: true,
      approved: r?.approved,
      available: r?.available,
      denied: r?.denied,
      date: r?.requestedDate,
      user: {
        alias: r?.requestedUser?.alias,
        email: r?.requestedUser?.email,
        name: r?.requestedUser?.userName
      }
    } as unknown as RequestInfo;
  }

  private format(results, type: RequestType): Array<Request> {
    return results.map((r) => ({
      id: r?.theMovieDbId || r?.tvDbId,
      title: r.title,
      description: type === RequestType.MOVIE ? r.overview : r.parentRequest?.overview,
      posterUrl: r.posterPath,
      request: {
          id: r.id,
          requested: true,
          approved: r?.approved,
          denied: r?.denied,
          date: r?.requestedDate,
          user: {
            alias: r?.requestedUser?.alias,
            email: r?.requestedUser?.email,
            name: r?.requestedUser?.userName
          }
      },
      available: r.childRequests ? r.childRequests.map(cr => cr.available).indexOf([true]) === -1 : r.available,
      type,
      rating: Math.round(type === RequestType.MOVIE ? r.voteAverage : r.rating)
      }) as Request
    );
  }

  private requestBody(type: RequestType, id: number) {
    return type === RequestType.MOVIE ?
          {
            theMovieDbId: id,
            languageCode: 'en'
          } : {
            firstSeason: false,
            latestSeason: false,
            requestAll: true,
            theMovieDbId: id
          };
  }
}
