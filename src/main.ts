// deno-lint-ignore-file

// we use let, == instead of ===, and .map instead of .forEach to shrink bundle size.
export let kSTATE: symbol = Symbol();
let bool = "boolean", text: (val: any) => Text = (val) => typeof val == bool ? new Text() : new Text(val), deps: State[] = [], events = "events" as const, style = "style" as const;

export type State<T = unknown> = {
    $: typeof kSTATE,
    val: T,
    readonly _b: ((val: T, old: T) => void)[]
}

export type Child = string | number | boolean | null | undefined | void | Node | StateChild;
interface StateChild extends State<Child> {};
export type Children = Child[];

export type NullComponent = () => Child;
export type Component<T = {}> = (props: T, ...children: Children) => Child;

let isTextChild: (child: unknown) => boolean = (child) => ["string", "number", bool].includes(typeof child);

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
    if (props instanceof Node || isTextChild(props)) {
        children = [props, ...children];
    } else {
        Object.keys(props).map(k => ![events, style].includes(k as "events" | "style") && el.setAttribute(k, props[k]));
        if(props[events]) Object.keys(props[events]).map(k => el.addEventListener(k, props[events][k]));
        if(props[style]) Object.keys(props[style]).map(k => el[style].setProperty(k, props[style][k]));
    }
    children.map(x => el.append(child(x)));
    return el;
}

export let tags: Record<string, Component<{}>> = new Proxy<Record<string, Component>>({}, {
    get: (_, p) => tagFactory(p as string),
});

export let mount: (el: Element, comp: Component) => void = (el, comp) => el.append(child(comp({})));

export let state: <T>(initial: T) => State<T> = <T>(initial: T) => {
    let val = initial;
    return {
        $: kSTATE,
        get val() {
            deps.push(this as State<unknown>);
            return val;
        },
        set val(newVal) {
            this._b.map(x => x(newVal, val));
            val = newVal;
        },
        _b: [],
    } as State<T>;
}

// memo: derives state
export let memo: <T>(fn: () => T) => State<T> = <T>(fn: () => T) => {
    deps = [];
    let st = state(fn());
    if (deps.length < 1) return st;
    deps.map(x => x._b.push(_ => st.val = fn()));
    return st;
}

// and effect is void memo (in types only to lower bundle size)
export let effect = memo as (fn: () => void) => void;

export let hydrate: (el: Element, comp: Component) => void = (el, comp) => el.replaceChildren(child(comp({})));
