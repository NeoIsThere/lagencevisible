import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { LocationStrategy, PathLocationStrategy } from '@angular/common';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: LocationStrategy, useClass: PathLocationStrategy },
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
