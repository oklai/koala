## 0.4.7 - June 27, 2012

### Bug fixes

- Increase latency to 0.25, to avoid useless polling fallback. (fixed by [@thibaudgg][])
- Change watched inotify events, to avoid duplication callback. (fixed by [@thibaudgg][])
- [#41](https://github.com/guard/listen/issues/41) Use lstat instead of stat when calculating mtime. (fixed by [@ebroder][])

## 0.4.6 - June 20, 2012

### Bug fix

- [#39](https://github.com/guard/listen/issues/39) Fix digest race condition. (fixed by [@dkubb][])

## 0.4.5 - June 13, 2012

### Bug fix

- [#39](https://github.com/guard/listen/issues/39) Rescue Errno::ENOENT when path inserted doesn't exist. (reported by [@textgoeshere][], fixed by [@thibaudgg][] and [@rymai][])

## 0.4.4 - June 8, 2012

### Bug fixes

- ~~[#39](https://github.com/guard/listen/issues/39) Non-existing path insertion bug. (reported by [@textgoeshere][], fixed by [@thibaudgg][])~~
- Fix relative path for directories containing special characters. (reported by [@napcs][], fixed by [@netzpirat][])

## 0.4.3 - June 6, 2012

### Bug fixes

- [#24](https://github.com/guard/listen/issues/24) Fail gracefully when the inotify limit is not enough for Listen to function. (reported by [@daemonza][], fixed by [@Maher4Ever][])
- [#32](https://github.com/guard/listen/issues/32) Fix a crash when trying to calculate the checksum of unreadable files. (reported by [@nex3][], fixed by [@Maher4Ever][])

### Improvements

- Add `#relative_paths` method to listeners. ([@Maher4Ever][])
- Add `#started?` query-method to adapters. ([@Maher4Ever][])
- Dynamically detect the mtime precision used on a system. ([@Maher4Ever][] with help from [@nex3][])

## 0.4.2 - May 1, 2012

### Bug fixes

- [#21](https://github.com/guard/listen/issues/21) Issues when listening to changes in relative paths. (reported by [@akerbos][], fixed by [@Maher4Ever][])
- [#27](https://github.com/guard/listen/issues/27) Wrong reports for files modifications. (reported by [@cobychapple][], fixed by [@Maher4Ever][])
- Fix segmentation fault when profiling on Windows. ([@Maher4Ever][])
- Fix redundant watchers on Windows. ([@Maher4Ever][])

### Improvements

- [#17](https://github.com/guard/listen/issues/17) Use regexp-patterns with the `ignore` method instead of supplying paths. (reported by [@fny][], added by [@Maher4Ever][])
- Speed improvement when listening to changes in directories with ignored paths. ([@Maher4Ever][])
- Added `.rbx` and `.svn` to ignored directories. ([@Maher4Ever][])

## 0.4.1 - April 15, 2012

### Bug fix

- [#18](https://github.com/guard/listen/issues/18) Listener crashes when removing directories with nested paths. (reported by [@daemonza][], fixed by [@Maher4Ever][])

## 0.4.0 - April 9, 2012

### New features

- Add `wait_for_callback` method to all adapters. ([@Maher4Ever][])
- Add `Listen::MultiListener` class to listen to multiple directories at once. ([@Maher4Ever][])
- Allow passing multiple directories to the `Listen.to` method. ([@Maher4Ever][])
- Add `blocking` option to `Listen#start` which can be used to disable blocking the current thread upon starting. ([@Maher4Ever][])
- Use absolute-paths in callbacks by default instead of relative-paths. ([@Maher4Ever][])
- Add `relative_paths` option to `Listen::Listener` to retain the old functionality. ([@Maher4Ever][])

### Improvements

- Encapsulate thread spawning in the linux-adapter. ([@Maher4Ever][])
- Encapsulate thread spawning in the darwin-adapter. ([@Maher4Ever][] with [@scottdavis][] help)
- Encapsulate thread spawning in the windows-adapter. ([@Maher4Ever][])
- Fix linux-adapter bug where Listen would report file-modification events on the parent-directory. ([@Maher4Ever][])

### Change

- Remove `wait_until_listening` as adapters doesn't need to run inside threads anymore ([@Maher4Ever][])

## 0.3.3 - March 6, 2012

### Improvement

- Improve pause/unpause. ([@thibaudgg][])

## 0.3.2 - March 4, 2012

### New feature

- Add pause/unpause listener's methods. ([@thibaudgg][])

## 0.3.1 - February 22, 2012

### Bug fix

- [#9](https://github.com/guard/listen/issues/9) Ignore doesn't seem to work. (reported by [@markiz][], fixed by [@thibaudgg][])

## 0.3.0 - February 21, 2012

### New features

- Add automatic fallback to polling if system adapter doesn't work (like a DropBox folder). ([@thibaudgg][])
- Add latency and force_polling options. ([@Maher4Ever][])

## 0.2.0 - February 13, 2012

### New features

- Add checksum comparaison support for detecting consecutive file modifications made during the same second. ([@thibaudgg][])
- Add rb-fchange support. ([@thibaudgg][])
- Add rb-inotify support. ([@thibaudgg][] with [@Maher4Ever][] help)
- Add rb-fsevent support. ([@thibaudgg][])
- Add non-recursive diff with multiple directories support. ([@thibaudgg][])
- Ignore .DS_Store by default. ([@thibaudgg][])

## 0.1.0 - January 28, 2012

- First version with only a polling adapter and basic features set (ignore & filter). ([@thibaudgg][])

<!--- The following link definition list is generated by PimpMyChangelog --->
[#9]: https://github.com/guard/listen/issues/9
[#17]: https://github.com/guard/listen/issues/17
[#18]: https://github.com/guard/listen/issues/18
[#21]: https://github.com/guard/listen/issues/21
[#24]: https://github.com/guard/listen/issues/24
[#27]: https://github.com/guard/listen/issues/27
[#32]: https://github.com/guard/listen/issues/32
[#39]: https://github.com/guard/listen/issues/39
[@Maher4Ever]: https://github.com/Maher4Ever
[@dkubb]: https://github.com/dkubb
[@ebroder]: https://github.com/ebroder
[@akerbos]: https://github.com/akerbos
[@cobychapple]: https://github.com/cobychapple
[@daemonza]: https://github.com/daemonza
[@fny]: https://github.com/fny
[@markiz]: https://github.com/markiz
[@napcs]: https://github.com/napcs
[@netzpirat]: https://github.com/netzpirat
[@nex3]: https://github.com/nex3
[@rymai]: https://github.com/rymai
[@scottdavis]: https://github.com/scottdavis
[@textgoeshere]: https://github.com/textgoeshere
[@thibaudgg]: https://github.com/thibaudgg