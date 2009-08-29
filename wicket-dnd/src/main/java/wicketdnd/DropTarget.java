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
import org.apache.wicket.Request;
import org.apache.wicket.ajax.AbstractDefaultAjaxBehavior;
import org.apache.wicket.ajax.AjaxRequestTarget;
import org.apache.wicket.markup.html.IHeaderResponse;
import org.wicketstuff.prototype.PrototypeResourceReference;

import wicketdnd.util.MarkupIdVisitor;

/**
 * A target of drops.
 * 
 * @see #onDragOver(AjaxRequestTarget, Object, int, Component)
 * @see #onDrop(AjaxRequestTarget, Object, int)
 * 
 * @author Sven Meier
 */
public class DropTarget extends AbstractDefaultAjaxBehavior {
	private static final long serialVersionUID = 1L;

	private String overSelector = DND.UNDEFINED;

	private String topSelector = DND.UNDEFINED;

	private String bottomSelector = DND.UNDEFINED;

	private String leftSelector = DND.UNDEFINED;

	private String rightSelector = DND.UNDEFINED;

	private int operations;

	/**
	 * Create a drop target.
	 * 
	 * @param operations
	 *            allowed operations
	 * @see DND#MOVE
	 * @see DND#COPY
	 * @see DND#LINK
	 */
	public DropTarget(int operations) {
		this.operations = operations;
	}

	public DropTarget over(String selector) {
		this.overSelector = selector;
		return this;
	}

	public DropTarget top(String selector) {
		this.topSelector = selector;
		return this;
	}

	public DropTarget right(String selector) {
		this.rightSelector = selector;
		return this;
	}

	public DropTarget bottom(String selector) {
		this.bottomSelector = selector;
		return this;
	}

	public DropTarget left(String selector) {
		this.leftSelector = selector;
		return this;
	}

	public DropTarget topAndBottom(String selector) {
		this.topSelector = selector;
		this.bottomSelector = selector;
		return this;
	}

	public DropTarget leftAndRight(String selector) {
		this.leftSelector = selector;
		this.rightSelector = selector;
		return this;
	}

	@Override
	public final void renderHead(IHeaderResponse response) {
		super.renderHead(response);

		response.renderJavascriptReference(PrototypeResourceReference.INSTANCE);

		renderDropHead(response);
	}

	private void renderDropHead(IHeaderResponse response) {
		response.renderJavascriptReference(DND.JS);

		final String id = getComponent().getMarkupId();
		String initJS = String.format(
				"new DND.DropTarget('%s','%s',%d,'%s','%s','%s','%s','%s');",
				id, getCallbackUrl(), operations, overSelector, topSelector,
				rightSelector, bottomSelector, leftSelector);
		response.renderOnDomReadyJavascript(initJS);
	}

	public int getOperations() {
		return operations;
	}

	@Override
	protected final void respond(AjaxRequestTarget target) {
		Request request = getComponent().getRequest();

		int location = Integer.parseInt(request.getParameter("location"));

		final DragSource source = DragSource.get(request);

		final int operation = Integer.parseInt(request
				.getParameter("operation"))
				& getOperations() & source.getOperations();

		try {
			final Object transferData = source.getTransferData(operation);

			if (location == -1) {
				if (operation == 0) {
					throw new Reject();
				}

				onDrop(target, transferData, operation);
			} else {
				final Component drop = findDrop();

				if (location == -2) {
					onDrag(target, transferData, operation, drop);
					return;
				}

				if (operation == 0) {
					throw new Reject();
				}

				onDrop(target, transferData, operation, drop, location);
			}

			source.onDropped(target, transferData, operation);
		} catch (Reject reject) {
			// TODO how to indicate rejection
		}
	}

	private Component findDrop() {
		String id = getComponent().getRequest().getParameter("drop");

		return MarkupIdVisitor.getComponent((MarkupContainer) getComponent(),
				id);
	}

	/**
	 * Notification that a drag happend on the given component.
	 * 
	 * @param target
	 *            initiating request target
	 * @param transferData
	 *            the transferring data
	 * @param operation
	 *            the DND operation
	 * @param drop
	 *            the component the drag happend over
	 */
	public void onDrag(AjaxRequestTarget target, Object transferData,
			int operation, Component drop) {
	}

	/**
	 * Notification that a drop happend.
	 * 
	 * The default implementation always rejects the drop.
	 * 
	 * @param target
	 *            initiating request target
	 * @param transferData
	 *            the transferred data
	 * @param operation
	 *            the DND operation
	 */
	public void onDrop(AjaxRequestTarget target, Object transferData,
			int operation) {
		throw new Reject();
	}

	/**
	 * Notification that a drop happend on the given component.
	 * 
	 * The default implementation always rejects the drop.
	 * 
	 * @param target
	 *            initiating request target
	 * @param transferData
	 *            the transferred data
	 * @param operation
	 *            the DND operation
	 * @param drop
	 *            the component the drop happend over
	 */
	public void onDrop(AjaxRequestTarget target, Object transferData,
			int operation, Component drop, int location) {
		throw new Reject();
	}
}