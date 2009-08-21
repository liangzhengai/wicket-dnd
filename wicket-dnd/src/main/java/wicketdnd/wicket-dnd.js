var DND = {

	NONE: 0,

	MOVE: 1,
	
	COPY: 2,
	
	LINK: 4,
	
	OPACITY: 0.7,
	
	DELAY: 1,
	
	bounds: [],
	
	executor: null,
	
	elements: {},
	
	startDrag: function(pointer, drag, offset) {
		this.drag = drag;

		this.drop = null;
		
		this.hover = new Hover(drag, offset);

		this.eventMousemove = this.updateDrag.bindAsEventListener(this);
		this.eventMouseup   = this.endDrag.bindAsEventListener(this);
		this.eventKeypress  = this.handleKeypress.bindAsEventListener(this);
		this.eventKeydown   = this.handleKeydown.bindAsEventListener(this);
		this.eventKeyup     = this.handleKeyup.bindAsEventListener(this);
		Event.observe(document, "mousemove", this.eventMousemove);
		Event.observe(document, "mouseup", this.eventMouseup);
		Event.observe(document, "keypress", this.eventKeypress);
		Event.observe(document, "keydown", this.eventKeydown);
		Event.observe(document, "keyup", this.eventKeyup);
		
		this.pointer = pointer;
		this.hover.draw(pointer);
	},
	
	updateDrag: function(event) {
		var pointer = [event.pointerX(), event.pointerY()];

		if (this.pointer.inspect() != pointer.inspect()) {
			this.pointer = pointer;

			this.hover.draw(pointer);

			var target = this.findTarget(document.body, this.pointer[0], this.pointer[1]);
			if (target == null) {
				this.setDrop(null);
			} else {
				this.setDrop(target.findDrop(this.pointer[0], this.pointer[1]));
			}
			
			this.shift = event.shiftKey;
			this.ctrl = event.ctrlKey;
			
			this.hover.setOperation(this.findOperation());
		}

		Event.stop(event);
	},
	
	findOperation: function() {
		var operations = this.drag.source.operations;
		if (this.drop != null) {
			operations = operations & this.drop.target.operations;
		}
		
		if (this.shift) {
			if ((operations & this.LINK) != 0) {
				return this.LINK;
			}
		} else if (this.ctrl) {
			if ((operations & this.COPY) != 0) {
				return this.COPY;
			}
		} else {
			if ((operations & this.MOVE) != 0) {
				return this.MOVE;
			} else if ((operations & this.COPY) != 0) {
				return this.COPY;
			} else if ((operations & this.LINK) != 0) {
				return this.LINK;
			}
		}		
		
		return this.NONE;
	},
	
	handleKeypress: function(event) {
		if (event.keyCode == Event.KEY_ESC) {
			this.endDrag(event);
			return;
		}
	},

	handleKeydown: function(event) {
		if (event.keyCode == 16) {
			this.shift = true;
		}
		if (event.keyCode == 17) {
			this.ctrl = true;
		}

		this.hover.setOperation(this.findOperation());
	},

	handleKeyup: function(event) {
		if (event.keyCode == 16) {
			this.shift = false;
		}
		if (event.keyCode == 17) {
			this.ctrl = false;
		}

		this.hover.setOperation(this.findOperation());
	},

	endDrag: function(event) {
		if (this.drop != null && this.hover.operation != this.NONE) {
			this.drop.onDrop(this.drag, this.hover.operation);
			
			this.setDrop(null);
		}

		this.drag.clear();
		this.drag = null;

		this.hover.clear();
		this.hover = null;
		
		for (var className in this.elements) {
			this.elements[className].remove();
		}
		this.elements = {};

		this.clearBounds();
		
		if (this.excutor != null) {
			this.executor.stop();
			this.executor = null;
		}

		Event.stopObserving(document, "mouseup"  , this.eventMouseup);
		Event.stopObserving(document, "mousemove", this.eventMousemove);
		Event.stopObserving(document, "keydown"  , this.eventKeydown);
		Event.stopObserving(document, "keyup"    , this.eventKeyup);
		
		Event.stop(event);
	},

	findTarget: function(element, x, y) {
		if (element.dropTarget != undefined) {
			return element.dropTarget;
		}

		var children = element.childElements();
		for (var index = 0; index < children.length; index++) {
			var child = children[index];
			
			var bounds = this.getBounds(child);
			if (x >= bounds.left && x < bounds.left + bounds.width && y >= bounds.top && y < bounds.top + bounds.height) {
				return this.findTarget(child, x, y);
			}
		};
		
		return null;
	},

	setDrop: function(drop) {
		if (drop != this.drop) {
			if (this.drop != null) {
				this.drop.clear();
			}
			
			if (this.executor != null) {
				this.executor.stop();
				this.executor = null;
			}
			
			this.drop = drop;
			
			if (this.drop != null) {
				this.drop.draw();
				
				this.executor = new PeriodicalExecuter(this.onDragOver.bindAsEventListener(this), this.DELAY);
			}
		}
	},
	
	onDragOver: function() {
		if (this.executor != null) {
			this.executor.stop();
			this.executor = null;
		}

		if (this.drop != null) {
			this.drop.target.notify("drag-over", this.hover.operation, this.drag, this.drop,
							this.clearBounds.bindAsEventListener(this));
		}		
	},

	getBounds: function(element) {
		for (var index = 0; index < this.bounds.length; index++) {
			var bounds = this.bounds[index];
			if (bounds.element == element) {
				return bounds;
			}
		}
		
		var position = element.cumulativeOffset();
		var dimension = element.getDimensions();

		var bounds = {};
		bounds.element = element;
		bounds.top  = position.top;
		bounds.left = position.left;
		bounds.width = dimension.width;
		bounds.height = dimension.height;

		this.bounds.push(bounds);
		
		return bounds;
	},
	
	clearBounds: function() {	
		this.bounds = [];
	},

	newElement: function(className) {
		var element = this.elements[className];
		if (element == null) {
			element = new Element("div");
			element.addClassName(className);
			element.setOpacity(this.OPACITY);
			element.hide();
			$(document.body).insert(element);
			
			this.elements[className] = element;
		}
		
		return element;
	}
};

