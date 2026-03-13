import { Entity } from "../../core/entity/model/entity";

type MatcherResult = { pass: boolean; message: () => string };
type MatcherContext = {
  utils?: { printReceived?: (value: unknown) => string };
};

function pp(context: MatcherContext, value: unknown): string {
  if (context.utils?.printReceived) {
    return context.utils.printReceived(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export const entityMatchers = {
  toHaveType(
    this: MatcherContext,
    entity: Entity,
    type: string,
  ): MatcherResult {
    const pass = entity.getType() === type;

    return {
      pass,
      message: () =>
        pass
          ? `Expected entity ${pp(this, entity)} not to have type '${type}' but it actually has type ${entity.getId(true)}`
          : `Expected entity ${pp(this, entity)} to have type '${type}' but it has type ${entity.getId()}`,
    };
  },
};
