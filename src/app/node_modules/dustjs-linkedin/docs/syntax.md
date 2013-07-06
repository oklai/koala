Dust is a JavaScript templating engine designed to provide a clean separation between presentation and logic without sacrificing ease of use. It is particularly well-suited for asynchronous and streaming applications.

### Syntax

Dust templates use two types of tags: _keys_ and _sections_. Keys reference fields within the current view context. You can think of them as placeholders that allow the context to insert data into the template. Sections accept template blocks that may be enumerated, filtered or transformed in various ways.

### Keys

To reference a key from the view context within the template, enclose the key in curly braces. For example, given the template below:

    Hello {name}!

And the following view context:

    { name: "Fred" }

The resulting output would be:

    Hello Fred!

If the _name_ key cannot be found in the view, Dust outputs an empty string:

    Hello !

Generally, Dust casts whatever values it finds to strings. If Dust encounters a handler function it calls the function, passing in the current state of the template.

#### Filters

By default, the content of all key tags is HTML escaped, so assuming the _name_ key above resolves to a dangerous script tag:

    <script>alert('I am evil!')</script>

This would be rendered as:

    &lt;script&gt;alert('I am evil!')&lt;/script&gt;

To disable auto-escaping, append a pipe character '|' and an 's' to the end of the tag identifier, like so:

    Hello {name|s}

There are several other built-in filters: `h` forces HTML escaping, `j` escapes JavaScript strings, `u` proxies to JavaScript's built-in `encodeURI`, and `uc` proxies to JavaScript's `encodeURIComponent`. Filters can also be chained together like so:

    Hello {name|s|h|u}

When chained in this manner, filters are applied from left to right. Filters do not accept arguments; if you need more sophisticated behavior use a section tag instead.

### Sections

