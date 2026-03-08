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
  icon?: ReactNode;
  prefix?: ReactNode;
  children?: SelectOption[];
}

export type FlattenedSelectOption = Omit<SelectOption, "children">;

export const SelectOptionsStatus = {
  idle: "idle",
  loading: "loading",
  success: "success",
  error: "error",
} as const;

export type SelectOptionsStatus = (typeof SelectOptionsStatus)[keyof typeof SelectOptionsStatus];

export type SelectOptionsLoadMode = "render" | "open";

export type SelectOptionLoader = ({
  query,
  signal,
}: {
  query: string;
  signal?: AbortSignal;
}) => Promise<SelectOption[]>;

export interface SelectOptionsSourceContext<
  FieldId extends string = string,
  Kind extends SelectKind = SelectKind,
> {
  field: SelectUIField<FieldId, Kind>;
  open: boolean;
  query: string;
  normalizedQuery: string;
  selectedValues: string[];
  shouldLoad: boolean;
}

export interface SelectOptionsSourceResult {
  options: SelectOption[];
  status: SelectOptionsStatus;
  error?: Error | null;
  selectedOptions?: FlattenedSelectOption[];
}

export type UseSelectOptions<
  FieldId extends string = string,
  Kind extends SelectKind = SelectKind,
> = (
  context: SelectOptionsSourceContext<FieldId, Kind>,
) => SelectOptionsSourceResult;

export type SelectOptions = SelectOption[] | SelectOptionLoader;
export type BooleanOptions = [{ label: string, value: true }, { label: string, value: false }]

export type SelectKind =
  | typeof FieldKind.select
  | typeof FieldKind.multiSelect;
export type BooleanKind = typeof FieldKind.boolean
export type MultiSelectValueLabelRenderer = (values: string[]) => ReactNode;

export interface SelectUIField<
  FieldId extends string = string,
  Kind extends SelectKind = SelectKind,
> extends UIFieldBase<FieldId, Kind> {
  options?: SelectOptions;
  useOptions?: UseSelectOptions<FieldId, Kind>;
  optionsLoadMode?: SelectOptionsLoadMode;
  optionsSearchable?: boolean;
  renderValueLabel?: MultiSelectValueLabelRenderer;
  maxSelections?: number;
}

export interface BooleanUIField<
  FieldId extends string = string,
  Kind extends BooleanKind = BooleanKind
> extends UIFieldBase<FieldId, Kind> {
  options?: BooleanOptions
}

export interface UIFieldGroup<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  label: string;
  fields: UIFieldForKind<FieldId, Kind>[];
}

export type UIFieldForKind<
  FieldId extends string,
  Kind extends EnumFieldKind,
> = Kind extends SelectKind
  ? SelectUIField<FieldId, Kind>
  : Kind extends BooleanKind
  ? BooleanUIField<FieldId, Kind>
  : UIFieldBase<FieldId, Kind>;

export type UIFieldEntry<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> = UIFieldForKind<FieldId, Kind> | UIFieldGroup<FieldId, Kind>;
