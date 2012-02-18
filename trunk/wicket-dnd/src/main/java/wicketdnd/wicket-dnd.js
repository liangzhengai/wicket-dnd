var wicketdnd = {

	MARGIN: 5,
	
	THRESHOLD: 4,
	
	OFFSET: 16,
	
	DELAY: 1
};

wicketdnd.Bounds = Class.create({
	initialize: function(element) {
		this.element = element;
	},

	getOffset: function() {
		if (!this.offset) {
			this.offset = this.element.cumulativeOffset();
			
			var scrollOffset = this.element.cumulativeScrollOffset();
			this.offset.top -= scrollOffset.top;
			this.offset.left -= scrollOffset.left;
			
			scrollOffset = $(document.body).cumulativeScrollOffset();
			this.offset.top += scrollOffset.top;
			this.offset.left += scrollOffset.left;
		}
		return this.offset;
	},

	getDimensions: function() {
		if (!this.dimensions) {
			this.dimensions = this.element.getDimensions();
		}
		return this.dimensions;
	},
		
	top: function() {
		return this.getOffset().top;
	},
	
	bottom: function() {
		return this.top() + this.height();
	},

	left: function() {
		return this.getOffset().left;
	},

	right: function() {
		return this.left() + this.width();
	},

	width: function() {
		return this.getDimensions().width;
	},
	
	height: function() {
		return this.getDimensions().height;
	},
	
	contains: function(position) {
		return position.left >= this.left() && position.left < this.right() && 
				position.top >= this.top() && position.top < this.bottom();
	}
});

wicketdnd.Position = Class.create({
	initialize: function(event) {
		this.left = event.pointerX();
		this.top  = event.pointerY();
	},
	
	equals: function(position) {
		return this.left == position.left && this.top == position.top;
	},
	
	distance: function(position) {
		var deltaLeft = this.left - position.left;
		var deltaTop = this.top - position.top;
		
		return Math.abs(deltaLeft) + Math.abs(deltaTop);
	}
});

