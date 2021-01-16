import { Injectable } from '@angular/core';
import { Request } from 'src/models/content';
import { RequestAction, RequestActionType, RequestAvailability, RequestSort, RequestStatus, RequestType } from 'src/models/requests';
import { ToastType } from 'src/models/toast';
import { getParam } from 'src/utils/requests.utils';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';

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
    count: number = 10,
    position: number = 0,
    sort: RequestSort = RequestSort.REQUEST_DATE_DESC,
    status: RequestStatus = RequestStatus.NO_FILTER,
    availability: RequestAvailability = RequestAvailability.NO_FILTER
  ): Promise<Request[]> {
    return this.api.get(`/Request/${type}/${count}/${position}/${sort}/${status}/${availability}`, {}, {})
            .then((requestResult) => this.format(requestResult.collection, type));
  }

  public search(
    type: RequestType = RequestType.MOVIE,
    term: string
  ): Promise<Request[]> {
    return this.api.get(`/Request/${type}/search/${term}`, {}, {}) 
              .then((requestResult) => this.format(requestResult.collection, type));
  }

  public request(type: RequestType, id: number) {
    return this.api.post(`/Request/${type}`, {}, this.requestBody(type, id))
            .then((res) => this.toast.show(res.isError ? ToastType.ERROR : ToastType.SUCCESS, res[res.isError ? 'errorMessage': 'message']));
  }

  public performAction(action: RequestAction, type: RequestType, id: number = 0) {
    return this.api[action == RequestAction.APPROVE ? 'post': 'put'](`/Request/${type}/${action}`, {}, {id: id})
            .then(() => this.toast.show(ToastType.SUCCESS, `Successfully ${action == RequestAction.APPROVE ? 'approved' : 'denied'} request`));
  }

  private format(results, type: RequestType): Array<Request> {
    return results.map((r) => ({
      id: r?.theMovieDbId || r?.imdbId,
      title: r.title,
      description: r.overview,
      posterUrl: r.posterPath,
      request: {
          id: r.id,
          requested: true,
          approved: getParam(r, type, 'approved'),
          denied: getParam(r, type, 'denied'),
          date: new Date(getParam(r, type, 'requestedDate')),
          user: {
            alias: getParam(r, type, 'requestedUser').alias,
            email:  getParam(r, type, 'requestedUser').email,
            name: getParam(r, type, 'requestedUser').userName
          }
      },
      available: r.childRequests ? r.childRequests.map(cr => cr.available).indexOf([true]) == -1 : r.available,
      type: type,
      rating: Math.round(type == RequestType.MOVIE ? r.voteAverage : r.rating)
      }) as Request
    )
  }
  
  private requestBody(type: RequestType, id: number) {
    return type == RequestType.MOVIE ?
          {"theMovieDbId": id,"languageCode": "en"}
          : {"firstSeason": false, "latestSeason": false, "requestAll": true, "tvDbId": id}
  }
}
