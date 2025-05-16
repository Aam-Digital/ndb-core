import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MenuItem } from 'app/core/ui/navigation/menu-item';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AdminIconComponent } from 'app/admin-icon-input/admin-icon-input.component';
import { ConfigService } from 'app/core/config/config.service';
import { PREFIX_VIEW_CONFIG, ViewConfig } from 'app/core/config/dynamic-routing/view-config.interface';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-admin-menu-item',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    AdminIconComponent,
    MatDialogModule,
  ],
  templateUrl: './admin-menu-item.component.html',
  styleUrls: ['./admin-menu-item.component.scss'],
})
export class AdminMenuItemComponent implements OnInit {
  item: MenuItem;
  availableRoutes: { value: string, label: string }[];
  isEditMode: boolean;

  constructor(
    private configService: ConfigService,
    public dialogRef: MatDialogRef<AdminMenuItemComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item: MenuItem, index: number | null }
  ) {
    this.item = data.item;
    this.isEditMode = data.index !== null;
  }

  ngOnInit(): void {
    this.availableRoutes = this.loadAvailableRoutes();
  }

  private loadAvailableRoutes(): { value: string, label: string }[] {
    const allConfigs: ViewConfig[] = this.configService.getAllConfigs<ViewConfig>(PREFIX_VIEW_CONFIG);
    return allConfigs
      .filter(view => !view._id.includes('/:id')) // skip details views (with "/:id" placeholder)
      .map(view => {
        const id = view._id.replace(PREFIX_VIEW_CONFIG, "/");
        const label =
          view.config?.entityType?.trim() ||
          view.component ||
          id;
        return { value: id, label };
      });
  }

  save() {
    this.dialogRef.close(this.item);
  }

  cancel() {
    this.dialogRef.close();
  }
}


