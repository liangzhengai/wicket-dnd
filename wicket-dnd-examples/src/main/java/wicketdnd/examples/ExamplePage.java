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

import org.apache.wicket.extensions.markup.html.repeater.data.table.DataTable;
import org.apache.wicket.extensions.markup.html.repeater.data.table.IColumn;
import org.apache.wicket.extensions.markup.html.repeater.data.table.PropertyColumn;
import org.apache.wicket.markup.html.CSSPackageResource;
import org.apache.wicket.markup.html.WebPage;
import org.apache.wicket.markup.repeater.Item;
import org.apache.wicket.model.IModel;
import org.apache.wicket.model.Model;

import wicketdnd.DND;
import wicketdnd.DragSource;
import wicketdnd.DropTarget;
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

		NestedTree<Foo> tree = new DefaultNestedTree<Foo>("tree", new FooTreeProvider());
		tree.add(new DragSource(DND.COPY | DND.MOVE, "span.tree-content"));
		tree.add(new DropTarget(DND.COPY | DND.MOVE, "span.tree-content", "li", "li"));
		add(tree);

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
		table.add(new DragSource(DND.COPY | DND.MOVE, "tr"));
		table.add(new DropTarget(DND.COPY | DND.MOVE, null, "tr", "tr"));
		add(table);

		TableTree<Foo> tabletree = new DefaultTableTree<Foo>("tabletree", treeColumns(),
				new FooTreeProvider(), Integer.MAX_VALUE);
		tabletree.add(new DragSource(DND.COPY | DND.MOVE, "tr"));
		tabletree.add(new DropTarget(DND.COPY | DND.MOVE, "tr", null, null));
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