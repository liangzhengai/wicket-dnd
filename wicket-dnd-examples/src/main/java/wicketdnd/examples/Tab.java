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

import org.apache.wicket.extensions.markup.html.tabs.ITab;
import org.apache.wicket.extensions.markup.html.tabs.TabbedPanel;
import org.apache.wicket.markup.html.basic.Label;
import org.apache.wicket.markup.html.panel.Panel;
import org.apache.wicket.model.AbstractReadOnlyModel;
import org.apache.wicket.model.IModel;
import org.apache.wicket.model.Model;

/**
 * @author Sven Meier
 */
public class Tab extends Panel implements ITab
{
	private int number;

	public Tab(int number)
	{
		super(TabbedPanel.TAB_PANEL_ID);

		this.number = number;

		add(new Label("label", new AbstractReadOnlyModel<String>()
		{
			@Override
			public String getObject()
			{
				return "Tab " + Tab.this.number;
			}
		}));
	}

	public Panel getPanel(String panelId)
	{
		return this;
	}

	public IModel<String> getTitle()
	{
		return Model.of("Tab " + number);
	}
}