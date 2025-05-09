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
  ],
  templateUrl: './admin-menu-item.component.html',
  styleUrls: ['./admin-menu-item.component.scss'],
})
export class AdminMenuItemComponent implements OnInit {
  item: MenuItem;

  constructor(
    public dialogRef: MatDialogRef<AdminMenuItemComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { item: MenuItem }
  ) {
    this.item = data.item;
  }

  ngOnInit(): void {}

  save() {
    this.dialogRef.close(this.item);
  }

  cancel() {
    this.dialogRef.close();
  }
}

