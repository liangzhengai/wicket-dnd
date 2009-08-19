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
import org.apache.wicket.behavior.AbstractBehavior;
import org.apache.wicket.markup.html.IHeaderResponse;
import org.wicketstuff.prototype.PrototypeResourceReference;

/**
 * @author Sven Meier
 */
public class DragSource extends AbstractBehavior
{

	private static final long serialVersionUID = 1L;

	private Component component;

	private String selector;

	private int operations;

	public DragSource(int operations, String selector)
	{
		this.operations = operations;
		this.selector = selector;
	}

	@Override
	public void bind(Component component)
	{
		this.component = component;
		component.setOutputMarkupId(true);
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

		final String id = component.getMarkupId();
		String initJS = String.format("new DragSource('%s',%d,'%s');", id, operations, selector);
		response.renderOnDomReadyJavascript(initJS);
	}

	public void onDragFinished(Component drag, int operation)
	{
	}
}
