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
package wicketdnd;

import org.apache.wicket.Component;
import org.apache.wicket.Component.IVisitor;

/**
 * Find a child component by it's markup id.
 * 
 * NOTE: the markup id may be different from the wicket id used in the markup.
 * 
 * @author Sven Meier
 */
public class MarkupIdVisitor implements IVisitor<Component>
{

	private final String id;

	public MarkupIdVisitor(String id)
	{
		if (id == null)
		{
			throw new IllegalArgumentException("id must not be null");
		}
		this.id = id;
	}

	public Object component(Component component)
	{
		if (id.equals(component.getMarkupId(false)))
		{
			return component;
		}
		return IVisitor.CONTINUE_TRAVERSAL;
	}
}