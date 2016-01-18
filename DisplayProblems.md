When using wicket-dnd you will encounter the following obstacles:

## IE and custom cursor images ##
IE loads custom cursor images relative to the current HTML page. This bug affects all IE versions and normally makes it impossible to use relative URLs inside cursor styles defined in CSS files:

```
div.mycursor {
  cursor: url(mycursor.cur};
}
```

wicket-dnd offers the [IECursorFix](http://code.google.com/p/wicket-dnd/source/browse/trunk/wicket-dnd/src/main/java/wicketdnd/IECursorFix.java) behavior to adjust these styles on the fly via Javascript.

Regretfully IE 6 fails to reliably display cursor changes so it is recommended to use a theme like [WebTheme](http://code.google.com/p/wicket-dnd/source/browse/trunk/wicket-dnd/src/main/java/wicketdnd/theme/WebTheme.java) which doesn't utilize cursor changes to indicate DnD operations.

## IE and background images ##
IE 6 doesn't cache background images defined in CSS. This leads to excessive flickering especially when hovering with the mouse over HTML elements.

wicket-dnd offers the [IEBackgroundImageCacheFix](http://code.google.com/p/wicket-dnd/source/browse/trunk/wicket-dnd/src/main/java/wicketdnd/IEBackgroundImageCacheFix.java) behavior to force image caching via Javascript.

## Opera and custom cursor images ##
Opera doesn't support custom cursor images. Please use a theme like [WebTheme](http://code.google.com/p/wicket-dnd/source/browse/trunk/wicket-dnd/src/main/java/wicketdnd/theme/WebTheme.java) which doesn't utilize cursor changes to indicate DnD operations.