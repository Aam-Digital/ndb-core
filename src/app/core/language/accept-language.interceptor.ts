import { Injectable, LOCALE_ID, inject } from "@angular/core";
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable()
export class AcceptLanguageInterceptor implements HttpInterceptor {
  private locale = inject(LOCALE_ID);

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(
      request.clone({ setHeaders: { "Accept-Language": this.locale } }),
    );
  }
}
