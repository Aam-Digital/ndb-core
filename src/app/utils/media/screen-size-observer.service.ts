import { combineLatest, fromEvent, Observable } from "rxjs";
import { Inject, Injectable } from "@angular/core";
import { distinctUntilChanged, map, startWith } from "rxjs/operators";
import { WINDOW_TOKEN } from "../di-tokens";

/*
 * Constants describing the threshold values.
 * These constants are considered the lower limit, i.e. if
 * a screen is more than 576px large but less than 768px
 * the screen is considered SM.
 *
 * Any screen smaller than `SM` is considered `XS`
 */
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
  private static matching(
    query: MediaQueryList,
  ): Observable<MediaQueryListEvent> {
    return fromEvent<MediaQueryListEvent>(query, "change").pipe(
      startWith({
        matches: query.matches,
        media: query.media,
      } as MediaQueryListEvent),
    );
  }

  /**
   * The internal query lists that are used to check the current screen sizes
   * @private
   */
  private queryLists: MediaQueryList[] = [SM, MD, LG, XL, XXL].map((size) =>
    // matches when the screen's width is greater than `size`
    this.window.matchMedia(`screen and (min-width: ${size})`),
  );

  private readonly _shared: Observable<ScreenSize>;

  /**
   * The observable shared amongst all instances.
   * Subscribers to this observable get notified whenever the current screen size changes.
   *
   * When getting a new observable (or, in other words, when calling this function), the current
   * screen size is injected so that when you subscribe the first element that arrives is the current screen size.
   */
  public shared(): Observable<ScreenSize> {
    return this._shared.pipe(startWith(this.currentScreenSize()));
  }

  private readonly _platform: Observable<IsDesktop>;

  /**
   * An observable that emits whenever the screen size changes so that the app is considered
   * to be on a mobile device or a desktop device.
   */
  public platform(): Observable<IsDesktop> {
    return this._platform.pipe(startWith(this.isDesktop()));
  }

  constructor(@Inject(WINDOW_TOKEN) private window: Window) {
    this._shared = combineLatest(
      this.queryLists.map((queryList) =>
        ScreenWidthObserver.matching(queryList),
      ),
    ).pipe(
      map(() => {
        // Listening to the events requires parsing (or understanding) the event and the
        // attached media-string which requires more logic than simply computing the result in-place.
        return this.currentScreenSize();
      }),
    );

    this._platform = this._shared.pipe(
      map((screenSize) => screenSize > MOBILE_THRESHOLD),
      distinctUntilChanged(),
    );
  }

  /**
   * Return the current screen size as determined by the media queries
   */
  public currentScreenSize(): ScreenSize {
    // when this returns -1 then no query is active. This means
    // that the screen size is less than `SM`, i.e. `XS`
    return (
      this.queryLists.map((queryList) => queryList.matches).lastIndexOf(true) +
      1
    );
  }

  /**
   * returns whether the app is currently considered to be in desktop mode
   * looking only at the screen size.
   */
  public isDesktop(): IsDesktop {
    return this.currentScreenSize() > MOBILE_THRESHOLD;
  }
}
