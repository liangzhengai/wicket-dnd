var DND = {

	NONE: 0,

	MOVE: 1,
	
	COPY: 2,
	
	LINK: 4,
	
	OPACITY: 0.7,
	
	DELAY: 1,
	
	executor: null,
	
	targets: [],
	
	elements: {},
	
	startDrag: function(pointer, drag, offset) {
		this.drag = drag;

		this.drop = null;
		
		this.hover = new Hover(drag, offset);
		
		this.targets = [];
		this.findTargets(document.body);

		this.eventMousemove  = this.handleMousemove.bindAsEventListener(this);
		this.eventMouseup    = this.handleMouseup.bindAsEventListener(this);
		this.eventKeypress   = this.handleKeypress.bindAsEventListener(this);
		this.eventKeydown    = this.handleKeydown.bindAsEventListener(this);
		this.eventKeyup      = this.handleKeyup.bindAsEventListener(this);
		this.eventExecute    = this.handleExecute.bindAsEventListener(this);
		
		Event.observe(document, "mousemove", this.eventMousemove);
		Event.observe(document, "mouseup", this.eventMouseup);
		Event.observe(document, "keypress", this.eventKeypress);
		Event.observe(document, "keydown", this.eventKeydown);
		Event.observe(document, "keyup", this.eventKeyup);
		
		this.pointer = pointer;
		this.hover.draw(pointer);
	},
	
	endDrag: function() {
		if (this.drop != null && this.hover.operation != this.NONE) {
			this.drop.onDrop(this.drag, this.hover.operation);
			
			this.setDrop(null);
		}

		if (this.drag != null) {
			this.drag.clear();
			this.drag = null;
		}

		if (this.hoover != null) {
			this.hover.clear();
			this.hover = null;
		}
		
		for (var className in this.elements) {
			this.elements[className].remove();
		}
		this.elements = {};
		
		this.targets = [];

		if (this.excutor != null) {
			this.executor.stop();
			this.executor = null;
		}

		Event.stopObserving(document, "mousemove", this.eventMousemove);
		Event.stopObserving(document, "mouseup"  , this.eventMouseup);
		Event.stopObserving(document, "keypress" , this.eventKeypress);
		Event.stopObserving(document, "keydown"  , this.eventKeydown);
		Event.stopObserving(document, "keyup"    , this.eventKeyup);
	},
	
	handleMousemove: function(event) {
		var pointer = [event.pointerX(), event.pointerY()];

		if (this.pointer.inspect() != pointer.inspect()) {
			this.pointer = pointer;
			this.shift = event.shiftKey;
			this.ctrl = event.ctrlKey;			
	
			this.hover.draw(pointer);

			this.updateDropAndOperation();
		}

		Event.stop(event);
	},

	handleKeypress: function(event) {
		if (event.keyCode == Event.KEY_ESC) {
			this.setDrop(null);
			
			this.endDrag();

			Event.stop(event);
		}
	},

	handleKeydown: function(event) {
		if (event.keyCode == 16) {
			this.shift = true;
		}
		if (event.keyCode == 17) {
			this.ctrl = true;
		}

		if (this.hover != null) {
			this.hover.setOperation(this.findOperation());
		}
	},

	handleKeyup: function(event) {
		if (event.keyCode == 16) {
			this.shift = false;
		}
		if (event.keyCode == 17) {
			this.ctrl = false;
		}

		if (this.hover != null) {
			this.hover.setOperation(this.findOperation());
		}
	},

	handleMouseup: function(event) {
		this.endDrag();
		
		Event.stop(event);
	},

	updateDropAndOperation: function() {
		var target = this.findTarget(this.pointer[0], this.pointer[1]);
		if (target == null) {
			this.setDrop(null);
		} else {
			this.setDrop(target.findDrop(this.pointer[0], this.pointer[1]));
		}
		
		this.hover.setOperation(this.findOperation());
	},
		
	findOperation: function() {
		if (this.drag == null) {
			return this.NONE;
		}
		
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

	findTarget: function(x, y) {
		for (var index = 0; index < this.targets.length; index++) {
			var target = this.targets[index];

			var bounds = this.getBounds($(target.id));
			if (x >= bounds.left && x < bounds.left + bounds.width && y >= bounds.top && y < bounds.top + bounds.height) {
				return target;
			}
		}
		
		return null;
	},

	findTargets: function(element) {
		if (element.dropTarget != undefined) {
			this.targets.push(element.dropTarget);
		}

		var children = element.childElements();
		for (var index = 0; index < children.length; index++) {
			var child = children[index];

			this.findTargets(child);
		};
	},

	setDrop: function(drop) {
		if (this.drop != null && drop != null) {
			if (this.drop.id == drop.id && this.drop.element == drop.element) {
				return;
			}
		}
		
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
			
			if (!(this.drop instanceof Drop)) {
				this.executor = new PeriodicalExecuter(this.eventExecute, this.DELAY);
			}
		}
	},
	
	handleExecute: function() {
		if (this.executor != null) {
			this.executor.stop();
			this.executor = null;
		}

		if (this.drop != null) {
			this.drop.target.notify("drag-over", this.hover.operation, this.drag, this.drop,
							this.updateDropAndOperation.bindAsEventListener(this));
		}		
	},

	getBounds: function(element) {
		var position = element.cumulativeOffset();
		var dimension = element.getDimensions();

		var bounds = {};
		bounds.top  = position.top;
		bounds.left = position.left;
		bounds.width = dimension.width;
		bounds.height = dimension.height;

		return bounds;
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
	
		this.element = DND.newElement("dnd-hover");
		
		var clone = $(drag.id).cloneNode(true);
		clone.addClassName("dnd-hover-clone");
		var style = clone.style;
		style.width = DND.getBounds($(drag.id)).width + "px";
		style.height = DND.getBounds($(drag.id)).height + "px";
		if (clone.match("tr")) {
			var table = new Element("table");
			table.className = "dnd-hover-table";
			this.element.insert(table);

			var tbody = new Element("tbody");
			table.insert(tbody);
			
			tbody.insert(clone);
		} else {
			this.element.insert(clone);
		}
		
		this.cover = new Element("div");
		this.cover.className = "dnd-hover-move";
		this.element.insert(this.cover);		
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
		this.element.hide();
	},
	
	draw: function(pointer) {
		var style = this.element.style;
		style.left = pointer[0] -this.offset[0] + "px";
		style.top = pointer[1] - this.offset[1] + "px";
		
		this.element.show();
	}
});

