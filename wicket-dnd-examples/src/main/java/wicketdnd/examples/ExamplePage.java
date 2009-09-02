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
import org.apache.wicket.ResourceReference;
import org.apache.wicket.ajax.AjaxRequestTarget;
import org.apache.wicket.behavior.HeaderContributor;
import org.apache.wicket.extensions.markup.html.repeater.data.table.DataTable;
import org.apache.wicket.extensions.markup.html.repeater.data.table.DefaultDataTable;
import org.apache.wicket.extensions.markup.html.repeater.data.table.IColumn;
import org.apache.wicket.extensions.markup.html.repeater.data.table.PropertyColumn;
import org.apache.wicket.extensions.markup.html.tabs.ITab;
import org.apache.wicket.extensions.markup.html.tabs.TabbedPanel;
import org.apache.wicket.markup.html.IHeaderContributor;
import org.apache.wicket.markup.html.IHeaderResponse;
import org.apache.wicket.markup.html.WebMarkupContainer;
import org.apache.wicket.markup.html.WebPage;
import org.apache.wicket.markup.html.basic.Label;
import org.apache.wicket.markup.html.form.ChoiceRenderer;
import org.apache.wicket.markup.html.form.DropDownChoice;
import org.apache.wicket.markup.html.form.Form;
import org.apache.wicket.markup.html.list.ListItem;
import org.apache.wicket.markup.html.list.ListView;
import org.apache.wicket.markup.repeater.Item;
import org.apache.wicket.markup.repeater.ReuseIfModelsEqualStrategy;
import org.apache.wicket.model.IModel;
import org.apache.wicket.model.Model;
import org.apache.wicket.model.PropertyModel;

