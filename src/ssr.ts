// deno-lint-ignore-file

/**
 * This module contains the main server/SSR exports for Fluid.
 * @module
 */

import { State, kSTATE } from "./main.ts";

let from = (text: string) => ({ $_t: text }) as Rendered;

let text: (val: any) => Rendered = (val: any) => typeof val == "boolean" ? from("") : val !== false ? from(serialize(String(val))) : from("");

let voidEls = [
    "area",
    "base",
    "br",
    "col",
    "embed",
    "hr",
    "img",
    "input",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
]

/**
 * A rendered SSR element.
 */
type Rendered = { $_t: string };

/**
 * All types that can be passed as a child to a component.
 */
export type Child = string | number | boolean | null | undefined | void | Rendered | StateChild;
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

let isTextChild: (child: unknown) => boolean = (child: unknown) => ["string", "number", "boolean"].includes(typeof child);

/**
 * Creates a DOM {@link Node} from a {@link Child}.
 * @param child The child to create from.
 * @returns The created node.
 */
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
    if(!voidEls.includes(tagName)) el += `</${tagName}>`;
    return from(el);
}

/**
 * An object which you can destructure or use directly to get the tag components.
 */
export let tags: Record<string, Component<{}>> = new Proxy<Record<string, Component>>({}, {
    get: (_, p) => tagFactory(p as string),
});

/**
 * Renders a given {@link NullComponent} to a string.
 * @param comp The component to render.
 * @returns The rendered HTML.
 */
export let render: (comp: NullComponent) => string = (comp) => child(comp()).$_t;

export { state, memo, effect, type State, kSTATE } from "./main.ts";