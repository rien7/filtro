import type { EnumFieldKind } from '../logical/field'
import { FieldKind } from '../logical/field'
import type { OperatorKindFor } from '../logical/operator'
import {
  operatorsForKind,
} from '../logical/operator'
import type {
  BooleanKind,
  BooleanOptions,
  FilterBarSuggestedDisplay,
  MultiSelectValueLabelRenderer,
  SafeParseSchemaResolver,
  SelectKind,
  SelectOptions,
  SelectOptionsLoadMode,
  SelectUIField,
  UIFieldBase,
  UIFieldForKind,
  UIFieldRender,
  UIFieldValidator,
  UseSelectOptions,
} from './types'

type BaseFieldBuilderMethod
  = | 'label'
    | 'icon'
    | 'description'
    | 'placeholder'
    | 'pin'
    | 'suggest'
    | 'operator'
    | 'fixedOperator'
    | 'render'
    | 'validate'
    | 'zod'
type SelectFieldBuilderMethod
  = | BaseFieldBuilderMethod
    | 'options'
    | 'useOptions'
    | 'loadOptions'
    | 'searchable'
type MultiSelectFieldBuilderMethod
  = | SelectFieldBuilderMethod
    | 'renderValueLabel'
    | 'maxSelections'
type BooleanFieldBuilderMethod = BaseFieldBuilderMethod | 'options'

type FieldBuilderMethod<Kind extends EnumFieldKind> = Kind extends SelectKind
  ? Kind extends typeof FieldKind.multiSelect
    ? MultiSelectFieldBuilderMethod
    : SelectFieldBuilderMethod
  : Kind extends BooleanKind
    ? BooleanFieldBuilderMethod
    : BaseFieldBuilderMethod

type OmitUsedMethods<Builder, Used extends PropertyKey> = Omit<
  Builder,
  Extract<keyof Builder, Used>
>
type FieldOperatorConfig<Op extends string> = {
  default?: Op
}
type FieldOperatorResolver<Kind extends EnumFieldKind> = (
  ops: OperatorKindFor<Kind>[],
) => OperatorKindFor<Kind>[]
type FieldOperatorInput<Kind extends EnumFieldKind>
  = | OperatorKindFor<Kind>
    | readonly OperatorKindFor<Kind>[]
    | FieldOperatorResolver<Kind>
declare const fieldBuilderBrand: unique symbol

export interface AnyFieldBuilder<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  readonly [fieldBuilderBrand]: {
    readonly fieldId: FieldId
    readonly kind: Kind
  }
}

export type BaseFieldBuilder<
  FieldId extends string,
  Kind extends EnumFieldKind,
  Used extends BaseFieldBuilderMethod = never,
> = AnyFieldBuilder<FieldId, Kind>
  & OmitUsedMethods<
    {
      label: (label: NonNullable<UIFieldBase<FieldId, Kind>['label']>) => BaseFieldBuilder<FieldId, Kind, Used | 'label'>
      icon: (icon: NonNullable<UIFieldBase<FieldId, Kind>['icon']>) => BaseFieldBuilder<FieldId, Kind, Used | 'icon'>
      description: (
        description: NonNullable<UIFieldBase<FieldId, Kind>['description']>,
      ) => BaseFieldBuilder<FieldId, Kind, Used | 'description'>
      placeholder: (
        placeholder: NonNullable<UIFieldBase<FieldId, Kind>['placeholder']>,
      ) => BaseFieldBuilder<FieldId, Kind, Used | 'placeholder'>
      pin: () => BaseFieldBuilder<FieldId, Kind, Used | 'pin' | 'suggest'>
      suggest: (
        config?: Omit<FilterBarSuggestedDisplay<Kind>, 'kind'>,
      ) => BaseFieldBuilder<FieldId, Kind, Used | 'pin' | 'suggest'>
      operator: (<Op extends OperatorKindFor<Kind>>(
        op: Op,
        config?: FieldOperatorConfig<Op>,
      ) => BaseFieldBuilder<FieldId, Kind, Used | 'operator'>) & (<const Ops extends readonly OperatorKindFor<Kind>[]>(
        ops: Ops,
        config?: FieldOperatorConfig<Ops[number]>,
      ) => BaseFieldBuilder<FieldId, Kind, Used | 'operator'>) & ((
        resolve: FieldOperatorResolver<Kind>,
        config?: FieldOperatorConfig<OperatorKindFor<Kind>>,
      ) => BaseFieldBuilder<FieldId, Kind, Used | 'operator'>) & ((
        config: FieldOperatorConfig<OperatorKindFor<Kind>>,
      ) => BaseFieldBuilder<FieldId, Kind, Used | 'operator'>)
      fixedOperator: <Op extends OperatorKindFor<Kind>>(
        op: Op,
      ) => BaseFieldBuilder<FieldId, Kind, Used | 'fixedOperator'>
      render: (fn: UIFieldRender) => BaseFieldBuilder<FieldId, Kind, Used | 'render'>
      validate: (
        fn: UIFieldValidator,
      ) => BaseFieldBuilder<FieldId, Kind, Used | 'validate'>
      zod: (
        schema: SafeParseSchemaResolver<Kind>,
      ) => BaseFieldBuilder<FieldId, Kind, Used | 'zod'>
    },
    Used
  >

