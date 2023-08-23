import { Component, Input, OnInit } from "@angular/core";
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
  imports: [EntitySubrecordComponent],
  standalone: true,
})
export class EducationalMaterialComponent implements OnInit {
  @Input() entity: Child;
  records: EducationalMaterial[] = [];
  summary = "";

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
    const summary = new Map<string, number>();
    this.records.forEach((m) => {
      const previousValue = summary.has(m.materialType.label)
        ? summary.get(m.materialType.label)
        : 0;
      summary.set(m.materialType.label, previousValue + m.materialAmount);
    });
    this.summary = [...summary]
      .map(([key, value]) => key + ": " + value)
      .join(", ");
  }
}
