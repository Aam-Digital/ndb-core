import { ConflictResolutionComponent } from './conflict-resolution/conflict-resolution.component';
import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

/**
 * Internal routes of the lazy-loaded ConflictResolutionModule.
 * These are relative to the route the module is loaded at in the main app.
 */
const routes: Routes = [
  {
    path: '',
    component: ConflictResolutionComponent,
  },
];

/**
 * Routing Module for the lazy-loaded {@link ConflictResolutionModule}.
 */
@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConflictResolutionRoutingModule { }
