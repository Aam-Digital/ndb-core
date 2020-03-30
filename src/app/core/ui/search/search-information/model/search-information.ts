import { Entity } from '../../../../entity/entity';
import { DatabaseEntity } from '../../../../entity/database-entity.decorator';


@DatabaseEntity('SearchInformation')
export class SearchInformation extends Entity {

    text: string;
}
