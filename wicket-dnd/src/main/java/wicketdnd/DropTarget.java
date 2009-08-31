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
public class DropTarget extends AbstractDefaultAjaxBehavior
{
	private static final long serialVersionUID = 1L;

	private String centerSelector = DND.UNDEFINED;

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
	public DropTarget(int operations)
	{
		this.operations = operations;
	}

	public DropTarget onCenter(String selector)
	{
		this.centerSelector = selector;
		return this;
	}

	public DropTarget onTop(String selector)
	{
		this.topSelector = selector;
		return this;
	}

	public DropTarget onRight(String selector)
	{
		this.rightSelector = selector;
		return this;
	}

	public DropTarget onBottom(String selector)
	{
		this.bottomSelector = selector;
		return this;
	}

	public DropTarget onLeft(String selector)
	{
		this.leftSelector = selector;
		return this;
	}

	public DropTarget onTopAndBottom(String selector)
	{
		this.topSelector = selector;
		this.bottomSelector = selector;
		return this;
	}

	public DropTarget onLeftAndRight(String selector)
	{
		this.leftSelector = selector;
		this.rightSelector = selector;
		return this;
	}

	@Override
	public final void renderHead(IHeaderResponse response)
	{
		super.renderHead(response);

		response.renderJavascriptReference(PrototypeResourceReference.INSTANCE);

		renderDropHead(response);
	}

	private void renderDropHead(IHeaderResponse response)
	{
		response.renderJavascriptReference(DND.JS);

		final String id = getComponent().getMarkupId();
		String initJS = String.format("new DND.DropTarget('%s','%s',%d,'%s','%s','%s','%s','%s');",
				id, getCallbackUrl(), operations, centerSelector, topSelector, rightSelector,
				bottomSelector, leftSelector);
		response.renderOnDomReadyJavascript(initJS);
	}

	public int getOperations()
	{
		return operations;
	}

	@Override
	protected final void respond(AjaxRequestTarget target)
	{
		Request request = getComponent().getRequest();

		final String type = readType(request);

		final DragSource source = DragSource.get(request);

		final int operation = readOperation(request) & this.getOperations()
				& source.getOperations();

		final Object transferData = source.getTransferData(operation);

		final Location location = readLocation(request);

		if ("drag".equals(type))
		{
			onDrag(target, transferData, operation, location);
		}
		else
		{
			try
			{
				if (operation == 0)
				{
					throw new Reject();
				}

				onDrop(target, transferData, operation, location);
			}
			catch (Reject reject)
			{
				// TODO how to indicate rejection
				return;
			}

			source.onDropped(target, transferData, operation);
		}
	}

	private String readType(Request request)
	{
		return request.getParameter("type");
	}

	private int readOperation(Request request)
	{
		return Integer.parseInt(request.getParameter("operation"));
	}

	private Location readLocation(Request request)
	{
		String id = getComponent().getRequest().getParameter("component");
		if (id == null)
		{
			return null;
		}

		Component component = MarkupIdVisitor.getComponent((MarkupContainer)getComponent(), id);

		int anchor = Integer.parseInt(request.getParameter("anchor"));

		return new Location(component, anchor);
	}

	/**
	 * Notification that a drag happend over this drop target.
	 * 
	 * @param target
	 *            initiating request target
	 * @param transferData
	 *            the transferring data
	 * @param operation
	 *            the DND operation
	 * @param location
	 *            the location
	 */
	public void onDrag(AjaxRequestTarget target, Object transferData, int operation,
			Location location)
	{
	}

	/**
	 * Notification that a drop happend on this drop target.
	 * 
	 * The default implementation always rejects the drop.
	 * 
	 * @param target
	 *            initiating request target
	 * @param transferData
	 *            the transferred data
	 * @param operation
	 *            the DND operation
	 * @param location
	 *            the location or <code>null</code> if not available
	 */
	public void onDrop(AjaxRequestTarget target, Object transferData, int operation,
			Location location) throws Reject
	{
		throw new Reject();
	}
}