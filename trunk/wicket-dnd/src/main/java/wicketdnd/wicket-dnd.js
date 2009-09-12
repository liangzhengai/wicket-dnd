var DnD = {

	BORDER: 6,
	
	THRESHOLD: 3,
	
	DELAY: 1,
	
	executor: null,
	
	targets: [],
	
	elements: {},
	
	startDrag: function(pointer, drag, offset) {
		this.drag = drag;

		this.drop = null;
		
		this.hover = new DnD.Hover(drag, offset);
		
		this.targets = this.collectTargets([], document.body);

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
		if (this.excutor != null) {
			this.executor.stop();
			this.executor = null;
		}

		if (this.drop != null) {
			this.drop.clear();
			if (this.hover.operation != 'NONE') {
				this.drop.notify("drop", this.hover.operation, this.drag);
			}
			this.drop = null;
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

			if (this.updateDrop()) {
				if (this.drop != null && !(this.drop instanceof DnD.Drop)) {
					this.executor = new PeriodicalExecuter(this.eventExecute, this.DELAY);
				}
			}
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

	updateDrop: function() {
		if (this.drag == null) {
			return false;
		}
		
		var target = this.findTarget(this.pointer[0], this.pointer[1]);
		if (target == null) {
			return this.setDrop(null);
		} else {
			return this.setDrop(target.findDrop(this.pointer[0], this.pointer[1]));
		}
	},

	canTransfer: function() {
		if (this.drag == null || this.drop == null) {
			return false;
		}
		
		var targetTransfers = this.drop.target.transfers;
		var sourceTransfers = this.drag.source.transfers;
		for (var index = 0; index < sourceTransfers.length; index++) {
			var transfer = sourceTransfers[index];
			
			if (targetTransfers.indexOf(transfer) != -1) {
				return true;
			}
		}		

		return false;
	},
	
	allowsOperation: function(operation) {
		return this.drag.source.operations.indexOf(operation) != -1 &&
				this.drop.target.operations.indexOf(operation) != -1;
	},
	
	findOperation: function() {
		if (this.canTransfer()) {
			if (this.shift) {
				if (this.allowsOperation('LINK')) {
					return 'LINK';
				}
			} else if (this.ctrl) {
				if (this.allowsOperation('COPY')) {
					return 'COPY';
				}
			} else {
				if (this.allowsOperation('MOVE')) {
					return 'MOVE';
				} else if (this.allowsOperation('COPY')) {
					return 'COPY';
				} else if (this.allowsOperation('LINK')) {
					return 'LINK';
				}
			}		
		}		
		return 'NONE';
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

	collectTargets: function(targets, element) {
		if (element.dropTarget != undefined) {
			targets.push(element.dropTarget);
		}

		var children = element.childElements();
		for (var index = 0; index < children.length; index++) {
			var child = children[index];

			this.collectTargets(targets, child);
		};
		
		return targets;
	},

	/**
	 * Set a new drop and return whether the drop has actually changed.
	 */
	setDrop: function(drop) {
		if (this.drop != null && drop != null) {
			if (this.drop.id == drop.id && this.drop.anchor == drop.anchor) {
				return false;
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
		}

		this.hover.setOperation(this.findOperation());
		
		return true;
	},
	
	handleExecute: function() {
		if (this.executor != null) {
			this.executor.stop();
			this.executor = null;
		}

		if (this.drop != null) {
			var completion = function() {
				// clear old drop to force update
				this.setDrop(null);
				
				this.updateDrop();
			};
			this.drop.notify("drag", this.hover.operation, this.drag, completion.bindAsEventListener(this));
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
			element.hide();
			$(document.body).insert(element);
			
			this.elements[className] = element;
		}
		
		return element;
	}
};

DnD.Hover = Class.create({

	initialize: function(drag, offset) {
		this.offset = offset;
		
		this.operation = 'NONE';
	
		this.element = DnD.newElement("dnd-hover-NONE");
		
		this.element.insert(drag.clone());
		
		var bounds = DnD.getBounds(this.element);	

		var cover = new Element("div");
		cover.className = "dnd-hover-cover";
		var style = cover.style;
		style.top = "0px";
		style.left = "0px";
		style.width = bounds.width + "px";
		style.height = bounds.height + "px";
		this.element.insert(cover);
					
		window.focus();
	},

	setOperation: function(operation) {
		if (this.operation != operation) {
			this.operation = operation;
			
			this.element.className = "dnd-hover-" + operation;
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

DnD.Drop = Class.create({

	initialize: function(target) {
		this.target = target;
	},

	draw: function() {
		$(this.target.id).addClassName("dnd-drop");
	},
	
	clear: function() {
		$(this.target.id).removeClassName("dnd-drop");
	},

	notify: function(type, operation, drag, successHandler) {
		this.target.notify(type, operation, drag, null, successHandler);
	}
});

DnD.DropCenter = Class.create({

	initialize: function(target, element) {
		this.target = target;
		this.id = element.identify();
		this.anchor = "CENTER";
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

	notify: function(type, operation, drag, successHandler) {
		this.target.notify(type, operation, drag, this, successHandler);
	}
});

DnD.DropTop = Class.create({

	initialize: function(target, element) {
		this.target = target;
		this.id = element.id;
		this.anchor = "TOP";
		
		this.element = DnD.newElement("dnd-drop-top");
	},

	draw: function() {
		var bounds = DnD.getBounds($(this.id));
		
		var style = this.element.style;
		style.left  = bounds.left + "px";
		style.top   = bounds.top - (DnD.getBounds(this.element).height/2) + "px";
		style.width = bounds.width + "px";

		this.element.show();
	},
	
	clear: function() {
		this.element.hide();
	},

	notify: function(type, operation, drag, successHandler) {
		this.target.notify(type, operation, drag, this, successHandler);
	}
});

DnD.DropBottom = Class.create({

	initialize: function(target, element) {
		this.target = target;
		this.id = element.identify();
		this.anchor = "BOTTOM";
		
		this.element = DnD.newElement("dnd-drop-bottom");
	},

	draw: function() {
		var bounds = DnD.getBounds($(this.id));
		
		var style = this.element.style;
		style.left  = bounds.left + "px";
		style.top   = bounds.top + bounds.height - (DnD.getBounds(this.element).height/2) + "px";
		style.width = bounds.width + "px";

		this.element.show();
	},
	
	clear: function() {
		this.element.hide();
	},
	
	notify: function(type, operation, drag, successHandler) {
		this.target.notify(type, operation, drag, this, successHandler);
	}
});

DnD.DropLeft = Class.create({

	initialize: function(target, element) {
		this.target = target;
		this.id = element.id;
		this.anchor = "LEFT";
		
		this.element = DnD.newElement("dnd-drop-left");
	},

	draw: function() {
		var bounds = DnD.getBounds($(this.id));
		
		var style = this.element.style;
		style.left  = bounds.left - (DnD.getBounds(this.element).width/2) + "px";
		style.top   = bounds.top + "px";
		style.height = bounds.height + "px";

		this.element.show();
	},
	
	clear: function() {
		this.element.hide();
	},

	notify: function(type, operation, drag, successHandler) {
		this.target.notify(type, operation, drag, this, successHandler);
	}
});

DnD.DropRight = Class.create({

	initialize: function(target, element) {
		this.target = target;
		this.id = element.identify();
		this.anchor = "RIGHT";
		
		this.element = DnD.newElement("dnd-drop-right");
	},

	draw: function() {
		var bounds = DnD.getBounds($(this.id));
		
		var style = this.element.style;
		style.left  = bounds.left + bounds.width - (DnD.getBounds(this.element).width/2) + "px";
		style.top   = bounds.top + "px";
		style.height = bounds.height + "px";

		this.element.show();
	},
	
	clear: function() {
		this.element.hide();
	},
	
	notify: function(type, operation, drag, successHandler) {
		this.target.notify(type, operation, drag, this, successHandler);
	}
});

DnD.Drag = Class.create({

	initialize: function(source, element, pointer) {
		this.source = source;
		this.id = element.identify();
		
		var bounds = DnD.getBounds(element);
		DnD.startDrag(pointer, this,
					[pointer[0] - bounds.left,
		             pointer[1] - bounds.top]);
		
		element.addClassName("dnd-drag");
	},

	clone: function() {
		var element = $(this.id);
		
		var clone = element.cloneNode(true);
		clone.addClassName("dnd-hover-clone");

		if (clone.match("td")) {
			var tr = new Element("tr");
			tr.className = "dnd-hover-tr";
			tr.insert(clone);
			clone = tr;
		}
		if (clone.match("tr")) {
			var tbody = new Element("tbody");
			tbody.className = "dnd-hover-tbody";
			tbody.insert(clone);
			clone = tbody;
		}
		if (clone.match("tbody")) {
			var table = new Element("table");
			table.className = "dnd-hover-table";
			table.insert(clone);
			clone = table;
		}
	
		var bounds = DnD.getBounds(element);
		var style = clone.style;
		style.width = bounds.width + "px";
		style.height = bounds.height + "px";
		
		return clone;
	},
	
	clear: function() {
		// element might no longer exist
		var element = $(this.id);
		if (element) {
			element.removeClassName("dnd-drag");
		}
	}
});

DnD.DragSource = Class.create({

	initialize: function(id, path, operations, transfers, selector, initiateSelector) {
		this.element = $(id);
		
		this.path = path;
		
		this.operations = operations;
		this.transfers = transfers;
				
		this.selector = selector;
		this.initiateSelector = initiateSelector;
		
		this.eventMouseDown = this.handleMouseDown.bindAsEventListener(this);
		Event.observe(this.element, "mousedown", this.eventMouseDown);
	},
	
	handleMouseDown: function(event) {
		if (event.isLeftClick()) {
			var candidate = event.element();
			
			// abort on form elements
			if ((tag_name = candidate.tagName.toUpperCase()) && (
				tag_name=='INPUT' ||
				tag_name=='SELECT' ||
				tag_name=='OPTION' ||
				tag_name=='BUTTON' ||
				tag_name=='TEXTAREA')) {
				return;
			}

			while (candidate != this.element && !candidate.match(this.initiateSelector)) {
				candidate = candidate.up();
			}
			
			if (candidate != this.element) {
				if (!candidate.match(this.selector)) {
					candidate = candidate.up(this.selector);
				}
				
				if (candidate != null && candidate.id) {
					new DnD.Gesture(this, candidate, [event.pointerX(), event.pointerY()]);
					
					event.stop();
				}
			}
		}
	},	
});

DnD.Gesture = Class.create({

	initialize: function(source, element, pointer) {
		this.source = source;
		this.element = element;
		this.pointer = pointer;
		
		this.eventMousemove  = this.handleMousemove.bindAsEventListener(this);
		this.eventMouseup    = this.handleMouseup.bindAsEventListener(this);
		
		Event.observe(document, "mousemove", this.eventMousemove);
		Event.observe(document, "mouseup", this.eventMouseup);
	},
	
	destroy: function() {
		Event.stopObserving(document, "mousemove", this.eventMousemove);
		Event.stopObserving(document, "mouseup"  , this.eventMouseup);
	},

	confirmDrag: function() {
		new DnD.Drag(this.source, this.element, this.pointer);
	},	
	
	handleMousemove: function(event) {
		var deltaX = event.pointerX() - this.pointer[0];
		var deltaY = event.pointerY() - this.pointer[1];
		
		if (Math.abs(deltaX) > DnD.THRESHOLD || Math.abs(deltaY) > DnD.THRESHOLD) {

			this.confirmDrag();
			
			this.destroy();
		}
	
		event.stop();
	},
	
	handleMouseup: function(event) {
		this.destroy();
	}
});

DnD.DropTarget = Class.create({

	initialize: function(id, url, operations, transfers, overSelector, topSelector, rightSelector, bottomSelector, leftSelector) {
		this.id = id;

		$(this.id).dropTarget = this;
		
		this.url = url;
		
		this.operations = operations;
		this.transfers = transfers;
				
		this.overSelector   = overSelector;
		this.topSelector    = topSelector;
		this.rightSelector  = rightSelector;
		this.bottomSelector = bottomSelector;
		this.leftSelector   = leftSelector;
	},

	findDrop: function(x, y) {
		var drop = this.findDropFor($(this.id), x, y);
		if (drop == null) {
			drop = new DnD.Drop(this);
		}
		return drop;
	},
	
	findDropFor: function(element, x, y) {
		var drop = null;
		
		if (element.id) {
			if (element.match(this.overSelector)) {
				var bounds = DnD.getBounds(element);

				if (x >= bounds.left && x < bounds.left + bounds.width &&
					y >= bounds.top && y < bounds.top + bounds.height) {
					
					drop = new DnD.DropCenter(this, element);
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
			if (element.match(this.topSelector)) {
				if (drop == null) {
					var bounds = DnD.getBounds(element);
	
					if (x >= bounds.left && x < bounds.left + bounds.width &&
						y >= bounds.top && y < bounds.top + bounds.height/2) {
						
						drop = new DnD.DropTop(this, element);
					}
				} else if (drop instanceof DnD.DropCenter) {
					var bounds = DnD.getBounds(element);
	
					if (x >= bounds.left && x < bounds.left + bounds.width &&
						y >= bounds.top && y < bounds.top + DnD.BORDER) {
						
						drop = new DnD.DropTop(this, element);
					}
				}
			}
			
			if (element.match(this.bottomSelector)) {
				if (drop == null) {
					var bounds = DnD.getBounds(element);
	
					if (x >= bounds.left && x < bounds.left + bounds.width &&
						y >= bounds.top + bounds.height/2 && y < bounds.top + bounds.height) {
						
						drop = new DnD.DropBottom(this, element);
					}
				} else if (drop instanceof DnD.DropCenter) {
					var bounds = DnD.getBounds(element);
	
					if (x >= bounds.left && x < bounds.left + bounds.width &&
						y >= bounds.top + bounds.height - DnD.BORDER && y < bounds.top + bounds.height) {
						
						drop = new DnD.DropBottom(this, element);
					}
				}
			}
			
			if (element.match(this.leftSelector)) {
				if (drop == null) {
					var bounds = DnD.getBounds(element);
	
					if (x >= bounds.left && x < bounds.left + bounds.width/2 &&
						y >= bounds.top && y < bounds.top + bounds.height) {
						
						drop = new DnD.DropLeft(this, element);
					}
				} else if (drop instanceof DnD.DropCenter) {
					var bounds = DnD.getBounds(element);
	
					if (x >= bounds.left && x < bounds.left + DnD.BORDER &&
						y >= bounds.top && y < bounds.top + bounds.height) {
						
						drop = new DnD.DropLeft(this, element);
					}
				}
			}
			
			if (element.match(this.rightSelector)) {
				if (drop == null) {
					var bounds = DnD.getBounds(element);
	
					if (x >= bounds.left + bounds.width/2  && x < bounds.left + bounds.width &&
						y >= bounds.top && y < bounds.top + bounds.height) {
						
						drop = new DnD.DropRight(this, element);
					}
				} else if (drop instanceof DnD.DropCenter) {
					var bounds = DnD.getBounds(element);
	
					if (x >= bounds.left + bounds.width - DnD.BORDER && x < bounds.left + bounds.width &&
						y >= bounds.top && y < bounds.top + bounds.height) {
						
						drop = new DnD.DropRight(this, element);
					}
				}
			}
		}
		
		return drop;
	},	
	
	notify: function(type, operation, drag, location, successHandler) {
		var url = this.url;
		url += "&type=" + type;
		url += "&operation=" + operation;
		url += "&source=" + drag.source.path;
		url += "&drag=" + drag.id;
		if (location != null) {
			url += "&component=" + location.id;
			url += "&anchor=" + location.anchor;
		}
		
		wicketAjaxGet(url, successHandler);
	}
});