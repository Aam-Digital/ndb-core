import { Inject, Injectable, LOCALE_ID } from "@angular/core";
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable()
export class AcceptLanguageInterceptor implements HttpInterceptor {
  constructor(@Inject(LOCALE_ID) private locale: string) {}

  intercept(
    request: HttpRequest<unknown>,
    next: HttpHandler,
  ): Observable<HttpEvent<unknown>> {
    return next.handle(
      request.clone({ setHeaders: { "Accept-Language": this.locale } }),
    );
  }
}
