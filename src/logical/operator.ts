import { FieldKind } from "./field.js";
import type { EnumFieldKind, FieldValueType } from "./field.js";

export const EmptyOperatorKind = {
  isEmpty: "isEmpty",
  isNotEmpty: "isNotEmpty",
} as const;

export type EnumEmptyOperatorKind =
  (typeof EmptyOperatorKind)[keyof typeof EmptyOperatorKind];

export interface EmptyOperatorValue {
  [EmptyOperatorKind.isEmpty]: never;
  [EmptyOperatorKind.isNotEmpty]: never;
}

export const StringOperatorKind = {
  eq: "eq",
  startsWith: "startsWith",
  endsWith: "endsWith",
  contains: "contains",
  notContains: "notContains",
  ...EmptyOperatorKind,
} as const;

export type EnumStringOperatorKind =
  (typeof StringOperatorKind)[keyof typeof StringOperatorKind];

export interface StringOperatorValue extends EmptyOperatorValue {
  [StringOperatorKind.eq]: string;
  [StringOperatorKind.startsWith]: string;
  [StringOperatorKind.endsWith]: string;
  [StringOperatorKind.contains]: string;
  [StringOperatorKind.notContains]: string;
}

export const NumberOperatorKind = {
  eq: "eq",
  gt: "gt",
  lt: "lt",
  gte: "gte",
  lte: "lte",
  between: "between",
  notBetween: "notBetween",
  ...EmptyOperatorKind,
} as const;

export type EnumNumberOperatorKind =
  (typeof NumberOperatorKind)[keyof typeof NumberOperatorKind];

export interface NumberOperatorValue extends EmptyOperatorValue {
  [NumberOperatorKind.eq]: number;
  [NumberOperatorKind.gt]: number;
  [NumberOperatorKind.lt]: number;
  [NumberOperatorKind.gte]: number;
  [NumberOperatorKind.lte]: number;
  [NumberOperatorKind.between]: [number, number];
  [NumberOperatorKind.notBetween]: [number, number];
}

export const DateOperatorKind = {
  eq: "eq",
  before: "before",
  after: "after",
  between: "between",
  notBetween: "notBetween",
  lastNDays: "lastNDays",
  nextNDays: "nextNDays",
  ...EmptyOperatorKind,
} as const;

export type EnumDateOperatorKind =
  (typeof DateOperatorKind)[keyof typeof DateOperatorKind];

export interface DateOperatorValue extends EmptyOperatorValue {
  [DateOperatorKind.eq]: string;
  [DateOperatorKind.before]: string;
  [DateOperatorKind.after]: string;
  [DateOperatorKind.between]: [string, string];
  [DateOperatorKind.notBetween]: [string, string];
  [DateOperatorKind.lastNDays]: number;
  [DateOperatorKind.nextNDays]: number;
}

export const SelectOperatorKind = {
  eq: "eq",
  neq: "neq",
  ...EmptyOperatorKind,
} as const;

export type EnumSelectOperatorKind =
  (typeof SelectOperatorKind)[keyof typeof SelectOperatorKind];

export interface SelectOperatorValue<Value extends FieldValueType = string>
  extends EmptyOperatorValue {
  [SelectOperatorKind.eq]: Value;
  [SelectOperatorKind.neq]: Value;
}

export const MultiSelectOperatorKind = {
  hasAny: "hasAny",
  hasAll: "hasAll",
  hasNone: "hasNone",
  ...EmptyOperatorKind,
} as const;

export type EnumMultiSelectOperatorKind =
  (typeof MultiSelectOperatorKind)[keyof typeof MultiSelectOperatorKind];

export interface MultiSelectOperatorValue<Value extends FieldValueType = string>
  extends EmptyOperatorValue {
  [MultiSelectOperatorKind.hasAny]: Value[];
  [MultiSelectOperatorKind.hasAll]: Value[];
  [MultiSelectOperatorKind.hasNone]: Value[];
}

export const BooleanOperatorKind = {
  eq: "eq",
} as const;

export type EnumBooleanOperatorKind =
  (typeof BooleanOperatorKind)[keyof typeof BooleanOperatorKind];

