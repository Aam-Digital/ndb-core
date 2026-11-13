import { FieldValidator } from "../../common-components/entity-form/dynamic-form-validators/field-validator";
import { NumberDatatype } from "./number.datatype";

/** A limit of a number field, whose setting is a number. */
export abstract class NumberLimitValidator extends FieldValidator<number> {
  override readonly datatypesSupported = [NumberDatatype];
  override readonly configComponent = "NumberValidatorSetting";
}
