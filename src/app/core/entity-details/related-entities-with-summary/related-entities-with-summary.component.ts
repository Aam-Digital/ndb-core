import { Component, Input, OnInit } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EntitySubrecordComponent } from "../../common-components/entity-subrecord/entity-subrecord/entity-subrecord.component";
import { RelatedEntitiesComponent } from "../related-entities/related-entities.component";
import { Entity } from "../../entity/model/entity";
import { filter } from "rxjs/operators";
import { applyUpdate } from "../../entity/model/entity-update";

/**
 * Load and display a list of entity subrecords (entities related to the current entity details view)
 * including a summary below the table.
 */
@DynamicComponent("RelatedEntitiesWithSummary")
@UntilDestroy()
@Component({
  selector: "app-related-entities-with-summary",
  templateUrl: "./related-entities-with-summary.component.html",
  imports: [EntitySubrecordComponent, NgIf, NgFor],
  standalone: true,
})
export class RelatedEntitiesWithSummaryComponent<E extends Entity = Entity>
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

  summarySum = "";
  summaryAvg = "";

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
      this.summarySum = "";
      this.summaryAvg = "";
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
      summary.get(groupLabel).count++;
      summary.get(groupLabel).sum += amount;
    });

    if (this.summaries.total) {
      const summarySumArray = Array.from(
        summary.entries(),
        ([label, { sum }]) => `${label}: ${sum}`,
      );
      this.summarySum = summarySumArray.join(", ");
    }

    if (this.summaries.average) {
      const summaryAvgArray = Array.from(
        summary.entries(),
        ([label, { count, sum }]) => {
          const avg = parseFloat((sum / count).toFixed(2));
          average.set(label, avg);
          return `${label}: ${avg}`;
        },
      );
      this.summaryAvg = summaryAvgArray.join(", ");
    }

    if (summary.size === 1 && summary.has(undefined)) {
      // display only single summary without group label (this also applies if no groupBy is given)
      this.summarySum = this.summarySum.replace("undefined: ", "");
      this.summaryAvg = this.summaryAvg.replace("undefined: ", "");
    }
  }
}
