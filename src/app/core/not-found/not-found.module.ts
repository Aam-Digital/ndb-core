import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { NotFoundComponent } from "./not-found/not-found.component";
import { MatButtonModule } from "@angular/material/button";
import { RouterModule } from "@angular/router";
import { FlexModule } from "@angular/flex-layout";

@NgModule({
  imports: [CommonModule, MatButtonModule, RouterModule, FlexModule],
  declarations: [NotFoundComponent],
  exports: [NotFoundComponent],
})
export class NotFoundModule {}