export type SelectFieldBuilder<
  FieldId extends string,
  Kind extends SelectKind,
  Used extends Kind extends typeof FieldKind.multiSelect
    ? MultiSelectFieldBuilderMethod
    : SelectFieldBuilderMethod = never,
> = AnyFieldBuilder<FieldId, Kind>
  & OmitUsedMethods<
    {
      label: (label: NonNullable<UIFieldBase<FieldId, Kind>['label']>) => SelectFieldBuilder<FieldId, Kind, Used | 'label'>
      icon: (icon: NonNullable<UIFieldBase<FieldId, Kind>['icon']>) => SelectFieldBuilder<FieldId, Kind, Used | 'icon'>
      description: (
        description: NonNullable<UIFieldBase<FieldId, Kind>['description']>,
      ) => SelectFieldBuilder<FieldId, Kind, Used | 'description'>
      placeholder: (
        placeholder: NonNullable<UIFieldBase<FieldId, Kind>['placeholder']>,
      ) => SelectFieldBuilder<FieldId, Kind, Used | 'placeholder'>
      pin: () => SelectFieldBuilder<FieldId, Kind, Used | 'pin' | 'suggest'>
      suggest: (
        config?: Omit<FilterBarSuggestedDisplay<Kind>, 'kind'>,
      ) => SelectFieldBuilder<FieldId, Kind, Used | 'pin' | 'suggest'>
      operator: (<Op extends OperatorKindFor<Kind>>(
        op: Op,
        config?: FieldOperatorConfig<Op>,
      ) => SelectFieldBuilder<FieldId, Kind, Used | 'operator'>) & (<const Ops extends readonly OperatorKindFor<Kind>[]>(
        ops: Ops,
        config?: FieldOperatorConfig<Ops[number]>,
      ) => SelectFieldBuilder<FieldId, Kind, Used | 'operator'>) & ((
        resolve: FieldOperatorResolver<Kind>,
        config?: FieldOperatorConfig<OperatorKindFor<Kind>>,
      ) => SelectFieldBuilder<FieldId, Kind, Used | 'operator'>) & ((
        config: FieldOperatorConfig<OperatorKindFor<Kind>>,
      ) => SelectFieldBuilder<FieldId, Kind, Used | 'operator'>)
      fixedOperator: <Op extends OperatorKindFor<Kind>>(
        op: Op,
      ) => SelectFieldBuilder<FieldId, Kind, Used | 'fixedOperator'>
      render: (fn: UIFieldRender) => SelectFieldBuilder<FieldId, Kind, Used | 'render'>
      options: (options: SelectOptions) => SelectFieldBuilder<FieldId, Kind, Used | 'options'>
      useOptions: (
        useOptions: UseSelectOptions<FieldId, Kind>,
      ) => SelectFieldBuilder<FieldId, Kind, Used | 'useOptions'>
      loadOptions: (
        mode: SelectOptionsLoadMode,
      ) => SelectFieldBuilder<FieldId, Kind, Used | 'loadOptions'>
      searchable: (
        searchable?: boolean,
      ) => SelectFieldBuilder<FieldId, Kind, Used | 'searchable'>
      validate: (
        fn: UIFieldValidator,
      ) => SelectFieldBuilder<FieldId, Kind, Used | 'validate'>
      zod: (
        schema: SafeParseSchemaResolver<Kind>,
      ) => SelectFieldBuilder<FieldId, Kind, Used | 'zod'>
    } & (Kind extends typeof FieldKind.multiSelect
      ? {
          renderValueLabel: (fn: MultiSelectValueLabelRenderer) => SelectFieldBuilder<FieldId, Kind, Used | 'renderValueLabel'>
          maxSelections: (max: number) => SelectFieldBuilder<FieldId, Kind, Used | 'maxSelections'>
        }
      : Record<never, never>),
    Used
  >

