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
import org.wicketstuff.prototype.PrototypeResourceReference;

/**
 * @author Sven Meier
 */
public class DropTarget extends AbstractDefaultAjaxBehavior
{
	private static final long serialVersionUID = 1L;

	private String dropSelector;
	private String dropBeforeSelector;
	private String dropAfterSelector;

	private int operations;

	public DropTarget(int operations, String dropSelector, String dropBeforeSelector,
			String dropAfterSelector)
	{
		this.operations = operations;

		this.dropSelector = dropSelector;
		this.dropBeforeSelector = dropBeforeSelector;
		this.dropAfterSelector = dropAfterSelector;
	}

	@Override
	public void renderHead(IHeaderResponse response)
	{
		super.renderHead(response);

		response.renderJavascriptReference(PrototypeResourceReference.INSTANCE);

		renderDragHead(response);
	}

	private void renderDragHead(IHeaderResponse response)
	{
		response.renderJavascriptReference(DND.JS);

		final String id = getComponent().getMarkupId();
		String initJS = String.format("new DropTarget('%s','%s',%d,'%s','%s','%s');", id,
				getCallbackUrl(), operations, dropSelector, dropBeforeSelector, dropAfterSelector);
		response.renderOnDomReadyJavascript(initJS);
	}

	@Override
	protected void respond(AjaxRequestTarget target)
	{
		WebMarkupContainer dragSource = (WebMarkupContainer)getComponent(getComponent().getPage(),
				"dragSource");
		Component drag = getComponent(dragSource, "drag");
		Component drop = getComponent((WebMarkupContainer)getComponent(), "drop");
		String type = getComponent().getRequest().getParameter("type");
		int operation = Integer.parseInt(getComponent().getRequest().getParameter("operation"));

		boolean accepted;
		if ("drop".equals(type))
		{
			accepted = onDrop(drag, drop, operation);
		}
		else if ("drop-before".equals(type))
		{
			accepted = onDropBefore(drag, drop, operation);
		}
		else if ("drop-after".equals(type))
		{
			accepted = onDropAfter(drag, drop, operation);
		}
		else
		{
			throw new IllegalArgumentException("unkown drop type");
		}

		if (accepted)
		{
			for (IBehavior behavior : dragSource.getBehaviors())
			{
				if (behavior instanceof DragSource)
				{
					((DragSource)behavior).onDragFinished(drag, operation);
					break;
				}
			}
		}
	}

	private Component getComponent(MarkupContainer root, String parameter)
	{
		String id = getComponent().getRequest().getParameter(parameter);

		return (Component)root.visitChildren(new MarkupIdVisitor(id));
	}

	protected boolean onDrop(Component drag, Component drop, int operation)
	{
		return false;
	}

	protected boolean onDropBefore(Component drag, Component drop, int operation)
	{
		return false;
	}

	protected boolean onDropAfter(Component drag, Component drop, int operation)
	{
		return false;
	}
}
