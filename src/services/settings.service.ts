import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { PredefinedSetting, Settings, SETTINGS_STORAGE_KEY } from 'src/models/settings';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private settings = {};
  private settingsChange = new Subject();

  constructor(private http: HttpClient) {
    this.init();
  }

  public get change(): Subject<any> {
    return this.settingsChange;
  }

  public set(key: Settings, value: any): void {
    this.settings[key] = value;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(this.settings));
    this.settingsChange.next(null);
  }

  public get(key: Settings): any {
    return this.settings[key];
  }

  public fetchPredefinedSetting(setting: PredefinedSetting): Observable<string> {
    return this.http.get(`/assets/settings/${setting as string}.txt`, {responseType: 'text'});
  }

  private init() {
    this.settings = JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY)) || {};
  }
}