var Hover = Class.create({

	initialize: function(drag, offset) {
		this.offset = offset;
	
		this.element = new Element("div");
		this.element.setOpacity(DND.OPACITY);
		this.element.className = "dnd-hover";
		$(document.body).insert(this.element);
		
		this.clone = $(drag.id).cloneNode(true);
		if (this.clone.match("tr")) {
			var table = new Element("table");
			table.className = "dnd-hover-table";
			this.element.insert(table);

			var tbody = new Element("tbody");
			table.insert(tbody);
			
			tbody.insert(this.clone);
		} else {
			this.element.insert(this.clone);
		}
		
		this.cover = new Element("div");
		this.cover.className = "dnd-hover-move";
		this.element.insert(this.cover);
		
		var style = this.element.style;
		style.width = DND.getBounds($(drag.id)).width + "px";
		style.height = DND.getBounds($(drag.id)).height + "px";
	},

	setOperation: function(operation) {
		if (this.operation != operation) {
			this.operation = operation;
			
			if (operation == DND.MOVE) {
				this.cover.className = "dnd-hover-move";
			} else if (operation == DND.COPY) {
				this.cover.className = "dnd-hover-copy";
			} else if (operation == DND.LINK) {
				this.cover.className = "dnd-hover-link";
			} else {
				this.cover.className = "dnd-hover-none";
			}
		}
	},
	
	clear: function() {
		this.element.remove();
	},
	
	draw: function(pointer) {
		var style = this.element.style;
		style.left = pointer[0] -this.offset[0] + "px";
		style.top = pointer[1] - this.offset[1] + "px";
	}
});

var Drop = Class.create({

	initialize: function(target) {
		this.target = target;
	},

	clear: function() {
		this.target.element.removeClassName("dnd-drop");
	},

	draw: function() {
		this.target.element.addClassName("dnd-drop");
	},

	onDrop: function(drag, operation) {
		this.target.notify("drop", operation, drag, null);
	}
});

var DropOver = Class.create({

	initialize: function(target, element) {
		this.target = target;
		this.id = element.identify();
	},

	clear: function() {
		$(this.id).removeClassName("dnd-drop-over");
	},

	draw: function() {
		$(this.id).addClassName("dnd-drop-over");
	},

	onDrop: function(drag, operation) {
		this.target.notify("drop-over", operation, drag, this);
	}
});

var DropBefore = Class.create({

	initialize: function(target, element) {
		this.target = target;
		this.id = element.identify();
		
		this.element = DND.newElement("dnd-drop-before");
		
		this.height = DND.getBounds(this.element).height;
	},

	clear: function() {
		this.element.hide();
	},

	draw: function() {
		this.element.show();

		var bounds = DND.getBounds($(this.id));
		
		var style = this.element.style;
		style.left  = bounds.left + "px";
		style.top   = bounds.top - (this.height/2) + "px";
		style.width = bounds.width + "px";
	},	

	onDrop: function(drag, operation) {
		this.target.notify("drop-before", operation, drag, this);
	}
});