export type BooleanFieldBuilder<
  FieldId extends string,
  Kind extends BooleanKind,
  Used extends BooleanFieldBuilderMethod = never,
> = AnyFieldBuilder<FieldId, Kind>
  & OmitUsedMethods<
    {
      label: (label: NonNullable<UIFieldBase<FieldId, Kind>['label']>) => BooleanFieldBuilder<FieldId, Kind, Used | 'label'>
      icon: (icon: NonNullable<UIFieldBase<FieldId, Kind>['icon']>) => BooleanFieldBuilder<FieldId, Kind, Used | 'icon'>
      description: (
        description: NonNullable<UIFieldBase<FieldId, Kind>['description']>,
      ) => BooleanFieldBuilder<FieldId, Kind, Used | 'description'>
      placeholder: (
        placeholder: NonNullable<UIFieldBase<FieldId, Kind>['placeholder']>,
      ) => BooleanFieldBuilder<FieldId, Kind, Used | 'placeholder'>
      pin: () => BooleanFieldBuilder<FieldId, Kind, Used | 'pin' | 'suggest'>
      suggest: (
        config?: Omit<FilterBarSuggestedDisplay<Kind>, 'kind'>,
      ) => BooleanFieldBuilder<FieldId, Kind, Used | 'pin' | 'suggest'>
      operator: (<Op extends OperatorKindFor<Kind>>(
        op: Op,
        config?: FieldOperatorConfig<Op>,
      ) => BooleanFieldBuilder<FieldId, Kind, Used | 'operator'>) & (<const Ops extends readonly OperatorKindFor<Kind>[]>(
        ops: Ops,
        config?: FieldOperatorConfig<Ops[number]>,
      ) => BooleanFieldBuilder<FieldId, Kind, Used | 'operator'>) & ((
        resolve: FieldOperatorResolver<Kind>,
        config?: FieldOperatorConfig<OperatorKindFor<Kind>>,
      ) => BooleanFieldBuilder<FieldId, Kind, Used | 'operator'>) & ((
        config: FieldOperatorConfig<OperatorKindFor<Kind>>,
      ) => BooleanFieldBuilder<FieldId, Kind, Used | 'operator'>)
      fixedOperator: <Op extends OperatorKindFor<Kind>>(
        op: Op,
      ) => BooleanFieldBuilder<FieldId, Kind, Used | 'fixedOperator'>
      render: (fn: UIFieldRender) => BooleanFieldBuilder<FieldId, Kind, Used | 'render'>
      options: (options: BooleanOptions) => BooleanFieldBuilder<FieldId, Kind, Used | 'options'>
      validate: (
        fn: UIFieldValidator,
      ) => BooleanFieldBuilder<FieldId, Kind, Used | 'validate'>
      zod: (
        schema: SafeParseSchemaResolver<Kind>,
      ) => BooleanFieldBuilder<FieldId, Kind, Used | 'zod'>
    },
    Used
  >

export type FieldBuilder<
  FieldId extends string,
  Kind extends EnumFieldKind,
  Used extends FieldBuilderMethod<Kind> = never,
> = Kind extends SelectKind
  ? SelectFieldBuilder<FieldId, Kind, Extract<Used, SelectFieldBuilderMethod>>
  : Kind extends BooleanKind
    ? BooleanFieldBuilder<FieldId, Kind, Extract<Used, BooleanFieldBuilderMethod>>
    : BaseFieldBuilder<FieldId, Kind, Extract<Used, BaseFieldBuilderMethod>>

export interface FieldGroupDefinition<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> {
  label: string
  fields: AnyFieldBuilder<FieldId, Kind>[]
}

export type FieldDefinition<
  FieldId extends string = string,
  Kind extends EnumFieldKind = EnumFieldKind,
