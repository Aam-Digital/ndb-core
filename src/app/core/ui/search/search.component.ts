import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  ViewChild,
  ViewEncapsulation,
  inject,
} from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { BehaviorSubject, Observable, from, of } from "rxjs";
import { switchMap, debounceTime, tap, map, catchError } from "rxjs/operators";
import { Router } from "@angular/router";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { UserRoleGuard } from "../../permissions/permission-guard/user-role.guard";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatInputModule } from "@angular/material/input";
import {
  MatAutocomplete,
  MatAutocompleteModule,
} from "@angular/material/autocomplete";
import { AsyncPipe } from "@angular/common";
import { EntityBlockComponent } from "../../basic-datatypes/entity/entity-block/entity-block.component";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { SearchService } from "./search.service";
import { ScreenWidthObserver } from "app/utils/media/screen-size-observer.service";
import { MatButtonModule } from "@angular/material/button";

/**
 * General search box that provides results out of any kind of entities from the system
 * as soon as the user starts typing.
 *
 * This is usually displayed in the app header to be available to the user anywhere, allowing to navigate quickly.
 */
@UntilDestroy()
@Component({
  selector: "app-search",
  templateUrl: "./search.component.html",
  styleUrls: ["./search.component.scss"],
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatFormFieldModule,
    FontAwesomeModule,
    MatInputModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    EntityBlockComponent,
    AsyncPipe,
    MatButtonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent {
  private router = inject(Router);
  private userRoleGuard = inject(UserRoleGuard);
  private searchService = inject(SearchService);
  private readonly resultsSubject = new BehaviorSubject<Entity[]>([]);

  static INPUT_DEBOUNCE_TIME_MS = 400;
  MIN_CHARACTERS_FOR_SEARCH = 2;

  readonly NOTHING_ENTERED = 0;
  readonly TOO_FEW_CHARACTERS = 1;
  readonly SEARCH_IN_PROGRESS = 2;
  readonly NO_RESULTS = 3;
  readonly SHOW_RESULTS = 4;

  state = this.NOTHING_ENTERED;

  mobile = false;
  searchActive = false;

  formControl = new FormControl("");

  results: Observable<Entity[]> = this.resultsSubject.asObservable();
  @ViewChild("searchInput") searchInput: ElementRef<HTMLInputElement>;
  @ViewChild("autoResults") autocomplete: MatAutocomplete;

  private currentSearchString = "";

  constructor() {
    const screenWithObserver = inject(ScreenWidthObserver);

    screenWithObserver
      .platform()
      .pipe(untilDestroyed(this))
      .subscribe((isDesktop) => (this.mobile = !isDesktop));

    this.formControl.valueChanges
      .pipe(
        debounceTime(SearchComponent.INPUT_DEBOUNCE_TIME_MS),
        tap((next) => {
          const searchTerm = this.normalizeSearchTerm(next);
          this.currentSearchString = searchTerm;
          this.state = this.updateState(searchTerm);
        }),
        map((next) => this.normalizeSearchTerm(next)),
        switchMap((next: string) => this.searchResults(next)),
        untilDestroyed(this),
      )
      .subscribe((entities) => {
        this.resultsSubject.next(entities);
      });
  }

  private updateState(searchTerm: string): number {
    if (searchTerm.length === 0) {
      return this.NOTHING_ENTERED;
    }
    return searchTerm.length < this.MIN_CHARACTERS_FOR_SEARCH
      ? this.TOO_FEW_CHARACTERS
      : this.SEARCH_IN_PROGRESS;
  }

  searchResults(searchTerm: string): Observable<Entity[]> {
    // Return empty results for invalid states or empty input
    if (this.state !== this.SEARCH_IN_PROGRESS) {
      return of([]);
    }

    const originalSearchString = searchTerm;

    return from(this.searchService.getSearchResults(searchTerm)).pipe(
      map((entities) => {
        if (this.currentSearchString !== originalSearchString) {
          // Abort because the results are not relevant anymore
          return [];
        }
        const filtered = this.prepareResults(entities);
        this.state =
          filtered.length === 0 ? this.NO_RESULTS : this.SHOW_RESULTS;
        return filtered;
      }),
      catchError((_err) => {
        this.state = this.NO_RESULTS;
        return of([]);
      }),
    );
  }

  async clickOption(optionElement) {
    await this.router.navigate([
      optionElement.value.getConstructor().route,
      optionElement.value.getId(true),
    ]);
    this.formControl.setValue("");
    this.state = this.NOTHING_ENTERED;
    if (this.mobile) {
      this.searchActive = false;
    }
  }

  private prepareResults(entities: Entity[]): Entity[] {
    return entities.filter((entity) =>
      this.userRoleGuard.checkRoutePermissions(entity.getConstructor().route),
    );
  }

  toggleSearch() {
    this.searchActive = !this.searchActive;
    if (!this.searchActive) {
      this.formControl.setValue("");
      this.currentSearchString = "";
      this.state = this.NOTHING_ENTERED;
    } else {
      setTimeout(() => this.searchInput?.nativeElement.focus());
    }
  }

  onFocusOut() {
    if (this.mobile && !this.autocomplete.isOpen) {
      this.searchActive = false;
    }
    // Reset state if field is empty when losing focus
    const currentValue = this.normalizeSearchTerm(this.formControl.value);
    if (currentValue.length === 0) {
      this.currentSearchString = "";
      this.state = this.NOTHING_ENTERED;
    }
  }

  private normalizeSearchTerm(searchTerm: unknown): string {
    return typeof searchTerm === "string" ? searchTerm.trim() : "";
  }
}
