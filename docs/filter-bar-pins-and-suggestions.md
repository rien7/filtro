# FilterBar Pins And Suggestions Proposal

这是一份针对当前扁平 `FilterBar` 的规划草案，用来引入两类新的字段曝光方式：

- `pin`
- `suggestion`

同时补充一条配套规则：

- 空值条件自动退出 active values

这份草案只讨论当前这套 flat `FilterBar` 的扩展，不涉及未来规划中的 nested filter builder，也不改变 `logical` 层的 AST 定义。

## 1. 目标

当前 `FilterBar` 的所有字段都主要通过 `Trigger` 菜单暴露。

这对熟悉“先点 Add Filter 再加条件”的用户是足够的，但对一部分更习惯直接在页面上看到常用筛选入口的用户来说，心智成本仍然偏高。

这次规划的目标是补充两种字段曝光层级：

- `pin`: 始终显示在外部的常驻字段
- `suggestion`: 显示在外部的推荐快捷入口

同时，为了让 `pin`、`suggestion`、`nuqs`、saved views 的语义保持一致，需要把“空值如何处理”明确下来：

- 只有真正生效的过滤条件才进入 `FilterBarValue[]`
- 不生效的空条件应自动从 active values 中移除

## 2. 非目标

这份规划不试图解决下面这些问题：

- 不支持重复字段条件
- 不支持 AND / OR 分组
- 不支持嵌套 AST 编辑
- 不把 `FilterBarValue[]` 扩展成复杂 filter builder 状态树
- 不在 `logical` 层引入 React 或展示语义

如果后续需求已经变成复杂过滤器、分组、AST 输出、framework-agnostic core，这应该视为新阶段能力，而不是继续给当前 `FilterBar` 打补丁。

## 3. 核心原则

### 3.1 `FilterBarValue[]` 仍然只表示 active conditions

当前 `FilterBar` 的唯一状态源是 `values: FilterBarValue[]`。

这条原则不变：

- `values` 只表示当前生效的过滤条件
- `pin` / `suggestion` 不直接写入新的 display-only state
- `pin` / `suggestion` 的可见性由字段元数据和 `values` 派生出来

### 3.2 `pin` 是常驻 UI 容器，不是常驻 value

`pin` 的定义应该是：

- 字段在 UI 上始终显示
- 但只有当它形成有效过滤条件时，才进入 `values`
- 清空后从 `values` 删除
- UI 上的 pinned 容器继续保留

所以 `pin` 不是“值不可删除”，而是“外层展示位不可消失”。

### 3.3 空值条件自动退出 `values`

为了让状态模型、`nuqs`、saved views 三者语义一致，需要统一规定：

- `null` 表示该条件不应该存在于 active values
- `string` 类型的 `""` 也等同于空值
- 其它空态也应在规范化后自动移除

这里的关键不是简单判断 `value === null`，而是判断：

- 这个 `operator + value` 组合是否构成有效过滤条件

## 4. 规范化规则

建议为当前 `FilterBar` 引入统一的 canonicalization 规则。

只有“有意义的条件”才保留在 `values` 中。

### 4.1 建议的空值判断

- `string`
  - `""` 视为无值
  - `null` 视为无值

- `number`
  - `null` 视为无值

- `date`
  - `null` 视为无值

- `select`
  - `null` 视为无值

- `multiSelect`
  - `[]` 视为无值
  - `null` 视为无值

- `boolean`
  - `null` 视为无值

- 区间类 operator
  - 不完整区间视为无值
  - 例如只有起点没有终点、只有终点没有起点

### 4.2 empty operator 的例外

`isEmpty` / `isNotEmpty` 这类 operator 虽然 value 本身是 `null`，但它们是有效过滤条件。

因此不能按“`value === null` 就移除”来做统一处理。

更稳妥的定义是：

- 对普通 operator，空值表示条件无效，应自动移除
- 对 empty operator，`null` 是合法条件的一部分，应保留

### 4.3 规范化发生的位置

