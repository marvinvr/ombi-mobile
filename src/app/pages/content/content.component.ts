import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { MovieContent } from 'src/app/base/content-row/content-types/movie-row';
import { TvContent } from 'src/app/base/content-row/content-types/tv-row';
import { ContentClass } from 'src/models/content';
import { RequestActionType, RequestType } from 'src/models/requests';
import { CredentialsService } from 'src/services/credentials.service';
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
  public isLoading = false;
  public isRequest = false;

  private subscription: Subscription;

  constructor(
    private requests: RequestsService,
    private route: ActivatedRoute,
    private router: Router,
    private movieService: MovieService,
    private tvService: TvService,
    private credentials: CredentialsService
  ) { }

  get type(): RequestType {
    return this.content.type;
  }

  get label(): string {
    return this.content.available ? 'Available'
    : this.content.approved ? 'Approved'
    : this.content.denied ? 'Denied'
    : this.content.requested ? 'Requested'
    : '';
  }

  get color(): 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'light' {
    return this.content.available ? 'success'
    : this.content.approved ? 'secondary'
    : this.content.denied ? 'danger'
    : this.content.requested ? 'warning'
    : 'success';
  }

  get fabIcon(): string {
    return this.content?.available ? 'checkmark'
    : this.content?.approved ? 'cloud-download-outline'
    : this.content?.denied ? 'close-outline'
    : this.content?.requested ? 'person-outline'
    : 'download-outline';
  }

  get icon(): string {
    return this.content?.type === 'movie' ? 'film' : 'tv-outline';
  }

  get contentName(): string {
    return this.content?.type === 'movie' ? 'Movie' : 'TV-Show';
  }

  ngOnInit() {
    this.isLoading = true;
    this.subscription = this.route.paramMap.subscribe( params => {
      this.isRequest = this.router.url.includes('request');
      const type = params.get('type');
      const id = params.get('id');
      switch (type) {
        case 'tv':
          this.tvService.get(id)
            .then((show) => {
              if(!show) {
                this.router.navigate(['/']);
              }
              this.content = new TvContent(show);
              this.isLoading = false;
            });
          break;
        case 'movie':
          this.movieService.get(id)
            .then((movie) => {
              if(!movie) {
                this.router.navigate(['/']);
              }
              this.content = new MovieContent(movie);
              this.isLoading = false;
            });
      }
    });
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  public goBack() {
    if(this.isRequest) {
      this.router.navigate(['requests']);
    } else {
      this.router.navigate(['search']);
    }
  }

  public request(): void {
    this.content.requested = true;
    if(this.credentials.hasAutoApprove(this.content.type)) {
      this.content.approved = true;
    }
    this.requests.request(this.content.type, this.content.id)
      .then()
      .catch(() => {
        this.content.requested = false;
        this.content.approved = false;
      });
  }
}
