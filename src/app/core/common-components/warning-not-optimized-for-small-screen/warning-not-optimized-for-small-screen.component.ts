import { ChangeDetectionStrategy, Component, inject } from "@angular/core";
import { BreakpointObserver, Breakpoints } from "@angular/cdk/layout";
import { toSignal } from "@angular/core/rxjs-interop";
import { map } from "rxjs/operators";
import { FaIconComponent } from "@fortawesome/angular-fontawesome";

/**
 * Displays an inline warning banner when the user is on a small screen (≤599px),
 * indicating that the current page is not optimized for small screens.
 *
 * Add `<app-warning-not-optimized-for-small-screen />` at the top of any complex
 * page template that is not suited for mobile use.
 */
@Component({
  selector: "app-warning-not-optimized-for-small-screen",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FaIconComponent],
  templateUrl: "./warning-not-optimized-for-small-screen.component.html",
  styleUrl: "./warning-not-optimized-for-small-screen.component.scss",
})
export class WarningNotOptimizedForSmallScreenComponent {
  private breakpointObserver = inject(BreakpointObserver);

  isSmallScreen = toSignal(
    this.breakpointObserver
      .observe(Breakpoints.XSmall)
      .pipe(map((result) => result.matches)),
    { initialValue: false },
  );
}
