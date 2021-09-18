import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ComingSoonComponent } from "./coming-soon/coming-soon.component";
import { MatButtonModule } from "@angular/material/button";
import { FlexModule } from "@angular/flex-layout";
import { RouterModule } from "@angular/router";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";

/**
 * Provides a generic page to announce features that are not implemented yet including tracking user interest to analytics.
 *
 * Either use the {@link ComingSoonComponent} in a template or lazy-load this module and simply navigate to it
 * with a parameter holding the feature id:
 *
 * Routing:
```
 {
    path: "coming-soon",
    loadChildren: () =>
      import("./core/coming-soon/coming-soon.module").then(
        (m) => m["ComingSoonModule"]
      ),
  }
```
 *
 * navigation to "coming-soon/my-new-feature" will then show a coming soon page and track interest for "my-new-feature".
 */
@NgModule({
  declarations: [ComingSoonComponent],
  imports: [
    CommonModule,
    MatButtonModule,
    FlexModule,
    RouterModule.forChild([
      {
        path: ":feature",
        component: ComingSoonComponent,
      },
    ]),
    FontAwesomeModule,
  ],
  exports: [RouterModule],
})
export class ComingSoonModule {}
