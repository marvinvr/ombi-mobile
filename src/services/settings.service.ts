import { Injectable } from '@angular/core';
import { Subscriber } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { Settings, SETTINGS_STORAGE_KEY } from 'src/models/settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settings = {};
  private settingsChangeObservable = new Observable<void>(subscriber => this.subscriber = subscriber);
  private subscriber: Subscriber<void>;

  constructor() {
    this.init();
  }

  private init() {
    this.settings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)) || {};
  }

  public set(key: Settings, value: any): void {
    this.settings[key] = value;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings))
    this.subscriber?.next();
  }

  public get(key: Settings): any {
    return this.settings[key];
  }

  public change(): Observable<void> {
    return this.settingsChangeObservable;
  }
}
