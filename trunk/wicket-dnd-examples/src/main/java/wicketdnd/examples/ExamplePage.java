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

		WebMarkupContainer list = new WebMarkupContainer("list");
		ListView<Foo> items = new ListView<Foo>("items", new FooList())
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
		list.add(new ModelDragSource<Foo>(DND.MOVE | DND.COPY | DND.LINK, "div"));
		list.add(new ModelDropTarget<Foo>(DND.LINK, null, "div", "div"));
		add(list);

		DataTable<Foo> table = new DataTable<Foo>("table", dataColumns(), new FooDataProvider(),
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
		table.add(new ModelDragSource<Foo>(DND.MOVE | DND.COPY | DND.LINK, "tr"));
		table.add(new ModelDropTarget<Foo>(DND.COPY, null, "tr", "tr"));
		add(table);

		final NestedTree<Foo> tree = new DefaultNestedTree<Foo>("tree", new FooTreeProvider())
		{
			@Override
			protected Component newContentComponent(String arg0, IModel<Foo> arg1)
			{
				Component component = super.newContentComponent(arg0, arg1);
				component.setOutputMarkupId(true);
				return component;
			}
		};
		tree.add(new ModelDragSource<Foo>(DND.MOVE | DND.COPY | DND.LINK, "span.tree-content"));
		tree.add(new ModelDropTarget<Foo>(DND.MOVE, "span.tree-content", "li", "li")
		{
			@Override
			public void onDragOver(Foo drag, Foo drop, int operation)
			{
				tree.expand(drop);
			}
		});
		add(tree);

		final TableTree<Foo> tabletree = new DefaultTableTree<Foo>("tabletree", treeColumns(),
				new FooTreeProvider(), Integer.MAX_VALUE)
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
		tabletree.setItemReuseStrategy(new ReuseIfModelsEqualStrategy());
		tabletree
				.add(new ModelDragSource<Foo>(DND.MOVE | DND.COPY | DND.LINK, "span.tree-content"));
		tabletree.add(new ModelDropTarget<Foo>(DND.MOVE | DND.COPY | DND.LINK, "tr", null, null)
		{
			@Override
			public void onDragOver(Foo drag, Foo drop, int operation)
			{
				tabletree.expand(drop);
			}
		});

		add(tabletree);
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