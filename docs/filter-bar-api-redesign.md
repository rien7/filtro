# FilterBar API 重构草案

这份文档聚焦当前 `filtro` API 的一次收敛式重构。

目标不是把当前能力砍掉，而是把默认路径压缩到更短、更稳定，同时保留高级扩展能力。

想达到的使用感可以概括成一句话：

- 默认用法接近 `sonner` 那种“先用起来，再逐步深入”
- 高级能力仍然存在，但不应该压到所有用户的第一层 API 上

## 1. 当前问题

结合当前实现，主要问题不是“能力不够”，而是“默认 API 太像框架，不像产品”。

### 1.1 默认路径偏重

当前常规用法通常需要：

- `FilterBar.Root`
- `FilterBar.Trigger`
- `FilterBar.Items`
- `FilterBar.Clear`
- 可选 `FilterBar.Views`
- 可选 `FilterBar.SaveView`

在 playground 里，一个完整示例已经接近一段固定样板：

- [`playground/playground-app.tsx`](/Users/rien7/Developer/filtro/playground/playground-app.tsx)

这对需要高度控制布局的用户没有问题，但不符合“先写最少代码就能得到一套好用过滤 UI”的目标。

### 1.2 对外状态模型暴露了太多内部细节

当前 `FilterBarValue` 暴露了：

- `fieldId`
- `kind`
- `operator`
- `allowOperators`
- `value`

定义位置：

- [`src/filter-bar/context.ts`](/Users/rien7/Developer/filtro/src/filter-bar/context.ts)

其中 `kind` 和 `allowOperators` 对外部消费者来说都更像推导信息，而不是业务真正需要持有的数据。

这会带来两个问题：

- 用户心智会落到内部 UI 状态，而不是业务过滤条件
- 后续如果内部 operator/field 约束策略变化，受控 API 也会被迫跟着变化

### 1.3 高级能力和基础能力混在同一层

当前根入口直接导出了很多不同层级的东西：

- builder
- compound components
- context/provider
- value serialize/deserialize/sanitize 工具
- theme contract

入口位置：

- [`src/filter-bar/index.ts`](/Users/rien7/Developer/filtro/src/filter-bar/index.ts)

这会让 API surface 很大，也会让使用者难以判断：

- 哪些是主路径
- 哪些是高级能力
- 哪些只是内部能力被顺手导出了

### 1.4 行为一致性还不够

当前不同字段在“新增时”的行为并不一致：

- `select` / `multiSelect` 可以在 trigger 里直接形成完整条件
- `string` / `number` / `date` 往往先插入 incomplete row
- `boolean` 默认值会被直接推成 `true`
- `select` 在静态 options 下可能默认取第一个 option

相关代码：

- [`src/filter-bar/trigger.tsx`](/Users/rien7/Developer/filtro/src/filter-bar/trigger.tsx)
- [`src/filter-bar/state.ts`](/Users/rien7/Developer/filtro/src/filter-bar/state.ts)

这些行为各自都能解释，但组合起来会让“库替我做决定”的感觉偏重。

### 1.5 builder 的能力统一了，但默认 UI 没完全统一兑现

例如 `.validate()` / `.zod()` 是统一 builder 能力，但默认 UI 里：

- string / number / date 会走错误展示链路
- select / multiSelect / boolean 目前没有接到同等的错误展示

相关代码：

- [`src/filter-bar/builder.ts`](/Users/rien7/Developer/filtro/src/filter-bar/builder.ts)
- [`src/filter-bar/items.value-editor.tsx`](/Users/rien7/Developer/filtro/src/filter-bar/items.value-editor.tsx)

这会削弱 API 的可预期性。

## 2. 重构目标

这次重构建议围绕三个目标展开。

### 2.1 默认入口更短

希望最常见用法能压缩成：

```tsx
<FilterBar
  fields={fields}
  value={value}
  onChange={setValue}
/>
```

或者：

```tsx
const filters = createFilterBar({
  fields,
});

return <filters.UI />;
```

具体形式可以再定，但核心目标不变：

- 默认不需要显式拼装 `Root/Trigger/Items/Clear`
- 默认提供一套可工作的 layout 和行为
- 只有需要深度定制时才进入 compound/headless API

### 2.2 状态模型更小、更稳定

建议把对外主状态收敛成：

```ts
type FilterConditionValue = {
  fieldId: string;
  operator: string;
  value: unknown;
};
```

是否保留精确类型推导可以进一步设计，但原则应是：

- 不向外暴露 `allowOperators`
- 不向外要求携带 `kind`
- 让字段定义成为唯一事实来源

内部仍然可以保留 richer model，但不应该成为主受控 API。

### 2.3 明确区分主路径和高级路径

