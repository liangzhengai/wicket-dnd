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

import org.apache.wicket.markup.html.WebMarkupContainer;
import org.apache.wicket.markup.html.basic.Label;
import org.apache.wicket.markup.html.form.CheckBoxMultipleChoice;
import org.apache.wicket.markup.html.form.IChoiceRenderer;
import org.apache.wicket.markup.html.form.TextField;
import org.apache.wicket.markup.html.panel.Panel;
import org.apache.wicket.model.CompoundPropertyModel;

import wicketdnd.Transfer;

/**
 * @author Sven Meier
 */
public abstract class Example extends Panel
{

	private List<Integer> operations;

	private List<Integer> dragOperations = new ArrayList<Integer>();

	private List<Integer> dropOperations = new ArrayList<Integer>();

	private String transferType = Transfer.ANY;

	public Example(String id)
	{
		super(id);
		
		operations = new ArrayList<Integer>();
		operations.add(Transfer.MOVE);
		operations.add(Transfer.COPY);
		operations.add(Transfer.LINK);

		dragOperations.addAll(operations);
		dropOperations.addAll(operations);

		add(new Label("title", getClass().getSimpleName()));

		WebMarkupContainer controls = new WebMarkupContainer("controls", new CompoundPropertyModel<Example>(this));
		add(controls);
		
		controls.add(new CheckBoxMultipleChoice<Integer>("dragOperations", operations,
				new OperationRenderer()).setSuffix(""));

		controls.add(new CheckBoxMultipleChoice<Integer>("dropOperations", operations,
				new OperationRenderer()).setSuffix(""));

		controls.add(new TextField<String>("transferType"));
	}

	protected int dragOperations()
	{
		int operations = 0;
		for (int operation : dragOperations)
		{
			operations |= operation;
		}

		return operations;
	}

	protected int dropOperations()
	{
		int operations = 0;
		for (int operation : dropOperations)
		{
			operations |= operation;
		}

		return operations;
	}

	public String[] types()
	{
		return new String[]{transferType};
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

	private class OperationRenderer implements IChoiceRenderer<Integer>
	{

		public Object getDisplayValue(Integer object)
		{
			switch (object)
			{
				case Transfer.MOVE :
					return "move";
				case Transfer.COPY :
					return "copy";
				case Transfer.LINK :
					return "link";
				case Transfer.NONE :
					return "none";
				default :
					throw new IllegalArgumentException("" + object);
			}
		}

		public String getIdValue(Integer object, int index)
		{
			return "" + object;
		}

	}
}