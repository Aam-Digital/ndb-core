import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { EditButtonComponent } from "./edit-button/edit-button.component";
import { MatButtonModule } from "@angular/material/button";
import { Angulartics2Module } from "angulartics2";

@NgModule({
  declarations: [EditButtonComponent],
  imports: [CommonModule, MatButtonModule, Angulartics2Module],
  exports: [EditButtonComponent],
})
export class AppButtonsModule {}
