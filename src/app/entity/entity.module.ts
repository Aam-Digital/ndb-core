import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatabaseModule } from '../database/database.module';
import { EntityMapperService } from './entity-mapper.service';

@NgModule({
  imports: [
    CommonModule,
    DatabaseModule
  ],
  declarations: [],
  providers: [EntityMapperService]
})
export class EntityModule { }
