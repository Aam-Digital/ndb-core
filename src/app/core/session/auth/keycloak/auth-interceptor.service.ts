import { Injectable } from "@angular/core";
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
} from "@angular/common/http";
import { Observable } from "rxjs";
import { AuthService } from "../auth.service";

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
    // The request needs to be cloned as they are immutable
    const headers = {} as any;
    this.authService.addAuthHeader(headers);
    return next.handle(request.clone({ setHeaders: headers }));
  }
}
