
/**
 * Entity is a base class for all domain model classes.
 *
 * Entity does not deal with database actions. Inject `EntityMapperService` and use its find/save/delete functions.
 */
export class Entity {

    private _id: string;




    public getPrefix(): string {
        return "";
    }
}
