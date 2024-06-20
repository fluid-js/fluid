# 💧 Fluid: The **True** Smallest Reactive UI Framework in the World
> Fluid has all the features (and more) of VanJS and is almost 2x smaller in both min and min.gz.

<img alt="Fluid's JSR version" src="https://img.shields.io/jsr/v/@fluid/core?color=%23f7df1e">
<img alt="Fluid's gzipped size of 609 bytes" src="https://img.shields.io/badge/gzipped_size-609_bytes-blue">

**Fluid** is an ***unbelievably lightweight***, ***extremely fast***, and ***truly reactive*** UI framework that interacts directly with the DOM. You can use Fluid today without neither a compilation step nor a server!

Here's a basic example assuming you can resolve JSR imports ([see here](https://github.com/lucacasonato/esbuild_deno_loader) or import from "https://esm.sh/jsr/@fluid/core"):
```ts
import { tags, mount } from "jsr:@fluid/core";

// Destructure from `tags` (you don't have to, but it's recommended)
const { div, h1, h3, ul, li, a } = tags;

// Capitalized functions for components (like React)
function Hello() {
    return div(
        h1("Hello, Fluid!"),
        h3("Links"),
        ul(
            li(a({ href: "https://github.com/fluid-js/fluid" }, "GitHub")),
            li(a({ href: "https://jsr.io/@fluid/core" }, "JSR")),
        ),
    );
}

mount(document.body, Hello);
```

We also (of course) have reactivity with signals! The API is extremely simple (just 3 base functions!)
```ts
import { tags, state, memo, effect, mount } from "jsr:@fluid/core";

const { h1, div, span, button } = tags;

function Counter() {
    const count = state(0); // Regular signal
    const previewMinus = memo(() => count.val - 1); // Derived state. Just access the signal's val property and Fluid will track it for you.
    const previewPlus = memo(() => count.val + 1); // Automatically updates whenever any dependencies are updated!

    effect(() => console.log("Count updated!", count.val)); // Will log this every time the count is updated.
    
    return div(
        h1("Counter"),
        div(
            button("- (", previewMinus, ")"), // just reference the state itself, not the value, in the markup!
            span("Current value: ", count),
            button("+ (", previewPlus, ")"),
        ),
    );
}

mount(document.body, Counter);
```

Notice the `memo` and `effect` calls! `memo` is for *derived state*, which is state based on one or more other signals that will automatically be recomputed whenever any of its dependencies are updated. `effect` does pretty much the same thing but is for side effects (executes logic but does not return anything).

## Why Fluid?
### Truly Reactive
Fluid is a truly reactive library that allows for extremely performant, simple, predictable reactivity logic. This is in contrast to something like React, which is not reactive at all (just re-runs functions!) and it is incredibly slow when compared to others that take a truly reactive approach, such as Fluid, [VanJS](https://github.com/vanjs-org/van), or [Solid](https://github.com/solidjs/solid).

### Unbelievably Lightweight
Fluid beats out literally every other reactive UI library in size. Every. Single. One. It is almost 2 times smaller than VanJS. It's 13 times smaller than Solid. It's 65 times smaller than Vue. It's 70 times smaller than ReactDOM. It's almost 200 times smaller than Angular! Yes, you read that correctly, TWO HUNDRED times smaller.

### Easy to Use
Fluid has a very simple and small API that allows even beginners in JS/TS to create advanced applications with our powerful reactive primitives and easy, declarative, and flexible element creation APIs. This means that anyone with any programming experience at all can create a vast array of web applications with ease.

## With all that said...
Go build something with Fluid! Build your dream app, prototype a little game, or make an advanced image editor. Anything goes! Put it on GitHub and let us know what you've created! We love to see your awesome projects made with this tiny library!

\- [arrow](https://github.com/WorriedArrow)