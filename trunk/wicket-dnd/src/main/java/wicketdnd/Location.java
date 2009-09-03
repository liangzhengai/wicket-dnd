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
import org.apache.wicket.model.IModel;

/**
 * A location inside a {@link DropTarget}.
 * 
 * @see DropTarget#onDrag(org.apache.wicket.ajax.AjaxRequestTarget, Object, int,
 *      Location)
 * @see DropTarget#onDrop(org.apache.wicket.ajax.AjaxRequestTarget, Object, int,
 *      Location)
 * 
 * @author Sven Meier
 */
public class Location
{

	public static final int CENTER = 0;
	public static final int TOP = 1;
	public static final int RIGHT = 2;
	public static final int BOTTOM = 3;
	public static final int LEFT = 4;

	private int anchor;
	private Component component;

	public Location(Component component, int anchor)
	{
		this.anchor = anchor;
		this.component = component;
	}

	/**
	 * The component defining the location.
	 * 
	 * @return the component
	 */
	public Component getComponent()
	{
		return component;
	}

	/**
	 * Get the anchor.
	 * 
	 * @see #CENTER
	 * @see #TOP
	 * @see #RIGHT
	 * @see #BOTTOM
	 * @see #LEFT
	 */
	public int getAnchor()
	{
		return anchor;
	}

	/**
	 * Convenience method to get the model of this location's component.
	 * 
	 * @return model
	 */
	@SuppressWarnings("unchecked")
	public <T> IModel<T> getModel()
	{
		return (IModel<T>)component.getDefaultModel();
	}

	/**
	 * Convenience method to get the model object of this location's component.
	 * 
	 * @return model
	 */
	@SuppressWarnings("unchecked")
	public <T> T getModelObject()
	{
		return (T)component.getDefaultModelObject();
	}
}