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

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import org.apache.wicket.Component;
import org.apache.wicket.MarkupContainer;
import org.apache.wicket.Request;
import org.apache.wicket.ajax.AbstractDefaultAjaxBehavior;
import org.apache.wicket.ajax.AjaxRequestTarget;
import org.apache.wicket.markup.html.IHeaderResponse;
import org.wicketstuff.prototype.PrototypeResourceReference;

import wicketdnd.util.MarkupIdVisitor;
import wicketdnd.util.StringArrayFormattable;

/**
 * A target of drops.
 * 
 * @see #getTransferTypes()
 * @see #onDrag(AjaxRequestTarget, Location)
 * @see #onDrop(AjaxRequestTarget, Transfer, Location)
 * 
 * @author Sven Meier
 */
public class DropTarget extends AbstractDefaultAjaxBehavior
{
	private static final long serialVersionUID = 1L;

	private String centerSelector = Transfer.UNDEFINED;

	private String topSelector = Transfer.UNDEFINED;

	private String bottomSelector = Transfer.UNDEFINED;

	private String leftSelector = Transfer.UNDEFINED;

	private String rightSelector = Transfer.UNDEFINED;

	private int operations;

	/**
	 * Create a drop target.
	 */
	public DropTarget()
	{
		this(Transfer.NONE);
	}

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

	/**
	 * Get possible types of transfers.
	 * 
	 * @return transfer types
	 */
	public String[] getTransferTypes()
	{
		return new String[] { Transfer.ANY };
	}

	public DropTarget dropCenter(String selector)
	{
		this.centerSelector = selector;
		return this;
	}

	public DropTarget dropTop(String selector)
	{
		this.topSelector = selector;
		return this;
	}

	public DropTarget dropRight(String selector)
	{
		this.rightSelector = selector;
		return this;
	}

	public DropTarget dropBottom(String selector)
	{
		this.bottomSelector = selector;
		return this;
	}

	public DropTarget dropLeft(String selector)
	{
		this.leftSelector = selector;
		return this;
	}

	public DropTarget dropTopAndBottom(String selector)
	{
		this.topSelector = selector;
		this.bottomSelector = selector;
		return this;
	}

	public DropTarget dropLeftAndRight(String selector)
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
		response.renderJavascriptReference(Transfer.JS);

		final String id = getComponent().getMarkupId();
		String initJS = String.format(
				"new DND.DropTarget('%s','%s',%d,%s,'%s','%s','%s','%s','%s');", id,
				getCallbackUrl(), getOperations(), new StringArrayFormattable(getTransferTypes()),
				centerSelector, topSelector, rightSelector, bottomSelector, leftSelector);
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

		final String type = getType(request);

		final Location location = readLocation(request);

		if ("drag".equals(type))
		{
			onDrag(target, location);
		}
		else
		{
			try
			{
				final DragSource source = DragSource.get(request);

				final Transfer transfer = getTransfer(request, source);

				source.beforeDrop(request, transfer);

				onDrop(target, transfer, location);

				source.afterDrop(target, transfer);
			}
			catch (Reject reject)
			{
				// TODO how to indicate rejection
				return;
			}
		}
	}

	private String getType(Request request)
	{
		return request.getParameter("type");
	}

	private Transfer getTransfer(Request request, DragSource source)
	{
		int operation = Integer.parseInt(request.getParameter("operation")) & this.getOperations()
				& source.getOperations();

		if (operation == 0)
		{
			throw new Reject();
		}

		List<String> transfers = new ArrayList<String>();
		for (String transfer : this.getTransferTypes())
		{
			transfers.add(transfer);
		}
		transfers.retainAll(Arrays.asList(source.getTransferTypes()));
		if (transfers.size() == 0)
		{
			throw new Reject();
		}

		return new Transfer(transfers.get(0), operation);
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
	 * @param location
	 *            the location
	 */
	public void onDrag(AjaxRequestTarget target, Location location)
	{
	}

	/**
	 * Notification that a drop happend on this drop target.
	 * 
	 * The default implementation always rejects the drop.
	 * 
	 * @param target
	 *            initiating request target
	 * @param transfer
	 *            the transfer
	 * @param location
	 *            the location or <code>null</code> if not available
	 */
	public void onDrop(AjaxRequestTarget target, Transfer transfer, Location location)
			throws Reject
	{
		throw new Reject();
	}
}