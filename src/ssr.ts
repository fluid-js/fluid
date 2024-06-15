// deno-lint-ignore-file

import { State, kSTATE } from "./main.ts";

let from = (text: string) => ({ $_t: text }) as Rendered;

let text: (val: any) => Rendered = (val: any) => typeof val == "boolean" ? from("") : val !== false ? from(serialize(String(val))) : from("");

type Rendered = { $_t: string };

export type Child = string | number | boolean | null | undefined | void | Rendered | StateChild;
interface StateChild extends State<Child> {};
export type Children = Child[];

export type NullComponent = () => Child;
export type Component<T = {}> = (props: T, ...children: Children) => Child;

let isTextChild: (child: unknown) => boolean = (child: unknown) => ["string", "number", "boolean"].includes(typeof child);

export let child: (child: Child) => Rendered = (child: Child) => child == null
    ? text("")
    : isTextChild(child)
        ? text(child)
        : (child as unknown as StateChild).$ == kSTATE
            ? bind(child as State<string | Rendered>)
            : child as Rendered;

let bind: <T extends string | Rendered>(state: State<T>) => Rendered = <T extends string | Rendered>(state: State<T>) => {
    return isTextChild(state.val) ? text(state.val) : state.val as Rendered;
}

let replacements = {
    '"': "&quot;",
    "<": "&lt;",
    ">": "&gt;"
}

let serialize: (input: string) => string = (input) => {
    let ret = input;
    Object.keys(replacements).map(key => ret = ret.replaceAll(key, replacements[key as keyof typeof replacements]));
    return ret;
}

// don't export to reduce bundle size
let tagFactory: (tagName: string) => (props?: any, ...children: Children) => Rendered = (tagName) => (props = {}, ...children) => {
    let el = `<${tagName}`
    if (props["$_t"] || isTextChild(props)) {
        children = [props, ...children];
    } else {
        Object.keys(props).map(k => !["events", "style"].includes(k) && (el += ` ${serialize(k)}="${serialize(props[k])}"`));
        if(props.style) el += ` style="${Object.entries(props.style).map(([k, v]) => `${serialize(k)}: ${serialize(v as string)}`).join(";")}"`
    }
    el += ">";
    children.map(x => el += child(x).$_t);
    el += `</${tagName}>`;
    return from(el);
}

export let tags: Record<string, Component<{}>> = new Proxy<Record<string, Component>>({}, {
    get: (_, p) => tagFactory(p as string),
});

export let render: (comp: Component) => string = (comp) => child(comp({})).$_t;

export { state, memo, effect, type State, kSTATE } from "./main.ts";