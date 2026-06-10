# Screen: <Name> (`<route or id>`)

> One programmable screen. Purely textual — no wireframes. The Elements, States,
> and Interaction-flow tables are what make this codeable: they pin down every
> control and every state transition. Replace `<state-management>` and other
> bracketed terms with the project's stack from the architecture registry.

**Purpose:** one line — what this screen is for.

**Entry:** how the user arrives here (routes, deep links, triggers). **Exit:**
where the user can go from here.

## Layout (regions, top → bottom)

> The wireframe substitute: describe the screen as ordered regions, each listing
> the elements it contains. Square brackets mark conditionally shown elements.

- **AppBar:** title, back action, [overflow menu]
- **Body:** <e.g. scrollable list of items / form / map>
- **Footer:** [primary action]

## Elements & Actions

| Element | Type                                      | Content / Source                    | Gesture                           | Result                                           |
| ------- | ----------------------------------------- | ----------------------------------- | --------------------------------- | ------------------------------------------------ |
| <name>  | button / list item / field / toggle / map | static / `<endpoint>` / state field | tap / long-press / swipe / scroll | navigate / call API / mutate state / open dialog |

## States

> Every state the screen can be in. Cover at minimum: loading, loaded, empty,
> error, and any permission/offline/submitting states the feature can hit.

| State   | Trigger            | What's shown          | Available actions |
| ------- | ------------------ | --------------------- | ----------------- |
| loading | on enter / refetch | skeleton / spinner    | none              |
| loaded  | data ok            | populated UI          | all               |
| empty   | zero results       | empty state + CTA     | <CTA>             |
| error   | request failed     | error message + retry | Retry             |

## Forms

> Include only if the screen has inputs. One row per field.

| Field | Type | Required | Validation | Default | Error copy |
| ----- | ---- | -------- | ---------- | ------- | ---------- |

## Interaction Flows

> Numbered sequences for multi-step interactions on this screen
> (pull-to-refresh, infinite scroll, optimistic update, multi-step confirm).
> Each step: user action → system response → resulting state.

1. <user action> → <system response> → <resulting state / navigation>

## State Bindings

> Which `<state-management>` controller/fields back this screen, and which
> reactive fields drive which elements above. Link to the entity `index.md`
> controller section rather than restating it.
