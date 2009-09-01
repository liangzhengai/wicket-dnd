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
package wicketdnd.util;

import java.util.Formattable;
import java.util.Formatter;

/**
 * @author Sven Meier
 */
public class StringArrayFormattable implements Formattable
{
	private String[] strings;
	
	public StringArrayFormattable(String[] strings) {
		this.strings = strings;
	}
	
	public void formatTo(Formatter formatter, int flags, int width, int precision)
	{
		StringBuilder builder = new StringBuilder();
		builder.append("[");
		for (String string : strings) {
			if (builder.length()  > 0) {
				builder.append(",");
			}
			builder.append("'");
			builder.append(string);
			builder.append("'");
		}
		builder.append("]");
		
		formatter.format(builder.toString());
	}
}