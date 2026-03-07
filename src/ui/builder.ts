import { FieldKind, type EnumFieldKind } from "../logical/field.js";
import { operatorsForKind, type OperatorKindFor } from "../logical/operator.js";
import type {
  BooleanKind,
  BooleanOptions,
  SelectKind,
  SelectOptions,
  UIFieldBase,
  UIFieldForKind,
  UIFieldRender,
} from "./types.js";

export interface BaseFieldBuilder<
  FieldId extends string,
  Kind extends EnumFieldKind,
> {
  meta(
    meta: Partial<
      Pick<
        UIFieldBase<FieldId, Kind>,
        "label" | "icon" | "description" | "placeholder"
      >
    >,
  ): this;
  operator(
    ops:
      | readonly OperatorKindFor<Kind>[]
      | ((ops: OperatorKindFor<Kind>[]) => OperatorKindFor<Kind>[]),
  ): this;
  render(fn: UIFieldRender): this;
}

export interface SelectFieldBuilder<
  FieldId extends string,
  Kind extends SelectKind,
> extends BaseFieldBuilder<FieldId, Kind> {
  options(options: SelectOptions): this;
}

export interface BooleanFieldBuilder<
  FieldId extends string,
  Kind extends BooleanKind,
> extends BaseFieldBuilder<FieldId, Kind> {
  options(options: BooleanOptions): this;
}

export type FieldBuilder<
  FieldId extends string,
  Kind extends EnumFieldKind,
> = Kind extends SelectKind
  ? SelectFieldBuilder<FieldId, Kind>
  : Kind extends BooleanKind
  ? BooleanFieldBuilder<FieldId, Kind>
  : BaseFieldBuilder<FieldId, Kind>;

type AnyUIField = UIFieldForKind<string, EnumFieldKind>;
const builderFieldStore = new WeakMap<object, AnyUIField>();

export function getUIFieldFromBuilder<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(builder: FieldBuilder<FieldId, Kind>): UIFieldForKind<FieldId, Kind> {
  const field = builderFieldStore.get(builder as object);
  if (!field) {
    throw new Error("Invalid field builder instance.");
  }
  return field as UIFieldForKind<FieldId, Kind>;
}

class BuilderBase<FieldId extends string, Kind extends EnumFieldKind>
  implements BaseFieldBuilder<FieldId, Kind> {
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

class SelectBuilderBase<FieldId extends string, Kind extends SelectKind>
  extends BuilderBase<FieldId, Kind>
  implements SelectFieldBuilder<FieldId, Kind> {
  options(options: SelectOptions) {
    this.field.options = options;
    return this;
  }
}

class BooleanBuilderBase<FieldId extends string, Kind extends BooleanKind>
  extends BuilderBase<FieldId, Kind>
  implements BooleanFieldBuilder<FieldId, Kind> {
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
    return new BuilderBase(id, FieldKind.string);
  }

  number<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.number> {
    return new BuilderBase(id, FieldKind.number);
  }

  date<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.date> {
    return new BuilderBase(id, FieldKind.date);
  }

  select<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.select> {
    return new SelectBuilderBase(id, FieldKind.select);
  }

  multiSelect<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.multiSelect> {
    return new SelectBuilderBase(id, FieldKind.multiSelect);
  }

  boolean<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.boolean> {
    return new BooleanBuilderBase(id, FieldKind.boolean);
  }
}

export const filtro = Filtro.instance;
