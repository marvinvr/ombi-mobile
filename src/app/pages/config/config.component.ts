import { Component, OnInit } from '@angular/core';
import { Settings } from 'src/models/settings';
import { ToastType } from 'src/models/toast';
import { AuthService } from 'src/services/auth.service';
import { CredentialsService } from 'src/services/credentials.service';
import { SettingsService } from 'src/services/settings.service';
import { ToastService } from 'src/services/toast.service';
import { InputType } from '../../../models/input';
import { Router } from '@angular/router';

@Component({
  selector: 'app-config',
  templateUrl: './config.component.html',
  styleUrls: ['./config.component.scss'],
})
export class ConfigComponent implements OnInit {

  public validUrl = false;
  public hasOauth = false;

  public model = {
    ombiUrl: '',
    username: '',
    password: ''
  };

  private baseUrlTimeout;

  constructor(
    private credentials: CredentialsService,
    private auth: AuthService,
    private toast: ToastService,
    private settings: SettingsService,
    private router: Router
  ) { }

  public get inputType(): typeof InputType {
    return InputType;
  }

  public get hasBaseUrl(): boolean {
    return this.model.ombiUrl !== '';
  }

  public get hasCredentials(): boolean {
    return this.model.username !== '' && this.model.password !== '' && this.hasBaseUrl;
  }

  public get isPredefinedUrl(): boolean {
    return this.settings.get(Settings.IS_PREDEFINED_URL);
  }

  public prettifyUrl(url: string | undefined): string {
    if (!url) {
      return '';
    }
    return url.replace('https://', '').replace('http://', '');
  }

  public openLink(): void {
    window.open(this.model.ombiUrl, '_blank');
  }

  ngOnInit() {
    this.model.ombiUrl = this.credentials.baseUrl;
    this.model.username = this.credentials.username;
    this.model.password = this.credentials.password;
    this.validUrl = this.settings.get(Settings.URL_IS_VALID);
    this.hasOauth = this.settings.get(Settings.URL_HAS_OAUTH);
    this.settings.change.subscribe(() => {
      this.validUrl = this.settings.get(Settings.URL_IS_VALID);
      this.hasOauth = this.settings.get(Settings.URL_HAS_OAUTH);
    });
  }

  public submit() {
    this.credentials.username = this.model.username;
    this.credentials.password = this.model.password;
    this.credentials.token = '';
    this.auth.fetchToken()
      .then((t) => {
        this.toast.show(ToastType.SUCCESS, `Signed in as ${this.credentials.name}!`);
        this.router.navigate(['search']);
      })
      .catch(e => this.toast.show(ToastType.ERROR, 'Unable to sign in with these credentials'));
  }

  public submitWithPlex() {
    this.auth.triggerPlexOauth()
      .then((t) => {
        this.toast.show(ToastType.SUCCESS, `Signed in as ${this.credentials.name}!`);
        this.router.navigate(['search']);
      })
      .catch(e => this.toast.show(ToastType.ERROR, 'Unable to sign in with Plex'));
  }

  public baseUrlChange(): void {
    if (this.baseUrlTimeout) {
      clearTimeout(this.baseUrlTimeout);
    }
    this.baseUrlTimeout = setTimeout(() => {
      this.credentials.baseUrl = this.model.ombiUrl;
      this.auth.updateAuthConfig();
    }, 300);
  }

  public openGithub(): void {
    location.href = 'https://github.com/marvinvr/ombi-mobile';
  }

}