var Drop = Class.create({

	initialize: function(target) {
		this.target = target;
	},

	draw: function() {
		$(this.target.id).addClassName("dnd-drop");
	},
	
	clear: function() {
		$(this.target.id).removeClassName("dnd-drop");
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

	draw: function() {
		$(this.id).addClassName("dnd-drop-over");
	},
	
	clear: function() {
		var element = $(this.id);
		if (element) {
			// element might no longer exist
			$(this.id).removeClassName("dnd-drop-over");
		}
	},

	onDrop: function(drag, operation) {
		this.target.notify("drop-over", operation, drag, this);
	}
});

var DropBefore = Class.create({

	initialize: function(target, element) {
		this.target = target;
		this.id = element.id;
		
		this.element = DND.newElement("dnd-drop-before");		
	},

	draw: function() {
		var bounds = DND.getBounds($(this.id));
		
		var style = this.element.style;
		style.left  = bounds.left + "px";
		style.top   = bounds.top - (DND.getBounds(this.element).height/2) + "px";
		style.width = bounds.width + "px";

		this.element.show();
	},
	
	clear: function() {
		this.element.hide();
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
	},

	draw: function() {
		var bounds = DND.getBounds($(this.id));
		
		var style = this.element.style;
		style.left  = bounds.left + "px";
		style.top   = bounds.top + bounds.height - (DND.getBounds(this.element).height/2) + "px";
		style.width = bounds.width + "px";

		this.element.show();
	},
	
	clear: function() {
		this.element.hide();
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
		var element = $(this.id);
		if (element) {
			// element might no longer exist
			element.removeClassName("dnd-drag");
		}
	}
});

var DragSource = Class.create({

	initialize: function(id, path, operations, selector) {
		this.element = $(id);
		
		this.path = path;
		
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
			
			if (src != this.element && src.id) {
				var pointer = [event.pointerX(), event.pointerY()];
				
				new Drag(this, src, pointer);
				
				event.stop();
			}
		}
	}
});

var DropTarget = Class.create({

	initialize: function(id, url, operations, selector, beforeSelector, afterSelector) {
		this.id = id;

		$(this.id).dropTarget = this;
		
		this.url = url;
		
		this.operations = operations;
				
		this.selector       = selector;
		this.beforeSelector = beforeSelector;
		this.afterSelector  = afterSelector;
	},

	findDrop: function(x, y) {
		var drop = this.findDropFor($(this.id), x, y);
		if (drop == null) {
			drop = new Drop(this);
		}
		return drop;
	},
	
	findDropFor: function(element, x, y) {
		var drop = null;
		
		if (element.id) {
			if (element.match(this.selector)) {
				var bounds = DND.getBounds(element);

				if (x >= bounds.left && x < bounds.left + bounds.width &&
					y >= bounds.top && y < bounds.top + bounds.height) {
					
					drop = new DropOver(this, element);
				}
			}
		}
		
		if (drop == null) {
			var children = element.childElements();
			for (var index = 0; index < children.length; index++) {
				var child = children[index];
	
				drop = this.findDropFor(child, x, y);
				if (drop != null) {
					break;
				}
			};
		}

		if (element.id) {
			if (element.match(this.beforeSelector)) {
				if (drop == null) {
					var bounds = DND.getBounds(element);
	
					if (x >= bounds.left && x < bounds.left + bounds.width &&
						y >= bounds.top && y < bounds.top + bounds.height/2) {
						
						drop = new DropBefore(this, element);
					}
				} else if (drop instanceof DropOver) {
					var bounds = DND.getBounds(element);
	
					if (x >= bounds.left && x < bounds.left + bounds.width &&
						y >= bounds.top && y < bounds.top + 6) {
						
						drop = new DropBefore(this, element);
					}
				}
			}
			
			if (element.match(this.afterSelector)) {
				if (drop == null) {
					var bounds = DND.getBounds(element);
	
					if (x >= bounds.left && x < bounds.left + bounds.width &&
						y >= bounds.top + bounds.height/2 && y < bounds.top + bounds.height) {
						
						drop = new DropAfter(this, element);
					}
				} else if (drop instanceof DropOver) {
					var bounds = DND.getBounds(element);
	
					if (x >= bounds.left && x < bounds.left + bounds.width &&
						y >= bounds.top + bounds.height - 6 && y < bounds.top + bounds.height) {
						
						drop = new DropAfter(this, element);
					}
				}
			}
		}
		
		return drop;
	},	
	
	notify: function(type, operation, drag, drop, successHandler) {
		var params = "&type=" + type
					+ "&operation=" + operation
					+ "&source=" + drag.source.path
					+ "&drag=" + drag.id;
		if (drop != null) {
			params = params + "&drop=" + drop.id;
		}
		
		wicketAjaxGet(this.url + params, successHandler);
	}
});