建议把 API 分成两层：

- 第一层：高层易用 API
- 第二层：高级 headless / controller / URL sync / preset API

也就是说，未来文档和导出都应该有明确主次：

- “先用这个”
- “需要定制再用这个”

而不是把所有能力平铺在同一个入口页上。

## 3. 建议的 API 结构

下面是一个偏务实的方案，尽量复用当前实现，而不是推倒重写。

### 3.1 保留 `filtro` builder

`filtro.string(...)` 这套声明方式整体值得保留。

原因：

- 可读性够好
- 类型约束已经比较完整
- 当前生态文档和示例都围绕它展开

但要做两点收敛：

- 让 builder 输出更接近 plain definition，而不是必须依赖 class + `WeakMap`
- 明确哪些方法是基础能力，哪些是高级能力

建议中的分层：

- 基础：`label`、`placeholder`、`operator`
- 进阶：`options`、`loadOptions`、`searchable`
- 高级：`render`、`useOptions`、`validate`、`zod`

不是要删方法，而是要在文档和 API 组织上体现层次。

### 3.2 新增高层组件入口

建议新增一个真正的一层入口：

```tsx
import { FilterBar, filtro } from "filtro";

const fields = [
  filtro.string("keyword").label("Keyword"),
  filtro.select("status").label("Status").options([
    { label: "Open", value: "open" },
    { label: "Closed", value: "closed" },
  ]),
];

export function Example() {
  return <FilterBar fields={fields} />;
}
```

这个高层 `FilterBar` 建议默认包含：

- 内建 toolbar
- 默认 trigger
- 默认 clear
- 默认 items
- 可选 views

并支持通过 props 控制显隐，例如：

```tsx
<FilterBar
  fields={fields}
  views
  saveViews
  clearable
/>
```

或者：

```tsx
<FilterBar
  fields={fields}
  slots={{
    trigger: { children: "Add Filter" },
    clear: { children: "Clear" },
  }}
/>
```

目标是：

- 80% 用户不再自己组装基础骨架
- 20% 用户仍可下沉到 headless API

### 3.3 保留并下沉 compound API

当前 `FilterBar.Root / Trigger / Items / Clear / SaveView / Views` 不建议删除。

它们应该变成：

- 高级模式
- 布局深度定制模式
- preset / design system 集成模式

建议未来命名与导出方式二选一：

#### 方案 A

保留现名，但在文档里明确归为 headless API：

```ts
FilterBar.Root
FilterBar.Trigger
FilterBar.Items
```

#### 方案 B

迁移到更明确的命名：

```ts
FilterBarPrimitive.Root
FilterBarPrimitive.Trigger
FilterBarPrimitive.Items
```

如果兼容成本允许，我更倾向于方案 B。

因为它能清楚表达：

- `FilterBar` 是产品级入口
- `FilterBarPrimitive` 才是拼装级入口

### 3.4 新增受控值的简化类型

建议新增对外的主状态类型：

```ts
type FilterBarCondition<FieldId extends string = string> = {
  fieldId: FieldId;
  operator: string;
  value: unknown;
};

type FilterBarConditions<FieldId extends string = string> =
  FilterBarCondition<FieldId>[];
```

当前 richer 类型可以保留为内部或高级导出，例如：

```ts
type InternalFilterBarValue = ...
```

建议高层 `FilterBar` 默认只接简化类型：

```ts
type FilterBarProps = {
  fields: FieldDefinition[];
  value?: FilterBarConditions;
  defaultValue?: FilterBarConditions;
  onChange?: (nextValue: FilterBarConditions, meta?: FilterBarChangeMeta) => void;
};
```

内部再把它转换成现有结构。

这样能让：

- `nuqs`
- 外部 store
- 服务端请求参数转换

都面对更简单的数据结构。

### 3.5 views 和 controller 不再挤在默认心智里

现在 `viewsStorageKey` 在 `Root` 上，`useFilterBarController()` 在同一主入口里暴露。

建议未来这样处理：

- 高层 `FilterBar` 通过单独 props 开启 views
- controller 仍是高级 hook
- URL sync 仍是独立子入口

高层示意：

```tsx
<FilterBar
  fields={fields}
  views={{
    storageKey: "demo:filters",
  }}
/>
```

而不是默认先暴露：

- `viewsStorageKey`
- `SaveView`
- `Views`
- `clearActiveView`
- `activeView`

这些更适合放在高级模式里。

### 3.6 把“默认可定制”从 `render` element 转为 `slots`

当前很多组件依赖 `render={<Button />}` 这种方式替换 trigger：

- [`playground/playground-app.tsx`](/Users/rien7/Developer/filtro/playground/playground-app.tsx)

它能工作，但从整体产品 API 角度看，可读性并不够直接。

