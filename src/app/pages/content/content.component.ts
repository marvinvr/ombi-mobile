import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MovieContent } from 'src/app/base/content-row/content-types/movie-row';
import { TvContent } from 'src/app/base/content-row/content-types/tv-row';
import { ContentClass } from 'src/models/content';
import { RequestActionType, RequestType } from 'src/models/requests';
import { MovieService } from 'src/services/movie.service';
import { RequestsService } from 'src/services/requests.service';
import { TvService } from 'src/services/tv.service';

@Component({
  selector: 'app-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.scss'],
})
export class ContentComponent implements OnInit, OnDestroy {
  public content: ContentClass;

  @Output() back: EventEmitter<void> = new EventEmitter<void>();

  private subscription: Subscription;

  constructor(
    private requests: RequestsService,
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private tvService: TvService
  ) { }

  ngOnInit() {
    this.subscription = this.route.paramMap.subscribe( params => {
      let type = params.get('type');
      let id = params.get('id')
      switch (type) {
        case RequestActionType.TV:
          if(!this.tvService?.shows[id]) this.router.navigate(['/']);
          else this.content = new TvContent(this.tvService?.shows[id])
          break;
        case RequestActionType.MOVIE:
          if(!this.movieService?.movies[id]) this.router.navigate(['/']);
          else this.content = new MovieContent(this.movieService?.movies[id])
          break;
      }
    })
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  get type(): RequestType {
    return this.content.type;
  }

  get label(): string {
    return this.content.available ? 'Available' : this.content.requested ? 'Requested' : `Request ${this.type == RequestType.TV ? this.type.toUpperCase() : this.type}`
  }

  get color(): string {
    return this.content.available ? 'success' : this.content.requested ? 'warning': 'success';
  }

  public goBack() {
    this.back.emit();
  }

  public request(): void {
    this.content.requested = true;
    this.requests.request(this.content.type, this.content.id).then();
  }
}
