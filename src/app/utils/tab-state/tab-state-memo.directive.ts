import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { MatTabGroup } from "@angular/material/tabs";
import { ChangeDetectorRef, Directive, OnInit, inject } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ViewComponentContext } from "../../core/ui/abstract-view/view-component-context";
import { filter, startWith } from "rxjs/operators";

/**
 * Memorizes the current state of a `TabGroup` (i.e. which tab currently is selected)
 * in the URL and sets the initial value to a value that was previously set.
 *
 * This enables navigation throughout the app while memorizing the state a tab was in
 * Usage (only the directive is required, the rest is automatic):
 * ```
 * <mat-tab-group appTabStateMemo>
 *   ...
 * </mat-tab-group>
 * ```
 */
@UntilDestroy()
@Directive({
  selector: "[appTabStateMemo]",
  // eslint-disable-next-line @angular-eslint/prefer-standalone
  standalone: false,
})
export class TabStateMemoDirective implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private tab = inject(MatTabGroup);
  private cdr = inject(ChangeDetectorRef);
  private viewContext = inject(ViewComponentContext, { optional: true });

  private readonly tabIndexKey = "tabIndex";

  ngOnInit() {
    if (this.viewContext?.isDialog) {
      // does not apply if opened in popup
      return;
    }

    // React to NavigationEnd (not just snapshot) so that navigating to
    // ?tabIndex=N while already on this page also updates the tab.
    // startWith(null) covers the initial load synchronously.
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        startWith(null),
        untilDestroyed(this),
      )
      .subscribe(() => {
        const potentialNextTabIndex = parseInt(
          this.route.snapshot.queryParamMap.get(this.tabIndexKey),
          10,
        );
        if (
          !Number.isNaN(potentialNextTabIndex) &&
          this.tab.selectedIndex !== potentialNextTabIndex
        ) {
          this.tab.selectedIndex = potentialNextTabIndex;
          // Trigger change detection so MatTabGroup actually applies the switch.
          // Without this, an in-app navigation that only changes the tabIndex
          // query param updates the URL but not the visible tab (OnPush parents).
          this.cdr.markForCheck();
        }
      });
    this.tab.selectedIndexChange
      .pipe(untilDestroyed(this))
      .subscribe((next) => this.updateURLQueryParams(next));
  }

  // Update the URL
  private async updateURLQueryParams(value: number) {
    if (this.viewContext?.isDialog) {
      // does not apply if opened in popup
      return;
    }

    await this.router.navigate(["."], {
      relativeTo: this.route,
      queryParams: { [this.tabIndexKey]: value },
      replaceUrl: true,
      queryParamsHandling: "merge",
    });
  }
}
