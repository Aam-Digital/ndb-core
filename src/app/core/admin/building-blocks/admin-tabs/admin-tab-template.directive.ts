import { Directive, Input } from "@angular/core";

// following guide from https://medium.com/@thomas.laforge/ngtemplateoutlet-type-checking-5d2dcb07a2c6
// to ensure typing of ng-template context

interface AdminTabTemplateContext<T> {
  $implicit: T;
  index: number;
}

@Directive({
  selector: "ng-template[appAdminTabTemplate]",
  standalone: true,
})
export class AdminTabTemplateDirective<T> {
  @Input("appAdminTabTemplate") tabs!: T[];

  static ngTemplateContextGuard<TContext>(
    dir: AdminTabTemplateDirective<TContext>,
    ctx: unknown,
  ): ctx is AdminTabTemplateContext<TContext> {
    return true;
  }
}
