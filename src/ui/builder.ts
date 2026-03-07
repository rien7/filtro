import { FieldKind, type EnumFieldKind } from "../logical/field.js";
import { operatorsForKind, type OperatorKindFor } from "../logical/operator.js";
import type {
  BooleanKind,
  BooleanOptions,
  MultiSelectValueLabelRenderer,
  SelectKind,
  SelectOptionsLoadMode,
  SelectOptions,
  UIFieldBase,
  UIFieldForKind,
  UIFieldRender,
} from "./types.js";

type BaseFieldBuilderMethod = "meta" | "operator" | "render";
type SelectFieldBuilderMethod =
  | BaseFieldBuilderMethod
  | "options"
  | "loadOptions"
  | "searchable";
type MultiSelectFieldBuilderMethod =
  | SelectFieldBuilderMethod
  | "renderValueLabel"
  | "maxSelections";
type BooleanFieldBuilderMethod = BaseFieldBuilderMethod | "options";

type FieldBuilderMethod<Kind extends EnumFieldKind> = Kind extends SelectKind
  ? Kind extends typeof FieldKind.multiSelect
    ? MultiSelectFieldBuilderMethod
    : SelectFieldBuilderMethod
  : Kind extends BooleanKind
  ? BooleanFieldBuilderMethod
  : BaseFieldBuilderMethod;

type OmitUsedMethods<Builder, Used extends PropertyKey> = Omit<
  Builder,
  Extract<keyof Builder, Used>
>;

type BaseBuilderUsed<Used extends string> = Extract<Used, BaseFieldBuilderMethod>;
declare const fieldBuilderBrand: unique symbol;

export interface AnyFieldBuilder<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  readonly [fieldBuilderBrand]: {
    readonly fieldId: FieldId;
    readonly kind: Kind;
  };
}

export type BaseFieldBuilder<
  FieldId extends string,
  Kind extends EnumFieldKind,
  Used extends BaseFieldBuilderMethod = never,
> = AnyFieldBuilder<FieldId, Kind> &
  OmitUsedMethods<
    {
      meta(
        meta: Partial<
          Pick<
            UIFieldBase<FieldId, Kind>,
            "label" | "icon" | "description" | "placeholder"
          >
        >,
      ): BaseFieldBuilder<FieldId, Kind, Used | "meta">;
      operator(
        ops:
          | readonly OperatorKindFor<Kind>[]
          | ((ops: OperatorKindFor<Kind>[]) => OperatorKindFor<Kind>[]),
      ): BaseFieldBuilder<FieldId, Kind, Used | "operator">;
      render(fn: UIFieldRender): BaseFieldBuilder<FieldId, Kind, Used | "render">;
    },
    Used
  >;

export type SelectFieldBuilder<
  FieldId extends string,
  Kind extends SelectKind,
  Used extends Kind extends typeof FieldKind.multiSelect
    ? MultiSelectFieldBuilderMethod
    : SelectFieldBuilderMethod = never,
> = AnyFieldBuilder<FieldId, Kind> &
  OmitUsedMethods<
    {
      meta(
        meta: Partial<
          Pick<
            UIFieldBase<FieldId, Kind>,
            "label" | "icon" | "description" | "placeholder"
          >
        >,
      ): SelectFieldBuilder<FieldId, Kind, Used | "meta">;
      operator(
        ops:
          | readonly OperatorKindFor<Kind>[]
          | ((ops: OperatorKindFor<Kind>[]) => OperatorKindFor<Kind>[]),
      ): SelectFieldBuilder<FieldId, Kind, Used | "operator">;
      render(fn: UIFieldRender): SelectFieldBuilder<FieldId, Kind, Used | "render">;
      options(options: SelectOptions): SelectFieldBuilder<FieldId, Kind, Used | "options">;
      loadOptions(
        mode: SelectOptionsLoadMode,
      ): SelectFieldBuilder<FieldId, Kind, Used | "loadOptions">;
      searchable(
        searchable?: boolean,
      ): SelectFieldBuilder<FieldId, Kind, Used | "searchable">;
    } & (Kind extends typeof FieldKind.multiSelect
      ? {
          renderValueLabel(fn: MultiSelectValueLabelRenderer): SelectFieldBuilder<FieldId, Kind, Used | "renderValueLabel">;
          maxSelections(max: number): SelectFieldBuilder<FieldId, Kind, Used | "maxSelections">;
        }
      : {}),
    Used
  >;

export type BooleanFieldBuilder<
  FieldId extends string,
  Kind extends BooleanKind,
  Used extends BooleanFieldBuilderMethod = never,
> = AnyFieldBuilder<FieldId, Kind> &
  OmitUsedMethods<
    {
      meta(
        meta: Partial<
          Pick<
            UIFieldBase<FieldId, Kind>,
            "label" | "icon" | "description" | "placeholder"
          >
        >,
      ): BooleanFieldBuilder<FieldId, Kind, Used | "meta">;
      operator(
        ops:
          | readonly OperatorKindFor<Kind>[]
          | ((ops: OperatorKindFor<Kind>[]) => OperatorKindFor<Kind>[]),
      ): BooleanFieldBuilder<FieldId, Kind, Used | "operator">;
      render(fn: UIFieldRender): BooleanFieldBuilder<FieldId, Kind, Used | "render">;
      options(options: BooleanOptions): BooleanFieldBuilder<FieldId, Kind, Used | "options">;
    },
    Used
  >;

