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
import org.apache.wicket.extensions.markup.html.repeater.data.table.DataTable;
import org.apache.wicket.extensions.markup.html.repeater.data.table.IColumn;
import org.apache.wicket.extensions.markup.html.repeater.data.table.PropertyColumn;
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
import wicketdnd.ModelDragSource;
import wicketdnd.ModelDropTarget;
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
		add(CSSPackageResource.getHeaderContribution(new WindowsTheme()));

		add(newList());

		add(newTable());

		add(newTree());

		add(newTableTree());
	}

	private WebMarkupContainer newList()
	{
		final FooList list = new FooList();

		final WebMarkupContainer container = new WebMarkupContainer("list");
		container.setOutputMarkupId(true);
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
		container.add(new ModelDragSource<Foo>(DND.MOVE | DND.COPY | DND.LINK, "div")
		{
			@Override
			public void onDragFinished(AjaxRequestTarget target, Foo foo, int operation)
			{
				if (operation == DND.MOVE)
				{
					list.remove(foo);

					target.addComponent(container);
				}
			}
		});
		container.add(new ModelDropTarget<Foo>(DND.LINK, null, "div", "div")
		{
			@Override
			public void onDropBefore(AjaxRequestTarget target, Foo drag, Foo drop, int operation)
			{
				list.addBefore(operate(drag, operation), drop);

				target.addComponent(container);
			}

			@Override
			public void onDropAfter(AjaxRequestTarget target, Foo drag, Foo drop, int operation)
			{
				list.addAfter(operate(drag, operation), drop);

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

	private WebMarkupContainer newTable()
	{
		final FooDataProvider provider = new FooDataProvider();

		final DataTable<Foo> container = new DataTable<Foo>("table", dataColumns(), provider,
				Integer.MAX_VALUE)
		{
			@Override
			protected Item<Foo> newRowItem(String id, int index, IModel<Foo> model)
			{
				Item<Foo> item = super.newRowItem(id, index, model);
				item.setOutputMarkupId(true);
				return item;
			}
		};
		container.setOutputMarkupId(true);
		container.add(new ModelDragSource<Foo>(DND.MOVE | DND.COPY | DND.LINK, "tr")
		{
			@Override
			public void onDragFinished(AjaxRequestTarget target, Foo foo, int operation)
			{
				if (operation == DND.MOVE)
				{
					provider.remove(foo);

					target.addComponent(container);
				}
			}
		});
		container.add(new ModelDropTarget<Foo>(DND.COPY, null, "tr", "tr")
		{
			@Override
			public void onDropBefore(AjaxRequestTarget target, Foo drag, Foo drop, int operation)
			{
				provider.addBefore(operate(drag, operation), drop);

				target.addComponent(container);
			}

			@Override
			public void onDropAfter(AjaxRequestTarget target, Foo drag, Foo drop, int operation)
			{
				provider.addAfter(operate(drag, operation), drop);

				target.addComponent(container);
			}
		});

		return container;
	}

	private WebMarkupContainer newTree()
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
		container.setOutputMarkupId(true);
		container.add(new ModelDragSource<Foo>(DND.MOVE | DND.COPY | DND.LINK, "span.tree-content")
		{
			@Override
			public void onDragFinished(AjaxRequestTarget target, Foo foo, int operation)
			{
				if (operation == DND.MOVE)
				{
					provider.remove(foo);

					target.addComponent(container);
				}
			}
		});
		container.add(new ModelDropTarget<Foo>(DND.MOVE, "span.tree-content", "div.tree-branch", "div.tree-branch")
		{
			@Override
			public void onDragOver(AjaxRequestTarget target, Foo drag, Foo drop, int operation)
			{
				container.expand(drop);
			}

			@Override
			public void onDropOver(AjaxRequestTarget target, Foo drag, Foo drop, int operation)
			{
				provider.add(operate(drag, operation), drop);

				target.addComponent(container);
			}

			@Override
			public void onDropBefore(AjaxRequestTarget target, Foo drag, Foo drop, int operation)
			{
				provider.addBefore(operate(drag, operation), drop);

				target.addComponent(container);
			}

			@Override
			public void onDropAfter(AjaxRequestTarget target, Foo drag, Foo drop, int operation)
			{
				provider.addAfter(operate(drag, operation), drop);

				target.addComponent(container);
			}
		});

		return container;
	}

	private WebMarkupContainer newTableTree()
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
		container.setOutputMarkupId(true);
		// reuse items or drop following expansion will fail due to new
		// markup ids
		container.setItemReuseStrategy(new ReuseIfModelsEqualStrategy());
		container.add(new ModelDragSource<Foo>(DND.MOVE | DND.COPY | DND.LINK, "span.tree-content")
		{
			@Override
			public void onDragFinished(AjaxRequestTarget target, Foo foo, int operation)
			{
				if (operation == DND.MOVE)
				{
					provider.remove(foo);

					target.addComponent(container);
				}
			}
		});
		container.add(new ModelDropTarget<Foo>(DND.MOVE | DND.COPY | DND.LINK, "tr", null, null)
		{
			@Override
			public void onDragOver(AjaxRequestTarget target, Foo drag, Foo drop, int operation)
			{
				container.expand(drop);
			}

			@Override
			public void onDropOver(AjaxRequestTarget target, Foo drag, Foo drop, int operation)
			{
				provider.add(operate(drag, operation), drop);

				target.addComponent(container);
			}

			@Override
			public void onDropBefore(AjaxRequestTarget target, Foo drag, Foo drop, int operation)
			{
				provider.addBefore(operate(drag, operation), drop);

				target.addComponent(container);
			}

			@Override
			public void onDropAfter(AjaxRequestTarget target, Foo drag, Foo drop, int operation)
			{
				provider.addAfter(operate(drag, operation), drop);

				target.addComponent(container);
			}
		});

		return container;
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