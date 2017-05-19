import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationComponent } from './navigation/navigation.component';
import { SessionModule } from '../session/session.module';
import { RouterModule } from '@angular/router';
import { NavigationItemsService } from './navigation-items.service';

@NgModule({
  imports: [
    CommonModule,
    SessionModule,
    RouterModule
  ],
  declarations: [NavigationComponent],
  exports: [NavigationComponent],
  providers: [NavigationItemsService]
})
export class NavigationModule {
}
