import {Entity} from './entity';

export interface PassableEntityConstructor<T extends Entity> {
  new(id: string): T;
}