export interface BooleanOperatorValue {
  [BooleanOperatorKind.eq]: boolean;
}

type OperatorValueMapForFieldKind<Value extends FieldValueType = string> =
  | {
      kind: typeof FieldKind.string;
      operatorKind: EnumStringOperatorKind;
      valueMap: StringOperatorValue;
    }
  | {
      kind: typeof FieldKind.number;
      operatorKind: EnumNumberOperatorKind;
      valueMap: NumberOperatorValue;
    }
  | {
      kind: typeof FieldKind.date;
      operatorKind: EnumDateOperatorKind;
      valueMap: DateOperatorValue;
    }
  | {
      kind: typeof FieldKind.select;
      operatorKind: EnumSelectOperatorKind;
      valueMap: SelectOperatorValue<Value>;
    }
  | {
      kind: typeof FieldKind.multiSelect;
      operatorKind: EnumMultiSelectOperatorKind;
      valueMap: MultiSelectOperatorValue<Value>;
    }
  | {
      kind: typeof FieldKind.boolean;
      operatorKind: EnumBooleanOperatorKind;
      valueMap: BooleanOperatorValue;
    };

function values<const T extends Record<string, string>>(obj: T) {
  return Object.values(obj) as unknown as T[keyof T][];
}

export function operatorsForKind<K extends EnumFieldKind>(
  kind: K,
): OperatorKindFor<K>[] {
  const kindsByField = {
    [FieldKind.string]: values(StringOperatorKind),
    [FieldKind.number]: values(NumberOperatorKind),
    [FieldKind.date]: values(DateOperatorKind),
    [FieldKind.select]: values(SelectOperatorKind),
    [FieldKind.multiSelect]: values(MultiSelectOperatorKind),
    [FieldKind.boolean]: values(BooleanOperatorKind),
  } as const satisfies { [P in EnumFieldKind]: OperatorKindFor<P>[] };

  return kindsByField[kind] as OperatorKindFor<K>[];
}

export function defaultOperatorForKind<K extends EnumFieldKind>(
  kind: K,
): OperatorKindFor<K> {
  const defaultsByField = {
    [FieldKind.string]: StringOperatorKind.contains,
    [FieldKind.number]: NumberOperatorKind.eq,
    [FieldKind.date]: DateOperatorKind.eq,
    [FieldKind.select]: SelectOperatorKind.eq,
    [FieldKind.multiSelect]: MultiSelectOperatorKind.hasAny,
    [FieldKind.boolean]: BooleanOperatorKind.eq,
  } as const satisfies { [P in EnumFieldKind]: OperatorKindFor<P> };

  return defaultsByField[kind] as unknown as OperatorKindFor<K>;
}

export type OperatorKindFor<K extends EnumFieldKind> =
  K extends typeof FieldKind.string
    ? EnumStringOperatorKind
    : K extends typeof FieldKind.number
      ? EnumNumberOperatorKind
      : K extends typeof FieldKind.date
        ? EnumDateOperatorKind
        : K extends typeof FieldKind.select
          ? EnumSelectOperatorKind
          : K extends typeof FieldKind.multiSelect
            ? EnumMultiSelectOperatorKind
            : K extends typeof FieldKind.boolean
              ? EnumBooleanOperatorKind
              : never;

export type OperatorValueFor<
  K extends EnumFieldKind,
  Op extends string,
> = K extends typeof FieldKind.string
  ? StringOperatorValue[Op & EnumStringOperatorKind]
  : K extends typeof FieldKind.number
    ? NumberOperatorValue[Op & EnumNumberOperatorKind]
    : K extends typeof FieldKind.date
      ? DateOperatorValue[Op & EnumDateOperatorKind]
      : K extends typeof FieldKind.select
        ? SelectOperatorValue[Op & EnumSelectOperatorKind]
        : K extends typeof FieldKind.multiSelect
          ? MultiSelectOperatorValue[Op & EnumMultiSelectOperatorKind]
          : K extends typeof FieldKind.boolean
            ? BooleanOperatorValue[Op & EnumBooleanOperatorKind]
            : never;
