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
public class ModelDragSource<T> extends DragSource {

	private static final long serialVersionUID = 1L;

	public ModelDragSource(int operations, String selector) {
		super(operations, selector);
	}

	@SuppressWarnings("unchecked")
	protected T getModelObject(Component drag) {
		return (T) drag.getDefaultModelObject();
	}

	@Override
	public final void onDragFinished(AjaxRequestTarget target, Component drag,
			int operation) {
		onDragFinished(target, getModelObject(drag), operation);
	}

	public void onDragFinished(AjaxRequestTarget target, T t, int operation) {
	}
}
