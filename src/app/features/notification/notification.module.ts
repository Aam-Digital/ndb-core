import { NgModule } from "@angular/core";
import { Routes } from "@angular/router";

@NgModule({})
export class NotificationModule {
  static readonly routes: Routes = [
    {
      path: ":id",
      loadComponent: () =>
        import(
          "./notification-link/notification-link.component"
        ).then((c) => c.NotificationLinkComponent),
    },
  ];
}
