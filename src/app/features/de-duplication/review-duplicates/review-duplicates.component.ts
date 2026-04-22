import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from "@angular/core";
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
} from "../duplicate-detection.service";
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
  isLoading = signal(false);
  searched = signal(false);
  pairs = signal<DuplicatePair[]>([]);

  pageSize = signal(5);
  pageIndex = signal(0);

  readonly displayedColumns = ["record", "possibleDuplicate", "actions"];
  private searchRequestId = 0;

  paginatedPairs = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.pairs().slice(start, start + this.pageSize());
  });

  onEntityTypeChange(type: string) {
    this.selectedEntityType.set(type);
    this.clear();
  }

  clear() {
    this.searchRequestId++;
    this.pairs.set([]);
    this.selectedFields.set([]);
    this.searched.set(false);
    this.isLoading.set(false);
    this.pageIndex.set(0);
  }

  async search() {
    const requestId = ++this.searchRequestId;
    const type = this.selectedEntityType();
    const fields = [...this.selectedFields()];
    if (!type || !fields.length) {
      this.pairs.set([]);
      this.searched.set(false);
      this.pageIndex.set(0);
      this.isLoading.set(false);
      return;
    }

    this.isLoading.set(true);
    this.pageIndex.set(0);
    this.pairs.set([]);
    this.searched.set(false);
    try {
      const ctor = this.entityRegistry.get(type);
      const result = await this.duplicateDetectionService.findDuplicates(
        ctor,
        fields,
      );
      if (requestId !== this.searchRequestId) return;
      this.pairs.set(result);
      this.searched.set(true);
    } catch (e) {
      if (requestId !== this.searchRequestId) return;
      this.alertService.addDanger(
        $localize`Could not search for duplicates: ${e instanceof Error ? e.message : e}`,
      );
    } finally {
      if (requestId === this.searchRequestId) {
        this.isLoading.set(false);
      }
    }
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

    const merged = await this.bulkMergeService.executeAction([
      pair.record,
      pair.possibleDuplicate,
    ]);
    if (merged) {
      const nextPairs = this.pairs().filter(
        (p) =>
          p.record !== pair.record ||
          p.possibleDuplicate !== pair.possibleDuplicate,
      );
      this.pairs.set(nextPairs);

      const maxPageIndex = Math.max(
        Math.ceil(nextPairs.length / this.pageSize()) - 1,
        0,
      );
      if (this.pageIndex() > maxPageIndex) {
        this.pageIndex.set(maxPageIndex);
      }
    }
  }

  onPageChange(event: PageEvent) {
    this.pageSize.set(event.pageSize);
    this.pageIndex.set(event.pageIndex);
  }
}
