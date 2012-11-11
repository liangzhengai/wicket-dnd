;(function (undefined) {
	
	"use strict";
	
	if (typeof(window.wicketdnd) === 'undefined') {
		window.wicketdnd = {
	
			MARGIN: 5,
		
			THRESHOLD: 4,
		
			OFFSET: 16,
		
			DELAY: 1000,
		
			dragSource: function(id, componentPath, operations, types, selectors) {
				var element = Wicket.$(id);

				$(element).on('mousedown', selectors.initiate, function(event) {
					if ($(event.target).is('input,select,option,button,textarea')) {
						return;
					}

					var closest = $(this).closest(selectors.select).get(0);
					if (closest.id) {
						event.preventDefault();
						event.stopPropagation();

						gesture(closest, wicketdnd.position(event));
					} else {
						Wicket.Log.error("wicket-dnd: element matched selector but does not have markup id");
					}
				});

				function gesture(element, startPosition) {
					$(document).on('mousemove.wicketdnd', function(event) {
						var distance = wicketdnd.distance(wicketdnd.position(event), startPosition);
						if (distance >= wicketdnd.THRESHOLD) {
							$(document).off('.wicketdnd');
	
							transfer(element);
						}
					});

					$(document).on('mouseup.wicketdnd', function(event) {
						$(document).off('.wicketdnd');
					});
				};

				function transfer(element) {
					var shift = false;
					var ctrl = false;

					var hover = wicketdnd.createHover(element);
					$('body').append(hover);

					var target = undefined;
					var location = wicketdnd.locationNone;
					var type = undefined;
					var operation = wicketdnd.operation('NONE');
					operation.mark();

					var notifier = undefined;
					
					$(element).addClass("dnd-drag");

					$(document).on('mousemove.wicketdnd', function(event) {
						hover.css({'left' : (event.pageX + wicketdnd.OFFSET) + 'px', 'top' : (event.pageY + wicketdnd.OFFSET) + 'px'});
						
						target = wicketdnd.findTarget(event);

						updateLocation(target, event);

						type = wicketdnd.findType(types, location.types);

						updateOperation();
					});

					$(document).on('mouseup.wicketdnd', function(event) {
						hover.remove();

						$(element).removeClass("dnd-drag");

						$(document).off('.wicketdnd');

						operation.unmark();

						notifier = undefined;

						location.unmark();

						if (location !== wicketdnd.locationNone) {
							target.notify('drop', operation, componentPath, element, location, undefined);
							target = undefined;
						}
					});

					$(document).on('keypress.wicketdnd', function(event) {
					});

					var keyUpOrDown = function(event) {
						if (event.which == 16) {
							shift = event.data;
						}
						if (event.which == 17) {
							ctrl = event.data;
						}
						updateOperation();
					};

					var updateOperation = function() {
						var newOperation = wicketdnd.findOperation(shift, ctrl, type, operations, location.operations);
						if (newOperation.name != operation.name) {
							operation.unmark();
							operation = newOperation;
							operation.mark();
						}
					};

					var updateLocation = function(target, event) {
						var newLocation;
						if (target === undefined) {
							newLocation = wicketdnd.locationNone;
						} else {
							newLocation = target.findLocation(event);

							if (newLocation != wicketdnd.locationNone && !newLocation.id) {
								Wicket.Log.error("wicket-dnd: element matched selector but does not have markup id");
								newLocation = wicketdnd.locationNone;
							}
						}
						if (newLocation != location) {
							location.unmark();
							location = newLocation;
							location.mark();

							if (newLocation != wicketdnd.locationNone) {
								var newNotifier = function() {
									if (notifier === newNotifier && location !== wicketdnd.locationNone) {
										target.notify('drag', operation, componentPath, element, location, success);
									}
								};
								var success = function() {
									location.mark();
								};
								notifier = newNotifier;
								setTimeout(notifier, wicketdnd.DELAY);
							}
						}
					};

					$(document).on('keydown.wicketdnd', true, keyUpOrDown);
					$(document).on('keyup.wicketdnd', false, keyUpOrDown);
				};
			},
		
			dropTarget: function(id, callbackUrl, operations, types, selectors) {
				var element = Wicket.$(id);

				$(element).data('wicketdnd', {
					'callbackUrl' : callbackUrl,
					'operations' : operations,
					'types' : types,
					'selectors' : selectors,
					'findLocation' : function(event) {
						var candidate = event.target;

						do {
							if ($(candidate).is(selectors.center)) {
								return locationCenter(candidate.id);
							}

							if (candidate == element) {
								break;
							}

							candidate = candidate.parentNode;
						} while (candidate);

						return wicketdnd.locationNone;
					},
					'notify' : function(phase, operation, componentPath, element, location, success) {
						var attrs = {
							'u': callbackUrl,
							'ep': {},
							'sh': [success]
						};
						attrs.ep['phase'] = phase;
						attrs.ep['operation'] = operation.name;
						attrs.ep['source'] = componentPath;
						attrs.ep['drag'] = element.id;
						attrs.ep['component'] = location.id;
						attrs.ep['anchor'] = location.anchor;
						Wicket.Ajax.ajax(attrs);
					}
				});
			
				function locationCenter(id) {
					return {
						'id' : id,
						'operations' : operations,
						'types' : types,
						'anchor' : 'CENTER',
						'mark' : function() {
							$('#' + id).addClass('dnd-drop-center');
						},
						'unmark' : function() {
							$('#' + id).removeClass('dnd-drop-center');
						}
					};
				};
			},

			createHover: function(element) {
				var clone = $(element).clone();
				clone.addClass('dnd-clone');

				if (clone.is('td')) {
					var tr = $('<tr>');
					tr.addClass('dnd-hover-tr');
					tr.append(clone);
					clone = tr;
				}
				if (clone.is('tr')) {
					var tbody = $('<tbody>');
					tbody.addClass('dnd-hover-tbody');
					tbody.append(clone);
					clone = tbody;
				}
				if (clone.is('tbody')) {
					var table = $('<table>');
					table.addClass('dnd-hover-table');
					table.append(clone);
					clone = table;
				}

				clone.css({ 'width' : $(element).width() + 'px', 'height' : $(element).height() + 'px' });

				var hover = $('<div>');
				hover.addClass('dnd-hover');
				hover.append(clone);		

				var cover = $('<div>');
				cover.addClass('dnd-hover-cover');
				hover.append(cover);
		
				return hover;
			},

			findTarget: function(event) {
				var candidate = event.target;
				while (candidate) {
					var data = $(candidate).data('wicketdnd');
					if (data) {
						return data;
					}

					candidate = candidate.parentNode;
				}

				return undefined;
			},

			position: function(event) {
				return {'left': event.pageX, 'top': event.pageY}
			},

			offset: function(position1, position2) {
				return {'left': (position1.left - position2.left), 'top': (position1.top - position2.top)};
			},

			distance: function(position1, position2) {
				var deltaLeft = position1.left - position2.left;
				var deltaTop = position1.top - position2.top;
		
				return Math.abs(deltaLeft) + Math.abs(deltaTop);
			},

			locationNone: {
				'operations' : [],
				'types' : [],
				'mark' : function() {
				},
				'unmark' : function() {
				}
			},

			operation: function(name) {
				return {
					'name' : name,
					'mark' : function() {
						$('body').addClass('dnd-' + name);
					},
					'unmark' : function() {
						$('body').removeClass('dnd-' + name);
					}
				};
			},

			findType: function(sourceTypes, targetTypes) {
				for (var index = 0; index < sourceTypes.length; index++) {
					var type = sourceTypes[index];
			
					if (targetTypes.indexOf(type) != -1) {
						return type;
					}
				}
				return undefined;
			},

			findOperation: function(shift, ctrl, type, sourceOperations, targetOperations) {

				if (type != undefined) {
					var allowed = function(operation) {
						return sourceOperations.indexOf(operation) != -1 && 
							targetOperations.indexOf(operation) != -1;
					};

					if (shift) {
						if (allowed('LINK')) {
							return wicketdnd.operation('LINK');
						}
					} else if (ctrl) {
						if (allowed('COPY')) {
							return wicketdnd.operation('COPY');
						}
					} else {
						if (allowed('MOVE')) {
							return wicketdnd.operation('MOVE');
						} else if (allowed('COPY')) {
							return wicketdnd.operation('COPY');
						} else if (allowed('LINK')) {
							return wicketdnd.operation('LINK');
						}
					}
				}
				return wicketdnd.operation('NONE');
			}
		};
	}		
})();
