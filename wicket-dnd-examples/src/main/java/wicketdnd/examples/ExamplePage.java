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

import java.util.ArrayList;
import java.util.List;

import org.apache.wicket.Component;
import org.apache.wicket.ajax.AjaxRequestTarget;
import org.apache.wicket.extensions.markup.html.repeater.data.table.DataTable;
import org.apache.wicket.extensions.markup.html.repeater.data.table.DefaultDataTable;
import org.apache.wicket.extensions.markup.html.repeater.data.table.IColumn;
import org.apache.wicket.extensions.markup.html.repeater.data.table.PropertyColumn;
import org.apache.wicket.extensions.markup.html.tabs.ITab;
import org.apache.wicket.extensions.markup.html.tabs.TabbedPanel;
import org.apache.wicket.markup.html.CSSPackageResource;
import org.apache.wicket.markup.html.WebMarkupContainer;
import org.apache.wicket.markup.html.WebPage;
import org.apache.wicket.markup.html.basic.Label;
import org.apache.wicket.markup.html.list.ListItem;
import org.apache.wicket.markup.html.list.ListView;
import org.apache.wicket.markup.repeater.Item;
import org.apache.wicket.markup.repeater.ReuseIfModelsEqualStrategy;
import org.apache.wicket.model.IModel;
import org.apache.wicket.model.Model;
import org.apache.wicket.model.PropertyModel;

import wicketdnd.DND;
import wicketdnd.DragSource;
import wicketdnd.DropTarget;
import wicketdnd.IECursorFix;
import wicketdnd.theme.WindowsTheme;
import wickettree.DefaultNestedTree;
import wickettree.DefaultTableTree;
import wickettree.NestedTree;
import wickettree.TableTree;
import wickettree.table.TreeColumn;

/**
 * @author Sven Meier
 */
public class ExamplePage extends WebPage
{

	private static final long serialVersionUID = 1L;

	public ExamplePage()
	{
		add(new IECursorFix());
		
		add(CSSPackageResource.getHeaderContribution(new WindowsTheme()));

		add(newLabel());

		add(newList());

		add(newTable());

		add(newTree());

		add(newTableTree());

		add(newTabbing());
	}

	private Component newLabel()
	{
		final WebMarkupContainer container = new WebMarkupContainer("label");

		final Label label = new Label("label", Model.of(new Foo("A")));
		label.setOutputMarkupId(true);
		container.add(label);

		container.add(new DragSource(DND.COPY | DND.LINK, "div")
		{
		});
		container.add(new DropTarget(DND.COPY)
		{
			@Override
			public void onDrop(AjaxRequestTarget target, Object transferData, int operation)
			{
				label.setDefaultModelObject(transferData);

				target.addComponent(label);
			}
		});

		return container;
	}

	private Component newList()
	{
		final FooList list = new FooList();

		final WebMarkupContainer container = new WebMarkupContainer("list");
		final ListView<Foo> items = new ListView<Foo>("items", list)
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
		container.add(items);
		container.add(new DragSource(DND.MOVE | DND.COPY | DND.LINK, "div.item")
		{

			@Override
			public void onDropped(AjaxRequestTarget target, Object transfer, int operation)
			{
				if (operation == DND.MOVE)
				{
					list.remove(transfer);

					target.addComponent(container);
				}
			}
		});
		container.add(new DropTarget(DND.LINK, DND.UNDEFINED, "div.item", "div.item")
		{
			@Override
			public void onDropBefore(AjaxRequestTarget target, Object transfer, int operation,
					Component component)
			{
				list.addBefore(operate((Foo)transfer, operation), (Foo)component
						.getDefaultModelObject());

				target.addComponent(container);
			}

			@Override
			public void onDropAfter(AjaxRequestTarget target, Object transfer, int operation,
					Component component)
			{
				list.addAfter(operate((Foo)transfer, operation), (Foo)component
						.getDefaultModelObject());

				target.addComponent(container);
			}
		});

		return container;
	}

	protected Foo operate(Foo foo, int operation)
	{
		switch (operation)
		{
			case DND.MOVE :
				return foo;
			case DND.COPY :
				return foo.copy();
			case DND.LINK :
				return foo.link();
			default :
				throw new IllegalArgumentException();
		}
	}

	private Component newTable()
	{
		final FooDataProvider provider = new FooDataProvider();

		final DataTable<Foo> container = new DefaultDataTable<Foo>("table", dataColumns(),
				provider, Integer.MAX_VALUE)
		{
			@Override
			protected Item<Foo> newRowItem(String id, int index, IModel<Foo> model)
			{
				Item<Foo> item = super.newRowItem(id, index, model);
				item.setOutputMarkupId(true);
				return item;
			}
		};
		container.add(new DragSource(DND.MOVE | DND.COPY | DND.LINK, "tr")
		{
			@Override
			public void onDropped(AjaxRequestTarget target, Object transfer, int operation)
			{
				if (operation == DND.MOVE)
				{
					provider.remove((Foo)transfer);

					target.addComponent(container);
				}
			}
		});
		container.add(new DropTarget(DND.COPY, DND.UNDEFINED, "tr", "tr")
		{
			@Override
			public void onDrop(AjaxRequestTarget target, Object transfer, int operation)
			{
				provider.add(operate((Foo)transfer, operation));

				target.addComponent(container);
			}

			@Override
			public void onDropBefore(AjaxRequestTarget target, Object transfer, int operation,
					Component component)
			{
				provider.addBefore(operate((Foo)transfer, operation), (Foo)component
						.getDefaultModelObject());

				target.addComponent(container);
			}

			@Override
			public void onDropAfter(AjaxRequestTarget target, Object transfer, int operation,
					Component component)
			{
				provider.addAfter(operate((Foo)transfer, operation), (Foo)component
						.getDefaultModelObject());

				target.addComponent(container);
			}
		});

		return container;
	}