高层组件建议用更显式的 `slots` / `slotProps`：

```tsx
<FilterBar
  fields={fields}
  slots={{
    trigger: Button,
    clear: Button,
  }}
  slotProps={{
    trigger: { variant: "outline", children: "Add Filter" },
    clear: { variant: "outline", children: "Clear" },
  }}
/>
```

compound/headless API 仍可继续保留 `render` 风格。

## 4. 需要修改的代码区域

下面按影响范围列出建议修改点。

### 4.1 新增高层 `FilterBar` 组件

需要新增一个真正的产品级组件，负责包装当前 headless 组合。

建议位置：

- `src/filter-bar/component.tsx`

可能职责：

- 接收 `fields`
- 管理默认 toolbar 结构
- 内部渲染 `Root + Trigger + Clear + Items`
- 可选启用 `Views` / `SaveView`
- 提供 `slots` 和 `slotProps`

同时修改入口导出：

- [`src/filter-bar/index.ts`](/Users/rien7/Developer/filtro/src/filter-bar/index.ts)
- [`src/index.ts`](/Users/rien7/Developer/filtro/src/index.ts)

关键决策：

- `FilterBar` 名字给高层组件
- 现有 compound namespace 是否更名为 `FilterBarPrimitive`

### 4.2 调整现有 compound API 的对外命名

如果采用“高层 `FilterBar` + 低层 `FilterBarPrimitive`”方案，需要修改：

- [`src/filter-bar/index.ts`](/Users/rien7/Developer/filtro/src/filter-bar/index.ts)
- README
- docs 示例
- playground 示例

这部分主要是导出组织重构，不一定涉及内部逻辑大改。

### 4.3 收敛受控值类型

需要修改和新增的区域：

- [`src/filter-bar/context.ts`](/Users/rien7/Developer/filtro/src/filter-bar/context.ts)
- [`src/filter-bar/value.ts`](/Users/rien7/Developer/filtro/src/filter-bar/value.ts)
- [`src/filter-bar/root.tsx`](/Users/rien7/Developer/filtro/src/filter-bar/root.tsx)
- [`src/filter-bar/controller.ts`](/Users/rien7/Developer/filtro/src/filter-bar/controller.ts)
- [`src/nuqs/index.ts`](/Users/rien7/Developer/filtro/src/nuqs/index.ts)

建议步骤：

1. 先新增 `ExternalFilterBarValue` 或 `FilterBarCondition`
2. 提供 internal/external 双向转换
3. 让高层 API 使用 external model
4. 让 current headless API 暂时继续吃 internal model
5. 最后再决定是否完全替换内部流转

这样迁移风险更小。

### 4.4 把 views 能力从 `Root` 的主职责里拆松

当前 `Root` 负责：

- fields resolve
- controlled/uncontrolled values
- saved views localStorage
- active/pending view 状态

相关文件：

- [`src/filter-bar/root.tsx`](/Users/rien7/Developer/filtro/src/filter-bar/root.tsx)

这个职责已经偏重。

建议拆成两步：

1. 短期：先把 views 逻辑抽到 hook，例如 `useFilterBarViewsState`
2. 中期：高层 `FilterBar` 决定是否启用 views，headless `Root` 只注入结果

这样可以让 `Root` 回到更像状态容器的角色。

### 4.5 校正默认新增行为

需要重新定义“新增一个 filter”时的默认策略。

相关文件：

- [`src/filter-bar/trigger.tsx`](/Users/rien7/Developer/filtro/src/filter-bar/trigger.tsx)
- [`src/filter-bar/state.ts`](/Users/rien7/Developer/filtro/src/filter-bar/state.ts)

建议目标：

- 避免默认偷偷替用户选值
- 把“complete / incomplete”的形成条件设计得更一致

建议方向：

- `boolean` 新增后先处于未选择态，或者直接在 trigger 二选一完成选择，但不要默认 `true`
- `select` 对静态 options 不默认首项，除非显式配置 `defaultValue`
- `multiSelect` 不默认选第一项

如果为了效率保留“trigger 中快捷选值”，也应变成显式配置，而不是默认行为。

### 4.6 统一 validation 呈现

需要修改：

- [`src/filter-bar/items.value-editor.tsx`](/Users/rien7/Developer/filtro/src/filter-bar/items.value-editor.tsx)
- [`src/filter-bar/items-editors/select-value-editor.tsx`](/Users/rien7/Developer/filtro/src/filter-bar/items-editors/select-value-editor.tsx)
- [`src/filter-bar/items-editors/multi-select-value-editor.tsx`](/Users/rien7/Developer/filtro/src/filter-bar/items-editors/multi-select-value-editor.tsx)
- [`src/filter-bar/items-editors/boolean-value-editor.tsx`](/Users/rien7/Developer/filtro/src/filter-bar/items-editors/boolean-value-editor.tsx)

