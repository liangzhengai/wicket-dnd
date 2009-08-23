/*
 * Copyright 2009 Sven Meier
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package wicketdnd;

import org.apache.wicket.Component;
import org.apache.wicket.MarkupContainer;
import org.apache.wicket.ajax.AbstractDefaultAjaxBehavior;
import org.apache.wicket.ajax.AjaxRequestTarget;
import org.apache.wicket.behavior.IBehavior;
import org.apache.wicket.markup.html.IHeaderResponse;
import org.apache.wicket.protocol.http.PageExpiredException;
import org.wicketstuff.prototype.PrototypeResourceReference;

import wicketdnd.util.MarkupIdVisitor;

/**
 * @author Sven Meier
 */
public class DropTarget extends AbstractDefaultAjaxBehavior {
	private static final long serialVersionUID = 1L;

	private String selector;

	private String beforeSelector;

	private String afterSelector;

	private int operations;

	/**
	 * Convenience constructor for drop targets supporting
	 * {@link #onDropOver(Component, Component, int)} only.
	 * 
	 * @param operations
	 *            allowed operations
	 * @param selector
	 *            CSS selector for drops
	 * @see DND#MOVE
	 * @see DND#COPY
	 * @see DND#LINK
	 */
	public DropTarget(int operations, String selector) {
		this(operations, selector, null, null);
	}

	/**
	 * Create a drop target.
	 * 
	 * @param operations
	 *            allowed operations
	 * @param selector
	 *            CSS selector for drops
	 * @param afterSelector
	 *            CSS selector for drops after elements
	 * @param beforeSelector
	 *            CSS selector for drops before elements
	 * @see DND#MOVE
	 * @see DND#COPY
	 * @see DND#LINK
	 */
	public DropTarget(int operations, String selector, String beforeSelector,
			String afterSelector) {
		this.operations = operations;

		this.selector = selector;
		this.beforeSelector = beforeSelector;
		this.afterSelector = afterSelector;
	}

	@Override
	public void renderHead(IHeaderResponse response) {
		super.renderHead(response);

		response.renderJavascriptReference(PrototypeResourceReference.INSTANCE);

		renderDragHead(response);
	}

	private void renderDragHead(IHeaderResponse response) {
		response.renderJavascriptReference(DND.JS);

		final String id = getComponent().getMarkupId();
		String initJS = String.format(
				"new DropTarget('%s','%s',%d,'%s','%s','%s');", id,
				getCallbackUrl(), operations, selector, beforeSelector,
				afterSelector);
		response.renderOnDomReadyJavascript(initJS);
	}

	@Override
	protected final void respond(AjaxRequestTarget target) {
		String type = getComponent().getRequest().getParameter("type");

		int operation = Integer.parseInt(getComponent().getRequest()
				.getParameter("operation"));

		DragSource source = findDragSource();

		Object transferData = source.getTransferData(target);

		try {
			if ("drop".equals(type)) {
				onDrop(target, transferData, operation);
			} else {
				Component component = findDrop();

				if ("drag-over".equals(type)) {
					onDragOver(target, transferData, component);
					return;
				} else if ("drop-over".equals(type)) {
					onDropOver(target, transferData, operation, component);
				} else if ("drop-before".equals(type)) {
					onDropBefore(target, transferData, operation, component);
				} else if ("drop-after".equals(type)) {
					onDropAfter(target, transferData, operation, component);
				} else {
					throw new IllegalArgumentException("unkown drop type");
				}
			}
		} catch (Reject reject) {
			// TODO how to indicate rejection
			return;
		}

		source.onDropped(target, transferData, operation);
	}

	private DragSource findDragSource() {
		String id = getComponent().getRequest().getParameter("source");

		Component component = MarkupIdVisitor.getComponent(getComponent()
				.getPage(), id);

		for (IBehavior behavior : component.getBehaviors()) {
			if (behavior instanceof DragSource) {
				return (DragSource) behavior;
			}
		}
		throw new PageExpiredException("No drag source found for markupId "
				+ id + "; Component: " + component.toString());
	}

	private Component findDrop() {
		String id = getComponent().getRequest().getParameter("drop");

		return MarkupIdVisitor.getComponent((MarkupContainer) getComponent(),
				id);
	}

	/**
	 * Notification that a drag happend over the given component.
	 * 
	 * @param target
	 * @param component
	 */
	public void onDragOver(AjaxRequestTarget target, Object transferData, Component component) {
	}

	/**
	 * Notification that the given transfer data was dropped on this target.
	 */
	public void onDrop(AjaxRequestTarget target, Object transferData,
			int operation) {
		throw new Reject();
	}

	/**
	 * Notification that the given transfer data was dropped on this target over
	 * the given component.
	 */
	public void onDropOver(AjaxRequestTarget target, Object transferData,
			int operation, Component component) {
		throw new Reject();
	}

	/**
	 * Notification that the given transfer data was dropped on this target
	 * before the given component.
	 */
	public void onDropBefore(AjaxRequestTarget target, Object transferData,
			int operation, Component component) {
		throw new Reject();
	}

	/**
	 * Notification that the given transfer data was dropped on this target
	 * after the given component.
	 */
	public void onDropAfter(AjaxRequestTarget target, Object transferData,
			int operation, Component component) {
		throw new Reject();
	}
}