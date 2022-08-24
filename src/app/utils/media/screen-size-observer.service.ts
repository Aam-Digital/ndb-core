import { combineLatest, fromEvent, Observable } from "rxjs";
import { Inject, Injectable } from "@angular/core";
import { distinctUntilChanged, map, startWith } from "rxjs/operators";
import { WINDOW_TOKEN } from "../di-tokens";

/*
 * Constants that are used for
 */

// const XS = "0px";
const SM = "576px";
const MD = "768px";
const LG = "992px";
const XL = "1200px";
const XXL = "1400px";

/**
 * Different ranges of screen sizes.
 */
/* Implementation note: This is implemented as an enum (as opposed to a string-type)
 * so that
 * ```
 * sizeA: ScreenSize = ...
 * sizeB: ScreenSize = ...
 *
 * aIsGreaterThanB: boolean = sizeA > sizeB
 * ```
 * makes sense.
 */
export enum ScreenSize {
  // extra small (0px <= width < 576px)
  xs = 0,
  // medium small (576px <= width < 768px)
  sm = 1,
  // medium (768px <= width < 992px)
  md = 2,
  // large (992px <= width < 1200px)
  lg = 3,
  // extra large (1200px <= width < 1400px)
  xl = 4,
  // extra-extra large (1400 <= width)
  xxl = 5,
}

/**
 * The screen size where anything smaller and this size itself is considered mobile while anything strictly larger
 * is considered desktop.
 *
 */
export const MOBILE_THRESHOLD: ScreenSize = ScreenSize.sm;

/**
 * A type that is used to document the return type of the `platform` observable.
 * A variable that has this type shall only have two values that are encoded in
 * a boolean way:
 *
 * - `true`: the variable represents that the width of something is considered 'desktop width'
 * - `false`: the variable represents that the width of something is considered 'mobile width'
 */
export type IsDesktop = boolean;

/**
 * This can be used to check the current screen size programmatically
 * and get notified when it changes. Use the {@link shared} observable to
 * get notified on any changes. This observable is shared across all instances and
 * will persist throughout the lifespan of the app.
 *
 * The `platform` observable emits changes whenever the screen size changes to
 * where the app is considered to be in Mobile mode vs. desktop mode.
 *
 * This class can also be used statically to check the current screen size and/or check whether
 * the app is currently considered to be in mobile mode or desktop mode.
 */
@Injectable({
  providedIn: "root",
})
export class ScreenWidthObserver {
  /**
   * create an observable that emits whenever the `query` matches.
   * Also emits the current state to begin with.
   * @param query The query to check
   * @private
   */
  private static matching(query: MediaQueryList): Observable<boolean> {
    return fromEvent<MediaQueryListEvent>(query, "change").pipe(
      map((event) => event.matches),
      startWith(query.matches)
    );
  }

  /**
   * The internal query lists that are used to check the current screen sizes
   * @private
   */
  private queryLists: MediaQueryList[] = [SM, MD, LG, XL, XXL].map((size) =>
    // matches when the screen's width is greater than `size`
    this.window.matchMedia(`screen and (min-width: ${size})`)
  );

  /**
   * The observable shared amongst all instances.
   * Subscribers to this observable get notified whenever the current screen size changes
   */
  public readonly shared: Observable<ScreenSize>;

  /**
   * An observable that emits whenever the screen size changes so that the app is considered
   * to be on a mobile device or a desktop device.
   */
  public readonly platform: Observable<IsDesktop>;

  constructor(@Inject(WINDOW_TOKEN) private window: Window) {
    this.shared = combineLatest(
      this.queryLists.map((queryList) =>
        ScreenWidthObserver.matching(queryList)
      )
    ).pipe(
      map((value) => {
        // when this returns -1 then no query is active. This means
        // that the screen size is less than `SM`, i.e. `XS`
        return value.lastIndexOf(true) + 1;
      })
    );

    this.platform = this.shared.pipe(
      map((screenSize) => screenSize > MOBILE_THRESHOLD),
      distinctUntilChanged()
    );
  }

  /**
   * Return the current screen size as determined by the media queries
   */
  public currentScreenSize(): ScreenSize {
    return (
      this.queryLists.map((queryList) => queryList.matches).lastIndexOf(true) +
      1
    );
  }

  /**
   * returns whether or not the app is currently considered to be in desktop mode
   * looking only at the screen size.
   */
  public isDesktop(): IsDesktop {
    return this.currentScreenSize() <= MOBILE_THRESHOLD;
  }
}
