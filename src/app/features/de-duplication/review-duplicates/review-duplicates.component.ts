import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  linkedSignal,
  OnInit,
  signal,
} from "@angular/core";
import { toObservable, toSignal } from "@angular/core/rxjs-interop";
import { catchError, map, of, startWith, switchMap } from "rxjs";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatProgressBarModule } from "@angular/material/progress-bar";
import { MatTableModule } from "@angular/material/table";
import { ActivatedRoute } from "@angular/router";
import { AlertService } from "#src/app/core/alerts/alert.service";
import { EntityBlockComponent } from "#src/app/core/basic-datatypes/entity/entity-block/entity-block.component";
import { ViewTitleComponent } from "#src/app/core/common-components/view-title/view-title.component";
import { EntityFieldSelectComponent } from "#src/app/core/entity/entity-field-select/entity-field-select.component";
import { EntityRegistry } from "#src/app/core/entity/database-entity.decorator";
import { EntityTypeSelectComponent } from "#src/app/core/entity/entity-type-select/entity-type-select.component";
import { EntityAbility } from "#src/app/core/permissions/ability/entity-ability";
import { DisableEntityOperationDirective } from "#src/app/core/permissions/permission-directive/disable-entity-operation.directive";
import { RouteTarget } from "../../../route-target";
import {
  DuplicateDetectionService,
  DuplicatePair,
  isMatchableField,
} from "../duplicate-detection.service";
import { EntityConstructor } from "#src/app/core/entity/model/entity";
import { EntitySchemaField } from "#src/app/core/entity/schema/entity-schema-field";
import { BulkMergeService } from "../bulk-merge-service";

@RouteTarget("ReviewDuplicates")
@Component({
  selector: "app-review-duplicates",
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: "./review-duplicates.component.html",
  styleUrls: ["./review-duplicates.component.scss"],
  imports: [
    ViewTitleComponent,
    EntityTypeSelectComponent,
    EntityFieldSelectComponent,
    EntityBlockComponent,
    DisableEntityOperationDirective,
    FormsModule,
    MatFormFieldModule,
    MatButtonModule,
    MatTableModule,
    MatPaginatorModule,
    MatProgressBarModule,
  ],
})
export class ReviewDuplicatesComponent implements OnInit {
  private readonly entityRegistry = inject(EntityRegistry);
  private readonly duplicateDetectionService = inject(
    DuplicateDetectionService,
  );
  private readonly bulkMergeService = inject(BulkMergeService);
  private readonly route = inject(ActivatedRoute);
  private readonly alertService = inject(AlertService);
  private readonly ability = inject(EntityAbility);

  ngOnInit() {
    const entityType = this.route.snapshot.queryParamMap.get("entityType");
    if (entityType) {
      this.selectedEntityType.set(entityType);
    }
  }

  selectedEntityType = signal<string>("");
  selectedFields = signal<string[]>([]);

  /** the search to run, or null while none has been started */
  private readonly request = signal<{
    ctor: EntityConstructor;
    fields: string[];
  } | null>(null);

  /**
   * The running analysis. It stays subscribed while a search is active, so the list
   * reflects merges and any other change to the data without searching again;
   * `switchMap` ends the previous analysis whenever a new search starts.
   */
  private readonly state = toSignal(
    toObservable(this.request).pipe(
      switchMap((request) =>
        request
          ? this.duplicateDetectionService
              .watchDuplicates(request.ctor, request.fields)
              .pipe(
                map((pairs) => ({ status: "ready", pairs }) as const),
                startWith({ status: "loading" } as const),
                catchError((e) => {
                  this.alertService.addDanger(
                    $localize`Could not search for duplicates: ${e instanceof Error ? e.message : e}`,
                  );
                  return of({ status: "idle" } as const);
                }),
              )
          : of({ status: "idle" } as const),
      ),
    ),
    { initialValue: { status: "idle" } as const },
  );

  /** read-only: the pairs are maintained by the analysis, not set from here */
  readonly pairs = computed<DuplicatePair[]>(() => {
    const state = this.state();
    return state.status === "ready" ? state.pairs : [];
  });
  readonly isLoading = computed(() => this.state().status === "loading");
  readonly searched = computed(() => this.state().status === "ready");

  pageSize = signal(5);
  /** clamped to the last page, as the list shrinks whenever a duplicate is resolved */
  pageIndex = linkedSignal<{ pairs: number; pageSize: number }, number>({
    source: () => ({ pairs: this.pairs().length, pageSize: this.pageSize() }),
    computation: ({ pairs, pageSize }, previous) =>
      Math.min(
        previous?.value ?? 0,
        Math.max(Math.ceil(pairs / pageSize) - 1, 0),
      ),
  });

  readonly displayedColumns = ["record", "possibleDuplicate", "actions"];

  paginatedPairs = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.pairs().slice(start, start + this.pageSize());
  });

  /** fields whose values could never match, see {@link isMatchableField} */
  readonly hideUnmatchableField = (field: EntitySchemaField) =>
    !isMatchableField(field);

  onEntityTypeChange(type: string) {
    this.selectedEntityType.set(type);
    this.clear();
  }

  clear() {
    this.request.set(null);
    this.selectedFields.set([]);
  }

  search() {
    const type = this.selectedEntityType();
    const fields = [...this.selectedFields()];
    if (!type || !fields.length) {
      this.request.set(null);
      return;
    }

    this.request.set({ ctor: this.entityRegistry.get(type), fields });
  }

  async mergeRecords(pair: DuplicatePair) {
    if (
      this.ability.cannot("update", pair.record) ||
      this.ability.cannot("update", pair.possibleDuplicate) ||
      this.ability.cannot("delete", pair.record) ||
      this.ability.cannot("delete", pair.possibleDuplicate)
    ) {
      this.alertService.addDanger(
        $localize`:Missing permission:Your account does not have the required permission for this action.`,
      );
      return;
    }

    // the merged record's update and the discarded one's removal reach the running
    // analysis on their own, so the list updates without searching again
    await this.bulkMergeService.executeAction([
      pair.record,
      pair.possibleDuplicate,
    ]);
  }

  onPageChange(event: PageEvent) {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }
}
