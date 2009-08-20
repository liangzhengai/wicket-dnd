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
import org.apache.wicket.markup.html.WebMarkupContainer;
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

		WebMarkupContainer dragSource = (WebMarkupContainer) findDescendent(
				getComponent().getPage(), "source");
		Component drag = findDescendent(dragSource, "drag");

		try {
			if ("drop".equals(type)) {
				onDrop(target, drag, operation);
			} else {
				Component drop = findDescendent(
						(WebMarkupContainer) getComponent(), "drop");

				if ("drag-over".equals(type)) {
					onDragOver(target, drag, drop, operation);
					return;
				} else if ("drop-over".equals(type)) {
					onDropOver(target, drag, drop, operation);
				} else if ("drop-before".equals(type)) {
					onDropBefore(target, drag, drop, operation);
				} else if ("drop-after".equals(type)) {
					onDropAfter(target, drag, drop, operation);
				} else {
					throw new IllegalArgumentException("unkown drop type");
				}
			}

			for (IBehavior behavior : dragSource.getBehaviors()) {
				if (behavior instanceof DragSource) {
					((DragSource) behavior).onDragFinished(target, drag,
							operation);
					break;
				}
			}
		} catch (DNDFailure failure) {
			// TODO how to indicate failure
		}
	}

	private Component findDescendent(MarkupContainer root, String parameter) {
		String id = getComponent().getRequest().getParameter(parameter);

		Component descendent = (Component) root
				.visitChildren(new MarkupIdVisitor(id));
		if (descendent == null) {
			throw new PageExpiredException("No descendent found with id " + id
					+ "; Component: " + root.toString());
		}
		return descendent;
	}

	public void onDragOver(AjaxRequestTarget target, Component drag,
			Component drop, int operation) {
	}

	public void onDrop(AjaxRequestTarget target, Component drag, int operation) {
		throw new DNDFailure();
	}

	public void onDropOver(AjaxRequestTarget target, Component drag,
			Component drop, int operation) {
		throw new DNDFailure();
	}

	public void onDropBefore(AjaxRequestTarget target, Component drag,
			Component drop, int operation) {
		throw new DNDFailure();
	}

	public void onDropAfter(AjaxRequestTarget target, Component drag,
			Component drop, int operation) {
		throw new DNDFailure();
	}
}