import wicketdnd.DragSource;
import wicketdnd.DropTarget;
import wicketdnd.IECursorFix;
import wicketdnd.Location;
import wicketdnd.Reject;
import wicketdnd.Transfer;
import wicketdnd.theme.HumanTheme;
import wicketdnd.theme.WebTheme;
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

	private List<ResourceReference> themes;

	private ResourceReference theme;

	public ExamplePage()
	{
		add(new IECursorFix());

		Form<Void> form = new Form<Void>("form");
		form.add(new HeaderContributor(new IHeaderContributor()
		{
			private static final long serialVersionUID = 1L;

			public void renderHead(IHeaderResponse response)
			{
				response.renderCSSReference(theme);
			}
		}));
		add(form);

		form.add(new DropDownChoice<ResourceReference>("theme",
				new PropertyModel<ResourceReference>(this, "theme"), initThemes(),
				new ChoiceRenderer<ResourceReference>("class.simpleName"))
		{
			private static final long serialVersionUID = 1L;

			@Override
			protected boolean wantOnSelectionChangedNotifications()
			{
				return true;
			}
		});

		add(newLabel());

		add(newList());

		add(newTable());

		add(newTree());

		add(newTableTree());

		add(newTabbing());
	}

	private List<ResourceReference> initThemes()
	{
		themes = new ArrayList<ResourceReference>();

		themes.add(new WindowsTheme());
		themes.add(new HumanTheme());
		themes.add(new WebTheme());

		theme = themes.get(0);

		return themes;
	}

	private Component newLabel()
	{
		final WebMarkupContainer container = new WebMarkupContainer("label");

		final Model<Foo> model = Model.of(new Foo("A"));
		final Label label = new Label("label", model);
		label.setOutputMarkupId(true);
		container.add(label);

		container.add(new DragSource(Transfer.COPY | Transfer.LINK).from("span"));
		container.add(new DropTarget(Transfer.COPY)
		{
			@Override
			public void onDrop(AjaxRequestTarget target, Transfer transfer, Location location)
					throws Reject
			{
				Foo foo = transfer.getData();

				model.setObject(foo);

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
		container.add(new DragSource(Transfer.MOVE | Transfer.COPY | Transfer.LINK)
		{

			@Override
			public void onDropped(AjaxRequestTarget target, Transfer transfer)
			{
				if (transfer.getOperation() == Transfer.MOVE)
				{
					list.remove(transfer.getData());

					target.addComponent(container);
				}
			}
		}.from("div.item").initiateWith("a"));
		container.add(new DropTarget(Transfer.LINK)
		{
			@Override
			public void onDrop(AjaxRequestTarget target, Transfer transfer, Location location)
			{
				if (location != null)
				{
					Foo foo = location.getModelObject();
					switch (location.getAnchor())
					{
						case Location.TOP :
							list.addBefore(operate(transfer), foo);
							break;
						case Location.BOTTOM :
							list.addAfter(operate(transfer), foo);
							break;
						default :
							transfer.reject();
					}

					target.addComponent(container);
				}
			}
		}.onTopAndBottom("div.item"));

		return container;
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
		container.add(new DragSource(Transfer.MOVE | Transfer.COPY | Transfer.LINK)
		{
			@Override
			public void onDropped(AjaxRequestTarget target, Transfer transfer)
			{
				if (transfer.getOperation() == Transfer.MOVE)
				{
					Foo foo = transfer.getData();

					provider.remove(foo);

					target.addComponent(container);
				}
			}
		}.from("tr"));
		container.add(new DropTarget(Transfer.COPY)
		{
			@Override
			public void onDrop(AjaxRequestTarget target, Transfer transfer, Location location)
					throws Reject
			{
				if (location == null)
				{
					provider.add(operate(transfer));
				}
				else
				{
					Foo foo = location.getModelObject();
					switch (location.getAnchor())
					{
						case Location.TOP :
							provider.addBefore(operate(transfer), foo);
							break;
						case Location.BOTTOM :
							provider.addAfter(operate(transfer), foo);
							break;
						default :
							transfer.reject();
					}

				}

				target.addComponent(container);
			}
		}.onTopAndBottom("tr"));

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
		container.add(new DragSource(Transfer.MOVE | Transfer.COPY | Transfer.LINK)
		{
			@Override
			public void onDropped(AjaxRequestTarget target, Transfer transfer)
			{
				if (transfer.getOperation() == Transfer.MOVE)
				{
					Foo foo = transfer.getData();

					provider.remove(foo);

					target.addComponent(container);
				}
			}
		}.from("span.tree-content"));
		container.add(new DropTarget(Transfer.MOVE)
		{
			@Override
			public void onDrag(AjaxRequestTarget target, Location location)
			{
				Foo foo = location.getModelObject();
				container.expand(foo);
			}

			@Override
			public void onDrop(AjaxRequestTarget target, Transfer transfer, Location location)
					throws Reject
			{
				if (location != null)
				{
					Foo foo = location.getModelObject();
					switch (location.getAnchor())
					{
						case Location.CENTER :
							provider.add(operate(transfer), foo);
							break;
						case Location.TOP :
							provider.addBefore(operate(transfer), foo);
							break;
						case Location.BOTTOM :
							provider.addAfter(operate(transfer), foo);
							break;
						default :
							transfer.reject();
					}
					target.addComponent(container);
				}
			}
		}.onCenter("span.tree-content").onTopAndBottom("div.tree-branch"));

		return container;
	}

	private Component newTableTree()
	{
		final FooTreeProvider provider = new FooTreeProvider();
		final TableTree<Foo> container = new DefaultTableTree<Foo>("tabletree", treeColumns(),
				provider, Integer.MAX_VALUE);
		// reuse items or drop following expansion will fail due to new
		// markup ids
		container.setItemReuseStrategy(new ReuseIfModelsEqualStrategy());
		container.add(new DragSource(Transfer.MOVE | Transfer.COPY | Transfer.LINK)
		{
			@Override
			public void onDropped(AjaxRequestTarget target, Transfer transfer)
			{
				if (transfer.getOperation() == Transfer.MOVE)
				{
					Foo foo = transfer.getData();

					provider.remove(foo);

					target.addComponent(container);
				}
			}
		}.from("tr").initiateWith("span.tree-content"));
		container.add(new DropTarget(Transfer.MOVE | Transfer.COPY | Transfer.LINK)
		{
			@Override
			public void onDrag(AjaxRequestTarget target, Location location)
			{
				Foo foo = location.getModelObject();
				container.expand(foo);
			}

			@Override
			public void onDrop(AjaxRequestTarget target, Transfer transfer, Location location)
					throws Reject
			{
				if (location != null)
				{
					Foo foo = location.getModelObject();
					switch (location.getAnchor())
					{
						case Location.CENTER :
							provider.add(operate(transfer), foo);
							break;
						case Location.TOP :
							provider.addBefore(operate(transfer), foo);
							break;
						case Location.BOTTOM :
							provider.addAfter(operate(transfer), foo);
							break;
						default :
							transfer.reject();
					}

					target.addComponent(container);
				}
			}
		}.onCenter("tr"));

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
		tabbed.get("tabs-container").add(new DropTarget(Transfer.NONE)
		{
			@Override
			public void onDrag(AjaxRequestTarget target, Location location)
			{
				Integer index = location.getModelObject();

				tabbed.setSelectedTab(index);

				target.addComponent(tabbed);
			}
		}.onCenter("a").onLeftAndRight("a"));

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

	protected Foo operate(Transfer transfer)
	{
		Foo foo = transfer.getData();
		switch (transfer.getOperation())
		{
			case Transfer.MOVE :
				return foo;
			case Transfer.COPY :
				return foo.copy();
			case Transfer.LINK :
				return foo.link();
			default :
				throw new IllegalArgumentException();
		}
	}

}