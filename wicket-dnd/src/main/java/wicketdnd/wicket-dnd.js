var wicketdnd = {

	BORDER: 6,
	
	THRESHOLD: 3,
	
	DELAY: 3,
	
	/**
	 * Utility method to get the bounds of an element.
	 */
	getBounds: function(element) {
		var position = element.cumulativeOffset();
		var dimension = element.getDimensions();
	
		var bounds = {};
		bounds.top  = position.top;
		bounds.left = position.left;
		bounds.width = dimension.width;
		bounds.height = dimension.height;
	
		return bounds;
	}
};

/**
 * A transfer between a drag source and a drop target.
 */
wicketdnd.Transfer = Class.create({

	initialize: function(pointer, drag, offset) {
		this.drag = drag;
		
		this.operation = 'NONE';

		this.elements = {};
		
		this.hover = new wicketdnd.Hover(this, drag, offset);
		
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
		
		// request focus to be able to investigate key down/up/press
		window.focus();
	},
	
	/**
	 * Destroy this transfer - triggers a drop notification if a location is available.
	 */
	destroy: function() {
		if (this.excutor) {
			this.executor.stop();
			this.executor = null;
		}

		if (this.location) {
			this.location.clear();
			if (this.operation != 'NONE') {
				this.location.notify("drop", this.operation, this.drag);
			}
		}

		this.drag.clear();

		this.hover.clear();
		
		for (var className in this.elements) {
			this.elements[className].remove();
		}
		
		Event.stopObserving(document, "mousemove", this.eventMousemove);
		Event.stopObserving(document, "mouseup"  , this.eventMouseup);
		Event.stopObserving(document, "keypress" , this.eventKeypress);
		Event.stopObserving(document, "keydown"  , this.eventKeydown);
		Event.stopObserving(document, "keyup"    , this.eventKeyup);
	},
	
	handleMousemove: function(event) {
		var pointer = [event.pointerX(), event.pointerY()];

		if (this.executor) {
			this.executor.stop();
			this.executor = null;
		}
			
		if (this.pointer.inspect() != pointer.inspect()) {
			this.pointer = pointer;
			this.shift = event.shiftKey;
			this.ctrl = event.ctrlKey;			
	
			this.hover.draw(pointer);

			this.updateLocation();
			
			if (this.location && this.location.anchor) {
				this.executor = new PeriodicalExecuter(this.eventExecute, this.DELAY);
			}
		}

		Event.stop(event);
	},

	handleKeypress: function(event) {
		if (event.keyCode == Event.KEY_ESC) {
			this.setLocation(null);
			
			this.destroy();

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

		this.updateOperation();
	},

	handleKeyup: function(event) {
		if (event.keyCode == 16) {
			this.shift = false;
		}
		if (event.keyCode == 17) {
			this.ctrl = false;
		}

		this.updateOperation();
	},

	handleMouseup: function(event) {
		this.destroy();
		
		Event.stop(event);
	},

	handleExecute: function() {
		if (!this.executor) {
			return;
		}

		this.executor.stop();
		this.executor = null;

		if (this.location) {
			var completion = function() {
				// clear old location to force update
				this.setLocation(null);
				
				this.updateLocation();
			};
			this.location.notify("drag", this.operation, this.drag, completion.bindAsEventListener(this));
		}		
	},

	updateLocation: function() {
		var target = this.findTarget(this.pointer[0], this.pointer[1]);
		if (target) {
			this.setLocation(target.findLocation(this, this.pointer[0], this.pointer[1]));
		} else {
			this.setLocation(null);
		}
	},

	getType: function() {
		if (!this.location) {
			return null;
		}
		
		var targetTypes = this.location.target.transferTypes;
		var sourceTypes = this.drag.source.transferTypes;
		for (var index = 0; index < sourceTypes.length; index++) {
			var type = sourceTypes[index];
			
			if (targetTypes.indexOf(type) != -1) {
				return type;
			}
		}		

		return null;
	},

	updateOperation: function() {
		var operation = 'NONE';
		
		if (this.getType() != null) {
			if (this.shift) {
				if (this.allowsOperation('LINK')) {
					operation = 'LINK';
				}
			} else if (this.ctrl) {
				if (this.allowsOperation('COPY')) {
					operation = 'COPY';
				}
			} else {
				if (this.allowsOperation('MOVE')) {
					operation = 'MOVE';
				} else if (this.allowsOperation('COPY')) {
					operation = 'COPY';
				} else if (this.allowsOperation('LINK')) {
					operation = 'LINK';
				}
			}		
		}		
		
		if (this.operation != operation) {
			this.operation = operation;

			if (this.hover) {
				this.hover.onOperationChanged(operation);
			}			
		}	
	},
		
	allowsOperation: function(operation) {
		return this.drag.source.operations.indexOf(operation) != -1 &&
				this.location.target.operations.indexOf(operation) != -1;
	},

	findTarget: function(x, y) {
		for (var index = 0; index < this.targets.length; index++) {
			var target = this.targets[index];

			var bounds = wicketdnd.getBounds($(target.id));
			if (x >= bounds.left && x < bounds.left + bounds.width && y >= bounds.top && y < bounds.top + bounds.height) {
				return target;
			}
		}
		
		return null;
	},

	collectTargets: function(targets, element) {
		if (element.dropTarget) {
			targets.push(element.dropTarget);
		}

		var children = element.childElements();
		for (var index = 0; index < children.length; index++) {
			var child = children[index];

			this.collectTargets(targets, child);
		};
		
		return targets;
	},

	setLocation: function(location) {
		if (this.location && location) {
			if (this.location.id == location.id && this.location.anchor == location.anchor) {
				return;
			}
		}
		
		if (this.location) {
			this.location.clear();
		}
		
		this.location = location;
		
		if (this.location) {
			this.location.draw();
		}

		this.updateOperation();
	},
	
	/**
	 * Create an element usable for the duration of this transfer.
	 */
	newElement: function(className) {
		var element = this.elements[className];
		if (!element) {
			element = new Element("div");
			element.addClassName(className);
			element.hide();
			$(document.body).insert(element);
			
			this.elements[className] = element;
		}
		
		return element;
	}
});

/**
 * A visual feedback of a transfers location, type and operation.
 */
wicketdnd.Hover = Class.create({

	initialize: function(transfer, drag, offset) {
		this.offset = offset;
		
		this.element = transfer.newElement("dnd-hover-NONE");
		
		this.element.insert(drag.clone());
		
		var cover = new Element("div");
		cover.className = "dnd-hover-cover";
		var style = cover.style;
		style.top = "0px";
		style.left = "0px";
		var bounds = wicketdnd.getBounds(this.element);	
		style.width = bounds.width + "px";
		style.height = bounds.height + "px";
		this.element.insert(cover);
	},

	/**
	 * Notification that the operation has changed.
	 */
	onOperationChanged: function(operation) {
		this.element.className = "dnd-hover-" + operation;
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

wicketdnd.LocationNone = Class.create({

	initialize: function(transfer, target) {
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

wicketdnd.LocationCenter = Class.create({

	initialize: function(transfer, target, element) {
		this.target = target;
		this.id = element.identify();
		this.anchor = "CENTER";
	},

	draw: function() {
		$(this.id).addClassName("dnd-drop-center");
	},
	
	clear: function() {
		var element = $(this.id);
		if (element) {
			// element might no longer exist
			$(this.id).removeClassName("dnd-drop-center");
		}
	},

	notify: function(type, operation, drag, successHandler) {
		this.target.notify(type, operation, drag, this, successHandler);
	}
});

wicketdnd.LocationTop = Class.create({

	initialize: function(transfer, target, element) {
		this.target = target;
		this.id = element.id;
		this.anchor = "TOP";
		
		this.element = transfer.newElement("dnd-drop-top");
	},

	draw: function() {
		var bounds = wicketdnd.getBounds($(this.id));
		
		var style = this.element.style;
		style.left  = bounds.left + "px";
		style.top   = bounds.top - (wicketdnd.getBounds(this.element).height/2) + "px";
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

wicketdnd.LocationBottom = Class.create({

	initialize: function(transfer, target, element) {
		this.target = target;
		this.id = element.identify();
		this.anchor = "BOTTOM";
		
		this.element = transfer.newElement("dnd-drop-bottom");
	},

	draw: function() {
		var bounds = wicketdnd.getBounds($(this.id));
		
		var style = this.element.style;
		style.left  = bounds.left + "px";
		style.top   = bounds.top + bounds.height - (wicketdnd.getBounds(this.element).height/2) + "px";
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

wicketdnd.LocationLeft = Class.create({

	initialize: function(transfer, target, element) {
		this.target = target;
		this.id = element.id;
		this.anchor = "LEFT";
		
		this.element = transfer.newElement("dnd-drop-left");
	},

	draw: function() {
		var bounds = wicketdnd.getBounds($(this.id));
		
		var style = this.element.style;
		style.left  = bounds.left - (wicketdnd.getBounds(this.element).width/2) + "px";
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

wicketdnd.LocationRight = Class.create({

	initialize: function(transfer, target, element) {
		this.target = target;
		this.id = element.identify();
		this.anchor = "RIGHT";
		
		this.element = transfer.newElement("dnd-drop-right");
	},

	draw: function() {
		var bounds = wicketdnd.getBounds($(this.id));
		
		var style = this.element.style;
		style.left  = bounds.left + bounds.width - (wicketdnd.getBounds(this.element).width/2) + "px";
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

wicketdnd.Drag = Class.create({

	initialize: function(source, element, pointer) {
		this.source = source;
		this.id = element.identify();
		
		var bounds = wicketdnd.getBounds(element);
		new wicketdnd.Transfer(pointer, this,
					[pointer[0] - bounds.left,
		             pointer[1] - bounds.top]);
		
		element.addClassName("dnd-drag");
		
		if (Prototype.Browser.IE) {
			// recreate element to force cursor change
			element.replace(element.cloneNode(true));
		}		
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
	
		var bounds = wicketdnd.getBounds(element);
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

wicketdnd.DragSource = Class.create({

	initialize: function(id, path, operations, transferTypes, selector, initiateSelector) {
		this.element = $(id);
		
		this.path = path;
		
		this.operations = operations;
		this.transferTypes = transferTypes;
				
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
				
				if (candidate && candidate.id) {
					new wicketdnd.Gesture(this, candidate, [event.pointerX(), event.pointerY()]);
					
					event.stop();
				}
			}
		}
	}
});

wicketdnd.Gesture = Class.create({

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
		new wicketdnd.Drag(this.source, this.element, this.pointer);
	},
	
	handleMousemove: function(event) {
		var deltaX = event.pointerX() - this.pointer[0];
		var deltaY = event.pointerY() - this.pointer[1];
		
		if (Math.abs(deltaX) > wicketdnd.THRESHOLD || Math.abs(deltaY) > wicketdnd.THRESHOLD) {
			this.confirmDrag();
			
			this.destroy();
	
			event.stop();
		}
	},
	
	handleMouseup: function(event) {
		this.destroy();
	}
});

wicketdnd.DropTarget = Class.create({

	initialize: function(id, url, operations, transferTypes, centerSelector, topSelector, rightSelector, bottomSelector, leftSelector) {
		this.id = id;

		$(this.id).dropTarget = this;
		
		this.url = url;
		
		this.operations = operations;
		this.transferTypes = transferTypes;
				
		this.centerSelector = centerSelector;
		this.topSelector    = topSelector;
		this.rightSelector  = rightSelector;
		this.bottomSelector = bottomSelector;
		this.leftSelector   = leftSelector;
	},

	findLocation: function(transfer, x, y) {
		var location = this.findLocationFor(transfer, $(this.id), x, y);
		if (!location) {
			location = new wicketdnd.LocationNone(transfer, this);
		}
		return location;
	},
	
	findLocationFor: function(transfer, element, x, y) {
		var location = null;
		
		if (element.id) {
			if (element.match(this.centerSelector)) {
				var bounds = wicketdnd.getBounds(element);

				if (x >= bounds.left && x < bounds.left + bounds.width &&
					y >= bounds.top && y < bounds.top + bounds.height) {
					
					location = new wicketdnd.LocationCenter(transfer, this, element);
				}
			}
		}
		
		if (!location) {
			var children = element.childElements();
			for (var index = 0; index < children.length; index++) {
				var child = children[index];
	
				location = this.findLocationFor(transfer, child, x, y);
				if (location) {
					break;
				}
			};
		}

		if (element.id) {
			if (element.match(this.topSelector)) {
				if (!location) {
					var bounds = wicketdnd.getBounds(element);
	
					if (x >= bounds.left && x < bounds.left + bounds.width &&
						y >= bounds.top && y < bounds.top + bounds.height/2) {
						
						location = new wicketdnd.LocationTop(transfer, this, element);
					}
				} else if (location instanceof wicketdnd.LocationCenter) {
					var bounds = wicketdnd.getBounds(element);
	
					if (x >= bounds.left && x < bounds.left + bounds.width &&
						y >= bounds.top && y < bounds.top + wicketdnd.BORDER) {
						
						location = new wicketdnd.LocationTop(transfer, this, element);
					}
				}
			}
			
			if (element.match(this.bottomSelector)) {
				if (!location) {
					var bounds = wicketdnd.getBounds(element);
	
					if (x >= bounds.left && x < bounds.left + bounds.width &&
						y >= bounds.top + bounds.height/2 && y < bounds.top + bounds.height) {
						
						location = new wicketdnd.LocationBottom(transfer, this, element);
					}
				} else if (location instanceof wicketdnd.LocationCenter) {
					var bounds = wicketdnd.getBounds(element);
	
					if (x >= bounds.left && x < bounds.left + bounds.width &&
						y >= bounds.top + bounds.height - wicketdnd.BORDER && y < bounds.top + bounds.height) {
						
						location = new wicketdnd.LocationBottom(transfer, this, element);
					}
				}
			}
			
			if (element.match(this.leftSelector)) {
				if (!location) {
					var bounds = wicketdnd.getBounds(element);
	
					if (x >= bounds.left && x < bounds.left + bounds.width/2 &&
						y >= bounds.top && y < bounds.top + bounds.height) {
						
						location = new wicketdnd.LocationLeft(transfer, this, element);
					}
				} else if (location instanceof wicketdnd.LocationCenter) {
					var bounds = wicketdnd.getBounds(element);
	
					if (x >= bounds.left && x < bounds.left + wicketdnd.BORDER &&
						y >= bounds.top && y < bounds.top + bounds.height) {
						
						location = new wicketdnd.LocationLeft(transfer, this, element);
					}
				}
			}
			
			if (element.match(this.rightSelector)) {
				if (!location) {
					var bounds = wicketdnd.getBounds(element);
	
					if (x >= bounds.left + bounds.width/2  && x < bounds.left + bounds.width &&
						y >= bounds.top && y < bounds.top + bounds.height) {
						
						location = new wicketdnd.LocationRight(transfer, this, element);
					}
				} else if (location instanceof wicketdnd.LocationCenter) {
					var bounds = wicketdnd.getBounds(element);
	
					if (x >= bounds.left + bounds.width - wicketdnd.BORDER && x < bounds.left + bounds.width &&
						y >= bounds.top && y < bounds.top + bounds.height) {
						
						location = new wicketdnd.LocationRight(transfer, this, element);
					}
				}
			}
		}
		
		return location;
	},	
	
	notify: function(type, operation, drag, location, successHandler) {
		var url = this.url;
		url += "&type=" + type;
		url += "&operation=" + operation;
		url += "&source=" + drag.source.path;
		url += "&drag=" + drag.id;
		if (location) {
			url += "&component=" + location.id;
			url += "&anchor=" + location.anchor;
		}
		
		wicketAjaxGet(url, successHandler);
	}
});