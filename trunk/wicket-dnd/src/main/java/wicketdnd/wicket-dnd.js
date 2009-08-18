var DND = {

	NONE: 0,

	MOVE: 1,
	
	COPY: 2,
	
	LINK: 4,
	
	OPACITY: 0.7,
	
	DELAY: 2,
	
	positions: {},
	
	dimensions: {},
	
	executor: null,
	
	elements: {},
	
	startDrag: function(pointer, drag, offset) {
		this.drag = drag;

		this.drop = null;
		
		this.hoover = new Hoover(drag, offset);

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
		this.hoover.draw(pointer);
	},
	
	updateDrag: function(event) {
		var pointer = [event.pointerX(), event.pointerY()];

		if (this.pointer.inspect() != pointer.inspect()) {
			this.pointer = pointer;

			this.hoover.draw(pointer);

			this.setDrop(this.findDrop(document.body, null, this.pointer[0], this.pointer[1]));

			this.shift = event.shiftKey;
			this.ctrl = event.ctrlKey;
			
			this.hoover.setOperation(this.findOperation());
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

		this.hoover.setOperation(this.findOperation());
	},

	handleKeyup: function(event) {
		if (event.keyCode == 16) {
			this.shift = false;
		}
		if (event.keyCode == 17) {
			this.ctrl = false;
		}

		this.hoover.setOperation(this.findOperation());
	},

	endDrag: function(event) {
		if (this.drop != null && this.hoover.operation != this.NONE) {
			this.drop.onDrop(this.drag, this.hoover.operation);
			
			this.setDrop(null);
		}

		this.drag.clear();
		this.drag = null;

		this.hoover.clear();
		this.hoover = null;
		
		for (var className in this.elements) {
			this.elements[className].remove();
		}
		this.elements = {};

		this.clearCache();
		
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
				if (child.id != this.drag.id && target != null) {
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
			this.drop.target.onDragOver(this.drop,
							this.clearCache.bindAsEventListener(this));
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
	
	clearCache: function() {	
		this.dimensions = {};
		this.positions = {};
	},

	newElement: function(className) {
		var element = this.elements[className];
		if (element == null) {
			element = new Element("div");
			element.addClassName(className);
			element.setOpacity(this.OPACITY);
			element.hide();
			Element.insert(document.body, {"bottom" : element});
			
			this.elements[className] = element;
		}
		
		return element;
	}
};

var Hoover = Class.create({

	initialize: function(drag, offset) {
		this.offset = offset;
	
		this.element = new Element("div");
		this.element.className = "dnd-hoover";
		this.element.setOpacity(DND.OPACITY);
		Element.insert(document.body, {"bottom" : this.element});
		
		this.clone = $(drag.id).cloneNode(true);
		Element.insert(this.element, {"bottom" : this.clone});
		
		this.cover = new Element("div");
		this.cover.className = "dnd-hoover-move";
		Element.insert(this.element, {"bottom" : this.cover});
		
		var style = this.element.style;
		style.width = DND.getDimension(this.clone).width + "px";
		style.height = DND.getDimension(this.clone).height + "px";
		
		this.element.focus();
	},

	setOperation: function(operation) {
		if (this.operation != operation) {
			this.operation = operation;
			
			if (operation == DND.MOVE) {
				this.cover.className = "dnd-hoover-move";
			} else if (operation == DND.COPY) {
				this.cover.className = "dnd-hoover-copy";
			} else if (operation == DND.LINK) {
				this.cover.className = "dnd-hoover-link";
			} else {
				this.cover.className = "dnd-hoover-none";
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

	initialize: function(target, element) {
		this.target = target;
		this.id = element.identify();
	},

	clear: function() {
		$(this.id).removeClassName("dnd-drop");
	},

	draw: function() {
		$(this.id).addClassName("dnd-drop");
	},

	onDrop: function(drag, operation) {
		this.target.onDrop(drag, this, "drop", operation);
	}
});

var DropBefore = Class.create({

	initialize: function(target, element) {
		this.target = target;
		this.id = element.identify();
		
		this.element = DND.newElement("dnd-drop-before");
		
		this.height = DND.getDimension(this.element).height;
	},

	clear: function() {
		this.element.hide();
	},

	draw: function() {
		this.element.show();

		var position = DND.getPosition($(this.id));
		var dimension = DND.getDimension($(this.id));
		
		var style = this.element.style;
		style.left = position.left + "px";
		style.top = position.top - (this.height/2) + "px";
		style.width = dimension.width + "px";
	},	

	onDrop: function(drag, operation) {
		this.target.onDrop(drag, this, "drop-before", operation);
	}
});

var DropAfter = Class.create({

	initialize: function(target, element) {
		this.target = target;
		this.id = element.identify();
		
		this.element = DND.newElement("dnd-drop-after");
		
		this.height = DND.getDimension(this.element).height;
	},

	clear: function() {
		this.element.hide();
	},

	draw: function() {
		this.element.show();
		
		var position = DND.getPosition($(this.id));
		var dimension = DND.getDimension($(this.id));
		
		var style = this.element.style;
		style.left = position.left + "px";
		style.top = position.top + dimension.height - (this.height/2) + "px";
		style.width = dimension.width + "px";
	},
	
	onDrop: function(drag, operation) {
		this.target.onDrop(drag, this, "drop-after", operation);
	}
});

var Drag = Class.create({

	initialize: function(source, element, pointer) {
		this.source = source;
		this.id = element.identify();
		
		DND.startDrag(pointer, this,
					[pointer[0] - DND.getPosition(element).left,
		             pointer[1] - DND.getPosition(element).top]);
		
		element.addClassName("dnd-drag");
	},

	clear: function() {
		$(this.id).removeClassName("dnd-drag");
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
	
	onDragOver: function(drop, successHandler) {
		wicketAjaxGet(this.url + "&drop=" + drop.id, successHandler);
	},

	onDrop: function(drag, drop, type, operation) {
		wicketAjaxGet(this.url + "&drop=" + drop.id + "&type=" + type + "&operation=" + operation+ "&dragSource=" + drag.source.element.id  + "&drag=" + drag.id);
	}
});
