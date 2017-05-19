import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseManagerService, databaseServiceProvider } from './database-manager.service';
import { PouchDatabaseManagerService } from './pouch-database-manager.service';

@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [],
  providers: [
    {provide: DatabaseManagerService, useClass: PouchDatabaseManagerService},
    databaseServiceProvider,
  ]
})
export class DatabaseModule { }
