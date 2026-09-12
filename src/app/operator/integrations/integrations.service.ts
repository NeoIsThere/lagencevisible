import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import type { Observable } from "rxjs";
import type { IntegrationsDashboard } from "../models";

@Injectable({ providedIn: "root" })
export class IntegrationsService {
  private readonly http = inject(HttpClient);

  dashboard(): Observable<IntegrationsDashboard> {
    return this.http.get<IntegrationsDashboard>("/api/integrations");
  }
}
