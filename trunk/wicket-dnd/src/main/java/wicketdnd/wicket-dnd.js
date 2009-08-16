var DND = {

	MOVE: 1,
	
	COPY: 2,
	
	LINK: 4,
	
	OPACITY: 0.7,
	
	positions: {},
	
	dimensions: {},
	
	pointer: null,
	
	offset: null,
	
	drag: null,
	
	drop: null,
	
	operation: null,
	
	startDrag: function(drag, pointer) {
		this.drag = drag;

		this.drop = null;
		
		this.operation = this.MOVE;

		this.hoover = new Element("div");
		Element.insert(document.body, {"bottom" : this.hoover});
		var clone = this.drag.element.cloneNode(true);
		Element.insert(this.hoover, {"bottom" : clone});
		this.hoover.className = "dnd-hoover-move";
		this.hoover.setOpacity(this.OPACITY);

		this.before = new Element("div");
		Element.insert(document.body, {"bottom" : this.before});
		this.before.addClassName("dnd-drop-before");
		this.before.setOpacity(this.OPACITY);
		this.before.hide();

		this.after = new Element("div");
		Element.insert(document.body, {"bottom" : this.after});
		this.after.addClassName("dnd-drop-after");
		this.after.setOpacity(this.OPACITY);
		this.after.hide();

		this.eventMouseMove = this.updateDrag.bindAsEventListener(this);
		this.eventKeyPress  = this.updateKeys.bindAsEventListener(this);      
		this.eventMouseUp   = this.endDrag.bindAsEventListener(this);
		Event.observe(document, "mousemove", this.eventMouseMove);
		Event.observe(document, "keypress", this.eventKeyPress);
		Event.observe(document, "mouseup", this.eventMouseUp);
		
		this.pointer = pointer;
		this.drawHoover();
	},
	
	updateDrag: function(event) {
		var pointer = [event.pointerX(), event.pointerY()];

		if (this.pointer.inspect() != pointer.inspect()) {
			this.pointer = pointer;

			this.drawHoover();

			this.setDrop(this.findDrop(document.body, null, this.pointer[0], this.pointer[1]));
		}

		if (event.shiftKey) {
			this.setOperation(this.LINK);
		} else if (event.ctrlKey) {
			this.setOperation(this.COPY);
		} else {
			this.setOperation(this.MOVE);
		}

		Event.stop(event);
	},

	setOperation: function(operation) {
		if (this.operation != operation) {
			this.operation = operation;
			
			if (this.operation == this.MOVE) {
				this.hoover.className = "dnd-hoover-move";
			} else if (this.operation == this.COPY) {
				this.hoover.className = "dnd-hoover-copy";
			} else if (this.operation == this.LINK) {
				this.hoover.className = "dnd-hoover-link";
			}
		}
	},
		
	updateKeys: function(event) {
		if (event.keyCode == Event.KEY_ESC) {
			this.endDrag(event);
		}
	},

	endDrag: function(event) {
		if (this.drop != null) {
			this.drop.perform(this.drag, this.operation);
			
			this.setDrop(null);
		}

		this.drag.clear();
		this.drag = null;

		this.hoover.remove();
		this.hoover = null;
		
		this.before.remove();
		this.before = null;

		this.after.remove();
		this.after = null;

		this.positions = {};
		this.dimensions = {};

		Event.stopObserving(document, "mouseup", this.eventMouseUp);
		Event.stopObserving(document, "mousemove", this.eventMouseMove);
		Event.stopObserving(document, "keypress", this.eventKeypress);
		
		Event.stop(event);
	},

	drawHoover: function() {
		this.draw(this.hoover,
					this.pointer[0] - this.drag.offset[0],
					this.pointer[1] - this.drag.offset[1],
					this.getDimension(this.drag.element).width,
					this.getDimension(this.drag.element).height);
	},

	findDrop: function(parent, target, x, y) {
		var children = parent.childElements();
		for (var index = 0; index < children.length; index++) {
			var child = children[index];
			var position = this.getPosition(child);
			var dimension = this.getDimension(child);

			if (x >= position.left && x < position.left + dimension.width && y >= position.top && y < position.top + dimension.height) {
				if (target == null && child.dropTarget != undefined) {
					target = child.dropTarget;
				}
						
				var drop = this.findDrop(child, target, x, y);
				if (target != null) {
					if (drop == null) {
						if (target.match(child)) {
							return new Drop(target, child);
						}
						if (target.matchBefore(child) && y <= position.top + dimension.height/2) {
							return new DropBefore(target, child);
						}
						if (target.matchAfter(child) && y >= position.top + dimension.height/2) {
							return new DropAfter(target, child);
						}
					} else if (drop instanceof Drop) {
						if (target.matchBefore(child) && y < position.top + 6) {
							return new DropBefore(target, child);
						}
						if (target.matchAfter(child) && y > position.top + dimension.height - 6) {
							return new DropAfter(target, child);
						}
					}
				}
				
				return drop;
			}
		};
		return null;
	},
	
	setDrop: function(drop) {
		if (drop != this.drop) {
			if (this.drop != null) {
				this.drop.clear();
			}
			
			this.drop = drop;
			
			if (this.drop != null) {
				this.drop.draw();
			}
		}
	},
	
	getDimension: function(element) {
		var id = element.identify();
		
		var dimension = this.dimensions[id];
		if (dimension == undefined) {
			dimension = element.getDimensions();
			this.dimensions[id] = dimension;
		}
		return dimension;
	},
	
	getPosition: function(element) {
		var id = element.identify();

		var position = this.positions[id];
		if (position == null) {
			position = element.cumulativeOffset();
			this.positions[id] = position;
		}
		return position;
	},
	
	draw: function(element, left, top, width, height) {
		var style = element.style;
		style.left = left + "px";
		style.top = top + "px";
		if (width != undefined) {
			style.width = width + "px";
		}
		if (height != undefined) {
			style.height = height + "px";
		}
	},
};