wicketdnd.Transfer = Class.create({

	initialize: function(position, drag) {
		this.drag = drag;
		
		this.setOperation('NONE');

		this.elements = {};
		
		this.hover = new wicketdnd.Hover(this, drag);
		
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
		
		this.position = position;
		this.hover.draw(position);

		this.drag.draw();
		
		// request focus to be able to investigate key down/up/press
		window.focus();
	},
	
	destroy: function() {
		this.executor = null;

		if (this.location) {
			this.location.clear();
		}

		this.drag.clear();

		this.hover.clear();
		
		for (var className in this.elements) {
			this.elements[className].remove();
		}

		this.setOperation(null);		
		
		Event.stopObserving(document, "mousemove", this.eventMousemove);
		Event.stopObserving(document, "mouseup"  , this.eventMouseup);
		Event.stopObserving(document, "keypress" , this.eventKeypress);
		Event.stopObserving(document, "keydown"  , this.eventKeydown);
		Event.stopObserving(document, "keyup"    , this.eventKeyup);
	},
	
	handleMousemove: function(event) {
		var position = new wicketdnd.Position(event);

		if (!this.position.equals(position)) {
			this.position = position;

			this.executor = null;		
			this.shift = event.shiftKey;
			this.ctrl = event.ctrlKey;			
	
			this.hover.draw(position);

			this.updateLocation(event.element(), position);
			
			if (this.location && this.location.anchor) {
				this.executor = new PeriodicalExecuter(this.eventExecute, wicketdnd.DELAY);
			}
		}

		Event.stop(event);
	},

	handleKeypress: function(event) {
		if (event.keyCode == Event.KEY_ESC) {
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
		if (this.operation != 'NONE') {
			this.location.notify("drop", this.operation, this.drag);
		}
		
		this.destroy();
		
		Event.stop(event);
	},

	handleExecute: function(executor) {
		executor.stop();

		if (this.executor != executor) {
			return;
		}

		if (this.location) {
			var completion = function() {
				if (this.drag) {
					this.drag.draw();
				}
				if (this.location) {
					this.location.draw();
				}
			}.bind(this);
			this.location.notify("drag", this.operation, this.drag, completion);
		}		
	},

	updateLocation: function(element, position) {
		for (var className in this.elements) {
			if (element == this.elements[className]) {
				// do not step on our own feet
				return;
			}
		}
		
		var target = this.findTarget(element);
		if (target) {
			this.setLocation(target.findLocation(this, element, position));
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
		
		this.setOperation(operation);
	},
	
	setOperation: function(operation) {
		if (this.operation != operation) {
			if (this.operation) {
				$(document.body).removeClassName("dnd-" + this.operation);
			}
		
			this.operation = operation;

			if (this.operation) {
				$(document.body).addClassName("dnd-" + this.operation);
			}
		}	
	},
		
	allowsOperation: function(operation) {
		return this.drag.source.operations.indexOf(operation) != -1 &&
				this.location.target.operations.indexOf(operation) != -1;
	},

	findTarget: function(element) {
		if (element.dropTarget) {
			return element.dropTarget;
		}
		
		if (element.up && element.up()) {
			return this.findTarget(element.up());
		}
		
		return null;
	},

	setLocation: function(location) {
		if (this.location && location) {
			if (this.location.target == location.target && this.location.id == location.id && this.location.anchor == location.anchor) {
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

wicketdnd.Hover = Class.create({

	initialize: function(transfer, drag) {
		this.element = transfer.newElement("dnd-hover");
		
		this.element.insert(drag.clone());
		
		this.element.insert(transfer.newElement("dnd-hover-cover"));
	},

	clear: function() {
		this.element.hide();
	},
	
	draw: function(position) {
		this.element.show();
		
		var style = this.element.style;
		style.left = position.left + wicketdnd.OFFSET + "px";
		style.top  = position.top + wicketdnd.OFFSET + "px";
	}
});

wicketdnd.LocationCenter = Class.create({

	initialize: function(transfer, target, element) {
		this.target = target;
		this.id = element.id;
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
		var bounds = new wicketdnd.Bounds($(this.id));
		
		var style = this.element.style;
		style.left  = bounds.left() + "px";
		style.top   = bounds.top() - (new wicketdnd.Bounds(this.element).height()/2) + "px";
		style.width = bounds.width() + "px";

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
		this.id = element.id;
		this.anchor = "BOTTOM";
		
		this.element = transfer.newElement("dnd-drop-bottom");
	},

	draw: function() {
		var bounds = new wicketdnd.Bounds($(this.id));
		
		var style = this.element.style;
		style.left  = bounds.left() + "px";
		style.top   = bounds.bottom() - (new wicketdnd.Bounds(this.element).height()/2) + "px";
		style.width = bounds.width() + "px";

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
		var bounds = new wicketdnd.Bounds($(this.id));
		
		var style = this.element.style;
		style.left  = bounds.left() - (new wicketdnd.Bounds(this.element).width()/2) + "px";
		style.top   = bounds.top() + "px";
		style.height = bounds.height() + "px";

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
		this.id = element.id;
		this.anchor = "RIGHT";
		
		this.element = transfer.newElement("dnd-drop-right");
	},

	draw: function() {
		var bounds = new wicketdnd.Bounds($(this.id));
		
		var style = this.element.style;
		style.left  = bounds.right() - (new wicketdnd.Bounds(this.element).width()/2) + "px";
		style.top   = bounds.top() + "px";
		style.height = bounds.height() + "px";

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

	initialize: function(source, element, position) {
		this.source = source;
		this.id = element.id;
		
		new wicketdnd.Transfer(position, this);
		
		if (Prototype.Browser.IE) {
			// recreate element to force cursor change
			element.replace(element.cloneNode(true));
		}		
	},

	clone: function() {
		var element = $(this.id);

		var clone = this.source.clone(element);
		clone.addClassName("dnd-clone");

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
	
		var bounds = new wicketdnd.Bounds(element);
		var style = clone.style;
		style.width = bounds.width() + "px";
		style.height = bounds.height() + "px";
		
		return clone;
	},
	
	clear: function() {
		// element might no longer exist
		var element = $(this.id);
		if (element) {
			element.removeClassName("dnd-drag");
		}
	},
	
	draw: function() {
		// element might no longer exist
		var element = $(this.id);
		if (element) {
			element.addClassName("dnd-drag");
		}
	}
});

wicketdnd.DragSource = Class.create({

	initialize: function(id, path, operations, transferTypes, selector, initiateSelector, cloneSelector) {
		this.element = $(id);
		
		this.path = path;
		
		this.operations = operations;
		this.transferTypes = transferTypes;
				
		this.selector = selector;
		this.initiateSelector = initiateSelector;
		this.cloneSelector = cloneSelector;
		
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
				
				if (candidate) {
					if (candidate.id) {
						new wicketdnd.Gesture(this, candidate, new wicketdnd.Position(event));
						
						event.stop();
					} else {
						Wicket.Log.error("wicket-dnd: element matched source selector but does not have markup id");
					}
				}
			}
		}
	},
	
	clone: function(element) {
		if (!element.match(this.cloneSelector)) {
			element = element.down(this.cloneSelector);
		}
		return element.cloneNode(true)
	}
});

wicketdnd.Gesture = Class.create({

	initialize: function(source, element, position) {
		this.source = source;
		this.element = element;
		this.position = position;
		
		this.eventMousemove  = this.handleMousemove.bindAsEventListener(this);
		this.eventMouseup    = this.handleMouseup.bindAsEventListener(this);
		
		Event.observe(document, "mousemove", this.eventMousemove);
		Event.observe(document, "mouseup", this.eventMouseup);
	},
	
	destroy: function() {
		Event.stopObserving(document, "mousemove", this.eventMousemove);
		Event.stopObserving(document, "mouseup"  , this.eventMouseup);
	},

	confirmDrag: function(position) {
		new wicketdnd.Drag(this.source, this.element, position);
	},
	
	handleMousemove: function(event) {
		var position = new wicketdnd.Position(event);
		
		if (position.distance(this.position) >= wicketdnd.THRESHOLD) {
			this.destroy();
	
			this.confirmDrag(position);
			
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

	findLocation: function(transfer, element, position) {
		var location = this.findLocationUp(transfer, element, position, null);

		if (!location.id) {
			Wicket.Log.error("wicket-dnd: element matched target selector but does not have markup id");
			location = null;
		}
		
		return location;
	},
	
	findLocationUp: function(transfer, element, position, location) {
		var location = this.getLocation(transfer, element, position, location);
		
		var parent = element.up();
		if (element.id == this.id || parent == null) {
			return location;
		} else {
			return this.findLocationUp(transfer, parent, position, location);
		}
	},	

	getLocation: function(transfer, element, position, location) {
		var bounds = new wicketdnd.Bounds(element);
		
		// center location never replaces other location
		if (!location && element.match(this.centerSelector) &&
				bounds.contains(position)) {
			location = new wicketdnd.LocationCenter(transfer, this, element);
		}

		if (!location) {
			// no location yet thus using full bounds
			
			if (element.match(this.topSelector) &&
					position.left >= bounds.left() && position.left < bounds.right() &&
					position.top >= bounds.top() && position.top < bounds.top() + bounds.height()/2) {
					
				location = new wicketdnd.LocationTop(transfer, this, element);
			} else if (element.match(this.bottomSelector) &&
					position.left >= bounds.left() && position.left < bounds.right() &&
					position.top >= bounds.top() + bounds.height()/2 && position.top < bounds.bottom()) {
					
				location = new wicketdnd.LocationBottom(transfer, this, element);
			} else if (element.match(this.leftSelector) &&
					position.left >= bounds.left() && position.left < bounds.left() + bounds.width()/2 &&
					position.top >= bounds.top() && position.top < bounds.bottom()) {
						
				location = new wicketdnd.LocationLeft(transfer, this, element);
			} else if (element.match(this.rightSelector) &&
					position.left >= bounds.left() + bounds.width()/2  && position.left < bounds.right() &&
					position.top >= bounds.top() && position.top < bounds.bottom()) {
					
				location = new wicketdnd.LocationRight(transfer, this, element);
			}
		} else if (location instanceof wicketdnd.LocationCenter) {
			// center location already thus using bound margins only
			
			if (element.match(this.topSelector) &&
					position.left >= bounds.left() && position.left < bounds.right() &&
					position.top >= bounds.top() && position.top < bounds.top() + wicketdnd.MARGIN) {
					
				location = new wicketdnd.LocationTop(transfer, this, element);
			} else if (element.match(this.bottomSelector) &&
					position.left >= bounds.left() && position.left < bounds.right() &&
					position.top >= bounds.bottom() - wicketdnd.MARGIN && position.top < bounds.bottom()) {
					
				location = new wicketdnd.LocationBottom(transfer, this, element);
			} else if (element.match(this.leftSelector) &&
					position.left >= bounds.left() && position.left < bounds.left() + wicketdnd.MARGIN &&
					position.top >= bounds.top() && position.top < bounds.bottom()) {
					
				location = new wicketdnd.LocationLeft(transfer, this, element);
			} else if (element.match(this.rightSelector) &&
					position.left >= bounds.right() - wicketdnd.MARGIN && position.left < bounds.right() &&
					position.top >= bounds.top() && position.top < bounds.bottom()) {
					
				location = new wicketdnd.LocationRight(transfer, this, element);
			}			
		} else {
			// keep location
		}
				
		return location;
	},

	notify: function(type, operation, drag, location, successHandler) {
		var url = this.url;
		if (url.indexOf('?') == -1) {
			url += "?type=" + type;
		} else {
			url += "&type=" + type;
		}
		url += "&operation=" + operation;
		url += "&source=" + drag.source.path;
		url += "&drag=" + drag.id;
		url += "&component=" + location.id;
		url += "&anchor=" + location.anchor;
		
		wicketAjaxGet(url, successHandler);
	}
});