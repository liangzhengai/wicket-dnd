var DND = {

	ACTION_MOVE: 1,
	
	ACTION_COPY: 2,
	
	OPACITY: 0.7,
	
	positions: {},
	
	dimensions: {},
	
	pointer: null,
	
	offset: null,
	
	drag: null,
	
	drop: null,
	
	action: null,
	
	startDrag: function(drag, pointer) {
		this.drag = drag;

		this.drop = null;
		
		this.action = this.ACTION_MOVE;

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

		this.hoover = new Element("div");
		this.hoover = this.drag.element.cloneNode(true);
		Element.insert(document.body, {"bottom" : this.hoover});
		this.hoover.removeClassName("dnd-drag");
		this.hoover.addClassName("dnd-action-move");
		this.hoover.setOpacity(this.OPACITY);

		this.eventMouseMove = this.updateDrag.bindAsEventListener(this);
		this.eventKeyPress  = this.updateEscape.bindAsEventListener(this);      
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

		if (event.ctrlKey) {
			if (this.action == this.ACTION_MOVE) {
				this.action = this.ACTION_COPY;
				this.hoover.removeClassName("dnd-action-move");
				this.hoover.addClassName("dnd-action-copy");
			}
		} else {
			if (this.action == this.ACTION_COPY) {
				this.action = this.ACTION_MOVE;
				this.hoover.removeClassName("dnd-action-copy");
				this.hoover.addClassName("dnd-action-move");
			}
		}

		Event.stop(event);
	},
	
	updateEscape: function(event) {
		if (event.keyCode == Event.KEY_ESC) {
			this.endDrag(event);
		}
	},

	endDrag: function(event) {
		if (this.drop != null) {
			this.drop.perform(this.drag, this.action);
			
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

	perform: function(drag, action) {
		this.target.perform(drag, this, "drop", action);
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

	perform: function(drag, action) {
		this.target.perform(drag, this, "drop-before", action);
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
	
	perform: function(drag, action) {
		this.target.perform(drag, this, "drop-after", action);
	}
});

var Drag = Class.create({

	initialize: function(source, element, pointer) {
		this.source = source;
		this.element = element;
		this.element.addClassName("dnd-drag");
		
		this.offset = [pointer[0] - DND.getPosition(this.element).left,
		               pointer[1] - DND.getPosition(this.element).top];
	},
	
	clear: function() {
		this.element.removeClassName("dnd-drag");
	}
});

var DragSource = Class.create({

	initialize: function(element, actions, dragSelector) {
		this.element = $(element);
		
		this.actions = actions;
				
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
				
				DND.startDrag(new Drag(this, src, pointer), pointer);
				
				event.stop();
			}
		}
	}
});

var DropTarget = Class.create({

	initialize: function(element, url, actions, dropSelector, dropBeforeSelector, dropAfterSelector) {
		this.element = $(element);

		this.element.dropTarget = this;
		
		this.url = url;
		
		this.actions = actions;
				
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
	
	perform: function(drag, drop, type, action) {
		wicketAjaxGet(this.url + "&dragSource=" + drag.source.element.id  + "&drag=" + drag.element.id + "&drop=" + drop.element.id + "&type=" + type + "&action=" + action);
	}
});
