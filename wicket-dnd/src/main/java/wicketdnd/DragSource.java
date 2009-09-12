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

import java.util.Set;

import org.apache.wicket.Component;
import org.apache.wicket.MarkupContainer;
import org.apache.wicket.Request;
import org.apache.wicket.ajax.AjaxRequestTarget;
import org.apache.wicket.behavior.AbstractBehavior;
import org.apache.wicket.behavior.IBehavior;
import org.apache.wicket.markup.html.IHeaderResponse;
import org.apache.wicket.protocol.http.PageExpiredException;
import org.wicketstuff.prototype.PrototypeResourceReference;

import wicketdnd.util.CollectionFormattable;
import wicketdnd.util.MarkupIdVisitor;

/**
 * A source of drags.
 * 
 * @see #getTransferTypes()
 * @see #beforeDrop(Request, Transfer)
 * @see #onAfterDrop(AjaxRequestTarget, Transfer)
 * 
 * @author Sven Meier
 */
public class DragSource extends AbstractBehavior
{

	private static final long serialVersionUID = 1L;

	private Component component;

	private String selector = Transfer.UNDEFINED;

	private String initiateSelector = Transfer.UNDEFINED;

	private Set<Operation> operations;

	/**
	 * Create a source of drag operations.
	 */
	public DragSource(Operation... operations)
	{
		this(Operation.of(operations));
	}

	/**
	 * Create a source of drag operations.
	 * 
	 * @param operations
	 *            allowed operations
	 */
	public DragSource(Set<Operation> operations)
	{
		this.operations = operations;
	}

	/**
	 * Get supported types of transfer.
	 * 
	 * @return transfers
	 * @see Transfer#getType()
	 */
	public String[] getTransferTypes()
	{
		return new String[] { Transfer.ANY };
	}

	/**
	 * Allow drag on elements matching the given selector.
	 * 
	 * @param selector
	 *            element selector
	 */
	public DragSource drag(String selector)
	{
		this.selector = selector;

		if (this.initiateSelector.equals(Transfer.UNDEFINED))
		{
			this.initiateSelector = selector;
		}

		return this;
	}

	/**
	 * Initiate drag on elements matching the given selector.
	 * 
	 * @param selector
	 *            element selector
	 */
	public DragSource initiate(String selector)
	{
		this.initiateSelector = selector;
		return this;
	}

	@Override
	public final void bind(Component component)
	{
		this.component = component;
		component.setOutputMarkupId(true);
	}

	@Override
	public final void renderHead(IHeaderResponse response)
	{
		super.renderHead(response);

		response.renderJavascriptReference(PrototypeResourceReference.INSTANCE);

		renderDragHead(response);
	}

	private void renderDragHead(IHeaderResponse response)
	{
		response.renderJavascriptReference(Transfer.JS);

		final String id = component.getMarkupId();
		final String path = component.getPageRelativePath();

		String initJS = String.format("new DnD.DragSource('%s','%s',%s,%s,'%s','%s');", id, path,
				new CollectionFormattable(getOperations()), new CollectionFormattable(
						getTransferTypes()), selector, initiateSelector);
		response.renderOnDomReadyJavascript(initJS);
	}

	/**
	 * Get supported operations.
	 * 
	 * @return operations
	 * @see Transfer#getOperation()
	 */
	public Set<Operation> getOperations()
	{
		return operations;
	}

	final boolean hasOperation(Operation operation)
	{
		return getOperations().contains(operation);
	}

	final void beforeDrop(Request request, Transfer transfer) throws Reject
	{
		Component drag = getDrag(request);

		onBeforeDrop(drag, transfer);
	}

	final void afterDrop(AjaxRequestTarget target, Transfer transfer)
	{
		onAfterDrop(target, transfer);
	}

	/**
	 * Notification that a drop is about to happen - any implementation should
	 * set the data on the given transfer or reject it.
	 * 
	 * The default implementation uses the component's model object as transfer
	 * data.
	 * 
	 * @param drag
	 *            component to get data from
	 * @param operation
	 *            the drag's operation
	 * @param transfer
	 *            the transfer
	 * @throws Reject
	 *             may reject the drop
	 * @see Transfer#setData(Object)
	 * @see Transfer#reject()
	 */
	public void onBeforeDrop(Component drag, Transfer transfer) throws Reject
	{
		transfer.setData(drag.getDefaultModelObject());
	}

	/**
	 * Notification that a drop happened of one of this source's transfer datas.
	 * 
	 * The default implementation does nothing.
	 * 
	 * @param target
	 *            initiating request target
	 * @param transfer
	 *            the transfer
	 */
	public void onAfterDrop(AjaxRequestTarget target, Transfer transfer)
	{
	}

	private Component getDrag(Request request)
	{
		String id = request.getParameter("drag");

		return MarkupIdVisitor.getComponent((MarkupContainer)component, id);
	}

	/**
	 * Get the drag source of the given request.
	 * 
	 * @param request
	 *            request on which a drag happened
	 * @return drag source
	 */
	final static DragSource read(Request request)
	{
		String path = request.getParameter("source");

		Component component = request.getPage().get(path);

		if (component != null)
		{
			for (IBehavior behavior : component.getBehaviors())
			{
				if (behavior instanceof DragSource)
				{
					return (DragSource)behavior;
				}
			}
		}

		throw new PageExpiredException("No drag source found " + path);
	}
}
