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
import org.apache.wicket.ajax.AjaxRequestTarget;

/**
 * @author Sven Meier
 */
public abstract class ModelDropTarget<T> extends DropTarget {

	private static final long serialVersionUID = 1L;

	public ModelDropTarget(int operations, String selector) {
		super(operations, selector);
	}

	public ModelDropTarget(int operations, String selector,
			String beforeSelector, String afterSelector) {
		super(operations, selector, beforeSelector, afterSelector);
	}

	@SuppressWarnings("unchecked")
	protected T getDefaultModelObject(Component component) {
		return (T) component.getDefaultModelObject();
	}

	/**
	 * Get the model object of the given component.
	 */
	protected abstract T getModelObject(Component component);

	private T modelObject(Component component) {
		try {
			return getModelObject(component);
		} catch (Exception ex) {
			throw new Reject();
		}
	}
	
	@Override
	public final void onDragOver(AjaxRequestTarget target, Component drag,
			Component drop, int operation) {
		onDragOver(target, modelObject(drag), modelObject(drop),
				operation);
	}

	@Override
	public final void onDrop(AjaxRequestTarget target, Component drag,
			int operation) {
		onDrop(target, modelObject(drag), operation);
	}

	@Override
	public final void onDropOver(AjaxRequestTarget target, Component drag,
			Component drop, int operation) {
		onDropOver(target, modelObject(drag), modelObject(drop),
				operation);
	}

	@Override
	public final void onDropBefore(AjaxRequestTarget target, Component drag,
			Component drop, int operation) {
		onDropBefore(target, modelObject(drag), modelObject(drop),
				operation);
	}

	@Override
	public final void onDropAfter(AjaxRequestTarget target, Component drag,
			Component drop, int operation) {
		onDropAfter(target, modelObject(drag), modelObject(drop),
				operation);
	}

	public void onDragOver(AjaxRequestTarget target, T drag, T drop,
			int operation) {
	}

	public void onDrop(AjaxRequestTarget target, T drag, int operation) {
		throw new Reject();
	}

	public void onDropOver(AjaxRequestTarget target, T drag, T drop,
			int operation) {
		throw new Reject();
	}

	public void onDropBefore(AjaxRequestTarget target, T drag, T drop,
			int operation) {
		throw new Reject();
	}

	public void onDropAfter(AjaxRequestTarget target, T drag, T drop,
			int operation) {
		throw new Reject();
	}
}