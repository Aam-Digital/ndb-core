import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { MenuItem } from "../../../../core/ui/navigation/menu-item";
import { DynamicComponent } from "../../../../core/config/dynamic-components/dynamic-component.decorator";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatTooltipModule } from "@angular/material/tooltip";
import { FormsModule } from "@angular/forms";
import { AdminIconComponent } from "#src/app/admin-icon-input/admin-icon-input.component";

@DynamicComponent("ShortcutDashboardSettings")
@Component({
  selector: "app-shortcut-dashboard-settings",
  standalone: true,
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    FormsModule,
    AdminIconComponent
  ],
  templateUrl: "./shortcut-dashboard-settings.component.html",
  styleUrls: ["./shortcut-dashboard-settings.component.scss"]
})
export class ShortcutDashboardSettingsComponent implements OnInit {
  // Try individual inputs instead of a single config object
  @Input() shortcuts: MenuItem[] = [];
  @Input() subtitle: string = "Quick Actions";
  @Input() explanation: string = "Shortcuts to quickly navigate to common actions";
  
  @Output() configChange = new EventEmitter<any>();

  localConfig: any;

  ngOnInit() {
    console.log('=== SHORTCUT SETTINGS DEBUG ===');
    console.log('Shortcuts input:', this.shortcuts);
    console.log('Subtitle input:', this.subtitle);
    console.log('Explanation input:', this.explanation);
    
    this.localConfig = {
      shortcuts: this.shortcuts ? [...this.shortcuts.map(s => ({ ...s }))] : [],
      subtitle: this.subtitle || "Quick Actions",
      explanation: this.explanation || "Shortcuts to quickly navigate to common actions"
    };
    
    console.log('Final local config:', this.localConfig);
    console.log('Local shortcuts count:', this.localConfig.shortcuts.length);
  }

  addShortcut() {
    this.localConfig.shortcuts.push({
      label: "New Shortcut",
      icon: "link",
      link: "/"
    });
    this.emitConfigChange();
  }

  removeShortcut(index: number) {
    this.localConfig.shortcuts.splice(index, 1);
    this.emitConfigChange();
  }

  moveShortcutUp(index: number) {
    if (index > 0) {
      const shortcut = this.localConfig.shortcuts.splice(index, 1)[0];
      this.localConfig.shortcuts.splice(index - 1, 0, shortcut);
      this.emitConfigChange();
    }
  }

  moveShortcutDown(index: number) {
    if (index < this.localConfig.shortcuts.length - 1) {
      const shortcut = this.localConfig.shortcuts.splice(index, 1)[0];
      this.localConfig.shortcuts.splice(index + 1, 0, shortcut);
      this.emitConfigChange();
    }
  }

  onShortcutChange() {
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