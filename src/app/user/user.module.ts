import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserAccountComponent } from './user-account/user-account.component';
import { routing } from './user.routing';

@NgModule({
  imports: [
    routing
  ],
  declarations: [UserAccountComponent]
})
export class UserModule { }
