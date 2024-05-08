import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { Observable } from "rxjs";
import { concatMap, debounceTime, tap } from "rxjs/operators";
import { Router } from "@angular/router";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { UserRoleGuard } from "../../permissions/permission-guard/user-role.guard";
import { MatFormFieldModule } from "@angular/material/form-field";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatInputModule } from "@angular/material/input";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { AsyncPipe, NgForOf, NgSwitch, NgSwitchCase } from "@angular/common";
import { EntityBlockComponent } from "../../basic-datatypes/entity/entity-block/entity-block.component";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { SearchService } from "./search.service";

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
    NgSwitch,
    NgSwitchCase,
    NgForOf,
    EntityBlockComponent,
    AsyncPipe,
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchComponent {
  static INPUT_DEBOUNCE_TIME_MS = 400;
  MIN_CHARACTERS_FOR_SEARCH = 2;

  readonly NOTHING_ENTERED = 0;
  readonly TOO_FEW_CHARACTERS = 1;
  readonly SEARCH_IN_PROGRESS = 2;
  readonly NO_RESULTS = 3;
  readonly SHOW_RESULTS = 4;
  readonly ILLEGAL_INPUT = 5;

  state = this.NOTHING_ENTERED;

  formControl = new FormControl("");

  results: Observable<Entity[]>;

  constructor(
    private router: Router,
    private userRoleGuard: UserRoleGuard,
    private searchService: SearchService,
  ) {
    this.results = this.formControl.valueChanges.pipe(
      debounceTime(SearchComponent.INPUT_DEBOUNCE_TIME_MS),
      tap((next) => (this.state = this.updateState(next))),
      concatMap((next: string) => this.searchResults(next)),
      untilDestroyed(this),
    );
  }

  private updateState(next: any): number {
    if (typeof next !== "string") {
      return this.ILLEGAL_INPUT;
    }
    if (next.length === 0) {
      return this.NOTHING_ENTERED;
    }
    if (!this.isRelevantSearchInput(next)) {
      return this.ILLEGAL_INPUT;
    }
    return next.length < this.MIN_CHARACTERS_FOR_SEARCH
      ? this.TOO_FEW_CHARACTERS
      : this.SEARCH_IN_PROGRESS;
  }

  async searchResults(next: string): Promise<Entity[]> {
    if (this.state !== this.SEARCH_IN_PROGRESS) {
      return [];
    }
    const entities = await this.searchService.getSearchResults(next);
    const filtered = this.prepareResults(entities);
    this.state = filtered.length === 0 ? this.NO_RESULTS : this.SHOW_RESULTS;
    return filtered;
  }

  async clickOption(optionElement) {
    await this.router.navigate([
      optionElement.value.getConstructor().route,
      optionElement.value.getId(true),
    ]);
    this.formControl.setValue("");
  }

  /**
   * Check if the input should start an actual search.
   * Only search for words starting with a char or number -> no searching for space or no input
   * @param searchText
   */
  private isRelevantSearchInput(searchText: string): boolean {
    return /^[a-zA-Z]+|\d+$/.test(searchText);
  }

  private prepareResults(entities: Entity[]): Entity[] {
    return entities.filter((entity) =>
      this.userRoleGuard.checkRoutePermissions(entity.getConstructor().route),
    );
  }
}
