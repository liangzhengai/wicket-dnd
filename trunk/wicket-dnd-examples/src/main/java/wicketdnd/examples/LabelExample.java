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
package wicketdnd.examples;

import org.apache.wicket.ajax.AjaxRequestTarget;
import org.apache.wicket.markup.html.WebMarkupContainer;
import org.apache.wicket.markup.html.basic.Label;
import org.apache.wicket.model.Model;

import wicketdnd.DragSource;
import wicketdnd.DropTarget;
import wicketdnd.Location;
import wicketdnd.Reject;
import wicketdnd.Transfer;

/**
 * @author Sven Meier
 */
public class LabelExample extends Example
{
	
	private Model<Foo> model = Model.of(new Foo("A"));
	
	public LabelExample(String id)
	{
		super(id);

		final WebMarkupContainer container = new WebMarkupContainer("container");
		add(container);
		container.add(new DragSource()
		{
			@Override
			public int getOperations()
			{
				return dragOperations();
			}

			@Override
			public String[] getTransferTypes()
			{
				return types();
			}

			@Override
			public void afterDrop(AjaxRequestTarget target, Transfer transfer)
			{
				if (transfer.getOperation() == Transfer.MOVE)
				{
					model.setObject(null);
					
					target.addComponent(container);
				}
			}
		}.drag("span"));
		container.add(new DropTarget(Transfer.COPY)
		{
			@Override
			public int getOperations()
			{
				return dropOperations();
			}

			@Override
			public String[] getTransferTypes()
			{
				return types();
			}

			@Override
			public void onDrop(AjaxRequestTarget target, Transfer transfer, Location location)
					throws Reject
			{
				Foo foo = transfer.getData();

				model.setObject(foo);

				target.addComponent(container);
			}
		});
		
		final Label label = new Label("label", model)
		{
			@Override
			public boolean isVisible()
			{
				return model.getObject() != null;
			}
		};
		label.setOutputMarkupId(true);
		container.add(label);

	}
}