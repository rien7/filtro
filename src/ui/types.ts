import type { ReactNode } from "react";
import {
  FieldKind,
  type EnumFieldKind,
  type LogicalFieldBase,
} from "../logical/field.js";
import type { OperatorKindFor, OperatorValueFor } from "../logical/operator.js";

export type UIFieldRender = <
  Kind extends EnumFieldKind,
  Op extends OperatorKindFor<Kind>,
>({
  op,
  value,
  onChange,
}: {
  op: Op;
  value: OperatorValueFor<Kind, Op>;
  onChange: (value: OperatorValueFor<Kind, Op>) => void;
}) => ReactNode;

export interface UIFieldBase<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> extends LogicalFieldBase<FieldId, Kind> {
  label?: string;
  icon?: ReactNode;
  description?: string;
  placeholder?: string;
  render?: UIFieldRender;
}

export interface SelectOption {
  label: string;
  value: string;
  prefix?: ReactNode;
  children?: SelectOption[];
}

type SelectOptionLoader = ({
  query,
  signal,
}: {
  query: string;
  signal?: AbortSignal;
}) => Promise<SelectOption[]>;

export type SelectOptions = SelectOption[] | SelectOptionLoader;
export type BooleanOptions = [{ label: string, value: true }, { label: string, value: false }]

export type SelectKind =
  | typeof FieldKind.select
  | typeof FieldKind.multiSelect;
export type BooleanKind = typeof FieldKind.boolean

export interface SelectUIField<
  FieldId extends string = string,
  Kind extends SelectKind = SelectKind,
> extends UIFieldBase<FieldId, Kind> {
  options?: SelectOptions;
}

export interface BooleanUIField<
  FieldId extends string = string,
  Kind extends BooleanKind = BooleanKind
> extends UIFieldBase<FieldId, Kind> {
  options?: BooleanOptions
}

export type UIFieldForKind<
  FieldId extends string,
  Kind extends EnumFieldKind,
> = Kind extends SelectKind
  ? SelectUIField<FieldId, Kind>
  : Kind extends BooleanKind
  ? BooleanUIField<FieldId, Kind>
  : UIFieldBase<FieldId, Kind>;
