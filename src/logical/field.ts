import type { OperatorKindFor } from "./operator.js"

export const FieldKind = {
  string: 'string',
  number: 'number',
  date: 'date',
  select: 'select',
  multiSelect: 'multiSelect',
  boolean: 'boolean',
} as const

export type EnumFieldKind = (typeof FieldKind)[keyof typeof FieldKind]

export type FieldValueType = string | number

export interface LogicalFieldBase<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  id: FieldId
  kind: Kind
  allowedOperators: OperatorKindFor<Kind>[]
  fixedOperator?: OperatorKindFor<Kind>
}
