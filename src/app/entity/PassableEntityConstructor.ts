import {Entity} from './entity';

export type PassableEntityConstructor<T extends Entity> = new(id: string) => T;
