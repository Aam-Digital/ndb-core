import { Component, Input } from "@angular/core";
import { Entity } from "../../entity/model/entity";
import { BehaviorSubject } from "rxjs";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatChipsModule } from "@angular/material/chips";
import { MatAutocompleteModule } from "@angular/material/autocomplete";
import { UntilDestroy } from "@ngneat/until-destroy";
import { EntityMapperService } from "../../entity/entity-mapper/entity-mapper.service";
import { MatFormFieldModule } from "@angular/material/form-field";
import { AsyncPipe, NgForOf, NgIf } from "@angular/common";
import { DisplayEntityComponent } from "../../basic-datatypes/entity/display-entity/display-entity.component";
import { FontAwesomeModule } from "@fortawesome/angular-fontawesome";
import { MatTooltipModule } from "@angular/material/tooltip";
import { MatInputModule } from "@angular/material/input";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { ErrorHintComponent } from "../error-hint/error-hint.component";
import { BasicAutocompleteComponent } from "../basic-autocomplete/basic-autocomplete.component";
import { MatSlideToggle } from "@angular/material/slide-toggle";
import { asArray } from "../../../utils/utils";

@Component({
  selector: "app-entity-select",
  templateUrl: "./entity-select.component.html",
  styleUrls: ["./entity-select.component.scss"],
  imports: [
    MatFormFieldModule,
    NgIf,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatChipsModule,
    NgForOf,
    DisplayEntityComponent,
    FontAwesomeModule,
    MatTooltipModule,
    MatInputModule,
    MatCheckboxModule,
    AsyncPipe,
    ErrorHintComponent,
    BasicAutocompleteComponent,
    MatSlideToggle,
    FormsModule,
  ],
  standalone: true,
})
@UntilDestroy()
export class EntitySelectComponent<
  E extends Entity,
  T extends string[] | string = string[],
> {
  readonly loadingPlaceholder = $localize`:A placeholder for the input element when select options are not loaded yet:loading...`;

  @Input() form: FormControl<T>;

  /**
   * The entity-type (e.g. 'Child', 'School', e.t.c.) to set.
   * @param type The ENTITY_TYPE of a Entity. This affects the entities which will be loaded and the component
   *             that displays the entities. Can be an array giving multiple types.
   * @throws Error when `type` is not in the entity-map
   */
  @Input() set entityType(type: string | string[]) {
    this._entityType = Array.isArray(type) ? type : [type];
    this.loadAvailableEntities();
  }

  private _entityType: string[];

  /**
   * Whether users can select multiple entities.
   */
  @Input() multi: boolean = true;

  /**
   * The label is what is seen above the list. For example when used
   * in the note-details-view, this is "Children"
   */
  @Input() label: string;

  /**
   * The placeholder is what is seen when someone clicks into the input-
   * field and adds new entities.
   * In the note-details-view, this is "Add children..."
   * The placeholder is only displayed if `loading === false`
   */
  @Input() placeholder: string;

  /**
   * Whether to show entities in the list.
   * Entities can still be selected using the autocomplete,
   * and {@link selection} as well as {@link selectionChange} will
   * still work as expected
   */
  @Input() showEntities = true;

  /**
   * true when this is loading and false when it's ready.
   * This subject's state reflects the actual loading resp. the 'readiness'-
   * state of this component. Will trigger once loading is done
   */
  loading = new BehaviorSubject(true);
  allEntities: E[] = [];
  availableOptions = new BehaviorSubject<E[]>([]);

  @Input() includeInactive: boolean = false;

  constructor(private entityMapperService: EntityMapperService) {}

  /**
   * The accessor used for filtering and when selecting a new
   * entity.
   * <br> Per default, this filters for the name. If the entity
   * has no name, this filters for the entity's id.
   */
  @Input() accessor: (e: Entity) => string = (e) => e.toString();
  entityToId = (option: E) => option.getId();

  @Input() additionalFilter: (e: E) => boolean = (_) => true;

  private async loadAvailableEntities() {
    this.loading.next(true);

    this.allEntities = [];
    for (const type of this._entityType) {
      this.allEntities.push(
        ...(await this.entityMapperService.loadType<E>(type)),
      );
    }
    this.allEntities.sort((a, b) => a.toString().localeCompare(b.toString()));

    this.updateAvailableOptions();

    this.loading.next(false);
  }

  private updateAvailableOptions() {
    const includeInactive = (entity: E) =>
      this.includeInactive || entity.isActive;
    const includeSelected = (entity: E) =>
      asArray(this.form.value).includes(entity.getId());

    this.availableOptions.next(
      this.allEntities.filter((e) => includeInactive(e) || includeSelected(e)),
    );
  }

  toggleIncludeInactive() {
    this.includeInactive = !this.includeInactive;
    this.updateAvailableOptions();
  }
}
