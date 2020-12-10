import { Injectable } from '@angular/core';
import { RequestAction, RequestActionType, RequestType } from 'src/models/requests';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class RequestsService {

  constructor(
    private api: ApiService,
  ) { }

  public list(
    type: RequestType = RequestType.MOVIE,
    count: number = 10, 
    position: number = 0 
    ) {
    return this.api.getRequest(`/Request/${type}/${count}/${position}/2/0/0`, {}, {});
  }

  public deny(type: RequestActionType, id: number = 0) {
    this.performAction(RequestAction.DENY, type, id);
  }

  public approve(type: RequestActionType, id: number = 0) {
    this.performAction(RequestAction.APPROVE, type, id);
  }

  private performAction(action: RequestAction, type: RequestActionType, id: number = 0) {
    return this.api.putRequest(`/Request/${type}/${action}`, {}, {id: id});
  }
}
