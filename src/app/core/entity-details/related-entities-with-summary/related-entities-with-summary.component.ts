import { Component, Input, OnInit, ViewChild } from "@angular/core";
import { NgIf } from "@angular/common";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { RelatedEntitiesComponent } from "../related-entities/related-entities.component";
import { Entity } from "../../entity/model/entity";
import { EntitiesTableComponent } from "../../common-components/entities-table/entities-table.component";

/**
 * Load and display a list of related entities
 * including a summary below the table.
 */
@DynamicComponent("RelatedEntitiesWithSummary")
@Component({
  selector: "app-related-entities-with-summary",
  templateUrl: "./related-entities-with-summary.component.html",
  imports: [EntitiesTableComponent, NgIf],
  standalone: true,
})
export class RelatedEntitiesWithSummaryComponent<E extends Entity = Entity>
  extends RelatedEntitiesComponent<E>
  implements OnInit
{
  @ViewChild(EntitiesTableComponent, { static: true })
  entitiesTable: EntitiesTableComponent<E>;
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

  override async ngOnInit() {
    await super.ngOnInit();
    this.entitiesTable.filteredRecordsChange.subscribe((data) =>
      this.updateSummary(data),
    );
  }

  /**
   * update the summary or generate a new one.
   * The summary contains no duplicates and is in a
   * human-readable format
   */
  updateSummary(filteredData: E[]) {
    if (!this.summaries) {
      this.summarySum = "";
      this.summaryAvg = "";
      return;
    }

    const summary = new Map<string, { count: number; sum: number }>();
    const average = new Map<string, number>();

    filteredData.forEach((m) => {
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
