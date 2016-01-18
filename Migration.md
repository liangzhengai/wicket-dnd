Following the changes in Wicket from 1.4 to 1.5 you have to adjust your code for wicket-dnd 0.5.x:
  * wicket-dnd is now dependent on wicketstuff-jslibraries to provide prototype.js
  * Drops without location are no longer supported, so configure your [DropTarget](http://code.google.com/p/wicket-dnd/source/browse/trunk/wicket-dnd/src/main/java/wicketdnd/DropTargetjava) explicitely, e.g. to allow drops:
    * on a table without rows: target.dropCenter("table")
    * on a table without rows **and** on rows: target.dropCenter("table, tbody tr")

Migration to wicket-dnd 0.6 for Wicket 6 requires only small changes:
  * groupId has changed to 'com.github.wicket-dnd'
  * wicketstuff-jslibraries is no longer a dependency since built-in jQuery is used
  * see http://github.com/svenmeier/wicket-dnd for further details