var Drop = Class.create({

	initialize: function(target, element) {
		this.target = target;
		this.element = element;
	},

	clear: function() {
		this.element.removeClassName("dnd-drop");
	},

	draw: function() {
		this.element.addClassName("dnd-drop");
	},

	perform: function(drag, operation) {
		this.target.perform(drag, this, "drop", operation);
	}
});

var DropBefore = Class.create({

	initialize: function(target, element) {
		this.target = target;
		this.element = element;
	},

	clear: function() {
		DND.before.hide();
	},

	draw: function() {
		DND.before.show();

		var position = DND.getPosition(this.element);
		DND.draw(
					DND.before,
					position.left,
					position.top - (DND.getDimension(DND.before).height/2),
					DND.getDimension(this.element).width
				);
	},	

	perform: function(drag, operation) {
		this.target.perform(drag, this, "drop-before", operation);
	}
});

var DropAfter = Class.create({

	initialize: function(target, element) {
		this.target = target;
		this.element = element;
	},

	clear: function() {
		DND.after.hide();
	},

	draw: function() {
		DND.after.show();
		
		var position = DND.getPosition(this.element);
		DND.draw(
					DND.after,
					position.left,
					position.top + DND.getDimension(this.element).height - (DND.getDimension(DND.after).height/2),
					DND.getDimension(this.element).width
				);
	},
	
	perform: function(drag, operation) {
		this.target.perform(drag, this, "drop-after", operation);
	}
});

var Drag = Class.create({

	initialize: function(source, element, pointer) {
		this.source = source;
		this.element = element;
		
		this.offset = [pointer[0] - DND.getPosition(this.element).left,
		               pointer[1] - DND.getPosition(this.element).top];
		               
		DND.startDrag(this, pointer);
		
		this.element.addClassName("dnd-drag");
	},
	
	clear: function() {
		this.element.removeClassName("dnd-drag");
	}
});

var DragSource = Class.create({

	initialize: function(element, operations, dragSelector) {
		this.element = $(element);
		
		this.operations = operations;
				
		this.dragSelector = dragSelector;
		
		this.eventMouseDown = this.initDrag.bindAsEventListener(this);
		Event.observe(this.element, "mousedown", this.eventMouseDown);
	},
	
	initDrag: function(event) {

		if (Event.isLeftClick(event)) {    
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

			while (src != this.element && !src.match(this.dragSelector)) {
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

	initialize: function(element, url, operations, dropSelector, dropBeforeSelector, dropAfterSelector) {
		this.element = $(element);

		this.element.dropTarget = this;
		
		this.url = url;
		
		this.operations = operations;
				
		this.dropSelector       = dropSelector;
		this.dropBeforeSelector = dropBeforeSelector;
		this.dropAfterSelector  = dropAfterSelector;
	},
	
	match: function(element) {
		return element.match(this.dropSelector);
	},
	
	matchBefore: function(element) {
		return element.match(this.dropBeforeSelector);
	},
	
	matchAfter: function(element) {
		return element.match(this.dropBeforeSelector);
	},
	
	perform: function(drag, drop, type, operation) {
		wicketAjaxGet(this.url + "&dragSource=" + drag.source.element.id  + "&drag=" + drag.element.id + "&drop=" + drop.element.id + "&type=" + type + "&operation=" + operation);
	}
});
