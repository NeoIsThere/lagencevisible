import type { Routes } from '@angular/router';
import { loginGuard } from './auth.service';
export const operatorRoutes: Routes = [{
  path: '', canActivateChild: [loginGuard], children: [
    { path: 'campaigns', loadComponent: () => import('./campaigns/campaigns.component').then(m => m.CampaignsComponent), title: 'Campaigns · L’agence visible' },
    { path: 'locations', loadComponent: () => import('./locations/locations.component').then(m => m.LocationsComponent), title: 'Locations · L’agence visible' },
    { path: 'configuration', loadComponent: () => import('./configuration/configuration.component').then(m => m.ConfigurationComponent), title: 'Configuration · L’agence visible' },
    { path: '', pathMatch: 'full', redirectTo: 'campaigns' },
    { path: '**', redirectTo: 'campaigns' },
  ],
}];
