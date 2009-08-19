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

/**
 * @author Sven Meier
 */
public class ModelDropTarget<T> extends DropTarget {

	private static final long serialVersionUID = 1L;

	public ModelDropTarget(int operations, String selector) {
		super(operations, selector);
	}

	public ModelDropTarget(int operations, String selector,
			String beforeSelector, String afterSelector) {
		super(operations, selector, beforeSelector, afterSelector);
	}

	@SuppressWarnings("unchecked")
	protected T getModelObject(Component drop) {
		try {
			return (T) drop.getDefaultModelObject();
		} catch (ClassCastException ex) {
			throw new DNDFailure(ex);
		}
	}

	@Override
	public final void onDragOver(Component drag, Component drop, int operation) {
		onDragOver(getModelObject(drag), getModelObject(drop), operation);
	}

	@Override
	public final void onDrop(Component drag, int operation) {
		onDrop(getModelObject(drag), operation);
	}

	@Override
	public final void onDropOver(Component drag, Component drop, int operation) {
		onDropOver(getModelObject(drag), getModelObject(drop), operation);
	}

	@Override
	public final void onDropBefore(Component drag, Component drop, int operation) {
		onDropBefore(getModelObject(drag), getModelObject(drop), operation);
	}

	@Override
	public final void onDropAfter(Component drag, Component drop, int operation) {
		onDropAfter(getModelObject(drag), getModelObject(drop), operation);
	}

	public void onDragOver(T drag, T drop, int operation) {
	}

	public void onDrop(T drag, int operation) {
		throw new DNDFailure();
	}

	public void onDropOver(T drag, T drop, int operation) {
		throw new DNDFailure();
	}

	public void onDropBefore(T drag, T drop, int operation) {
		throw new DNDFailure();
	}

	public void onDropAfter(T drag, T drop, int operation) {
		throw new DNDFailure();
	}
}