export type FieldBuilder<
  FieldId extends string,
  Kind extends EnumFieldKind,
  Used extends FieldBuilderMethod<Kind> = never,
> = Kind extends SelectKind
  ? SelectFieldBuilder<FieldId, Kind, Extract<Used, SelectFieldBuilderMethod>>
  : Kind extends BooleanKind
  ? BooleanFieldBuilder<FieldId, Kind, Extract<Used, BooleanFieldBuilderMethod>>
  : BaseFieldBuilder<FieldId, Kind, Extract<Used, BaseFieldBuilderMethod>>;

export interface FieldGroupDefinition<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  label: string;
  fields: AnyFieldBuilder<FieldId, Kind>[];
}

export type FieldDefinition<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> = AnyFieldBuilder<FieldId, Kind> | FieldGroupDefinition<FieldId, Kind>;

type AnyUIField = UIFieldForKind<string, EnumFieldKind>;
const builderFieldStore = new WeakMap<object, AnyUIField>();

export function isFieldGroupDefinition<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  definition: FieldDefinition<FieldId, Kind>,
): definition is FieldGroupDefinition<FieldId, Kind> {
  return "fields" in definition && "label" in definition;
}

export function getUIFieldFromBuilder<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(builder: AnyFieldBuilder<FieldId, Kind>): UIFieldForKind<FieldId, Kind> {
  const field = builderFieldStore.get(builder as object);
  if (!field) {
    throw new Error("Invalid field builder instance.");
  }
  return field as UIFieldForKind<FieldId, Kind>;
}

class BuilderBase<
  FieldId extends string,
  Kind extends EnumFieldKind,
> {
  declare readonly [fieldBuilderBrand]: {
    readonly fieldId: FieldId;
    readonly kind: Kind;
  };

  #field: UIFieldForKind<FieldId, Kind>;

  protected get field() {
    return this.#field;
  }

  constructor(id: FieldId, kind: Kind) {
    const field = {
      id,
      kind,
      allowedOperators: operatorsForKind(kind),
    } as UIFieldForKind<FieldId, Kind>;
    this.#field = field;
    builderFieldStore.set(this, field as AnyUIField);
  }

  meta({
    label,
    icon,
    description,
    placeholder,
  }: Partial<
    Pick<
      UIFieldBase<FieldId, Kind>,
      "label" | "icon" | "description" | "placeholder"
    >
  >) {
    if (label !== undefined) this.#field.label = label;
    if (icon !== undefined) this.#field.icon = icon;
    if (description !== undefined) this.#field.description = description;
    if (placeholder !== undefined) this.#field.placeholder = placeholder;
    return this;
  }

  operator(
    ops:
      | readonly OperatorKindFor<Kind>[]
      | ((ops: OperatorKindFor<Kind>[]) => OperatorKindFor<Kind>[]),
  ) {
    const field = this.#field as UIFieldBase<FieldId, Kind>;
    const currentOps = [...field.allowedOperators];
    const resolvedOps = typeof ops === "function" ? ops(currentOps) : ops;
    field.allowedOperators = [...resolvedOps];
    return this;
  }

  render(fn: UIFieldRender) {
    this.#field.render = fn;
    return this;
  }
}

class SelectBuilderBase<
  FieldId extends string,
  Kind extends SelectKind,
> extends BuilderBase<FieldId, Kind> {
  constructor(id: FieldId, kind: Kind) {
    super(id, kind);
    this.field.optionsSearchable = true;
  }

  options(options: SelectOptions) {
    this.field.options = options;
    return this;
  }

  loadOptions(mode: SelectOptionsLoadMode) {
    this.field.optionsLoadMode = mode;
    return this;
  }

  searchable(searchable = true) {
    this.field.optionsSearchable = searchable;
    return this;
  }

  renderValueLabel(fn: MultiSelectValueLabelRenderer) {
    this.field.renderValueLabel = fn;
    return this;
  }

  maxSelections(max: number) {
    this.field.maxSelections = Math.max(1, Math.trunc(max));
    return this;
  }
}

class BooleanBuilderBase<
  FieldId extends string,
  Kind extends BooleanKind,
> extends BuilderBase<FieldId, Kind> {
  options(options: BooleanOptions) {
    this.field.options = options;
    return this;
  }
}

class Filtro {
  static readonly instance = new Filtro();

  private constructor() { }

  string<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.string> {
    return new BuilderBase<FieldId, typeof FieldKind.string>(id, FieldKind.string);
  }

  number<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.number> {
    return new BuilderBase<FieldId, typeof FieldKind.number>(id, FieldKind.number);
  }

  date<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.date> {
    return new BuilderBase<FieldId, typeof FieldKind.date>(id, FieldKind.date);
  }

  select<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.select> {
    return new SelectBuilderBase<FieldId, typeof FieldKind.select>(id, FieldKind.select);
  }

  multiSelect<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.multiSelect> {
    return new SelectBuilderBase<FieldId, typeof FieldKind.multiSelect>(
      id,
      FieldKind.multiSelect,
    );
  }

  boolean<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.boolean> {
    return new BooleanBuilderBase<FieldId, typeof FieldKind.boolean>(
      id,
      FieldKind.boolean,
    );
  }

  group<FieldId extends string = string, Kind extends EnumFieldKind = EnumFieldKind>(
    label: string,
    fields: AnyFieldBuilder<FieldId, Kind>[],
  ): FieldGroupDefinition<FieldId, Kind> {
    return {
      label,
      fields,
    };
  }
}

export const filtro = Filtro.instance;
