import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { NavigationComponent } from './base/navigation/navigation.component';
import { InputComponent } from './base/input/input.component';
import { CommonModule } from '@angular/common';
import { ConfigComponent } from './pages/config/config.component';
import { RequestsComponent } from './pages/requests/requests.component';
import { SearchComponent } from './base/search/search.component';
import { HeaderComponent } from './base/header/header.component';
import { ListRemarkComponent } from './base/list-remark/list-remark.component';
import { ButtonComponent } from './base/button/button.component';
import { ContentRowComponent } from './base/content-row/content-row.component';
import { ContentComponent } from './pages/content/content.component';
import { ServiceWorkerModule } from '@angular/service-worker';
import { environment } from '../environments/environment';
import { SearchPageComponent } from './pages/search/search-page.component';

@NgModule({
    declarations: [
        AppComponent,
        ContentRowComponent,
        NavigationComponent,
        InputComponent,
        ConfigComponent,
        RequestsComponent,
        SearchComponent,
        SearchPageComponent,
        HeaderComponent,
        ButtonComponent,
        ContentComponent,
        ListRemarkComponent
    ],
    imports: [
        BrowserModule,
        CommonModule,
        IonicModule.forRoot(),
        AppRoutingModule,
        HttpClientModule,
        ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
        ServiceWorkerModule.register('ngsw-worker.js', {
          enabled: !isDevMode(),
          // Register the ServiceWorker as soon as the application is stable
          // or after 30 seconds (whichever comes first).
          registrationStrategy: 'registerWhenStable:30000'
        })
    ],
    providers: [
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
    ],
    bootstrap: [AppComponent]
})
export class AppModule {}
