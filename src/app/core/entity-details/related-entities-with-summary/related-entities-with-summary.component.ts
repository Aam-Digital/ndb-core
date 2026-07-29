import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core";
import { CustomFormLinkButtonComponent } from "app/features/public-form/custom-form-link-button/custom-form-link-button.component";
import { EntitiesTableComponent } from "../../common-components/entities-table/entities-table.component";
import { DynamicComponent } from "../../config/dynamic-components/dynamic-component.decorator";
import { Entity } from "../../entity/model/entity";
import { RelatedEntitiesComponent } from "../related-entities/related-entities.component";

/**
 * Load and display a list of related entities
 * including a summary below the table.
 */
@DynamicComponent("RelatedEntitiesWithSummary")
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: "app-related-entities-with-summary",
  templateUrl: "./related-entities-with-summary.component.html",
  imports: [EntitiesTableComponent, CustomFormLinkButtonComponent],
})
export class RelatedEntitiesWithSummaryComponent<
  E extends Entity = Entity,
> extends RelatedEntitiesComponent<E> {
  /**
   * Configuration of what numbers should be summarized below the table.
   */
  summaries = input<{
    countProperty: string;
    groupBy?: string;
    total?: boolean;
    average?: boolean;
  }>();

  protected readonly summary = computed(() => this.buildSummary());

  private buildSummary() {
    const summaries = this.summaries();
    if (!summaries) {
      return { sum: "", avg: "" };
    }

    const summary = new Map<
      string | undefined,
      { count: number; sum: number }
    >();
    const filteredData = this.dataSource.filteredRecords();

    filteredData.forEach((m) => {
      const amount = Number(m[summaries.countProperty]);
      let groupLabel: string | undefined;
      if (summaries.groupBy) {
        groupLabel = m[summaries.groupBy]?.label ?? m[summaries.groupBy];
      }

      summary.set(groupLabel, summary.get(groupLabel) || { count: 0, sum: 0 });
      summary.get(groupLabel).count++;
      summary.get(groupLabel).sum += amount;
    });

    let summarySum = "";
    let summaryAvg = "";

    if (summaries.total) {
      const summarySumArray = Array.from(
        summary.entries(),
        ([label, { sum }]) => `${label}: ${sum}`,
      );
      summarySum = summarySumArray.join(", ");
    }

    if (summaries.average) {
      const summaryAvgArray = Array.from(
        summary.entries(),
        ([label, { count, sum }]) => {
          const avg = parseFloat((sum / count).toFixed(2));
          return `${label}: ${avg}`;
        },
      );
      summaryAvg = summaryAvgArray.join(", ");
    }

    if (summary.size === 1 && summary.has(undefined)) {
      // display only single summary without group label (this also applies if no groupBy is given)
      summarySum = summarySum.replace("undefined: ", "");
      summaryAvg = summaryAvg.replace("undefined: ", "");
    }

    return { sum: summarySum, avg: summaryAvg };
  }
}
