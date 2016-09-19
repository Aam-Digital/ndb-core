import {NgModule} from '@angular/core';
import {DatabaseModule} from '../database/database.module';
import {EntityMapperService} from './entity-mapper.service';

@NgModule({
    imports: [DatabaseModule],
    declarations: [],
    exports: [],
    providers: [EntityMapperService]
})
export class EntityModule {
}

export {EntityMapperService} from './entity-mapper.service';
export { Entity } from './entity';
