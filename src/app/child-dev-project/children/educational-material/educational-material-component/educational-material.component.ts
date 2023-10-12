import { Component, Input, OnInit } from "@angular/core";
import { NgFor, NgIf } from "@angular/common";
import { EducationalMaterial } from "../model/educational-material";
import { Child } from "../../model/child";
import { FormFieldConfig } from "../../../../core/common-components/entity-form/entity-form/FormConfig";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { applyUpdate } from "../../../../core/entity/model/entity-update";
import { filter } from "rxjs/operators";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EntitySubrecordComponent } from "../../../../core/common-components/entity-subrecord/entity-subrecord/entity-subrecord.component";

/**
 * Displays educational materials of a child, such as a pencil, rulers, e.t.c
 * as well as a summary
 */
@DynamicComponent("EducationalMaterial")
@UntilDestroy()
@Component({
  selector: "app-educational-material",
  templateUrl: "./educational-material.component.html",
  imports: [
    EntitySubrecordComponent,
    NgIf,
    NgFor
  ],
  standalone: true,
})
export class EducationalMaterialComponent implements OnInit {
  @Input() entity: Child;
  @Input() summaries: { total?: boolean; average?: boolean } = { total: true };
  records: EducationalMaterial[] = [];
  summary = "";
  avgSummary = "";

  @Input() config: { columns: FormFieldConfig[] } = {
    columns: [
      { id: "date", visibleFrom: "xs" },
      { id: "materialType", visibleFrom: "xs" },
      { id: "materialAmount", visibleFrom: "md" },
      { id: "description", visibleFrom: "md" },
    ],
  };

  constructor(private entityMapper: EntityMapperService) {
    this.entityMapper
      .receiveUpdates(EducationalMaterial)
      .pipe(
        untilDestroyed(this),
        filter(
          ({ entity, type }) =>
            type === "remove" || entity.child === this.entity.getId(),
        ),
      )
      .subscribe((update) => {
        this.records = applyUpdate(this.records, update);
        this.updateSummary();
      });
  }

  ngOnInit() {
    return this.loadData();
  }

  /**
   * Loads the data for a given child and updates the summary
   * @param id The id of the child to load the data for
   */
  private async loadData() {
    const allMaterials = await this.entityMapper.loadType(EducationalMaterial);
    this.records = allMaterials.filter(
      (mat) => mat.child === this.entity.getId(),
    );
    this.updateSummary();
  }

  newRecordFactory = () => {
    const newAtt = new EducationalMaterial(Date.now().toString());

    // use last entered date as default, otherwise today's date
    newAtt.date = this.records.length > 0 ? this.records[0].date : new Date();
    newAtt.child = this.entity.getId();

    return newAtt;
  };

  /**
   * update the summary or generate a new one.
   * The summary contains no duplicates and is in a
   * human-readable format
   */
  updateSummary() {
    const summary = new Map<string, { count: number; sum: number }>();
    const average = new Map<string, number>();

    this.records.forEach((m) => {
      const { materialType, materialAmount } = m;
      const label = materialType?.label;

      if (label) {
        summary.set(label, (summary.get(label) || { count: 0, sum: 0 }));
        summary.get(label)!.count++;
        summary.get(label)!.sum += materialAmount;
      }
    });
    
    if(this.summaries.total) {
      const summaryArray = Array.from(summary.entries(), ([label, { sum }]) => `${label}: ${sum}`);
      this.summary = summaryArray.join(", ");
    }
   
    if(this.summaries.average) {
      const avgSummaryArray = Array.from(summary.entries(), ([label, { count, sum }]) => {
        const avg = parseFloat((sum / count).toFixed(2));
        average.set(label, avg);
        return `${label}: ${avg}`;
      });
      this.avgSummary = avgSummaryArray.join(", ");
    }
  }
}
