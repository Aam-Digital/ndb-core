import { ActivatedRoute, Router } from "@angular/router";
import { MatTabGroup } from "@angular/material/tabs";
import { Directive, OnInit, Optional } from "@angular/core";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { ViewComponentContext } from "../../core/ui/abstract-view/abstract-view.component";

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
})
export class TabStateMemoDirective implements OnInit {
  private readonly tabIndexKey = "tabIndex";

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private tab: MatTabGroup,
    @Optional() private viewContext: ViewComponentContext,
  ) {}

  ngOnInit() {
    if (this.viewContext?.isDialog) {
      // does not apply if opened in popup
      return;
    }

    // This logic is purposefully in `ngOnInit` and not in the constructor,
    // so we can override values that are set by custom logic in the component
    // (i.e. we override any binding to [(selectedIndex)] for the initial index)
    const potentialNextTabIndex = parseInt(
      this.route.snapshot.queryParamMap.get(this.tabIndexKey),
      10,
    );
    if (!Number.isNaN(potentialNextTabIndex)) {
      this.tab.selectedIndex = potentialNextTabIndex;
    }
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