	private Component newTree()
	{
		final FooTreeProvider provider = new FooTreeProvider();
		final NestedTree<Foo> container = new DefaultNestedTree<Foo>("tree", provider)
		{
			@Override
			protected Component newContentComponent(String arg0, IModel<Foo> arg1)
			{
				Component component = super.newContentComponent(arg0, arg1);
				component.setOutputMarkupId(true);
				return component;
			}
		};
		container.add(new DragSource(DND.MOVE | DND.COPY | DND.LINK, "span.tree-content")
		{

			@Override
			public void onDropped(AjaxRequestTarget target, Object transfer, int operation)
			{
				if (operation == DND.MOVE)
				{
					provider.remove((Foo)transfer);

					target.addComponent(container);
				}
			}
		});
		container.add(new DropTarget(DND.MOVE, "span.tree-content", "div.tree-branch",
				"div.tree-branch")
		{

			@Override
			public void onDragOver(AjaxRequestTarget target, Object transferData, int operation,
					Component drop)
			{
				container.expand((Foo)drop.getDefaultModelObject());
			}

			@Override
			public void onDropOver(AjaxRequestTarget target, Object transfer, int operation,
					Component drop)
			{
				provider.add(operate((Foo)transfer, operation), (Foo)drop.getDefaultModelObject());

				target.addComponent(container);
			}

			@Override
			public void onDropBefore(AjaxRequestTarget target, Object transfer, int operation,
					Component drop)
			{
				provider.addBefore(operate((Foo)transfer, operation), (Foo)drop
						.getDefaultModelObject());

				target.addComponent(container);
			}

			@Override
			public void onDropAfter(AjaxRequestTarget target, Object transfer, int operation,
					Component component)
			{
				provider.addAfter(operate((Foo)transfer, operation), (Foo)component
						.getDefaultModelObject());

				target.addComponent(container);
			}
		});

		return container;
	}

	private Component newTableTree()
	{
		final FooTreeProvider provider = new FooTreeProvider();
		final TableTree<Foo> container = new DefaultTableTree<Foo>("tabletree", treeColumns(),
				provider, Integer.MAX_VALUE)
		{
			@Override
			protected Component newContentComponent(String arg0, IModel<Foo> arg1)
			{
				Component component = super.newContentComponent(arg0, arg1);
				component.setOutputMarkupId(true);
				return component;
			}
		};
		// reuse items or drop following expansion will fail due to new
		// markup ids
		container.setItemReuseStrategy(new ReuseIfModelsEqualStrategy());
		container.add(new DragSource(DND.MOVE | DND.COPY | DND.LINK, "span.tree-content")
		{
			@Override
			public void onDropped(AjaxRequestTarget target, Object transfer, int operation)
			{
				if (operation == DND.MOVE)
				{
					provider.remove((Foo)transfer);

					target.addComponent(container);
				}
			}
		});
		container.add(new DropTarget(DND.MOVE | DND.COPY | DND.LINK, "tr")
		{
			@Override
			public void onDragOver(AjaxRequestTarget target, Object transferData, int operation,
					Component drop)
			{
				container.expand((Foo)drop.getDefaultModelObject());
			}

			@Override
			public void onDropOver(AjaxRequestTarget target, Object transfer, int operation,
					Component drop)
			{
				provider.add(operate((Foo)transfer, operation), (Foo)drop.getDefaultModelObject());

				target.addComponent(container);
			}

			@Override
			public void onDropBefore(AjaxRequestTarget target, Object transfer, int operation,
					Component drop)
			{
				provider.addBefore(operate((Foo)transfer, operation), (Foo)drop
						.getDefaultModelObject());

				target.addComponent(container);
			}

			@Override
			public void onDropAfter(AjaxRequestTarget target, Object transfer, int operation,
					Component drop)
			{
				provider.addAfter(operate((Foo)transfer, operation), (Foo)drop
						.getDefaultModelObject());

				target.addComponent(container);
			}
		});

		return container;
	}

	private Component newTabbing()
	{
		List<ITab> tabs = new ArrayList<ITab>();
		for (int i = 0; i < 4; i++)
		{
			tabs.add(new Tab(i));
		}

		final TabbedPanel tabbed = new TabbedPanel("tabbed", tabs)
		{
			@Override
			protected WebMarkupContainer newLink(String linkId, int index)
			{
				WebMarkupContainer link = super.newLink(linkId, index);
				link.setDefaultModel(Model.of(index));
				link.setOutputMarkupId(true);
				return link;
			}
		};
		tabbed.setOutputMarkupId(true);
		// would be nice if TabbedPanel had a factory method for the container
		// of tabs - see WICKET-2435
		tabbed.get("tabs-container").add(new DropTarget(DND.NONE, "a")
		{
			@Override
			public void onDragOver(AjaxRequestTarget target, Object transferData, int operation,
					Component drop)
			{
				int index = (Integer)drop.getDefaultModelObject();

				tabbed.setSelectedTab(index);

				target.addComponent(tabbed);
			}
		});

		return tabbed;
	}

	@SuppressWarnings("unchecked")
	private IColumn<Foo>[] dataColumns()
	{
		return new IColumn[] { new PropertyColumn<Foo>(Model.of("Name"), "name") };
	}

	@SuppressWarnings("unchecked")
	private IColumn<Foo>[] treeColumns()
	{
		return new IColumn[] { new TreeColumn<Foo>(Model.of("Name")),
				new PropertyColumn<Foo>(Model.of("Name"), "name") };
	}
}