> = AnyFieldBuilder<FieldId, Kind> | FieldGroupDefinition<FieldId, Kind>

type AnyUIField = UIFieldForKind<string, EnumFieldKind>
const builderFieldStore = new WeakMap<object, AnyUIField>()

export function isFieldGroupDefinition<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(
  definition: FieldDefinition<FieldId, Kind>,
): definition is FieldGroupDefinition<FieldId, Kind> {
  return 'fields' in definition && 'label' in definition
}

export function getUIFieldFromBuilder<
  FieldId extends string,
  Kind extends EnumFieldKind,
>(builder: AnyFieldBuilder<FieldId, Kind>): UIFieldForKind<FieldId, Kind> {
  const field = builderFieldStore.get(builder as object)
  if (!field) {
    throw new Error('Invalid field builder instance.')
  }
  return field as UIFieldForKind<FieldId, Kind>
}

class BuilderBase<
  FieldId extends string,
  Kind extends EnumFieldKind,
> {
  declare readonly [fieldBuilderBrand]: {
    readonly fieldId: FieldId
    readonly kind: Kind
  }

  #field: UIFieldForKind<FieldId, Kind>

  protected get field() {
    return this.#field
  }

  constructor(id: FieldId, kind: Kind) {
    const field = {
      id,
      kind,
      allowedOperators: operatorsForKind(kind),
    } as UIFieldForKind<FieldId, Kind>
    this.#field = field
    builderFieldStore.set(this, field as AnyUIField)
  }

  label(label: NonNullable<UIFieldBase<FieldId, Kind>['label']>) {
    this.#field.label = label
    return this
  }

  icon(icon: NonNullable<UIFieldBase<FieldId, Kind>['icon']>) {
    this.#field.icon = icon
    return this
  }

  description(description: NonNullable<UIFieldBase<FieldId, Kind>['description']>) {
    this.#field.description = description
    return this
  }

  placeholder(placeholder: NonNullable<UIFieldBase<FieldId, Kind>['placeholder']>) {
    this.#field.placeholder = placeholder
    return this
  }

  #setDisplay(display: UIFieldBase<FieldId, Kind>['display']) {
    const field = this.#field as UIFieldBase<FieldId, Kind>

    if (!display || display.kind === 'default') {
      delete field.display
      return this
    }

    field.display = display
    return this
  }

  pin() {
    return this.#setDisplay({ kind: 'pinned' })
  }

  suggest(config?: Omit<FilterBarSuggestedDisplay<Kind>, 'kind'>) {
    const display: FilterBarSuggestedDisplay<Kind> = {
      kind: 'suggested',
      removeBehavior: 'back-to-suggestion',
      showInMenu: true,
    }

    if (config?.seed !== undefined) {
      display.seed = config.seed
    }

    if (config?.removeBehavior !== undefined) {
      display.removeBehavior = config.removeBehavior
    }

    if (config?.showInMenu !== undefined) {
      display.showInMenu = config.showInMenu
    }

    return this.#setDisplay(display)
  }

  operator<Op extends OperatorKindFor<Kind>>(
    op: Op,
    config?: FieldOperatorConfig<Op>,
  ): this
  operator<const Ops extends readonly OperatorKindFor<Kind>[]>(
    ops: Ops,
    config?: FieldOperatorConfig<Ops[number]>,
  ): this
  operator(
    resolve: FieldOperatorResolver<Kind>,
    config?: FieldOperatorConfig<OperatorKindFor<Kind>>,
  ): this
  operator(
    config: FieldOperatorConfig<OperatorKindFor<Kind>>,
  ): this
  operator(
    input: FieldOperatorInput<Kind> | FieldOperatorConfig<OperatorKindFor<Kind>>,
    config?: FieldOperatorConfig<OperatorKindFor<Kind>>,
  ) {
    const field = this.#field as UIFieldBase<FieldId, Kind>
    const currentOps = [...field.allowedOperators]
    const usingConfigOnly
      = typeof input === 'object'
        && input !== null
        && !Array.isArray(input)
    const resolvedOps = usingConfigOnly
      ? operatorsForKind(field.kind)
      : typeof input === 'function'
        ? input(currentOps)
        : Array.isArray(input)
          ? [...input]
          : [input]
    const resolvedConfig = usingConfigOnly
      ? input as FieldOperatorConfig<OperatorKindFor<Kind>>
      : config
    const defaultSelectedOperator = resolvedConfig?.default

    field.allowedOperators = [...resolvedOps]
    delete field.fixedOperator
    field.defaultSelectedOperator = resolvedOps.find(op => op === defaultSelectedOperator)
    return this
  }

  fixedOperator<Op extends OperatorKindFor<Kind>>(op: Op) {
    const field = this.#field as UIFieldBase<FieldId, Kind>
    field.allowedOperators = [op]
    field.fixedOperator = op
    field.defaultSelectedOperator = op
    return this
  }

  render(fn: UIFieldRender) {
    this.#field.render = fn
    return this
  }

  validate(fn: UIFieldValidator) {
    const field = this.#field as UIFieldBase<FieldId, Kind>
    field.validators = [...(field.validators ?? []), fn]
    return this
  }

  zod(schema: SafeParseSchemaResolver<Kind>) {
    return this.validate(({ op, value }) => {
      if (value === null) {
        return null
      }

      const resolvedSchema
        = typeof schema === 'function'
          ? schema({ op: op as unknown as OperatorKindFor<Kind> })
          : schema
      const result = resolvedSchema.safeParse(value)

      if (result.success) {
        return null
      }

      const firstIssue = result.error.issues?.find(issue =>
        typeof issue.message === 'string' && issue.message.trim().length > 0)

      if (firstIssue?.message) {
        return firstIssue.message.trim()
      }

      if (typeof result.error.message === 'string' && result.error.message.trim().length > 0) {
        return result.error.message.trim()
      }

      return 'Invalid value'
    })
  }
}

