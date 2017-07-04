/**
 * Entity is a base class for all domain model classes.
 *
 * Entity does not deal with database actions. Inject `EntityMapperService`
 * and use its find/save/delete functions.
 */
export class Entity {

  private readonly _id: string;

  /**
   * Creates an entity object with the given ID. If the prefix is not included it will be added so the ID will match
   * the format <code><prefix>:<id></code>.
   *
   * <b>Important: </b>Make sure to always call <code>super(id)</code> whenever you overwrite the constructor.
   *
   * @param id
   */
  constructor(id: string) {
    if (!id.startsWith(this.getPrefix())) {
      id = this.getPrefix() + id;
    }
    this._id = id;
  }

  /**
   *
   */
  public getPrefix(): string {
    return this.constructor.name;
  }

  /**
   * Returns the ID of this given entity. An ID exists in the form of <code><prefix>:<id></code>. Note that an ID is
   * final and can't be changed after the object has been instantiated, hence there is no <code>setId()</code> method.
   *
   * @returns {string}
   */
  public getId(): string {
    return this._id;
  }
}
