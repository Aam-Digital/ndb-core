import { Component, Input, OnInit } from "@angular/core";
import { NgFor, NgIf, } from "@angular/common";
import { EducationalMaterial } from "../model/educational-material";
import { Child } from "../../model/child";
import { FormFieldConfig } from "../../../../core/common-components/entity-form/entity-form/FormConfig";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { EntityMapperService } from "../../../../core/entity/entity-mapper/entity-mapper.service";
import { applyUpdate } from "../../../../core/entity/model/entity-update";
import { filter } from "rxjs/operators";
import { UntilDestroy, untilDestroyed } from "@ngneat/until-destroy";
import { EntitySubrecordComponent } from "../../../../core/common-components/entity-subrecord/entity-subrecord/entity-subrecord.component";
import { EntityListConfig } from "app/core/entity-list/EntityListConfig";
import { ActivatedRoute } from "@angular/router";
import { RouteData } from "app/core/config/dynamic-routing/view-config.interface";

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
  records: EducationalMaterial[] = [];
  summary = "";
  avgSummary = "";
  summaryTitle: { [key: string]: string }[] 
  listConfig: EntityListConfig;

  @Input() config: { columns: FormFieldConfig[] } = {
    columns: [
      { id: "date", visibleFrom: "xs" },
      { id: "materialType", visibleFrom: "xs" },
      { id: "materialAmount", visibleFrom: "md" },
      { id: "description", visibleFrom: "md" },
    ],
  };

  constructor(private entityMapper: EntityMapperService,
    private route: ActivatedRoute ) {
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
    
    // Initialize summary and average maps in a single loop
    for (const m of this.records) {
      if (m.materialType) {
        const label = m.materialType.label;
        const amount = m.materialAmount;
  
        if (!summary.has(label)) {
          summary.set(label, { count: 0, sum: 0 });
        }
  
        const labelData = summary.get(label);
        labelData.count++;
        labelData.sum += amount;
      }
    }

    const summaryArray: string[] = [];
    const avgSummaryArray: string[] = [];
  
    for (const [label, labelData] of summary.entries()) {
      const avg = parseFloat((labelData.sum / labelData.count).toPrecision(2));
      average.set(label, avg);
      
      summaryArray.push(`${label}: ${labelData.sum}`);
      avgSummaryArray.push(`${label}: ${avg}`);
    }
  
    this.summary = summaryArray.join(", ");
    this.avgSummary = avgSummaryArray.join(", ");
    this.getSummaryList();
  }
  
  
  getSummaryList(){
    this.route.data.subscribe(
      (data: RouteData<EntityListConfig>) => (this.listConfig = data.config),
    );
   this.summaryTitle =  this.listConfig['panels']
   .find((panel: { title: string })=> panel.title === "Educational Materials").summary;
 
  }
}
