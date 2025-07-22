import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FormsModule } from "@angular/forms";
import { MatSelectModule } from "@angular/material/select";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";

export interface EntityCountDashboardConfig {
  entityType?: string;
  groupBy?: string[];
  subtitle?: string;
  explanation?: string;
}

@DynamicComponent("EntityCountDashboardSettings")
@Component({
  selector: "app-entity-count-dashboard-settings",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSelectModule,
    FormsModule,
  ],
  templateUrl: "./entity-count-dashboard-settings.component.html",
  styleUrls: ["./entity-count-dashboard-settings.component.scss"]
})
export class EntityCountDashboardSettingsComponent implements OnInit {
  @Input() entityType: string = "Child";
  @Input() groupBy: string[] = ["center", "gender"];
  @Input() subtitle: string = "";
  @Input() explanation: string = "";
  
  @Output() configChange = new EventEmitter<EntityCountDashboardConfig>();

  localConfig: EntityCountDashboardConfig;

  // Available entity types that can be counted
  availableEntityTypes = [
    'Child',
    'School', 
    'Note',
    'User',
    'RecurringActivity',
    'Aser',
    'HealthCheck',
    'EducationalMaterial'
  ];

  // Available fields to group by (these are common fields across entities)
  availableGroupByFields = [
    'center',
    'gender',
    'status',
    'category',
    'isActive'
  ];

  ngOnInit() {
    console.log('=== ENTITY COUNT SETTINGS DEBUG ===');
    console.log('Entity Type input:', this.entityType);
    console.log('Group By input:', this.groupBy);
    console.log('Subtitle input:', this.subtitle);
    console.log('Explanation input:', this.explanation);
    
    this.localConfig = {
      entityType: this.entityType || "Child",
      groupBy: this.groupBy && this.groupBy.length > 0 ? [...this.groupBy] : ["center", "gender"],
      subtitle: this.subtitle || "",
      explanation: this.explanation || ""
    };
    
    console.log('Final local config:', this.localConfig);
  }

  onEntityTypeChange() {
    this.emitConfigChange();
  }

  onGroupByChange() {
    this.emitConfigChange();
  }

  onSubtitleChange() {
    this.emitConfigChange();
  }

  onExplanationChange() {
    this.emitConfigChange();
  }

  private emitConfigChange() {
    console.log('Emitting config change:', this.localConfig);
    this.configChange.emit({ ...this.localConfig });
  }
}