目标：

- 所有 field kind 的 `.validate()` / `.zod()` 表现一致
- 默认 editor 都能把错误透出到 row error 区域
- 自定义 `render` 仍保留自行处理能力

### 4.7 builder 逐步去 class/WeakMap 化

当前 builder 核心实现：

- [`src/filter-bar/builder.ts`](/Users/rien7/Developer/filtro/src/filter-bar/builder.ts)

短期不建议直接重写。

但建议作为中期方向：

- builder 最终返回 plain field definition
- 链式调用通过不可变对象或轻量 wrapper 实现
- `resolveFilterBarFields()` 不再依赖 `WeakMap`

原因：

- 更容易序列化和调试
- 更容易做 schema 编译
- 更容易做未来 framework-agnostic core

这一步不应阻塞高层 API 重构，可以后置。

## 5. 建议的重构顺序

建议分阶段推进，而不是一次性替换。

### 阶段一：对外 API 收敛，不大改底层

先做：

- 新增高层 `FilterBar`
- 保留现有 compound API
- 新增 `slots/slotProps`
- 文档改成“高层优先，headless 次之”

这个阶段的目标是先改善默认 DX。

### 阶段二：受控值模型收敛

再做：

- 新增 external condition model
- `nuqs` 改为围绕 external model 工作
- controller 也优先使用 external model

这个阶段的目标是让外部状态更稳定。

### 阶段三：内部状态职责拆分

再做：

- `Root` 拆 views 逻辑
- validation 行为统一
- 默认新增策略统一

这个阶段是内部整洁化。

### 阶段四：builder 内部实现重构

最后做：

- 评估是否去掉 class + `WeakMap`
- 评估是否引入 plain object field definition

这是收益明确但风险最高的一步，应该后置。

## 6. 向后兼容策略

为了避免这次重构让现有用户成本过高，建议明确一套兼容规则。

### 6.1 compound API 第一阶段不删除

保留：

- `FilterBar.Root`
- `FilterBar.Trigger`
- `FilterBar.Items`
- `FilterBar.Clear`
- `FilterBar.Views`
- `FilterBar.SaveView`

即使未来改名为 `FilterBarPrimitive.*`，也建议保留旧别名一个版本周期。

### 6.2 旧受控值模型先兼容一段时间

高层 API 可以先吃新模型。

headless API 可以暂时继续接受旧模型。

必要时提供：

- `toInternalFilterBarValue()`
- `toExternalFilterBarValue()`

用于桥接迁移。

### 6.3 docs 和 README 先切主路径

迁移的关键不只是代码兼容，更是心智兼容。

建议：

- README 最短示例改成高层 `FilterBar`
- docs 先讲高层，再讲 headless
- playground 默认先展示高层模式，再展示 headless 模式

这样新用户不会一上来就走最复杂路径。

## 7. 暂不建议做的事

这次重构不建议顺手把下面这些目标混进来：

- 支持同字段重复条件
- 支持 AND/OR 分组 UI
- 让 `FilterBar` 直接输出 `FilterRoot` AST
- 彻底抽成 framework-agnostic runtime core

这些都属于下一阶段能力。

如果把它们和当前 API 收敛重构绑在一起，复杂度会迅速失控。

## 8. 一个更接近目标的最终使用感

理想中的主路径可以长这样：

```tsx
import { FilterBar, filtro } from "filtro";
import "filtro/default-theme.css";

const fields = [
  filtro.string("keyword").label("Keyword"),
  filtro.select("status").label("Status").options([
    { label: "Open", value: "open" },
    { label: "Closed", value: "closed" },
  ]),
];

export function Example() {
  return (
    <FilterBar
      fields={fields}
      views={{ storageKey: "demo:filters" }}
      theme="default"
    />
  );
}
```

而需要高级控制时，再下沉到：

```tsx
import {
  FilterBarPrimitive,
  filtro,
  useFilterBarController,
} from "filtro";
```

这两层体验之间应该形成清晰梯度：

- 默认简单
- 深入时不受限

这会比当前“所有人先接触拼装级 API”的方式更接近目标。

## 9. 建议的首批实施清单

如果要落地，我建议第一批只做下面这些：

1. 新增高层 `FilterBar` 组件
2. 设计 `slots` / `slotProps`
3. 调整 README 和 playground，让高层 API 成为第一示例
4. 给 compound API 一个更明确的高级定位
5. 修正 validation 在各 field kind 上的行为一致性

这五项完成后，API 的“产品感”会先明显提升。

受控值模型和 builder 内部重构可以第二批再动。
