import type { Routes } from "@angular/router";
import { loginGuard } from "./auth.service";

const protectedRoutes: Routes = [
  {
    path: "candidates/attention",
    loadComponent: () => import("./research/research.component").then(({ ResearchComponent }) => ResearchComponent),
    title: "Needs attention · Local Lead Engine",
  },
  {
    path: "candidates",
    loadComponent: () => import("./dashboard/dashboard.component").then(({ DashboardComponent }) => DashboardComponent),
    title: "Candidates · Local Lead Engine",
  },
  {
    path: "search",
    loadComponent: () => import("./settings/settings.component").then(({ SettingsComponent }) => SettingsComponent),
    title: "Search · Local Lead Engine",
  },
  {
    path: "advanced",
    loadComponent: () => import("./advanced/advanced.component").then(({ AdvancedComponent }) => AdvancedComponent),
    children: [
      { path: "", pathMatch: "full", redirectTo: "integration" },
      {
        path: "integration",
        loadComponent: () => import("./integrations/integrations.component").then(({ IntegrationsComponent }) => IntegrationsComponent),
        title: "Integration · Local Lead Engine",
      },
      {
        path: "database",
        loadComponent: () => import("./database/database.component").then(({ DatabaseComponent }) => DatabaseComponent),
        title: "Database · Local Lead Engine",
      },
      {
        path: "environment",
        loadComponent: () => import("./environment/environment.component").then(({ EnvironmentComponent }) => EnvironmentComponent),
        title: "Environment · Local Lead Engine",
      },
    ],
  },

  // Keep old bookmarks useful without exposing retired pages in the navigation.
  { path: "", pathMatch: "full", redirectTo: "candidates" },
  { path: "settings", pathMatch: "full", redirectTo: "search" },
  { path: "integrations", pathMatch: "full", redirectTo: "advanced/integration" },
  { path: "database", pathMatch: "full", redirectTo: "advanced/database" },
  { path: "environment", pathMatch: "full", redirectTo: "advanced/environment" },
  { path: "history", pathMatch: "full", redirectTo: "candidates" },
  { path: "research", pathMatch: "full", redirectTo: "candidates/attention" },
  { path: "data", pathMatch: "full", redirectTo: "advanced/database" },
  { path: "**", redirectTo: "candidates" },
];

export const operatorRoutes: Routes = [
  { path: "", canActivateChild: [loginGuard], children: protectedRoutes },
];