建议把空值收敛统一放在 state / value 层，而不是交给每个 editor 自己决定。

这样可以避免：

- 某些 editor 传 `""`
- 某些 editor 传 `null`
- 某些 editor 传 `[]`
- 某些自定义 render 传另一套空态表示

最终状态不一致的问题。

## 5. 三种字段曝光方式

建议把字段的外显方式统一建模为 `placement`：

- `menu`
- `suggestion`
- `pinned`

### 5.1 `menu`

默认行为：

- 字段只出现在 `Trigger` 菜单中
- 未激活时不在外层显示
- 激活后作为普通 active item 渲染

### 5.2 `suggestion`

`suggestion` 是开发者推荐的快捷入口。

特点：

- 字段在外层 suggestion 区显示
- 字段未激活时不进入 `values`
- 用户点击 suggestion 后，进入普通编辑流程
- 一旦形成有效条件，就进入 `values`
- 激活后与普通 item 没有过滤语义上的区别

视觉上建议使用：

- 半透明
- 虚线边框
- 明确是“建议添加”的入口，而不是已生效条件

### 5.3 `pinned`

`pinned` 是始终外露的字段容器。

特点：

- 字段总是渲染在外层 pinned 区
- 即使当前没有 active value，也继续显示一个空态容器
- 当用户输入有效条件时，进入 `values`
- 当用户清空条件时，从 `values` 移除
- 但 pinned 容器不消失

## 6. `values` 与 UI 的关系

为避免状态模型膨胀，建议保持：

- `values` 只存 active conditions
- UI 通过字段 metadata + `values` 派生出不同展示区

这意味着：

- 普通 menu 字段未激活时：不在 `values`，也不在外层显示
- suggestion 字段未激活时：不在 `values`，但在 suggestion 区显示
- pinned 字段未激活时：不在 `values`，但在 pinned 区显示空态行

因此 `pin` 并不要求引入新的持久 display state。

## 7. 组件分层建议

当前 `FilterBar.Items` 只负责渲染 active items。

为了支持 `pin` 和 `suggestion`，建议把外显区域拆分成独立组件：

- `FilterBar.Pins`
- `FilterBar.Suggestions`
- `FilterBar.Items`

推荐结构：

```tsx
<FilterBar.Root fields={fields}>
  <div className="toolbar">
    <FilterBar.Pins />
    <FilterBar.Suggestions />
    <FilterBar.Trigger />
    <FilterBar.Clear />
  </div>
  <FilterBar.Items />
</FilterBar.Root>
```

职责建议：

- `Pins`
  - 负责渲染所有 pinned field
  - 如果字段当前在 `values` 里，显示 active row
  - 如果字段当前不在 `values` 里，显示空态 row

- `Suggestions`
  - 负责渲染所有 suggestion field 的推荐入口
  - 仅当字段当前不 active 时显示

- `Items`
  - 继续负责渲染普通 active items
  - 建议排除 pinned fields，避免同一字段重复显示两次

## 8. 删除、清空与回流行为

### 8.1 普通 item

- 删除
  - 从 `values` 移除
  - UI 消失

- 清空 value
  - 经规范化后如果条件无效，则从 `values` 移除
  - UI 消失

### 8.2 suggestion item

- 点击 suggestion
  - 进入普通编辑流程
  - 形成有效条件后进入 `values`

- 删除 active suggestion item
  - 从 `values` 移除
  - 再回流到 `suggestion` 或 `menu`

- 清空 active suggestion item
  - 与删除语义一致
  - 因为规范化后它会自动退出 `values`

### 8.3 pinned item

- 编辑 pinned item
  - 形成有效条件后进入 `values`

- 清空 pinned item
  - 从 `values` 移除
  - 但 pinned UI 容器继续保留

- remove 行为
  - 不应真正移除 pinned UI 容器
  - 应视为 reset to empty

## 9. `Clear` 的语义

建议 `Clear` 继续表示“清空所有 active conditions”，而不是“清空所有可视元素”。

因此：