var DropAfter = Class.create({

	initialize: function(target, element) {
		this.target = target;
		this.id = element.identify();
		
		this.element = DND.newElement("dnd-drop-after");
		
		this.height = DND.getBounds(this.element).height;
	},

	clear: function() {
		this.element.hide();
	},

	draw: function() {
		this.element.show();
		
		var bounds = DND.getBounds($(this.id));
		
		var style = this.element.style;
		style.left = bounds.left + "px";
		style.top = bounds.top + bounds.height - (this.height/2) + "px";
		style.width = bounds.width + "px";
	},
	
	onDrop: function(drag, operation) {
		this.target.notify("drop-after", operation, drag, this);
	}
});

var Drag = Class.create({

	initialize: function(source, element, pointer) {
		this.source = source;
		this.id = element.identify();
		
		var bounds = DND.getBounds(element);
		DND.startDrag(pointer, this,
					[pointer[0] - bounds.left,
		             pointer[1] - bounds.top]);
		
		element.addClassName("dnd-drag");
	},

	clear: function() {
		$(this.id).removeClassName("dnd-drag");
	}
});

var DragSource = Class.create({

	initialize: function(element, operations, selector) {
		this.element = $(element);
		
		this.operations = operations;
				
		this.selector = selector;
		
		this.eventMouseDown = this.initDrag.bindAsEventListener(this);
		Event.observe(this.element, "mousedown", this.eventMouseDown);
	},
	
	initDrag: function(event) {

		if (event.isLeftClick()) {
			var src = event.element();
			
			// abort on form elements, fixes a Firefox issue
			if ((tag_name = src.tagName.toUpperCase()) && (
				tag_name=='INPUT' ||
				tag_name=='SELECT' ||
				tag_name=='OPTION' ||
				tag_name=='BUTTON' ||
				tag_name=='TEXTAREA')) {
				return;
			}

			while (src != this.element && !src.match(this.selector)) {
				src = src.up();
			}
			
			if (src != this.element) {
				var pointer = [event.pointerX(), event.pointerY()];
				
				new Drag(this, src, pointer);
				
				event.stop();
			}
		}
	}
});

var DropTarget = Class.create({

	initialize: function(element, url, operations, selector, beforeSelector, afterSelector) {
		this.element = $(element);

		this.element.dropTarget = this;
		
		this.url = url;
		
		this.operations = operations;
				
		this.selector       = selector;
		this.beforeSelector = beforeSelector;
		this.afterSelector  = afterSelector;
	},

	findDrop: function(x, y) {
		var drop = this.findDropFor(this.element, x, y);
		if (drop == null) {
			drop = new Drop(this);
		}
		return drop;
	},
	
	findDropFor: function(element, x, y) {
		var drop = null;
		
		var children = element.childElements();
		for (var index = 0; index < children.length; index++) {
			var child = children[index];

			if (child.match('colgroup')) {
				continue;
			}
			
			drop = this.findDropFor(child, x, y);
			if (drop != null) {
				break;
			}
		};

		var bounds = DND.getBounds(element);
		if (x >= bounds.left && x < bounds.left + bounds.width && y >= bounds.top && y < bounds.top + bounds.height) {
			if (drop == null) {
				if (element.match(this.selector)) {
					drop = new DropOver(this, element);
				}
			}
			
			if (drop == null) {
				if (element.match(this.beforeSelector) && y <= bounds.top + bounds.height/2) {
					drop = new DropBefore(this, element);
				} else if (element.match(this.afterSelector) && y >= bounds.top + bounds.height/2) {
					drop = new DropAfter(this, element);
				}
			} else if (drop instanceof DropOver) {
				if (element.match(this.beforeSelector) && y < bounds.top + 6) {
					drop = new DropBefore(this, element);
				} else if (element.match(this.afterSelector) && y > bounds.top + bounds.height - 6) {
					drop = new DropAfter(this, element);
				}
			}
		}
		
		return drop;
	},	
	
	notify: function(type, operation, drag, drop, successHandler) {
		var params = "&type=" + type
					+ "&operation=" + operation
					+ "&source=" + drag.source.element.id
					+ "&drag=" + drag.id;
		if (drop != null) {
			params = params + "&drop=" + drop.id;
		}
		
		wicketAjaxGet(this.url + params, successHandler);
	}
});