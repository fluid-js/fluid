// deno-lint-ignore-file

// we use let, == instead of ===, and .map instead of .forEach to shrink bundle size.
/**
 * A symbol that uniquely identifies signals created by Fluid.
 */
export let kSTATE: symbol = Symbol();

let bool = "boolean",
    text: (val: any) => Text = (val) => typeof val == bool ? new Text() : new Text(val),
    deps: State[] = [],
    events = "events" as const,
    style = "style" as const,
    map = "map" as const;

/**
 * A signal created by Fluid.
 */
export type State<T = unknown> = {
    $: typeof kSTATE,
    val: T,
    readonly _b: ((val: T, old: T) => void)[]
}

/**
 * All types that can be passed as a child to a component.
 */
export type Child = string | number | boolean | null | undefined | void | Node | StateChild;
/**
 * Interface hack so {@link Child} is technically not a circular type.
 */
interface StateChild extends State<Child> {};
/**
 * An array of children.
 */
export type Children = Child[];
/**
 * A component that does not take any props or children.
 */
export type NullComponent = () => Child;
/**
 * A component that takes in props of the shape {@link T} and children.
 */
export type Component<T = {}> = (props: T, ...children: Children) => Child;
type TagComponent = (...children: any[]) => Child;

let isTextChild: (child: unknown) => boolean = (child) => ["string", "number", bool].includes(typeof child);

/**
 * Creates a DOM {@link Node} from a {@link Child}.
 * @param child The child to create from.
 * @returns The created node.
 */
export let child: (child: Child) => Node = (child) => child == null
    ? text("")
    : isTextChild(child)
        ? text(child) // @ts-expect-error
        : child.$ == kSTATE
            ? bind(child as State<string | Node>, isTextChild((child as State).val)
                ? text((child as State<string>).val)
                : (child as State<Node>).val)
            : child as Node;

let bind: <T extends string | Node>(state: State<T>, node: Node) => Node = <T extends string | Node>(state: State<T>, node: Node) => {
    if (node instanceof Text) state._b.push(v => node.textContent = v as string);
    else state._b.push(_ => node.parentNode && (node as ChildNode).replaceWith(child(state as unknown as StateChild)));
    return node;
}

// don't export to reduce bundle size
let tagFactory: (tagName: string) => (props?: any, ...children: Children) => HTMLElement = (tagName: string) => (props: any = {}, ...children: Children) => {
    let el = document.createElement(tagName);
    if (props instanceof Node || isTextChild(props) || props[map]) {
        children = [props, ...children];
    } else {
        Object.keys(props)[map](k => ![events, style].includes(k as "events" | "style") && el.setAttribute(k, props[k]));
        if(props[events]) Object.keys(props[events])[map](k => el.addEventListener(k, props[events][k]));
        if(props[style]) Object.keys(props[style])[map](k => el[style].setProperty(k, props[style][k]));
    }
    children.flat()[map](x => el.append(child(x)));
    return el;
}

/**
 * An object which you can destructure or use directly to get the tag components.
 */
export let tags: Record<string, TagComponent> = new Proxy<Record<string, TagComponent>>({}, {
    get: (_, p) => tagFactory(p as string),
});

/**
 * Mounts a {@link NullComponent} to a DOM {@link Element}.
 * @param el The element to mount to.
 * @param comp The component to mount.
 */
export let mount: (el: Element, comp: NullComponent) => void = (el, comp) => el.append(child(comp()));

/**
 * Creates a signal with a given initial value.
 * @param initial The initial value of the signal.
 * @returns The created signal.
 * @reactive
 */
export let state: <T>(initial: T) => State<T> = <T>(initial: T) => {
    let val = initial;
    return {
        $: kSTATE,
        get val() {
            deps.push(this as State<unknown>);
            return val;
        },
        set val(newVal) {
            this._b[map](x => x(newVal, val));
            val = newVal;
        },
        _b: [],
    } as State<T>;
}

/**
 * Creates a derived state with a factory function that can reference dependencies.
 * @param fn A factory to create the value. Just reference `state.val` and we'll track it.
 * @returns A signal that automatically calls the factory and updates when any dependencies change.
 * @reactive
 */
export let memo: <T>(fn: () => T) => State<T> = <T>(fn: () => T) => {
    deps = [];
    let st = state(fn());
    if (deps.length < 1) return st;
    deps[map](x => x._b.push(_ => st.val = fn()));
    return st;
}

/**
 * Runs a given side effect whenever a dependency updates.
 * @param fn A side effect. Just reference `state.val` and we'll track it.
 * @returns "Nothing" (does the same as memo, just re-exported to reduce bundle size).
 * @reactive
 */
export let effect = memo as (fn: () => void) => void;

/**
 * Hydrates a given DOM {@link Element} with a given {@link NullComponent}.
 * @param el The DOM element to hydrate.
 * @param comp The component to run to hydrate the element.
 */
export let hydrate: (el: Element, comp: NullComponent) => void = (el, comp) => el.replaceChildren(child(comp()));
