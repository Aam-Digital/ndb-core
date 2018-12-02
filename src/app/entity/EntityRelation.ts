import {Entity} from './entity';

export abstract class EntityRelation extends Entity {
  static getParameterName<T extends Entity>(type: typeof Entity): string {
    return null;
  }
}
