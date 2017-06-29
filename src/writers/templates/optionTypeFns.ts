// tslint:disable:interface-name no-var-requires
// THIS FILE IS GENERATED BY JOI-TS-GENERATOR. ANY CHANGES MADE WILL BE LOST.

import * as option from "fp-ts/lib/Option";
import * as joi from "joi";

import { cloneDeep, forOwn, get, isArray, isPlainObject } from "lodash";

const freeze = require("deep-freeze-strict");

interface NodeWrapper {
  applicable: (node: any, value: any) => boolean;
  wrap: (node: any, value: any) => any;
}

const defaultOptions: joi.ValidationOptions = {
  allowUnknown: true,
  convert: true,
  presence: "optional",
  stripUnknown: { objects: true },
};

const maybeWrap = (node: any, value: any) =>
  isRequiredNode(node) ? value : wrapOption(value);

const isRequiredNode = (node: any) =>
  get(node, "schema._flags.presence") === "required";

const plainValue: NodeWrapper = {
  applicable: () => true,
  wrap: (node, value) => maybeWrap(node, value),
};

const wrapArray: NodeWrapper = {
  applicable: (node, value) =>
    get(node, "schema._type") === "array" && isArray(value),

  wrap: (node, value) =>
    maybeWrap(
      node,
      value.map((v: any) => wrapOptions(node.schema._inner.items[0], v)),
    ),
};

const wrapObject: NodeWrapper = {
  applicable: (node, value) =>
    (get(node, "schema._inner.children", []) || []).length > 0 &&
    isPlainObject(value),
  wrap: (node, value) => maybeWrap(node, wrapOptions(node.schema, value)),
};

const wrapOption = (val: any) => {
  if (isValueless(val)) {
    return option.none;
  }

  if (option.isNone(val) || option.isSome(val)) {
    return val;
  }

  return option.some(val);
};

const wrapOptions = (schema: any, obj: any): any => {
  if (isValueless(obj)) {
    return obj;
  }

  const fields = get<any, any[]>(schema, "_inner.children", []);

  const wrappers: NodeWrapper[] = [wrapObject, wrapArray, plainValue];

  const findApplicableWrapper = (field: any, value: any): NodeWrapper => {
    const found = wrappers.find(w => w.applicable(field, value));

    if (found === undefined) {
      throw new Error(`Not able to find wrapper for ${field}: ${value}`);
    }

    return found;
  };

  return fields.reduce((prev, field) => {
    const value = prev[field.key];
    const wrapper = findApplicableWrapper(field, value);
    const maybeValue = wrapper.wrap(field, value);

    return { ...prev, [field.key]: maybeValue };
  }, obj);
};

const unwrapOptions = (thing: any): any => {
  if (isValueless(thing)) {
    return thing;
  }

  const className = thing.constructor.name;

  if (className === "None") {
    return undefined;
  }

  if (className === "Some") {
    return unwrapOptions(thing.toNullable());
  }

  if (isPlainObject(thing)) {
    forOwn(thing, (v, k) => (thing[k] = unwrapOptions(v)));

    return thing;
  }

  if (isArray(thing)) {
    return thing.map(unwrapOptions);
  }

  return thing;
};

// exports

export const cloneToPlainObject = (obj: any) => unwrapOptions(cloneDeep(obj));

export function coerceFactory<T>(
  factory: Factory.IFactory,
  schema: joi.Schema,
) {
  return (attrs?: any, options?: any): T =>
    coerceValue<T>(schema)(factory.build(attrs, options));
}
export function coerceValue<T>(schema: joi.Schema) {
  return (object: any, options?: any): T => {
    const resolvedOptions = Object.assign({}, defaultOptions, options);
    let coerced: any;

    joi.validate(
      cloneToPlainObject(object),
      schema,
      resolvedOptions,
      (err, result) => {
        if (err) {
          throw err;
        }
        coerced = result;
      },
    );

    return freeze(wrapOptions(schema, coerced)) as T;
  };
}

export function mapOptionalFieldsToOptions<T>(schema: joi.Schema) {
  return (obj: any): T => wrapOptions(schema, obj);
}

export const isValueless = (obj: any) => obj === undefined || obj === null;