- 普通 active item 被移除
- active suggestion item 被移除
- active pinned item 被移除
- pinned 空态容器继续显示
- suggestion 快捷入口继续显示

这与“`values` 只表示 active conditions”的原则保持一致。

## 10. suggestion 清除后的回流策略

这个点目前仍然需要产品层面的决定。

建议支持两种策略：

- `back-to-suggestion`
- `back-to-menu`

### 10.1 默认建议

默认建议使用：

- `back-to-suggestion`

原因：

- `suggestion` 的意义就是“开发者认为它可能常用”
- 用户删除的是当前条件，不一定是在表达“以后别再给我看这个入口”
- 如果默认回到 `menu`，`suggestion` 的价值会被削弱

### 10.2 为什么需要保留为可配置项

有些场景里，开发者可能希望 suggestion 更接近“一次性推荐”：

- 用户加过一次又删掉，就说明它不想继续放在外面
- 这时回到 `menu` 也有合理性

因此建议把它做成字段级可配置项，而不是全局写死。

## 11. Trigger 菜单的显示策略

建议把不同 placement 的字段在 `Trigger` 中的可见性区分开来。

### 11.1 pinned

默认建议：

- `pinned` 字段不再出现在 `Trigger` 菜单里

原因：

- 它已经始终外露
- 继续保留在 menu 中意义不大
- 还可能造成重复入口和认知混乱

### 11.2 suggestion

默认建议：

- `suggestion` 字段未激活时仍然保留在 `Trigger` 菜单中

原因：

- menu 仍然应该是完整字段库的可靠兜底入口
- 一部分用户只会从 menu 中找字段
- 把 suggestion 从 menu 隐掉会让“字段去哪了”变得不够直观

未来可以再加配置决定 suggestion 是否要从 menu 隐藏。

## 12. Builder API 草案

建议从字段元数据层面扩展 builder，而不是直接新增一堆互不关联的布尔值。

### 12.1 字段曝光方式

```ts
filtro.string("keyword")
  .label("Keyword")
  .placement("suggestion", {
    seed: {
      operator: "contains",
      value: "",
    },
    removeBehavior: "back-to-suggestion",
  });

filtro.select("status")
  .label("Status")
  .placement("pinned");
```

可选值建议：

- `menu`
- `suggestion`
- `pinned`

### 12.2 sugar API

如果想提高可读性，可以在 builder 上进一步提供语法糖：

```ts
filtro.string("keyword")
  .suggest({
    seed: {
      operator: "contains",
      value: "",
    },
  });

filtro.select("status")
  .pin();
```

但底层依然建议统一归到同一份 placement metadata，而不是维护多个平行字段。

### 12.3 suggestion 配置

建议 suggestion 支持这些配置：

- `seed`
- `removeBehavior`

示意：

```ts
.suggest({
  seed: {
    operator: "contains",
    value: "",
  },
  removeBehavior: "back-to-suggestion",
})
```

`seed` 的作用是让开发者定义：

- 默认 operator
- 默认 value

## 13. suggestion 的 seed 语义

建议把 seed 理解为“进入编辑流程时的初始草稿”，而不是绕过规范化直接写入 active values。

更具体地说：

- 点击 suggestion 后，可以先生成一份初始草稿
- 只有当草稿形成有效条件时，才真正进入 `values`

这样可以避免出现：

- suggestion 一点击就进入 `values`
- 但实际 seed 仍然是空值
- 最终又马上因为规范化被移除

第一版如果不想引入额外草稿层，也可以收窄为：

- suggestion 的 seed 必须是有效条件
- 否则 suggestion 点击行为不应立即创建 active value

这个点取决于当前 `FilterBar` 想不想区分“正在编辑但尚未生效”的 display state。

## 14. Select / MultiSelect 的展示变体

`pin` 和 `suggestion` 解决的是“字段如何曝光”的问题。

`segment` / 淘宝式展开筛选解决的是“值如何编辑”的问题。

这两者应该拆开建模。

