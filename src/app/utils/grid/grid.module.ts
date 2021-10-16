import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MovableGridComponent } from "./movable-grid/movable-grid.component";
import { DragDropModule } from "@angular/cdk/drag-drop";

@NgModule({
  declarations: [MovableGridComponent],
  imports: [CommonModule, DragDropModule],
  exports: [MovableGridComponent],
})
export class GridModule {}
