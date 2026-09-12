import { inject, Injectable, signal } from "@angular/core";
import { HttpClient, HttpErrorResponse, type HttpInterceptorFn } from "@angular/common/http";
import { Router, type CanActivateChildFn } from "@angular/router";
import { catchError, firstValueFrom, throwError } from "rxjs";
import { operatorApiUrl } from "../core/site.config";

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly http = inject(HttpClient);
  readonly username = signal<string | null>(null);

  async restore(): Promise<boolean> {
    if (this.username()) return true;
    try {
      const session = await firstValueFrom(this.http.get<{ username: string }>("/api/auth/session"));
      this.username.set(session.username);
      return true;
    } catch {
      this.username.set(null);
      return false;
    }
  }

  async login(username: string, password: string): Promise<void> {
    const session = await firstValueFrom(this.http.post<{ username: string }>("/api/auth/login", { username, password }));
    this.username.set(session.username);
  }

  async logout(): Promise<void> {
    await firstValueFrom(this.http.post<void>("/api/auth/logout", {}));
    this.username.set(null);
  }
}

export const loginGuard: CanActivateChildFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return await auth.restore() || router.createUrlTree(["/login"], {
    queryParams: { returnUrl: state.url },
    queryParamsHandling: "replace",
  });
};

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const operatorRequest = /^\/(?:api|screenshots)(?:\/|$)/.test(request.url);
  const outgoing = operatorRequest
    ? request.clone({ url: operatorApiUrl(request.url), withCredentials: true })
    : request;
  return next(outgoing).pipe(catchError((error: unknown) => {
    if (request.url.startsWith("/api/") && !request.url.startsWith("/api/auth/") && error instanceof HttpErrorResponse && error.status === 401) {
      auth.username.set(null);
      if (!router.url.startsWith("/login")) void router.navigate(["/login"], { queryParams: { returnUrl: router.url } });
    }
    return throwError(() => error);
  }));
};