Keys are fine for simple lookups, but suppose the view context contains a _friends_ field which resolves to an array of objects containing _name_ and _age_ fields. This is where section tags are useful.

    {#friends}
      {name}, {age}{~n}
    {/friends}

Here, the section begins with `{#friends}` and ends with `{/friends}`. Dust's default behavior is to enumerate over the array, passing each object in the array to the block. With a the following view context:

    {
      friends: [
        { name: "Moe", age: 37 },
        { name: "Larry", age: 39 },
        { name: "Curly", age: 35 }
      ]
    }

The output is as one might expect:

    Moe, 37
    Larry, 39
    Curly, 35

When _friends_ resolves to a value or object instead of an array, Dust sets the current context to the value and renders the block one time. If _friends_ resolves to a custom handler function, the function is given control over the section's behavior.

Dust outputs nothing if the friends key is empty or nonexistent. Let's change that by inserting an `{:else}` tag, which tells Dust to render an alternate template block when a section key resolves to a falsy value:

    {#friends}
      {name}, {age}{~n}
    {:else}
      You have no friends!
    {/friends}

Now when the friends key is empty or nonexistent we get the following:

    You have no friends!

Internally, Dust builds a stack of contexts as templates delve deeper into nested sections. If a key is not found within the current context, Dust looks for the key within the parent context, and its parent, and so on.

Self-closing section tags are allowed, so the template code below is permissible (although in this case it won't render anything):

    {#friends/}

#### Paths

Paths allow you to reference keys relative to the current context. 

    {#names}{.} {/names}

The dot notation above lets the template reference the current context implicitly, so given an array of strings:

    { names: ["Moe", "Larry", "Curly"] }

The template block outputs each string in the array.

    Moe Larry Curly 

Paths can also be used to reach into nested contexts:

    {foo.bar}

Or to constrain lookups to the current section scope:

    {.foo}

To avoid brittle and confusing references, paths never backtrack up the context stack. If you need to drill into a key available within the parent context, pass the key as a parameter.

#### Inline Parameters

Inline parameters appear within the section's opening tag. Parameters are separated by a single space. By default, inline parameters merge values into the section's view context:

    {#profile bar="baz" bing="bong"}
      {name}, {bar}, {bing}
    {/profile}

Assuming _name_ within the profile section resolves to "Fred", the output would be:

    Fred, baz, bong

Inline parameters may be used to alias keys that conflict between parent and child contexts:

    {name}{~n}
    {#profile root_name=name}
      {name}, {root_name}
    {/profile}

Note here that we're passing in a key rather than a string literal. If the context is as follows:

    {
      name: "Foo",
      profile: {
        name: "Bar"
      }
    }

The output will be:

    Foo
    Bar, Foo

Parameters accept interpolated string literals as values:

    {#snippet id="{name}_id"/}

#### Body Parameters

Unlike inline parameters, which modify the context, body parameters pass named template blocks to handler functions. Body parameters are useful for implementing striping or other complex behaviors that might otherwise involve manually assembling strings within your view functions. The only body parameter with default behavior is the `{:else}` tag as seen above.

#### Contexts

Normally, upon encountering a section tag Dust merges the section's context with the parent context. Sometimes it can be useful to manually set the context provided to a section. Sections accept a context argument for this purpose:

    {#list:projects}{name}{/list}

Here, we're providing an array of _projects_ to the _list_ section, which might be a special helper defined on the view. If _list_ is not a function but some other value instead, its parent context is simply set to _projects_.

#### Special Sections

In addition to the standard hashed (`#`) section tag, Dust provides a few section tags with special semantics, namely the _exists_ tag (`?`), the _notexists_ tag (`^`), and the context helpers tag (`@`). These tags make it easier to work with plain JSON data without additional helpers.

The exists and notexists sections check for the existence (in the falsy sense) of a key within the current context. They do not alter the current context, making it possible to, for instance, check that an array is non-empty before wrapping it in HTML list tags:

    {?tags}
      <ul>
        {#tags}
          <li>{.}</li>
        {/tags}
      </ul>
    {:else}
      No Tags!
    {/tags}

Unlike regular sections, conditional sections do not evaluate functions defined on the view. In those cases you'll still have to write your own handlers.

The context helpers tag provides a couple of convenience functions to support iteration. The `sep` tag prints the enclosed block for every value except for the last. The `idx` tag passes the numerical index of the current element to the enclosed block.

    {#names}{.}{@idx}{.}{/idx}{@sep}, {/sep}{/names}

The template above might output something like:

    Moe0, Larry1, Curly2

### Partials

Partials, also known as template includes, allow you to compose templates at runtime.

    {>profile/}

The block above looks for a template named "profile" and inserts its output into the parent template. Like sections, partials inherit the current context. And like sections, partials accept a context argument:

    {>profile:user/}

Partial tags also accept string literals and interpolated string literals as keys:

    {>"path/to/comments.dust.html"/}
    {>"posts/{type}.dust.html"/}

 This is useful when you're retrieving templates from the filesystem and the template names wouldn't otherwise be valid identifiers, or when selecting templates dynamically based on information from the view context.

### Blocks and Inline Partials

Often you'll want to have a template inherit the bulk of its content from a common base template. Dust solves this problem via blocks and inline partials. When placed within a template, blocks allow you to define snippets of template code that may be overriden by any templates that reference this template:

    Start{~n}
    {+title}
      Base Title
    {/title}
    {~n}
    {+main}
      Base Content
    {/main}
    {~n}
    End

Notice the special syntax for blocks: `{+block} ... {/block}`. When this template is rendered standalone, Dust simply renders the content within the blocks:

    Start
    Base Title
    Base Content
    End

But when the template is invoked from another template that contains inline partial tags (`{<snippet} ... {/snippet}`):

    {>base_template/}
    {<title}
      Child Title
    {/title}
    {<main}
      Child Content
    {/main}

Dust overrides the block contents of the base template:

    Start
    Child Title
    Child Content
    End

A block may be self-closing (`{+block/}`), in which case it is not displayed unless a calling template overrides the content of the block. Inline partials never output content themselves, and are always global to the template in which they are defined, so the order of their definition has no significance. They are passed to all templates invoked by the template in which they are defined.

Note that blocks can be used to render inline partials that are defined within the same template. This is useful when you want to use the same template to serve AJAX requests and regular requests:

    {^xhr}
      {>base_template/}
    {:else}
      {+main/}
    {/xhr}
    {<title}
      Child Title
    {/title}
    {<main}
      Child Content
    {/main}

### Static Text

The Dust parser is finely tuned to minimize the amount of escaping that needs to be done within static text. Any text that does not closely resemble a Dust tag is considered static and will be passed through untouched to the template's output. This makes Dust suitable for use in templating many different formats. In order to be recognized as such, Dust tags should not contain extraneous whitespace and newlines.

#### Special Characters

Depending on whitespace and delimeter settings, it is sometimes necessary to include escape tags within static text. Escape tags begin with a tilde (`~`), followed by a key identifying the desired escape sequence. Currently newline (`n`), carriage return (`r`), space (`s`), left brace (`lb`) and right brace (`rb`) are supported. For example:

    Hello World!{~n}

Inserts a newline after the text. By default, Dust compresses whitespace by eliminating newlines and indentation. This behavior can be toggled at compile time.

#### Comments

Comments, which do not appear in template output, begin and end with a bang (`!`):

    {!
      Multiline
      {#foo}{bar}{/foo}
    !}
    {!before!}Hello{!after!}

The template above would render as follows:

    Hello