建议为字段新增 `editorVariant` 概念。

### 14.1 建议的变体

- `default`
- `segment`
- `chips`

示意：

```ts
filtro.select("status")
  .options([
    { label: "Open", value: "open" },
    { label: "Closed", value: "closed" },
  ])
  .editorVariant("segment");

filtro.multiSelect("tags")
  .options([
    { label: "VIP", value: "vip" },
    { label: "Trial", value: "trial" },
  ])
  .editorVariant("chips");
```

### 14.2 第一版建议范围

建议第一版收窄支持范围：

- `select + segment`
  - 只支持静态、小量 options

- `multiSelect + chips`
  - 只支持静态、小量 options

第一版不建议支持：

- async options 的 segment/chips
- 大量选项的展开式多选
- searchable + segment/chips 混搭

## 15. 对现有系统的兼容原则

### 15.1 `logical` 层不动

`pin` / `suggestion` / `editorVariant` 都属于 UI 字段元数据。

这些能力应该落在：

- `src/filter-bar/types.ts`
- `src/filter-bar/builder.ts`

而不是落到 `src/logical`。

### 15.2 `nuqs` 只同步 active values

因为空值条件会自动从 `values` 移除，所以：

- `nuqs` 继续只序列化 active values
- pinned 但为空的字段不会进入 URL
- suggestion 未激活时也不会进入 URL

这与 `values` 的语义完全一致。

### 15.3 saved views 只保存 active values

saved views 也应保持同样的规则：

- 只保存 active conditions
- 不保存 pinned 空态容器
- 不保存 suggestion 快捷入口本身

这样 view 的行为就仍然是“当前已生效筛选的快照”。

## 16. 需要新增的内部概念

为了实现这套能力，建议在 filter-bar 层引入以下概念：

- 字段 placement metadata
- suggestion seed metadata
- suggestion remove behavior
- editor variant metadata
- active condition canonicalization
- pinned display rows 的派生逻辑

但不建议新增：

- 独立持久的 pinned values state
- 与 `values` 并列的复杂展示状态树

## 17. 实施顺序

建议按风险从低到高推进。

### 17.1 第一步：统一 canonicalization

先补齐空值自动退出 active values 的规则。

重点包括：

- `string` 的 `""`
- `multiSelect` 的 `[]`
- 区间类 operator 的不完整值
- empty operator 的例外处理

这是后续所有行为一致性的基础。

### 17.2 第二步：实现 suggestion

先做 suggestion 的原因：

- 它本质上是额外的 quick-add UI
- 不要求“字段常驻显示”
- 对现有 `Items` 的侵入更小

### 17.3 第三步：实现 pinned

`pinned` 的复杂度更高，因为它要求：

- 字段在 UI 层常驻
- 但数据层不常驻
- `Clear`、remove、渲染分层都要一起调整

### 17.4 第四步：实现 editor variants

最后再做 `segment` / `chips`。

第一版优先：

- `select.segment`

然后再评估：

- `multiSelect.chips`

## 18. 当前仍需确认的产品问题

下面这些点在开工前仍然需要拍板：

- suggestion 删除后默认回到 `suggestion` 还是 `menu`
- suggestion 未激活时是否默认继续显示在 menu 中
- suggestion 点击后是否允许先进入“编辑中但未生效”的状态
- pinned 的第一版空态是否复用完整 row UI
- `segment` / `chips` 的第一版是否只支持静态少量 options

## 19. 总结

这份规划建议把能力收敛成下面这组原则：

- `values` 只存生效条件
- 空值条件自动退出 `values`
- `pin` 是常驻展示位，不是常驻 value
- `suggestion` 是推荐快捷入口，不是新的过滤语义
- `segment` / `chips` 是编辑器展示变体，不是字段状态

这样做的好处是：

- 不破坏当前 flat `FilterBarValue[]` 模型
- `nuqs`、saved views、UI 行为能保持一致
- 扩展成本主要集中在 `filter-bar` 层
- 不会误把当前实现推向复杂 filter builder
