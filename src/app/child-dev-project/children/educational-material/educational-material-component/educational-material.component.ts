import { Component, Input, OnInit } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EntitySubrecordComponent } from "../../../../core/common-components/entity-subrecord/entity-subrecord/entity-subrecord.component";
import { RelatedEntitiesComponent } from "../../../../core/entity-details/related-entities/related-entities.component";
import { Entity } from "../../../../core/entity/model/entity";
import { filter } from "rxjs/operators";
import { applyUpdate } from "../../../../core/entity/model/entity-update";

/**
 * Load and display a list of entity subrecords (entities related to the current entity details view)
 * including a summary below the table.
 */
@DynamicComponent("EducationalMaterial")
@UntilDestroy()
@Component({
  selector: "app-educational-material",
  templateUrl: "./educational-material.component.html",
  imports: [EntitySubrecordComponent, NgIf, NgFor],
  standalone: true,
})
export class EducationalMaterialComponent<E extends Entity = Entity>
  extends RelatedEntitiesComponent<E>
  implements OnInit
{
  /**
   * Configuration of what numbers should be summarized below the table.
   */
  @Input() summaries?: {
    countProperty: string;
    groupBy?: string;
    total?: boolean;
    average?: boolean;
  };

  summary = "";
  avgSummary = "";

  async ngOnInit() {
    await super.ngOnInit();
    this.updateSummary();

    this.entityMapper
      .receiveUpdates(this.entityCtr)
      .pipe(
        untilDestroyed(this),
        filter(
          ({ entity, type }) =>
            type === "remove" || entity[this.property] === this.entity.getId(),
        ),
      )
      .subscribe((update) => {
        this.data = applyUpdate(this.data, update);
        this.updateSummary();
      });
  }

  /**
   * update the summary or generate a new one.
   * The summary contains no duplicates and is in a
   * human-readable format
   */
  updateSummary() {
    if (!this.summaries) {
      this.summary = "";
      this.avgSummary = "";
      return;
    }

    const summary = new Map<string, { count: number; sum: number }>();
    const average = new Map<string, number>();

    this.data.forEach((m) => {
      const amount = m[this.summaries.countProperty];
      let groupLabel;
      if (this.summaries.groupBy) {
        groupLabel =
          m[this.summaries.groupBy]?.label ?? m[this.summaries.groupBy];
      }

      summary.set(groupLabel, summary.get(groupLabel) || { count: 0, sum: 0 });
      summary.get(groupLabel)!.count++;
      summary.get(groupLabel)!.sum += amount;
    });

    if (this.summaries.total) {
      const summaryArray = Array.from(
        summary.entries(),
        ([label, { sum }]) => `${label}: ${sum}`,
      );
      this.summary = summaryArray.join(", ");
    }

    if (this.summaries.average) {
      const avgSummaryArray = Array.from(
        summary.entries(),
        ([label, { count, sum }]) => {
          const avg = parseFloat((sum / count).toFixed(2));
          average.set(label, avg);
          return `${label}: ${avg}`;
        },
      );
      this.avgSummary = avgSummaryArray.join(", ");
    }
  }
}
