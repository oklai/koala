A pure JavaScript library, Dust is runs in both browser-side and server-side environments. Dust templates are compiled and then loaded where they are needed along with the runtime library. The library doesn't make any assumptions about how templates are loaded; you are free to integrate templating into your environment as you see fit.

### Installation

To run Dust within Node.js, first install via [npm](http://github.com/isaacs/npm):

    npm install dust

Then, within your Node script or the REPL:

    var dust = require('dust');

This will import everything needed to parse, compile and render templates. To render Dust templates in the browser, grab the runtime distribution and include it in your script tags along with your compiled templates:

    <script src="dust-core-0.3.0.min.js"></script>
    <script src="compiled_templates.js"></script>

Include the full distribution if you want to compile templates within the browser (as in the online demo):

    <script src="dust-full-0.3.0.min.js"></script>

Precompilation is the recommended approach for general use.

### Compiling Templates

Use `dust.compile` to compile a template body into a string of JavaScript source code:

    var compiled = dust.compile("Hello {name}!", "intro");

The variable `compiled` now contains the following string:

    '(function(){dust.register("intro",body_0) ...'

If you save this source to a file and include the file in your HTML script tags, the compiled template will automatically register itself with the local runtime, under the name "intro". To evaluate a compiled template string manually, use `dust.loadSource`:

    dust.loadSource(compiled);

The template is now available within the `dust.cache` object.

### Rendering Templates

The rendering engine provides both callback and streaming interfaces.

#### The Callback Interface

To render a template, call `dust.render` with the template name, a context object and a callback function:

    dust.render("intro", {name: "Fred"}, function(err, out) {
      console.log(out);
    });

The code above will write the following to the console:

    Hello Fred!

#### The Streaming Interface

Templates may also be streamed. `dust.stream` returns a handler very similar to a Node `EventEmitter`:

    dust.stream("index", context)
        .on("data", function(data) {
          console.log(data);
        })
        .on("end", function() {
          console.log("I'm finished!");
        })
        .on("error", function(err) {
          console.log("Something terrible happened!");
        });

When used with specially crafted context handlers, the streaming interface provides chunked template rendering.

### Contexts

The context is a special object that handles variable lookups and controls template behavior. It is the interface between your application logic and your templates. The context can be visualized as a stack of objects that grows as we descend into nested sections:

    global     --> { helper: function() { ... }, ... }
    root       --> { profile: { ... }, ... }
    profile    --> { friends: [ ... ], ... }
    friends[0] --> { name: "Jorge", ... }

When looking up a key, Dust searches the context stack from the bottom up. There is no need to merge helper functions into the template data; instead, create a base context onto which you can push your local template data:

    // Set up a base context with global helpers
    var base = dust.makeBase({
      sayHello: function() { return "Hello!" }
    });

    // Push to the base context at render time
    dust.render("index", base.push({foo: "bar"}), function(err, out) {
      console.log(out);
    });

Dust does not care how your reference objects are built. You may, for example, push prototyped objects onto the stack. The system leaves the `this` keyword intact when calling handler functions on your objects.

### Handlers

When Dust encounters a function in the context, it calls the function, passing in arguments that reflect the current state of the template. In the simplest case, a handler can pass a value back to the template engine:

    {
      name: function() {
        return "Bob";
      }
    }

#### Chunks

But handlers can do much more than return values: they have complete control over the flow of the template, using the same API Dust uses internally. For example, the handler below writes a string directly to the current template chunk:

    {
      name: function(chunk) {
        return chunk.write("Bob");
      }
    }

A `Chunk` is a Dust primitive for controlling the flow of the template. Depending upon the behaviors defined in the context, templates may output one or more chunks during rendering. A handler that writes to a chunk directly must return the modified chunk.

#### Accessing the Context

Handlers have access to the context object:

    {
      wrap: function(chunk, context) {
        return chunk.write(context.get("foo"));
      }
    }

`context.get("foo")` searches for _foo_ within the context stack. `context.current()` retrieves the value most recently pushed onto the context stack.

#### Accessing Body Parameters

The `bodies` object provides access to any bodies defined within the calling block.

    {#guide}foo{:else}bar{/guide}

The template above will either render "foo" or "bar" depending on the behavior of the handler below:

    {
      guide: function(chunk, context, bodies) {
        if (secret === 42) {
          return chunk.render(bodies.block, context);
        } else {
          return chunk.render(bodies['else'], context);
        }
      }
    }

`bodies.block` is a special parameter that returns the default (unnamed) block. `chunk.render` renders the chosen block.

#### Accessing Inline Parameters

The `params` object contains any inline parameters passed to a section tag:

    {
      hello: function(chunk, context, bodies, params) {
        if (params.greet === "true") {
          return chunk.write("Hello!");
        }
        return chunk;
      }
    }

#### Asynchronous Handlers

You may define handlers that execute asynchronously and in parallel:

    {
      type: function(chunk) {
        return chunk.map(function(chunk) {
          setTimeout(function() {
            chunk.end("Async");
          });
        });
      }
    }

`chunk.map` tells Dust to manufacture a new chunk, reserving a slot in the output stream before continuing on to render the rest of the template. You must (eventually) call `chunk.end()` on a mapped chunk to weave its content back into the stream.

`chunk.map` provides a convenient way to split up templates rendered via `dust.stream`. For example, you might wrap the head of an HTML document in a special `{#head} ... {/head}` tag that is flushed to the browser before the rest of the body has finished rendering.

### Reference

#### Compiling

    dust.compile(source, name)

Compiles `source` into a JavaScript template string. Registers itself under `name` when evaluated.

    dust.compileFn(source, [name])

Compiles `source` directly into a JavaScript function that takes a context and an optional callback (see `dust.renderSource`). Registers the template under `name` if this argument is supplied.

    dust.optimizers

Object containing functions that transform the parse-tree before the template is compiled. To disable whitespace compression:

    dust.optimizers.format = function(ctx, node) { return node };

#### Loading

    dust.register(name, fn)

Used internally to register template function `fn` with the runtime environment. Override to customize the way Dust caches templates.

    dust.onLoad(name, callback(err, out))

By default Dust returns a "template not found" error when a named template cannot be located in the cache. Override `onLoad` to specify a fallback loading mechanism (e.g., to load templates from the filesystem or a database).

    dust.loadSource(source, [filename])

Evaluates compiled `source` string. In Node.js, evaluates `source` as if it were loaded from `filename`. `filename` is optional.

#### Rendering

    dust.render(name, context, callback(error, output))

Renders the named template and calls `callback` on completion. `context` may be a plain object or an instance of `dust.Context`.

    dust.stream(name, context)

Streams the named template. `context` may be a plain object or an instance of `dust.Context`. Returns an instance of `dust.Stream`.

    stream.on("data", listener(data))
    stream.on("end", listener)
    stream.on("error", listener(error))

Registers an event listener. Streams accept a single listener for a given event.

    dust.renderSource(source, context, [callback(error, output)])

Compiles and renders `source`, invoking `callback` on completion. If no callback is supplied this function returns a Stream object. Use this function when precompilation is not required.

#### Contexts

    dust.makeBase(object)

Manufactures a `dust.Context` instance with its global object set to `object`.

    context.get(key)

Retrieves the value at `key` from the context stack.

    context.push(head, [index], [length])

Pushes an arbitrary value onto the context stack and returns a new context instance. Specify `index` and/or `length` to enable enumeration helpers.

    context.rebase(head)

Returns a new context instance consisting only of the value at `head`, plus any previously defined global object.

    context.current()

Returns the `head` of the context stack.

#### Chunks

The operations below always return a chunk object.

    chunk.write(data)

Writes `data` to this chunk's buffer.

    chunk.map(callback(chunk))

Creates a new chunk and passes it to `callback`. Use `map` to wrap asynchronous functions and to partition the template for streaming.

    chunk.end(data)

Writes `data` to this chunk's buffer and marks it as flushable. This method _must_ be called on any chunks created via `chunk.map`. Do _not_ call this method on a handler's main chunk -- `dust.render` and `dust.stream` take care of this for you.

    chunk.tap(callback)
    chunk.untap()

Convenience methods for applying filters to a stream. See the _filter_ demo for an example.

    chunk.render(body, context)

Renders a template block, such as a default block or an `else` block. Basically equivalent to `body(chunk, context)`.

    chunk.setError(error)

Sets an error on this chunk and immediately flushes the output.

    chunk.reference(elem, context, auto, filters)
    chunk.section(elem, context, bodies, params)
    chunk.exists(elem, context, bodies)
    chunk.notexists(elem, context, bodies)
    chunk.block(elem, context, bodies)
    chunk.partial(elem, context)
    chunk.helper(name, context, bodies, params)

These methods implement Dust's default behavior for keys, sections, blocks, partials and context helpers. While it is unlikely you'll need to modify these methods or invoke them from within handlers, the source code may be a useful point of reference for developers.

#### Utilities

    dust.filters

Object containing built-in key filters. Can be customized with additional filters.

    dust.helpers

Object containing the built-in context helpers. These may also be customized.

    dust.escapeHtml

HTML escape function used by `dust.filters.h`.

    dust.escapeJs

JavaScript string escape function used by `dust.filters.j`.