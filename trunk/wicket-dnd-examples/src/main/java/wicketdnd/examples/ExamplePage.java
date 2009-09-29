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

import org.apache.wicket.ResourceReference;
import org.apache.wicket.behavior.HeaderContributor;
import org.apache.wicket.markup.html.IHeaderContributor;
import org.apache.wicket.markup.html.IHeaderResponse;
import org.apache.wicket.markup.html.WebPage;
import org.apache.wicket.markup.html.form.Button;
import org.apache.wicket.markup.html.form.ChoiceRenderer;
import org.apache.wicket.markup.html.form.DropDownChoice;
import org.apache.wicket.markup.html.form.Form;
import org.apache.wicket.markup.repeater.RepeatingView;
import org.apache.wicket.model.PropertyModel;

import wicketdnd.IEBackgroundImageCacheFix;
import wicketdnd.IECursorFix;
import wicketdnd.theme.HumanTheme;
import wicketdnd.theme.WebTheme;
import wicketdnd.theme.WindowsTheme;

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
		add(new IEBackgroundImageCacheFix());

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

		form.add(new Button("change"));

		RepeatingView examples = new RepeatingView("examples");
		examples.add(new LabelExample(examples.newChildId()));
		examples.add(new ListsExample(examples.newChildId()));
		examples.add(new TableExample(examples.newChildId()));
		examples.add(new TreeExample(examples.newChildId()));
		examples.add(new TableTreeExample(examples.newChildId()));
		form.add(examples);
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
}