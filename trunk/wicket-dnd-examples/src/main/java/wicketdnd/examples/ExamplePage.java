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

import org.apache.wicket.markup.html.CSSPackageResource;
import org.apache.wicket.markup.html.WebMarkupContainer;
import org.apache.wicket.markup.html.WebPage;

import wicketdnd.DND;
import wicketdnd.DragSource;
import wicketdnd.DropTarget;
import wicketdnd.theme.WindowsTheme;

/**
 * @author Sven Meier
 */
public class ExamplePage extends WebPage
{

	private static final long serialVersionUID = 1L;

	public ExamplePage()
	{
		add(CSSPackageResource.getHeaderContribution(new WindowsTheme()));

		WebMarkupContainer tree = new WebMarkupContainer("tree");
		tree.add(new DragSource(DND.ACTION_COPY | DND.ACTION_MOVE, "span"));
		tree.add(new DropTarget(DND.ACTION_COPY | DND.ACTION_MOVE, "span", "li",
				"li"));
		add(tree);

		WebMarkupContainer table = new WebMarkupContainer("table");
		table.add(new DragSource(DND.ACTION_COPY | DND.ACTION_MOVE, "tr"));
		table.add(new DropTarget(DND.ACTION_COPY | DND.ACTION_MOVE, null, "tr",
				"tr"));
		add(table);

		WebMarkupContainer tabletree = new WebMarkupContainer("tabletree");
		tabletree.add(new DragSource(DND.ACTION_COPY | DND.ACTION_MOVE, "tr"));
		tabletree.add(new DropTarget(DND.ACTION_COPY | DND.ACTION_MOVE, "tr", "tr",
				"tr"));
		add(tabletree);
	}
}