class SelectBuilderBase<
  FieldId extends string,
  Kind extends SelectKind,
> extends BuilderBase<FieldId, Kind> {
  constructor(id: FieldId, kind: Kind) {
    super(id, kind)
    this.field.optionsSearchable = true
  }

  options(options: SelectOptions) {
    const field = this.field as SelectUIField<FieldId, Kind>
    delete field.useOptions
    field.options = options
    return this
  }

  useOptions(useOptions: UseSelectOptions<FieldId, Kind>) {
    const field = this.field as SelectUIField<FieldId, Kind>
    delete field.options
    field.useOptions = useOptions
    return this
  }

  loadOptions(mode: SelectOptionsLoadMode) {
    this.field.optionsLoadMode = mode
    return this
  }

  searchable(searchable = true) {
    this.field.optionsSearchable = searchable
    return this
  }

  renderValueLabel(fn: MultiSelectValueLabelRenderer) {
    this.field.renderValueLabel = fn
    return this
  }

  maxSelections(max: number) {
    this.field.maxSelections = Math.max(1, Math.trunc(max))
    return this
  }
}

class BooleanBuilderBase<
  FieldId extends string,
  Kind extends BooleanKind,
> extends BuilderBase<FieldId, Kind> {
  options(options: BooleanOptions) {
    this.field.options = options
    return this
  }
}

class Filtro {
  static readonly instance = new Filtro()

  private constructor() { }

  string<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.string> {
    return new BuilderBase<FieldId, typeof FieldKind.string>(id, FieldKind.string)
  }

  number<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.number> {
    return new BuilderBase<FieldId, typeof FieldKind.number>(id, FieldKind.number)
  }

  date<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.date> {
    return new BuilderBase<FieldId, typeof FieldKind.date>(id, FieldKind.date)
  }

  select<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.select> {
    return new SelectBuilderBase<FieldId, typeof FieldKind.select>(id, FieldKind.select)
  }

  multiSelect<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.multiSelect> {
    return new SelectBuilderBase<FieldId, typeof FieldKind.multiSelect>(
      id,
      FieldKind.multiSelect,
    )
  }

  boolean<FieldId extends string = string>(
    id: FieldId,
  ): FieldBuilder<FieldId, typeof FieldKind.boolean> {
    return new BooleanBuilderBase<FieldId, typeof FieldKind.boolean>(
      id,
      FieldKind.boolean,
    )
  }

  group<FieldId extends string = string, Kind extends EnumFieldKind = EnumFieldKind>(
    label: string,
    fields: AnyFieldBuilder<FieldId, Kind>[],
  ): FieldGroupDefinition<FieldId, Kind> {
    return {
      label,
      fields,
    }
  }
}

export const filtro = Filtro.instance
