import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ConfigComponent } from './config/config.component';
import { ContentComponent } from './content/content.component';
import { RequestsComponent } from './requests/requests.component';
import { SearchPageComponent } from './search/search-page.component';

const routes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        redirectTo: 'search',
    },
    {
        path: 'search',
        component: SearchPageComponent,
    },
    {
        path: 'requests',
        component: RequestsComponent,
    },
    {
        path: 'config',
        component: ConfigComponent,
    },
    {
        path: ':type/:id',
        component: ContentComponent
    }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PagesRoutingModule {}