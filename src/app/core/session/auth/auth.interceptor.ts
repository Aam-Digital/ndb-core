import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpContextToken,
  HttpErrorResponse,
  HttpStatusCode,
} from "@angular/common/http";
import { concatMap, from, Observable } from "rxjs";
import { AuthService } from "./auth.service";
import { catchError } from "rxjs/operators";

/**
 * This context can be used to prevent the Bearer token to be set by this interceptor.
 * This can be useful when a request goes to a 3rd party service e.g. GitHub.
 *
 * Usage:
 * ```javascript
 * this.httpClient.get(`...`, { context: new HttpContext().set(AUTH_ENABLED, false) });
 * ```
 */
export const AUTH_ENABLED = new HttpContextToken(() => true);

/**
 * This interceptor adds the required auth headers to all outgoing requests of the HttpClient service.
 * This allows other backend services to verify, whether a user is properly logged in.
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    const authEnabled = request.context.get(AUTH_ENABLED);
    if (authEnabled) {
      request = this.getRequestWithAuth(request);
    }
    return next.handle(request).pipe(
      catchError((err: HttpErrorResponse) => {
        if (err.status === HttpStatusCode.Unauthorized && authEnabled) {
          return from(this.authService.autoLogin()).pipe(
            catchError(() => {
              // re-throw initial error
              throw err;
            }),
            concatMap(() => next.handle(this.getRequestWithAuth(request)))
          );
        } else {
          throw err;
        }
      })
    );
  }

  private getRequestWithAuth(request: HttpRequest<any>): HttpRequest<any> {
    const headers = {} as any;
    this.authService.addAuthHeader(headers);
    // The request needs to be cloned as they are immutable
    return request.clone({ setHeaders: headers });
  }
}
