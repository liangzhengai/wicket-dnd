A generic Drag&Drop framework for [Wicket](http://wicket.apache.org):

**News: jQuery based implementation with support for Wicket 6 is continuing on [GitHub](http://github.com/svenmeier/wicket-dnd)**

  * operate on any markup element via selectors
  * drag and drop between any Wicket components
  * vertical, horizontal and hierarchical structured markup (i.e. [trees](http://code.google.com/p/wicket-tree/))
  * drag initiators (a.k.a. handles)
  * common desktop metaphors with 'MOVE', 'COPY' and 'LINK' [operations](http://code.google.com/p/wicket-dnd/source/browse/trunk/wicket-dnd/src/main/java/wicketdnd/Operation.java)
  * transfer types
  * themeable
  * works in Firefox, Safari, Chrome, [IE and Opera](http://code.google.com/p/wicket-dnd/wiki/DisplayProblems)

See our live examples on http://wicket-dnd.appspot.com/ (beware - very slow!).

# Theme your DnD #
Add a theme to your pages to be used for DnD, e.g. the [WindowsTheme](http://code.google.com/p/wicket-dnd/source/browse/trunk/wicket-dnd/src/main/java/wicketdnd/theme/WindowsTheme.java):
```
add(CSSPackageResource.getHeaderContribution(new WindowsTheme()));
```

# Drag source #
Add a [DragSource](http://code.google.com/p/wicket-dnd/source/browse/trunk/wicket-dnd/src/main/java/wicketdnd/DragSource.java) behavior to enable a container for drags:
```
container.add(new DragSource(Operation.MOVE) {
  public void onAfterDrop(AjaxRequestTarget target, Transfer transfer) {
    // remove transfer data
  }
}.drag("tr"));
```

In this example only a MOVE [operation](http://code.google.com/p/wicket-dnd/source/browse/trunk/wicket-dnd/src/main/java/wicketdnd/Operation.java) is allowed. Drags are initiated on `<tr>` tags.

# Drop target #
Add a [DropTarget](http://code.google.com/p/wicket-dnd/source/browse/trunk/wicket-dnd/src/main/java/wicketdnd/DropTarget.java) behavior to enable a container for drops:
```
container.add(new DropTarget(Operation.MOVE, Operation.COPY) {
  public void onDrop(AjaxRequestTarget target, Transfer transfer, Location location) {
    // add transfer data
  }
}.dropCenter("tr"));
```

In this example MOVE and COPY [operations](http://code.google.com/p/wicket-dnd/source/browse/trunk/wicket-dnd/src/main/java/wicketdnd/Operation.java) are allowed. Drops are performed on center of `<tr>` tags, the [Location](http://code.google.com/p/wicket-dnd/source/browse/trunk/wicket-dnd/src/main/java/wicketdnd/Location.java) holds a reference to the actual component the transfer was dropped on.