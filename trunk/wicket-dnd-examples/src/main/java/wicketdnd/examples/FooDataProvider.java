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
import java.util.Iterator;
import java.util.List;

import org.apache.wicket.markup.repeater.data.IDataProvider;
import org.apache.wicket.model.IModel;
import org.apache.wicket.model.Model;

/**
 * @author Sven Meier
 */
public class FooDataProvider implements IDataProvider<Foo>
{

	private List<Foo> foos = new ArrayList<Foo>();
	
	{
		foos.add(new Foo("A"));
		foos.add(new Foo("B"));
		foos.add(new Foo("C"));
	}

	public int size()
	{
		return foos.size();
	}

	public Iterator<? extends Foo> iterator(int first, int count)
	{
		return foos.iterator();
	}

	public IModel<Foo> model(Foo foo)
	{
		return Model.of(foo);
	}

	public void detach()
	{
	}

}