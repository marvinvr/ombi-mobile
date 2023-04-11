import { Injectable } from '@angular/core';
import { ApiService } from './api.service';

@Injectable({
    providedIn: 'root'
})
export class SearchService {
    constructor(private api: ApiService) { }

    public search(term: string) {
        return this.api.post(`/search/multi/${term}`, {}, {}).then(toContent);
    }
}