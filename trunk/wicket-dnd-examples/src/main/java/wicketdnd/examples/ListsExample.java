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

import org.apache.wicket.Component;
import org.apache.wicket.ajax.AjaxRequestTarget;
import org.apache.wicket.markup.html.WebMarkupContainer;
import org.apache.wicket.markup.html.basic.Label;
import org.apache.wicket.markup.html.list.ListItem;
import org.apache.wicket.markup.html.list.ListView;
import org.apache.wicket.model.PropertyModel;

import wicketdnd.DragSource;
import wicketdnd.DropTarget;
import wicketdnd.Location;
import wicketdnd.Transfer;

/**
 * @author Sven Meier
 */
public class ListsExample extends Example
{
	public ListsExample(String id)
	{
		super(id);

		add(newList("vertical"));
		add(newList("horizontal"));
	}

	private Component newList(String id)
	{
		final FooList foos = new FooList();

		final WebMarkupContainer list = new WebMarkupContainer(id);
		final ListView<Foo> items = new ListView<Foo>("items", foos)
		{
			@Override
			protected ListItem<Foo> newItem(int index)
			{
				ListItem<Foo> item = super.newItem(index);
				item.setOutputMarkupId(true);
				return item;
			}

			@Override
			protected void populateItem(ListItem<Foo> item)
			{
				item.add(new Label("name", new PropertyModel<String>(item.getModel(), "name")));
			}
		};
		list.add(items);
		list.add(new DragSource()
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
					foos.remove(transfer.getData());

					target.addComponent(list);
				}
			}
		}.drag("div.item").initiate("span.initiate"));
		DropTarget dropTarget = new DropTarget()
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
			{
				if (location != null)
				{
					Foo foo = location.getModelObject();
					switch (location.getAnchor())
					{
						case Location.TOP :
						case Location.LEFT :
							foos.addBefore(operate(transfer), foo);
							break;
						case Location.BOTTOM :
						case Location.RIGHT :
							foos.addAfter(operate(transfer), foo);
							break;
						default :
							transfer.reject();
					}

					target.addComponent(list);
				}
			}
		};
		if ("vertical".equals(id))
		{
			dropTarget.dropTopAndBottom("div.item");
		}
		else
		{
			dropTarget.dropLeftAndRight("div.item");
		}
		list.add(dropTarget);

		return list;
	}
}