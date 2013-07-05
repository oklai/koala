Why Dust? Why another templating engine when there are so many alternatives? Dust is based on the philosophy that an ideal templating environment should be:

+ __Markup-like__: _A templating syntax should not encompass operations that are better left to a programming language_. Templates should make it easy to format content for presentation while keeping application logic where it belongs: in the application.
+ __Asynchronous__: Template helpers should be callable _asynchronously_ and in _parallel_ so that expensive operations (caching, deferred loading, filtering) can run as the template is being rendered.
+ __Streaming__: Templates should allow (but not require) data to be flushed to the output in user-defined chunks.
+ __Browser and server compatible__: Templates should render in both server and browser environments without hacks or extensive configuration.
+ __Storage agnostic__: _The templating engine should not impose a particular loading scheme_. Developers should be free to load templates via the filesystem, a database or an army of carrier pigeons.
+ __Composable__: Designers should be able to break presentation markup into manageable components and combine these components at runtime. _It should not be necessary to statically link templates or manually assemble 'layouts' inside application code._
+ __Format agnostic__: While HTML generation and DOM manipulation are useful in specific instances, a general-purpose template system should not be tied to a particular output format.
+ __Precise__: The parser should be accurate enough that designers rarely have to use escape sequences to achieve the desired result. Similarly, templates shouldn't mysteriously generate or eliminate whitespace.
+ __Safe(r)__: At the very least, the engine should be configurable such that it is reasonably safe to render untrusted templates in a server environment.
+ __Fast__: Server-side templates cannot always be cached. Browser-side templates may be rendered on devices with limited system resources. _A template engine should be fast enough to render in real time without bottlenecking its environment_.

If this list leaves you nodding your head in agreement you should [give Dust a try](http://akdubya.github.com/dustjs).