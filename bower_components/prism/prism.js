/* http://prismjs.com/download.html?themes=prism-okaidia&languages=markup+css+clike+javascript+c+csharp+cpp+ruby+elixir+erlang+glsl+go+java+processing+python+scala&plugins=line-highlight+line-numbers+show-invisibles+autolinker+wpd+file-highlight+show-language+jsonp-highlight+highlight-keywords+remove-initial-line-feed+previewer-base+previewer-color+previewer-gradient+previewer-easing+previewer-time+previewer-angle+autoloader+keep-markup+command-line */
var _self = (typeof window !== 'undefined')
	? window   // if in browser
	: (
		(typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope)
		? self // if in worker
		: {}   // if in node js
	);

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 * MIT license http://www.opensource.org/licenses/mit-license.php/
 * @author Lea Verou http://lea.verou.me
 */

var Prism = (function(){

// Private helper vars
var lang = /\blang(?:uage)?-(\w+)\b/i;

var _ = _self.Prism = {
	util: {
		encode: function (tokens) {
			if (tokens instanceof Token) {
				return new Token(tokens.type, _.util.encode(tokens.content), tokens.alias);
			} else if (_.util.type(tokens) === 'Array') {
				return tokens.map(_.util.encode);
			} else {
				return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
			}
		},

		type: function (o) {
			return Object.prototype.toString.call(o).match(/\[object (\w+)\]/)[1];
		},

		// Deep clone a language definition (e.g. to extend it)
		clone: function (o) {
			var type = _.util.type(o);

			switch (type) {
				case 'Object':
					var clone = {};

					for (var key in o) {
						if (o.hasOwnProperty(key)) {
							clone[key] = _.util.clone(o[key]);
						}
					}

					return clone;

				case 'Array':
					// Check for existence for IE8
					return o.map && o.map(function(v) { return _.util.clone(v); });
			}

			return o;
		}
	},

	languages: {
		extend: function (id, redef) {
			var lang = _.util.clone(_.languages[id]);

			for (var key in redef) {
				lang[key] = redef[key];
			}

			return lang;
		},

		/**
		 * Insert a token before another token in a language literal
		 * As this needs to recreate the object (we cannot actually insert before keys in object literals),
		 * we cannot just provide an object, we need anobject and a key.
		 * @param inside The key (or language id) of the parent
		 * @param before The key to insert before. If not provided, the function appends instead.
		 * @param insert Object with the key/value pairs to insert
		 * @param root The object that contains `inside`. If equal to Prism.languages, it can be omitted.
		 */
		insertBefore: function (inside, before, insert, root) {
			root = root || _.languages;
			var grammar = root[inside];
			
			if (arguments.length == 2) {
				insert = arguments[1];
				
				for (var newToken in insert) {
					if (insert.hasOwnProperty(newToken)) {
						grammar[newToken] = insert[newToken];
					}
				}
				
				return grammar;
			}
			
			var ret = {};

			for (var token in grammar) {

				if (grammar.hasOwnProperty(token)) {

					if (token == before) {

						for (var newToken in insert) {

							if (insert.hasOwnProperty(newToken)) {
								ret[newToken] = insert[newToken];
							}
						}
					}

					ret[token] = grammar[token];
				}
			}
			
			// Update references in other language definitions
			_.languages.DFS(_.languages, function(key, value) {
				if (value === root[inside] && key != inside) {
					this[key] = ret;
				}
			});

			return root[inside] = ret;
		},

		// Traverse a language definition with Depth First Search
		DFS: function(o, callback, type, visited) {
			visited = visited || {};
			for (var i in o) {
				if (o.hasOwnProperty(i)) {
					callback.call(o, i, o[i], type || i);

					if (_.util.type(o[i]) === 'Object' && !visited[o[i]]) {
						visited[o[i]] = true;
						_.languages.DFS(o[i], callback, null, visited);
					}
					else if (_.util.type(o[i]) === 'Array' && !visited[o[i]]) {
						visited[o[i]] = true;
						_.languages.DFS(o[i], callback, i, visited);
					}
				}
			}
		}
	},
	plugins: {},
	
	highlightAll: function(async, callback) {
		var elements = document.querySelectorAll('code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code');

		for (var i=0, element; element = elements[i++];) {
			_.highlightElement(element, async === true, callback);
		}
	},

	highlightElement: function(element, async, callback) {
		// Find language
		var language, grammar, parent = element;

		while (parent && !lang.test(parent.className)) {
			parent = parent.parentNode;
		}

		if (parent) {
			language = (parent.className.match(lang) || [,''])[1];
			grammar = _.languages[language];
		}

		// Set language on the element, if not present
		element.className = element.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;

		// Set language on the parent, for styling
		parent = element.parentNode;

		if (/pre/i.test(parent.nodeName)) {
			parent.className = parent.className.replace(lang, '').replace(/\s+/g, ' ') + ' language-' + language;
		}

		var code = element.textContent;

		var env = {
			element: element,
			language: language,
			grammar: grammar,
			code: code
		};

		if (!code || !grammar) {
			_.hooks.run('complete', env);
			return;
		}

		_.hooks.run('before-highlight', env);

		if (async && _self.Worker) {
			var worker = new Worker(_.filename);

			worker.onmessage = function(evt) {
				env.highlightedCode = evt.data;

				_.hooks.run('before-insert', env);

				env.element.innerHTML = env.highlightedCode;

				callback && callback.call(env.element);
				_.hooks.run('after-highlight', env);
				_.hooks.run('complete', env);
			};

			worker.postMessage(JSON.stringify({
				language: env.language,
				code: env.code,
				immediateClose: true
			}));
		}
		else {
			env.highlightedCode = _.highlight(env.code, env.grammar, env.language);

			_.hooks.run('before-insert', env);

			env.element.innerHTML = env.highlightedCode;

			callback && callback.call(element);

			_.hooks.run('after-highlight', env);
			_.hooks.run('complete', env);
		}
	},

	highlight: function (text, grammar, language) {
		var tokens = _.tokenize(text, grammar);
		return Token.stringify(_.util.encode(tokens), language);
	},

	tokenize: function(text, grammar, language) {
		var Token = _.Token;

		var strarr = [text];

		var rest = grammar.rest;

		if (rest) {
			for (var token in rest) {
				grammar[token] = rest[token];
			}

			delete grammar.rest;
		}

		tokenloop: for (var token in grammar) {
			if(!grammar.hasOwnProperty(token) || !grammar[token]) {
				continue;
			}

			var patterns = grammar[token];
			patterns = (_.util.type(patterns) === "Array") ? patterns : [patterns];

			for (var j = 0; j < patterns.length; ++j) {
				var pattern = patterns[j],
					inside = pattern.inside,
					lookbehind = !!pattern.lookbehind,
					lookbehindLength = 0,
					alias = pattern.alias;

				pattern = pattern.pattern || pattern;

				for (var i=0; i<strarr.length; i++) { // Don’t cache length as it changes during the loop

					var str = strarr[i];

					if (strarr.length > text.length) {
						// Something went terribly wrong, ABORT, ABORT!
						break tokenloop;
					}

					if (str instanceof Token) {
						continue;
					}

					pattern.lastIndex = 0;

					var match = pattern.exec(str);

					if (match) {
						if(lookbehind) {
							lookbehindLength = match[1].length;
						}

						var from = match.index - 1 + lookbehindLength,
							match = match[0].slice(lookbehindLength),
							len = match.length,
							to = from + len,
							before = str.slice(0, from + 1),
							after = str.slice(to + 1);

						var args = [i, 1];

						if (before) {
							args.push(before);
						}

						var wrapped = new Token(token, inside? _.tokenize(match, inside) : match, alias);

						args.push(wrapped);

						if (after) {
							args.push(after);
						}

						Array.prototype.splice.apply(strarr, args);
					}
				}
			}
		}

		return strarr;
	},

	hooks: {
		all: {},

		add: function (name, callback) {
			var hooks = _.hooks.all;

			hooks[name] = hooks[name] || [];

			hooks[name].push(callback);
		},

		run: function (name, env) {
			var callbacks = _.hooks.all[name];

			if (!callbacks || !callbacks.length) {
				return;
			}

			for (var i=0, callback; callback = callbacks[i++];) {
				callback(env);
			}
		}
	}
};

var Token = _.Token = function(type, content, alias) {
	this.type = type;
	this.content = content;
	this.alias = alias;
};

Token.stringify = function(o, language, parent) {
	if (typeof o == 'string') {
		return o;
	}

	if (_.util.type(o) === 'Array') {
		return o.map(function(element) {
			return Token.stringify(element, language, o);
		}).join('');
	}

	var env = {
		type: o.type,
		content: Token.stringify(o.content, language, parent),
		tag: 'span',
		classes: ['token', o.type],
		attributes: {},
		language: language,
		parent: parent
	};

	if (env.type == 'comment') {
		env.attributes['spellcheck'] = 'true';
	}

	if (o.alias) {
		var aliases = _.util.type(o.alias) === 'Array' ? o.alias : [o.alias];
		Array.prototype.push.apply(env.classes, aliases);
	}

	_.hooks.run('wrap', env);

	var attributes = '';

	for (var name in env.attributes) {
		attributes += (attributes ? ' ' : '') + name + '="' + (env.attributes[name] || '') + '"';
	}

	return '<' + env.tag + ' class="' + env.classes.join(' ') + '" ' + attributes + '>' + env.content + '</' + env.tag + '>';

};

if (!_self.document) {
	if (!_self.addEventListener) {
		// in Node.js
		return _self.Prism;
	}
 	// In worker
	_self.addEventListener('message', function(evt) {
		var message = JSON.parse(evt.data),
		    lang = message.language,
		    code = message.code,
		    immediateClose = message.immediateClose;

		_self.postMessage(_.highlight(code, _.languages[lang], lang));
		if (immediateClose) {
			_self.close();
		}
	}, false);

	return _self.Prism;
}

//Get current script and highlight
var script = document.currentScript || [].slice.call(document.getElementsByTagName("script")).pop();

if (script) {
	_.filename = script.src;

	if (document.addEventListener && !script.hasAttribute('data-manual')) {
		document.addEventListener('DOMContentLoaded', _.highlightAll);
	}
}

return _self.Prism;

})();

if (typeof module !== 'undefined' && module.exports) {
	module.exports = Prism;
}

// hack for components to work correctly in node.js
if (typeof global !== 'undefined') {
	global.Prism = Prism;
}
;
Prism.languages.markup = {
	'comment': /<!--[\w\W]*?-->/,
	'prolog': /<\?[\w\W]+?\?>/,
	'doctype': /<!DOCTYPE[\w\W]+?>/,
	'cdata': /<!\[CDATA\[[\w\W]*?]]>/i,
	'tag': {
		pattern: /<\/?(?!\d)[^\s>\/=.$<]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\\1|\\?(?!\1)[\w\W])*\1|[^\s'">=]+))?)*\s*\/?>/i,
		inside: {
			'tag': {
				pattern: /^<\/?[^\s>\/]+/i,
				inside: {
					'punctuation': /^<\/?/,
					'namespace': /^[^\s>\/:]+:/
				}
			},
			'attr-value': {
				pattern: /=(?:('|")[\w\W]*?(\1)|[^\s>]+)/i,
				inside: {
					'punctuation': /[=>"']/
				}
			},
			'punctuation': /\/?>/,
			'attr-name': {
				pattern: /[^\s>\/]+/,
				inside: {
					'namespace': /^[^\s>\/:]+:/
				}
			}

		}
	},
	'entity': /&#?[\da-z]{1,8};/i
};

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function(env) {

	if (env.type === 'entity') {
		env.attributes['title'] = env.content.replace(/&amp;/, '&');
	}
});

Prism.languages.xml = Prism.languages.markup;
Prism.languages.html = Prism.languages.markup;
Prism.languages.mathml = Prism.languages.markup;
Prism.languages.svg = Prism.languages.markup;

Prism.languages.css = {
	'comment': /\/\*[\w\W]*?\*\//,
	'atrule': {
		pattern: /@[\w-]+?.*?(;|(?=\s*\{))/i,
		inside: {
			'rule': /@[\w-]+/
			// See rest below
		}
	},
	'url': /url\((?:(["'])(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
	'selector': /[^\{\}\s][^\{\};]*?(?=\s*\{)/,
	'string': /("|')(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1/,
	'property': /(\b|\B)[\w-]+(?=\s*:)/i,
	'important': /\B!important\b/i,
	'function': /[-a-z0-9]+(?=\()/i,
	'punctuation': /[(){};:]/
};

Prism.languages.css['atrule'].inside.rest = Prism.util.clone(Prism.languages.css);

if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'style': {
			pattern: /(<style[\w\W]*?>)[\w\W]*?(?=<\/style>)/i,
			lookbehind: true,
			inside: Prism.languages.css,
			alias: 'language-css'
		}
	});
	
	Prism.languages.insertBefore('inside', 'attr-value', {
		'style-attr': {
			pattern: /\s*style=("|').*?\1/i,
			inside: {
				'attr-name': {
					pattern: /^\s*style/i,
					inside: Prism.languages.markup.tag.inside
				},
				'punctuation': /^\s*=\s*['"]|['"]\s*$/,
				'attr-value': {
					pattern: /.+/i,
					inside: Prism.languages.css
				}
			},
			alias: 'language-css'
		}
	}, Prism.languages.markup.tag);
};
Prism.languages.clike = {
	'comment': [
		{
			pattern: /(^|[^\\])\/\*[\w\W]*?\*\//,
			lookbehind: true
		},
		{
			pattern: /(^|[^\\:])\/\/.*/,
			lookbehind: true
		}
	],
	'string': /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
	'class-name': {
		pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[a-z0-9_\.\\]+/i,
		lookbehind: true,
		inside: {
			punctuation: /(\.|\\)/
		}
	},
	'keyword': /\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
	'boolean': /\b(true|false)\b/,
	'function': /[a-z0-9_]+(?=\()/i,
	'number': /\b-?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)\b/i,
	'operator': /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
	'punctuation': /[{}[\];(),.:]/
};

Prism.languages.javascript = Prism.languages.extend('clike', {
	'keyword': /\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,
	'number': /\b-?(0x[\dA-Fa-f]+|0b[01]+|0o[0-7]+|\d*\.?\d+([Ee][+-]?\d+)?|NaN|Infinity)\b/,
	// Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
	'function': /[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*(?=\()/i
});

Prism.languages.insertBefore('javascript', 'keyword', {
	'regex': {
		pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/,
		lookbehind: true
	}
});

Prism.languages.insertBefore('javascript', 'class-name', {
	'template-string': {
		pattern: /`(?:\\`|\\?[^`])*`/,
		inside: {
			'interpolation': {
				pattern: /\$\{[^}]+\}/,
				inside: {
					'interpolation-punctuation': {
						pattern: /^\$\{|\}$/,
						alias: 'punctuation'
					},
					rest: Prism.languages.javascript
				}
			},
			'string': /[\s\S]+/
		}
	}
});

if (Prism.languages.markup) {
	Prism.languages.insertBefore('markup', 'tag', {
		'script': {
			pattern: /(<script[\w\W]*?>)[\w\W]*?(?=<\/script>)/i,
			lookbehind: true,
			inside: Prism.languages.javascript,
			alias: 'language-javascript'
		}
	});
}

Prism.languages.js = Prism.languages.javascript;
Prism.languages.c = Prism.languages.extend('clike', {
	'keyword': /\b(asm|typeof|inline|auto|break|case|char|const|continue|default|do|double|else|enum|extern|float|for|goto|if|int|long|register|return|short|signed|sizeof|static|struct|switch|typedef|union|unsigned|void|volatile|while)\b/,
	'operator': /\-[>-]?|\+\+?|!=?|<<?=?|>>?=?|==?|&&?|\|?\||[~^%?*\/]/,
	'number': /\b-?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)[ful]*\b/i
});

Prism.languages.insertBefore('c', 'string', {
	'macro': {
		// allow for multiline macro definitions
		// spaces after the # character compile fine with gcc
		pattern: /(^\s*)#\s*[a-z]+([^\r\n\\]|\\.|\\(?:\r\n?|\n))*/im,
		lookbehind: true,
		alias: 'property',
		inside: {
			// highlight the path of the include statement as a string
			'string': {
				pattern: /(#\s*include\s*)(<.+?>|("|')(\\?.)+?\3)/,
				lookbehind: true
			},
			// highlight macro directives as keywords
			'directive': {
				pattern: /(#\s*)\b(define|elif|else|endif|error|ifdef|ifndef|if|import|include|line|pragma|undef|using)\b/,
				lookbehind: true,
				alias: 'keyword'
			}
		}
	},
	// highlight predefined macros as constants
	'constant': /\b(__FILE__|__LINE__|__DATE__|__TIME__|__TIMESTAMP__|__func__|EOF|NULL|stdin|stdout|stderr)\b/
});

delete Prism.languages.c['class-name'];
delete Prism.languages.c['boolean'];

Prism.languages.csharp = Prism.languages.extend('clike', {
	'keyword': /\b(abstract|as|async|await|base|bool|break|byte|case|catch|char|checked|class|const|continue|decimal|default|delegate|do|double|else|enum|event|explicit|extern|false|finally|fixed|float|for|foreach|goto|if|implicit|in|int|interface|internal|is|lock|long|namespace|new|null|object|operator|out|override|params|private|protected|public|readonly|ref|return|sbyte|sealed|short|sizeof|stackalloc|static|string|struct|switch|this|throw|true|try|typeof|uint|ulong|unchecked|unsafe|ushort|using|virtual|void|volatile|while|add|alias|ascending|async|await|descending|dynamic|from|get|global|group|into|join|let|orderby|partial|remove|select|set|value|var|where|yield)\b/,
	'string': [
		/@("|')(\1\1|\\\1|\\?(?!\1)[\s\S])*\1/,
		/("|')(\\?.)*?\1/
	],
	'number': /\b-?(0x[\da-f]+|\d*\.?\d+f?)\b/i
});

Prism.languages.insertBefore('csharp', 'keyword', {
	'preprocessor': {
		pattern: /(^\s*)#.*/m,
		lookbehind: true,
		alias: 'property',
		inside: {
			// highlight preprocessor directives as keywords
			'directive': {
				pattern: /(\s*#)\b(define|elif|else|endif|endregion|error|if|line|pragma|region|undef|warning)\b/,
				lookbehind: true,
				alias: 'keyword'
			}
		}
	}
});

Prism.languages.cpp = Prism.languages.extend('c', {
	'keyword': /\b(alignas|alignof|asm|auto|bool|break|case|catch|char|char16_t|char32_t|class|compl|const|constexpr|const_cast|continue|decltype|default|delete|do|double|dynamic_cast|else|enum|explicit|export|extern|float|for|friend|goto|if|inline|int|long|mutable|namespace|new|noexcept|nullptr|operator|private|protected|public|register|reinterpret_cast|return|short|signed|sizeof|static|static_assert|static_cast|struct|switch|template|this|thread_local|throw|try|typedef|typeid|typename|union|unsigned|using|virtual|void|volatile|wchar_t|while)\b/,
	'boolean': /\b(true|false)\b/,
	'operator': /[-+]{1,2}|!=?|<{1,2}=?|>{1,2}=?|\->|:{1,2}|={1,2}|\^|~|%|&{1,2}|\|?\||\?|\*|\/|\b(and|and_eq|bitand|bitor|not|not_eq|or|or_eq|xor|xor_eq)\b/
});

Prism.languages.insertBefore('cpp', 'keyword', {
	'class-name': {
		pattern: /(class\s+)[a-z0-9_]+/i,
		lookbehind: true
	}
});
/**
 * Original by Samuel Flores
 *
 * Adds the following new token classes:
 * 		constant, builtin, variable, symbol, regex
 */
(function(Prism) {
	Prism.languages.ruby = Prism.languages.extend('clike', {
		'comment': /#(?!\{[^\r\n]*?\}).*/,
		'keyword': /\b(alias|and|BEGIN|begin|break|case|class|def|define_method|defined|do|each|else|elsif|END|end|ensure|false|for|if|in|module|new|next|nil|not|or|raise|redo|require|rescue|retry|return|self|super|then|throw|true|undef|unless|until|when|while|yield)\b/
	});

	var interpolation = {
		pattern: /#\{[^}]+\}/,
		inside: {
			'delimiter': {
				pattern: /^#\{|\}$/,
				alias: 'tag'
			},
			rest: Prism.util.clone(Prism.languages.ruby)
		}
	};

	Prism.languages.insertBefore('ruby', 'keyword', {
		'regex': [
			{
				pattern: /%r([^a-zA-Z0-9\s\{\(\[<])(?:[^\\]|\\[\s\S])*?\1[gim]{0,3}/,
				inside: {
					'interpolation': interpolation
				}
			},
			{
				pattern: /%r\((?:[^()\\]|\\[\s\S])*\)[gim]{0,3}/,
				inside: {
					'interpolation': interpolation
				}
			},
			{
				// Here we need to specifically allow interpolation
				pattern: /%r\{(?:[^#{}\\]|#(?:\{[^}]+\})?|\\[\s\S])*\}[gim]{0,3}/,
				inside: {
					'interpolation': interpolation
				}
			},
			{
				pattern: /%r\[(?:[^\[\]\\]|\\[\s\S])*\][gim]{0,3}/,
				inside: {
					'interpolation': interpolation
				}
			},
			{
				pattern: /%r<(?:[^<>\\]|\\[\s\S])*>[gim]{0,3}/,
				inside: {
					'interpolation': interpolation
				}
			},
			{
				pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\r\n])+\/[gim]{0,3}(?=\s*($|[\r\n,.;})]))/,
				lookbehind: true
			}
		],
		'variable': /[@$]+[a-zA-Z_][a-zA-Z_0-9]*(?:[?!]|\b)/,
		'symbol': /:[a-zA-Z_][a-zA-Z_0-9]*(?:[?!]|\b)/
	});

	Prism.languages.insertBefore('ruby', 'number', {
		'builtin': /\b(Array|Bignum|Binding|Class|Continuation|Dir|Exception|FalseClass|File|Stat|File|Fixnum|Fload|Hash|Integer|IO|MatchData|Method|Module|NilClass|Numeric|Object|Proc|Range|Regexp|String|Struct|TMS|Symbol|ThreadGroup|Thread|Time|TrueClass)\b/,
		'constant': /\b[A-Z][a-zA-Z_0-9]*(?:[?!]|\b)/
	});

	Prism.languages.ruby.string = [
		{
			pattern: /%[qQiIwWxs]?([^a-zA-Z0-9\s\{\(\[<])(?:[^\\]|\\[\s\S])*?\1/,
			inside: {
				'interpolation': interpolation
			}
		},
		{
			pattern: /%[qQiIwWxs]?\((?:[^()\\]|\\[\s\S])*\)/,
			inside: {
				'interpolation': interpolation
			}
		},
		{
			// Here we need to specifically allow interpolation
			pattern: /%[qQiIwWxs]?\{(?:[^#{}\\]|#(?:\{[^}]+\})?|\\[\s\S])*\}/,
			inside: {
				'interpolation': interpolation
			}
		},
		{
			pattern: /%[qQiIwWxs]?\[(?:[^\[\]\\]|\\[\s\S])*\]/,
			inside: {
				'interpolation': interpolation
			}
		},
		{
			pattern: /%[qQiIwWxs]?<(?:[^<>\\]|\\[\s\S])*>/,
			inside: {
				'interpolation': interpolation
			}
		},
		{
			pattern: /("|')(#\{[^}]+\}|\\(?:\r?\n|\r)|\\?.)*?\1/,
			inside: {
				'interpolation': interpolation
			}
		}
	];
}(Prism));
Prism.languages.elixir = {
	// Negative look-ahead is needed for string interpolation
	// Negative look-behind is needed to avoid highlighting markdown headers in
	// multi-line doc strings
	'comment': {
		pattern: /(^|[^#])#(?![{#]).*/m,
		lookbehind: true
	},
	// ~r"""foo""", ~r'''foo''', ~r/foo/, ~r|foo|, ~r"foo", ~r'foo', ~r(foo), ~r[foo], ~r{foo}, ~r<foo>
	'regex': /~[rR](?:("""|'''|[\/|"'])(?:\\.|(?!\1)[^\\])+\1|\((?:\\\)|[^)])+\)|\[(?:\\\]|[^\]])+\]|\{(?:\\\}|[^}])+\}|<(?:\\>|[^>])+>)[uismxfr]*/,
	'string': [
		{
			// ~s"""foo""", ~s'''foo''', ~s/foo/, ~s|foo|, ~s"foo", ~s'foo', ~s(foo), ~s[foo], ~s{foo}, ~s<foo>
			pattern: /~[cCsSwW](?:("""|'''|[\/|"'])(?:\\.|(?!\1)[^\\])+\1|\((?:\\\)|[^)])+\)|\[(?:\\\]|[^\]])+\]|\{(?:\\\}|#\{[^}]+\}|[^}])+\}|<(?:\\>|[^>])+>)[csa]?/,
			inside: {
				// See interpolation below
			}
		},
		{
			pattern: /("""|''')[\s\S]*?\1/,
			inside: {
				// See interpolation below
			}
		},
		{
			// Multi-line strings are allowed
			pattern: /("|')(?:\\[\s\S]|(?!\1)[^\\])*\1/,
			inside: {
				// See interpolation below
			}
		}
	],
	'atom': {
		// Look-behind prevents bad highlighting of the :: operator
		pattern: /(^|[^:]):\w+/,
		lookbehind: true,
		alias: 'symbol'
	},
	// Look-ahead prevents bad highlighting of the :: operator
	'attr-name': /\w+:(?!:)/,
	'capture': {
		// Look-behind prevents bad highlighting of the && operator
		pattern: /(^|[^&])&(?:[^&\s\d()][^\s()]*|(?=\())/,
		lookbehind: true,
		alias: 'function'
	},
	'argument': {
		// Look-behind prevents bad highlighting of the && operator
		pattern: /(^|[^&])&\d+/,
		lookbehind: true,
		alias: 'variable'
	},
	'attribute': {
		pattern: /@[\S]+/,
		alias: 'variable'
	},
	'number': /\b(?:0[box][a-f\d_]+|\d[\d_]*)(?:\.[\d_]+)?(?:e[+-]?[\d_]+)?\b/i,
	'keyword': /\b(?:after|alias|and|case|catch|cond|def(?:callback|exception|impl|module|p|protocol|struct)?|do|else|end|fn|for|if|import|not|or|require|rescue|try|unless|use|when)\b/,
	'boolean': /\b(?:true|false|nil)\b/,
	'operator': [
		/\bin\b|&&?|\|[|>]?|\\\\|::|\.\.\.?|\+\+?|-[->]?|<[-=>]|>=|!==?|\B!|=(?:==?|[>~])?|[*\/^]/,
		{
			// We don't want to match <<
			pattern: /([^<])<(?!<)/,
			lookbehind: true
		},
		{
			// We don't want to match >>
			pattern: /([^>])>(?!>)/,
			lookbehind: true
		}
	],
	'punctuation': /<<|>>|[.,%\[\]{}()]/
};

Prism.languages.elixir.string.forEach(function(o) {
	o.inside = {
		'interpolation': {
			pattern: /#\{[^}]+\}/,
			inside: {
				'delimiter': {
					pattern: /^#\{|\}$/,
					alias: 'punctuation'
				},
				rest: Prism.util.clone(Prism.languages.elixir)
			}
		}
	};
});


Prism.languages.erlang = {
	'comment': /%.+/,
	'string': /"(?:\\?.)*?"/,
	'quoted-function': {
		pattern: /'(?:\\.|[^'\\])+'(?=\()/,
		alias: 'function'
	},
	'quoted-atom': {
		pattern: /'(?:\\.|[^'\\])+'/,
		alias: 'atom'
	},
	'boolean': /\b(?:true|false)\b/,
	'keyword': /\b(?:fun|when|case|of|end|if|receive|after|try|catch)\b/,
	'number': [
		/\$\\?./,
		/\d+#[a-z0-9]+/i,
		/(?:\b|-)\d*\.?\d+([Ee][+-]?\d+)?\b/
	],
	'function': /\b[a-z][\w@]*(?=\()/,
	'variable': {
		// Look-behind is used to prevent wrong highlighting of atoms containing "@"
		pattern: /(^|[^@])(?:\b|\?)[A-Z_][\w@]*/,
		lookbehind: true
	},
	'operator': [
		/[=\/<>:]=|=[:\/]=|\+\+?|--?|[=*\/!]|\b(?:bnot|div|rem|band|bor|bxor|bsl|bsr|not|and|or|xor|orelse|andalso)\b/,
		{
			// We don't want to match <<
			pattern: /(^|[^<])<(?!<)/,
			lookbehind: true
		},
		{
			// We don't want to match >>
			pattern: /(^|[^>])>(?!>)/,
			lookbehind: true
		}
	],
	'atom': /\b[a-z][\w@]*/,
	'punctuation': /[()[\]{}:;,.#|]|<<|>>/

};
Prism.languages.glsl = Prism.languages.extend('clike', {
	'comment': [
		/\/\*[\w\W]*?\*\//,
		/\/\/(?:\\(?:\r\n|[\s\S])|.)*/
	],
	'number': /\b(?:0x[\da-f]+|(?:\.\d+|\d+\.?\d*)(?:e[+-]?\d+)?)[ulf]*\b/i,
	'keyword': /\b(?:attribute|const|uniform|varying|buffer|shared|coherent|volatile|restrict|readonly|writeonly|atomic_uint|layout|centroid|flat|smooth|noperspective|patch|sample|break|continue|do|for|while|switch|case|default|if|else|subroutine|in|out|inout|float|double|int|void|bool|true|false|invariant|precise|discard|return|d?mat[234](?:x[234])?|[ibdu]?vec[234]|uint|lowp|mediump|highp|precision|[iu]?sampler[123]D|[iu]?samplerCube|sampler[12]DShadow|samplerCubeShadow|[iu]?sampler[12]DArray|sampler[12]DArrayShadow|[iu]?sampler2DRect|sampler2DRectShadow|[iu]?samplerBuffer|[iu]?sampler2DMS(?:Array)?|[iu]?samplerCubeArray|samplerCubeArrayShadow|[iu]?image[123]D|[iu]?image2DRect|[iu]?imageCube|[iu]?imageBuffer|[iu]?image[12]DArray|[iu]?imageCubeArray|[iu]?image2DMS(?:Array)?|struct|common|partition|active|asm|class|union|enum|typedef|template|this|resource|goto|inline|noinline|public|static|extern|external|interface|long|short|half|fixed|unsigned|superp|input|output|hvec[234]|fvec[234]|sampler3DRect|filter|sizeof|cast|namespace|using)\b/
});

Prism.languages.insertBefore('glsl', 'comment', {
	'preprocessor': {
		pattern: /(^[ \t]*)#(?:(?:define|undef|if|ifdef|ifndef|else|elif|endif|error|pragma|extension|version|line)\b)?/m,
		lookbehind: true,
		alias: 'builtin'
	}
});
Prism.languages.go = Prism.languages.extend('clike', {
	'keyword': /\b(break|case|chan|const|continue|default|defer|else|fallthrough|for|func|go(to)?|if|import|interface|map|package|range|return|select|struct|switch|type|var)\b/,
	'builtin': /\b(bool|byte|complex(64|128)|error|float(32|64)|rune|string|u?int(8|16|32|64|)|uintptr|append|cap|close|complex|copy|delete|imag|len|make|new|panic|print(ln)?|real|recover)\b/,
	'boolean': /\b(_|iota|nil|true|false)\b/,
	'operator': /[*\/%^!=]=?|\+[=+]?|-[=-]?|\|[=|]?|&(?:=|&|\^=?)?|>(?:>=?|=)?|<(?:<=?|=|-)?|:=|\.\.\./,
	'number': /\b(-?(0x[a-f\d]+|(\d+\.?\d*|\.\d+)(e[-+]?\d+)?)i?)\b/i,
	'string': /("|'|`)(\\?.|\r|\n)*?\1/
});
delete Prism.languages.go['class-name'];

Prism.languages.java = Prism.languages.extend('clike', {
	'keyword': /\b(abstract|continue|for|new|switch|assert|default|goto|package|synchronized|boolean|do|if|private|this|break|double|implements|protected|throw|byte|else|import|public|throws|case|enum|instanceof|return|transient|catch|extends|int|short|try|char|final|interface|static|void|class|finally|long|strictfp|volatile|const|float|native|super|while)\b/,
	'number': /\b0b[01]+\b|\b0x[\da-f]*\.?[\da-fp\-]+\b|\b\d*\.?\d+(?:e[+-]?\d+)?[df]?\b/i,
	'operator': {
		pattern: /(^|[^.])(?:\+[+=]?|-[-=]?|!=?|<<?=?|>>?>?=?|==?|&[&=]?|\|[|=]?|\*=?|\/=?|%=?|\^=?|[?:~])/m,
		lookbehind: true
	}
});
Prism.languages.processing = Prism.languages.extend('clike', {
	'keyword': /\b(?:break|catch|case|class|continue|default|else|extends|final|for|if|implements|import|new|null|private|public|return|static|super|switch|this|try|void|while)\b/,
	'operator': /<[<=]?|>[>=]?|&&?|\|\|?|[%?]|[!=+\-*\/]=?/
});
Prism.languages.insertBefore('processing', 'number', {
	// Special case: XML is a type
	'constant': /\b(?!XML\b)[A-Z][A-Z\d_]+\b/,
	'type': {
		pattern: /\b(?:boolean|byte|char|color|double|float|int|XML|[A-Z][A-Za-z\d_]*)\b/,
		alias: 'variable'
	}
});

// Spaces are allowed between function name and parenthesis
Prism.languages.processing['function'].pattern = /[a-z0-9_]+(?=\s*\()/i;

// Class-names is not styled by default
Prism.languages.processing['class-name'].alias = 'variable';
Prism.languages.python= {
	'triple-quoted-string': {
		pattern: /"""[\s\S]+?"""|'''[\s\S]+?'''/,
		alias: 'string'
	},
	'comment': {
		pattern: /(^|[^\\])#.*/,
		lookbehind: true
	},
	'string': /("|')(?:\\?.)*?\1/,
	'function' : {
		pattern: /((?:^|\s)def[ \t]+)[a-zA-Z_][a-zA-Z0-9_]*(?=\()/g,
		lookbehind: true
	},
	'class-name': {
		pattern: /(\bclass\s+)[a-z0-9_]+/i,
		lookbehind: true
	},
	'keyword' : /\b(?:as|assert|async|await|break|class|continue|def|del|elif|else|except|exec|finally|for|from|global|if|import|in|is|lambda|pass|print|raise|return|try|while|with|yield)\b/,
	'boolean' : /\b(?:True|False)\b/,
	'number' : /\b-?(?:0[bo])?(?:(?:\d|0x[\da-f])[\da-f]*\.?\d*|\.\d+)(?:e[+-]?\d+)?j?\b/i,
	'operator' : /[-+%=]=?|!=|\*\*?=?|\/\/?=?|<[<=>]?|>[=>]?|[&|^~]|\b(?:or|and|not)\b/,
	'punctuation' : /[{}[\];(),.:]/
};

Prism.languages.scala = Prism.languages.extend('java', {
	'keyword': /<-|=>|\b(?:abstract|case|catch|class|def|do|else|extends|final|finally|for|forSome|if|implicit|import|lazy|match|new|null|object|override|package|private|protected|return|sealed|self|super|this|throw|trait|try|type|val|var|while|with|yield)\b/,
	'string': /"""[\W\w]*?"""|"(?:[^"\\\r\n]|\\.)*"|'(?:[^\\\r\n']|\\.[^\\']*)'/,
	'builtin': /\b(?:String|Int|Long|Short|Byte|Boolean|Double|Float|Char|Any|AnyRef|AnyVal|Unit|Nothing)\b/,
	'number': /\b(?:0x[\da-f]*\.?[\da-f]+|\d*\.?\d+e?\d*[dfl]?)\b/i,
	'symbol': /'[^\d\s\\]\w*/
});
delete Prism.languages.scala['class-name'];
delete Prism.languages.scala['function'];

(function(){

if (typeof self === 'undefined' || !self.Prism || !self.document || !document.querySelector) {
	return;
}

function $$(expr, con) {
	return Array.prototype.slice.call((con || document).querySelectorAll(expr));
}

function hasClass(element, className) {
  className = " " + className + " ";
  return (" " + element.className + " ").replace(/[\n\t]/g, " ").indexOf(className) > -1
}

// Some browsers round the line-height, others don't.
// We need to test for it to position the elements properly.
var isLineHeightRounded = (function() {
	var res;
	return function() {
		if(typeof res === 'undefined') {
			var d = document.createElement('div');
			d.style.fontSize = '13px';
			d.style.lineHeight = '1.5';
			d.style.padding = 0;
			d.style.border = 0;
			d.innerHTML = '&nbsp;<br />&nbsp;';
			document.body.appendChild(d);
			// Browsers that round the line-height should have offsetHeight === 38
			// The others should have 39.
			res = d.offsetHeight === 38;
			document.body.removeChild(d);
		}
		return res;
	}
}());

function highlightLines(pre, lines, classes) {
	var ranges = lines.replace(/\s+/g, '').split(','),
	    offset = +pre.getAttribute('data-line-offset') || 0;

	var parseMethod = isLineHeightRounded() ? parseInt : parseFloat;
	var lineHeight = parseMethod(getComputedStyle(pre).lineHeight);

	for (var i=0, range; range = ranges[i++];) {
		range = range.split('-');
					
		var start = +range[0],
		    end = +range[1] || start;
		
		var line = document.createElement('div');
		
		line.textContent = Array(end - start + 2).join(' \n');
		line.className = (classes || '') + ' line-highlight';

    //if the line-numbers plugin is enabled, then there is no reason for this plugin to display the line numbers
    if(!hasClass(pre, 'line-numbers')) {
      line.setAttribute('data-start', start);

      if(end > start) {
        line.setAttribute('data-end', end);
      }
    }

		line.style.top = (start - offset - 1) * lineHeight + 'px';

    //allow this to play nicely with the line-numbers plugin
    if(hasClass(pre, 'line-numbers')) {
      //need to attack to pre as when line-numbers is enabled, the code tag is relatively which screws up the positioning
      pre.appendChild(line);
    } else {
      (pre.querySelector('code') || pre).appendChild(line);
    }
	}
}

function applyHash() {
	var hash = location.hash.slice(1);
	
	// Remove pre-existing temporary lines
	$$('.temporary.line-highlight').forEach(function (line) {
		line.parentNode.removeChild(line);
	});
	
	var range = (hash.match(/\.([\d,-]+)$/) || [,''])[1];
	
	if (!range || document.getElementById(hash)) {
		return;
	}
	
	var id = hash.slice(0, hash.lastIndexOf('.')),
	    pre = document.getElementById(id);
	    
	if (!pre) {
		return;
	}
	
	if (!pre.hasAttribute('data-line')) {
		pre.setAttribute('data-line', '');
	}

	highlightLines(pre, range, 'temporary ');

	document.querySelector('.temporary.line-highlight').scrollIntoView();
}

var fakeTimer = 0; // Hack to limit the number of times applyHash() runs

Prism.hooks.add('complete', function(env) {
	var pre = env.element.parentNode;
	var lines = pre && pre.getAttribute('data-line');
	
	if (!pre || !lines || !/pre/i.test(pre.nodeName)) {
		return;
	}
	
	clearTimeout(fakeTimer);
	
	$$('.line-highlight', pre).forEach(function (line) {
		line.parentNode.removeChild(line);
	});
	
	highlightLines(pre, lines);
	
	fakeTimer = setTimeout(applyHash, 1);
});

if(window.addEventListener) {
	window.addEventListener('hashchange', applyHash);
}

})();

(function() {

if (typeof self === 'undefined' || !self.Prism || !self.document) {
	return;
}

Prism.hooks.add('complete', function (env) {
	if (!env.code) {
		return;
	}

	// works only for <code> wrapped inside <pre> (not inline)
	var pre = env.element.parentNode;
	var clsReg = /\s*\bline-numbers\b\s*/;
	if (
		!pre || !/pre/i.test(pre.nodeName) ||
			// Abort only if nor the <pre> nor the <code> have the class
		(!clsReg.test(pre.className) && !clsReg.test(env.element.className))
	) {
		return;
	}

	if (env.element.querySelector(".line-numbers-rows")) {
		// Abort if line numbers already exists
		return;
	}

	if (clsReg.test(env.element.className)) {
		// Remove the class "line-numbers" from the <code>
		env.element.className = env.element.className.replace(clsReg, '');
	}
	if (!clsReg.test(pre.className)) {
		// Add the class "line-numbers" to the <pre>
		pre.className += ' line-numbers';
	}

	var match = env.code.match(/\n(?!$)/g);
	var linesNum = match ? match.length + 1 : 1;
	var lineNumbersWrapper;

	var lines = new Array(linesNum + 1);
	lines = lines.join('<span></span>');

	lineNumbersWrapper = document.createElement('span');
	lineNumbersWrapper.className = 'line-numbers-rows';
	lineNumbersWrapper.innerHTML = lines;

	if (pre.hasAttribute('data-start')) {
		pre.style.counterReset = 'linenumber ' + (parseInt(pre.getAttribute('data-start'), 10) - 1);
	}

	env.element.appendChild(lineNumbersWrapper);

});

}());
(function(){

if (
	typeof self !== 'undefined' && !self.Prism ||
	typeof global !== 'undefined' && !global.Prism
) {
	return;
}

for (var language in Prism.languages) {
	var tokens = Prism.languages[language];
	
    tokens.tab = /\t/g;
    tokens.crlf = /\r\n/g;
    tokens.lf = /\n/g;
	tokens.cr = /\r/g;
}

})();

(function(){

if (
	typeof self !== 'undefined' && !self.Prism ||
	typeof global !== 'undefined' && !global.Prism
) {
	return;
}

var url = /\b([a-z]{3,7}:\/\/|tel:)[\w\-+%~/.:#=?&amp;]+/,
    email = /\b\S+@[\w.]+[a-z]{2}/,
    linkMd = /\[([^\]]+)]\(([^)]+)\)/,
    
	// Tokens that may contain URLs and emails
    candidates = ['comment', 'url', 'attr-value', 'string'];

Prism.hooks.add('before-highlight', function(env) {
	// Abort if grammar has already been processed
	if (!env.grammar || env.grammar['url-link']) {
		return;
	}
	Prism.languages.DFS(env.grammar, function (key, def, type) {
		if (candidates.indexOf(type) > -1 && Prism.util.type(def) !== 'Array') {
			if (!def.pattern) {
				def = this[key] = {
					pattern: def
				};
			}

			def.inside = def.inside || {};

			if (type == 'comment') {
				def.inside['md-link'] = linkMd;
			}
			if (type == 'attr-value') {
				Prism.languages.insertBefore('inside', 'punctuation', { 'url-link': url }, def);
			}
			else {
				def.inside['url-link'] = url;
			}

			def.inside['email-link'] = email;
		}
	});
	env.grammar['url-link'] = url;
	env.grammar['email-link'] = email;
});

Prism.hooks.add('wrap', function(env) {
	if (/-link$/.test(env.type)) {
		env.tag = 'a';
		
		var href = env.content;
		
		if (env.type == 'email-link' && href.indexOf('mailto:') != 0) {
			href = 'mailto:' + href;
		}
		else if (env.type == 'md-link') {
			// Markdown
			var match = env.content.match(linkMd);
			
			href = match[2];
			env.content = match[1];
		}
		
		env.attributes.href = href;
	}
});

})();
(function(){

if (
	typeof self !== 'undefined' && !self.Prism ||
	typeof global !== 'undefined' && !global.Prism
) {
	return;
}

if (Prism.languages.css) {
	Prism.languages.css.atrule.inside['atrule-id'] = /^@[\w-]+/;
	
	// check whether the selector is an advanced pattern before extending it
	if (Prism.languages.css.selector.pattern)
	{
		Prism.languages.css.selector.inside['pseudo-class'] = /:[\w-]+/;
		Prism.languages.css.selector.inside['pseudo-element'] = /::[\w-]+/;
	}
	else
	{
		Prism.languages.css.selector = {
			pattern: Prism.languages.css.selector,
			inside: {
				'pseudo-class': /:[\w-]+/,
				'pseudo-element': /::[\w-]+/
			}
		};
	}
}

if (Prism.languages.markup) {
	Prism.languages.markup.tag.inside.tag.inside['tag-id'] = /[\w-]+/;
	
	var Tags = {
		HTML: {
			'a': 1, 'abbr': 1, 'acronym': 1, 'b': 1, 'basefont': 1, 'bdo': 1, 'big': 1, 'blink': 1, 'cite': 1, 'code': 1, 'dfn': 1, 'em': 1, 'kbd': 1,  'i': 1, 
			'rp': 1, 'rt': 1, 'ruby': 1, 's': 1, 'samp': 1, 'small': 1, 'spacer': 1, 'strike': 1, 'strong': 1, 'sub': 1, 'sup': 1, 'time': 1, 'tt': 1,  'u': 1, 
			'var': 1, 'wbr': 1, 'noframes': 1, 'summary': 1, 'command': 1, 'dt': 1, 'dd': 1, 'figure': 1, 'figcaption': 1, 'center': 1, 'section': 1, 'nav': 1,
			'article': 1, 'aside': 1, 'hgroup': 1, 'header': 1, 'footer': 1, 'address': 1, 'noscript': 1, 'isIndex': 1, 'main': 1, 'mark': 1, 'marquee': 1,
			'meter': 1, 'menu': 1
		},
		SVG: {
			'animateColor': 1, 'animateMotion': 1, 'animateTransform': 1, 'glyph': 1, 'feBlend': 1, 'feColorMatrix': 1, 'feComponentTransfer': 1, 
			'feFuncR': 1, 'feFuncG': 1, 'feFuncB': 1, 'feFuncA': 1, 'feComposite': 1, 'feConvolveMatrix': 1, 'feDiffuseLighting': 1, 'feDisplacementMap': 1, 
			'feFlood': 1, 'feGaussianBlur': 1, 'feImage': 1, 'feMerge': 1, 'feMergeNode': 1, 'feMorphology': 1, 'feOffset': 1, 'feSpecularLighting': 1, 
			'feTile': 1, 'feTurbulence': 1, 'feDistantLight': 1, 'fePointLight': 1, 'feSpotLight': 1, 'linearGradient': 1, 'radialGradient': 1, 'altGlyph': 1, 
			'textPath': 1, 'tref': 1, 'altglyph': 1, 'textpath': 1, 'altglyphdef': 1, 'altglyphitem': 1, 'clipPath': 1, 'color-profile': 1, 'cursor': 1,
			'font-face': 1, 'font-face-format': 1, 'font-face-name': 1, 'font-face-src': 1, 'font-face-uri': 1, 'foreignObject': 1, 'glyphRef': 1,
			'hkern': 1, 'vkern': 1
		},
		MathML: {}
	}
}

var language;

Prism.hooks.add('wrap', function(env) {
	if ((env.type == 'tag-id'
		|| (env.type == 'property' && env.content.indexOf('-') != 0)
		|| (env.type == 'atrule-id'&& env.content.indexOf('@-') != 0)
		|| (env.type == 'pseudo-class'&& env.content.indexOf(':-') != 0) 
		|| (env.type == 'pseudo-element'&& env.content.indexOf('::-') != 0) 
	    || (env.type == 'attr-name' && env.content.indexOf('data-') != 0)
	    ) && env.content.indexOf('<') === -1
	) {
		var searchURL = 'w/index.php?fulltext&search=';

		env.tag = 'a';
		
		var href = 'http://docs.webplatform.org/';
		
		if (env.language == 'css' || env.language == 'scss') {
			href += 'wiki/css/';
			
			if (env.type == 'property') {
				href += 'properties/';
			}
			else if (env.type == 'atrule-id') {
				href += 'atrules/';
			}
			else if (env.type == 'pseudo-class') {
				href += 'selectors/pseudo-classes/';
			}
			else if (env.type == 'pseudo-element') {
				href += 'selectors/pseudo-elements/';
			}
		}
		else if (env.language == 'markup') {
			if (env.type == 'tag-id') {
				// Check language
				language = getLanguage(env.content) || language;
				
				if (language) {
					href += 'wiki/' + language + '/elements/';
				}
				else {
					href += searchURL;
				}
			}
			else if (env.type == 'attr-name') {
				if (language) {
					href += 'wiki/' + language + '/attributes/';
				}
				else {
					href += searchURL;
				}
			}
		}
		
		href += env.content;
		
		env.attributes.href = href;
		env.attributes.target = '_blank';
	}
});

function getLanguage(tag) {
	var tagL = tag.toLowerCase();
	
	if (Tags.HTML[tagL]) {
		return 'html';
	}
	else if (Tags.SVG[tag]) {
		return 'svg';
	}
	else if (Tags.MathML[tag]) {
		return 'mathml';
	}
	
	// Not in dictionary, perform check
	if (Tags.HTML[tagL] !== 0 && typeof document !== 'undefined') {
		var htmlInterface = (document.createElement(tag).toString().match(/\[object HTML(.+)Element\]/) || [])[1];
		
		if (htmlInterface && htmlInterface != 'Unknown') {
			Tags.HTML[tagL] = 1;
			return 'html';
		}
	}
	
	Tags.HTML[tagL] = 0;
	
	if (Tags.SVG[tag] !== 0 && typeof document !== 'undefined') {
		var svgInterface = (document.createElementNS('http://www.w3.org/2000/svg', tag).toString().match(/\[object SVG(.+)Element\]/) || [])[1];
		
		if (svgInterface && svgInterface != 'Unknown') {
			Tags.SVG[tag] = 1;
			return 'svg';
		}
	}
	
	Tags.SVG[tag] = 0;
	
	// Lame way to detect MathML, but browsers don’t expose interface names there :(
	if (Tags.MathML[tag] !== 0) {
		if (tag.indexOf('m') === 0) {
			Tags.MathML[tag] = 1;
			return 'mathml';
		}
	}
	
	Tags.MathML[tag] = 0;
	
	return null;
}

})();
(function () {
	if (typeof self === 'undefined' || !self.Prism || !self.document || !document.querySelector) {
		return;
	}

	self.Prism.fileHighlight = function() {

		var Extensions = {
			'js': 'javascript',
			'html': 'markup',
			'svg': 'markup',
			'xml': 'markup',
			'py': 'python',
			'rb': 'ruby',
			'ps1': 'powershell',
			'psm1': 'powershell'
		};

		if(Array.prototype.forEach) { // Check to prevent error in IE8
			Array.prototype.slice.call(document.querySelectorAll('pre[data-src]')).forEach(function (pre) {
				var src = pre.getAttribute('data-src');

				var language, parent = pre;
				var lang = /\blang(?:uage)?-(?!\*)(\w+)\b/i;
				while (parent && !lang.test(parent.className)) {
					parent = parent.parentNode;
				}

				if (parent) {
					language = (pre.className.match(lang) || [, ''])[1];
				}

				if (!language) {
					var extension = (src.match(/\.(\w+)$/) || [, ''])[1];
					language = Extensions[extension] || extension;
				}

				var code = document.createElement('code');
				code.className = 'language-' + language;

				pre.textContent = '';

				code.textContent = 'Loading…';

				pre.appendChild(code);

				var xhr = new XMLHttpRequest();

				xhr.open('GET', src, true);

				xhr.onreadystatechange = function () {
					if (xhr.readyState == 4) {

						if (xhr.status < 400 && xhr.responseText) {
							code.textContent = xhr.responseText;

							Prism.highlightElement(code);
						}
						else if (xhr.status >= 400) {
							code.textContent = '✖ Error ' + xhr.status + ' while fetching file: ' + xhr.statusText;
						}
						else {
							code.textContent = '✖ Error: File does not exist or is empty';
						}
					}
				};

				xhr.send(null);
			});
		}

	};

	document.addEventListener('DOMContentLoaded', self.Prism.fileHighlight);

})();

(function(){

if (typeof self === 'undefined' || !self.Prism || !self.document) {
	return;
}

// The languages map is built automatically with gulp
var Languages = /*languages_placeholder[*/{"css":"CSS","clike":"C-like","javascript":"JavaScript","abap":"ABAP","actionscript":"ActionScript","apacheconf":"Apache Configuration","apl":"APL","applescript":"AppleScript","asciidoc":"AsciiDoc","aspnet":"ASP.NET (C#)","autoit":"AutoIt","autohotkey":"AutoHotkey","basic":"BASIC","csharp":"C#","cpp":"C++","coffeescript":"CoffeeScript","css-extras":"CSS Extras","fsharp":"F#","glsl":"GLSL","http":"HTTP","inform7":"Inform 7","json":"JSON","latex":"LaTeX","lolcode":"LOLCODE","matlab":"MATLAB","mel":"MEL","nasm":"NASM","nginx":"nginx","nsis":"NSIS","objectivec":"Objective-C","ocaml":"OCaml","parigp":"PARI/GP","php":"PHP","php-extras":"PHP Extras","powershell":"PowerShell","jsx":"React JSX","rest":"reST (reStructuredText)","sas":"SAS","sass":"Sass (Sass)","scss":"Sass (Scss)","sql":"SQL","typescript":"TypeScript","vhdl":"VHDL","vim":"vim","wiki":"Wiki markup","yaml":"YAML"}/*]*/;
Prism.hooks.add('before-highlight', function(env) {
	var pre = env.element.parentNode;
	if (!pre || !/pre/i.test(pre.nodeName)) {
		return;
	}
	var language = pre.getAttribute('data-language') || Languages[env.language] || (env.language.substring(0, 1).toUpperCase() + env.language.substring(1));

	/* check if the divs already exist */
	var sib = pre.previousSibling;
	var div, div2;
	if (sib && /\s*\bprism-show-language\b\s*/.test(sib.className) &&
		sib.firstChild &&
		/\s*\bprism-show-language-label\b\s*/.test(sib.firstChild.className)) {
		div2 = sib.firstChild;
	} else {
		div = document.createElement('div');
		div2 = document.createElement('div');

		div2.className = 'prism-show-language-label';

		div.className = 'prism-show-language';
		div.appendChild(div2);

		pre.parentNode.insertBefore(div, pre);
	}
	
	div2.innerHTML = language;
});

})();

(function() {
	if ( !self.Prism || !self.document || !document.querySelectorAll || ![].filter) return;

	var adapters = [];
	function registerAdapter(adapter) {
		if (typeof adapter === "function" && !getAdapter(adapter)) {
			adapters.push(adapter);
		}
	}
	function getAdapter(adapter) {
		if (typeof adapter === "function") {
			return adapters.filter(function(fn) { return fn.valueOf() === adapter.valueOf()})[0];
		}
		else if (typeof adapter === "string" && adapter.length > 0) {
			return adapters.filter(function(fn) { return fn.name === adapter})[0];
		}
		return null;
	}
	function removeAdapter(adapter) {
		if (typeof adapter === "string")
			adapter = getAdapter(adapter);
		if (typeof adapter === "function") {
			var index = adapters.indexOf(adapter);
			if (index >=0) {
				adapters.splice(index,1);
			}
		}
	}

	Prism.plugins.jsonphighlight = {
		registerAdapter: registerAdapter,
		removeAdapter: removeAdapter,
		highlight: highlight
	};
	registerAdapter(function github(rsp, el) {
		if ( rsp && rsp.meta && rsp.data ) {
			if ( rsp.meta.status && rsp.meta.status >= 400 ) {
				return "Error: " + ( rsp.data.message || rsp.meta.status );
			}
			else if ( typeof(rsp.data.content) === "string" ) {
				return typeof(atob) === "function"
					? atob(rsp.data.content.replace(/\s/g, ""))
					: "Your browser cannot decode base64";
			}
		}
		return null;
	});
	registerAdapter(function gist(rsp, el) {
		if ( rsp && rsp.meta && rsp.data && rsp.data.files ) {
			if ( rsp.meta.status && rsp.meta.status >= 400 ) {
				return "Error: " + ( rsp.data.message || rsp.meta.status );
			}
			else {
				var filename = el.getAttribute("data-filename");
				if (filename == null) {
					// Maybe in the future we can somehow render all files
					// But the standard <script> include for gists does that nicely already,
					// so that might be getting beyond the scope of this plugin
					for (var key in rsp.data.files) {
						if (rsp.data.files.hasOwnProperty(key)) {
							filename = key;
							break;
						}
					}
				}
				if (rsp.data.files[filename] !== undefined) {
					return rsp.data.files[filename].content;
				}
				else {
					return "Error: unknown or missing gist file " + filename;
				}
			}
		}
		return null;
	});
	registerAdapter(function bitbucket(rsp, el) {
		return rsp && rsp.node && typeof(rsp.data) === "string"
			? rsp.data
			: null;
	});

	var jsonpcb = 0,
	    loadstr = "Loading…";

	function highlight() {
		Array.prototype.slice.call(document.querySelectorAll("pre[data-jsonp]")).forEach(function(pre) {
			pre.textContent = "";

			var code = document.createElement("code");
			code.textContent = loadstr;
			pre.appendChild(code);

			var adapterfn = pre.getAttribute("data-adapter");
			var adapter = null;
			if ( adapterfn ) {
				if ( typeof(window[adapterfn]) === "function" ) {
					adapter = window[adapterfn];
				}
				else {
					code.textContent = "JSONP adapter function '" + adapterfn + "' doesn't exist";
					return;
				}
			}

			var cb = "prismjsonp" + ( jsonpcb++ );
			
			var uri = document.createElement("a");
			var src = uri.href = pre.getAttribute("data-jsonp");
			uri.href += ( uri.search ? "&" : "?" ) + ( pre.getAttribute("data-callback") || "callback" ) + "=" + cb;

			var timeout = setTimeout(function() {
				// we could clean up window[cb], but if the request finally succeeds, keeping it around is a good thing
				if ( code.textContent === loadstr )
					code.textContent = "Timeout loading '" + src + "'";
			}, 5000);
			
			var script = document.createElement("script");
			script.src = uri.href;

			window[cb] = function(rsp) {
				document.head.removeChild(script);
				clearTimeout(timeout);
				delete window[cb];

				var data = "";
				
				if ( adapter ) {
					data = adapter(rsp, pre);
				}
				else {
					for ( var p in adapters ) {
						data = adapters[p](rsp, pre);
						if ( data !== null ) break;
					}
				}

				if (data === null) {
					code.textContent = "Cannot parse response (perhaps you need an adapter function?)";
				}
				else {
					code.textContent = data;
					Prism.highlightElement(code);
				}
			};

			document.head.appendChild(script);
		});
	}

	highlight();
})();
(function(){

if (
	typeof self !== 'undefined' && !self.Prism ||
	typeof global !== 'undefined' && !global.Prism
) {
	return;
}

Prism.hooks.add('wrap', function(env) {
	if (env.type !== "keyword") {
		return;
	}
	env.classes.push('keyword-' + env.content);
});

})();

(function() {

if (typeof self === 'undefined' || !self.Prism || !self.document) {
	return;
}

Prism.hooks.add('before-highlight', function (env) {
	if (env.code) {
		var pre = env.element.parentNode;
		var clsReg = /\s*\bkeep-initial-line-feed\b\s*/;
		if (
			pre && pre.nodeName.toLowerCase() === 'pre' &&
			// Apply only if nor the <pre> or the <code> have the class
			(!clsReg.test(pre.className) && !clsReg.test(env.element.className))
		) {
			env.code = env.code.replace(/^(?:\r?\n|\r)/, '');
		}
	}
});

}());
(function() {

	if (typeof self === 'undefined' || !self.Prism || !self.document || !Function.prototype.bind) {
		return;
	}

	/**
	 * Returns the absolute X, Y offsets for an element
	 * @param {HTMLElement} element
	 * @returns {{top: number, right: number, bottom: number, left: number}}
	 */
	var getOffset = function (element) {
		var left = 0, top = 0, el = element;

		if (el.parentNode) {
			do {
				left += el.offsetLeft;
				top += el.offsetTop;
			} while ((el = el.offsetParent) && el.nodeType < 9);

			el = element;

			do {
				left -= el.scrollLeft;
				top -= el.scrollTop;
			} while ((el = el.parentNode) && !/body/i.test(el.nodeName));
		}

		return {
			top: top,
			right: innerWidth - left - element.offsetWidth,
			bottom: innerHeight - top - element.offsetHeight,
			left: left
		};
	};

	var tokenRegexp = /(?:^|\s)token(?=$|\s)/;
	var activeRegexp = /(?:^|\s)active(?=$|\s)/g;
	var flippedRegexp = /(?:^|\s)flipped(?=$|\s)/g;

	/**
	 * Previewer constructor
	 * @param {string} type Unique previewer type
	 * @param {function} updater Function that will be called on mouseover.
	 * @param {string[]|string=} supportedLanguages Aliases of the languages this previewer must be enabled for. Defaults to "*", all languages.
	 * @constructor
	 */
	var Previewer = function (type, updater, supportedLanguages, initializer) {
		this._elt = null;
		this._type = type;
		this._clsRegexp = RegExp('(?:^|\\s)' + type + '(?=$|\\s)');
		this._token = null;
		this.updater = updater;
		this._mouseout = this.mouseout.bind(this);
		this.initializer = initializer;

		var self = this;

		if (!supportedLanguages) {
			supportedLanguages = ['*'];
		}
		if (Prism.util.type(supportedLanguages) !== 'Array') {
			supportedLanguages = [supportedLanguages];
		}
		supportedLanguages.forEach(function (lang) {
			if (typeof lang !== 'string') {
				lang = lang.lang;
			}
			if (!Previewer.byLanguages[lang]) {
				Previewer.byLanguages[lang] = [];
			}
			if (Previewer.byLanguages[lang].indexOf(self) < 0) {
				Previewer.byLanguages[lang].push(self);
			}
		});
		Previewer.byType[type] = this;
	};

	/**
	 * Creates the HTML element for the previewer.
	 */
	Previewer.prototype.init = function () {
		if (this._elt) {
			return;
		}
		this._elt = document.createElement('div');
		this._elt.className = 'prism-previewer prism-previewer-' + this._type;
		document.body.appendChild(this._elt);
		if(this.initializer) {
			this.initializer();
		}
	};

	/**
	 * Checks the class name of each hovered element
	 * @param token
	 */
	Previewer.prototype.check = function (token) {
		do {
			if (tokenRegexp.test(token.className) && this._clsRegexp.test(token.className)) {
				break;
			}
		} while(token = token.parentNode);

		if (token && token !== this._token) {
			this._token = token;
			this.show();
		}
	};

	/**
	 * Called on mouseout
	 */
	Previewer.prototype.mouseout = function() {
		this._token.removeEventListener('mouseout', this._mouseout, false);
		this._token = null;
		this.hide();
	};

	/**
	 * Shows the previewer positioned properly for the current token.
	 */
	Previewer.prototype.show = function () {
		if (!this._elt) {
			this.init();
		}
		if (!this._token) {
			return;
		}

		if (this.updater.call(this._elt, this._token.textContent)) {
			this._token.addEventListener('mouseout', this._mouseout, false);

			var offset = getOffset(this._token);
			this._elt.className += ' active';

			if (offset.top - this._elt.offsetHeight > 0) {
				this._elt.className = this._elt.className.replace(flippedRegexp, '');
				this._elt.style.top = offset.top + 'px';
				this._elt.style.bottom = '';
			} else {
				this._elt.className +=  ' flipped';
				this._elt.style.bottom = offset.bottom + 'px';
				this._elt.style.top = '';
			}

			this._elt.style.left = offset.left + Math.min(200, this._token.offsetWidth / 2) + 'px';
		} else {
			this.hide();
		}
	};

	/**
	 * Hides the previewer.
	 */
	Previewer.prototype.hide = function () {
		this._elt.className = this._elt.className.replace(activeRegexp, '');
	};

	/**
	 * Map of all registered previewers by language
	 * @type {{}}
	 */
	Previewer.byLanguages = {};

	/**
	 * Map of all registered previewers by type
	 * @type {{}}
	 */
	Previewer.byType = {};

	/**
	 * Initializes the mouseover event on the code block.
	 * @param {HTMLElement} elt The code block (env.element)
	 * @param {string} lang The language (env.language)
	 */
	Previewer.initEvents = function (elt, lang) {
		var previewers = [];
		if (Previewer.byLanguages[lang]) {
			previewers = previewers.concat(Previewer.byLanguages[lang]);
		}
		if (Previewer.byLanguages['*']) {
			previewers = previewers.concat(Previewer.byLanguages['*']);
		}
		elt.addEventListener('mouseover', function (e) {
			var target = e.target;
			previewers.forEach(function (previewer) {
				previewer.check(target);
			});
		}, false);
	};
	Prism.plugins.Previewer = Previewer;

	// Initialize the previewers only when needed
	Prism.hooks.add('after-highlight', function (env) {
		if(Previewer.byLanguages['*'] || Previewer.byLanguages[env.language]) {
			Previewer.initEvents(env.element, env.language);
		}
	});

}());
(function() {

	if (
		typeof self !== 'undefined' && !self.Prism ||
		typeof global !== 'undefined' && !global.Prism
	) {
		return;
	}

	var languages = {
		'css': true,
		'less': true,
		'markup': {
			lang: 'markup',
			before: 'punctuation',
			inside: 'inside',
			root: Prism.languages.markup && Prism.languages.markup['tag'].inside['attr-value']
		},
		'sass': [
			{
				lang: 'sass',
				before: 'punctuation',
				inside: 'inside',
				root: Prism.languages.sass && Prism.languages.sass['variable-line']
			},
			{
				lang: 'sass',
				inside: 'inside',
				root: Prism.languages.sass && Prism.languages.sass['property-line']
			}
		],
		'scss': true,
		'stylus': [
			{
				lang: 'stylus',
				before: 'hexcode',
				inside: 'rest',
				root: Prism.languages.stylus && Prism.languages.stylus['property-declaration'].inside
			},
			{
				lang: 'stylus',
				before: 'hexcode',
				inside: 'rest',
				root: Prism.languages.stylus && Prism.languages.stylus['variable-declaration'].inside
			}
		]
	};

	Prism.hooks.add('before-highlight', function (env) {
		if (env.language && languages[env.language] && !languages[env.language].initialized) {
			var lang = languages[env.language];
			if (Prism.util.type(lang) !== 'Array') {
				lang = [lang];
			}
			lang.forEach(function(lang) {
				var before, inside, root, skip;
				if (lang === true) {
					before = 'important';
					inside = env.language;
					lang = env.language;
				} else {
					before = lang.before || 'important';
					inside = lang.inside || lang.lang;
					root = lang.root || Prism.languages;
					skip = lang.skip;
					lang = env.language;
				}

				if (!skip && Prism.languages[lang]) {
					Prism.languages.insertBefore(inside, before, {
						'color': /\B#(?:[0-9a-f]{3}){1,2}\b|\b(?:rgb|hsl)\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*\)\B|\b(?:rgb|hsl)a\(\s*\d{1,3}\s*,\s*\d{1,3}%?\s*,\s*\d{1,3}%?\s*,\s*(?:0|0?\.\d+|1)\s*\)\B|\b(?:AliceBlue|AntiqueWhite|Aqua|Aquamarine|Azure|Beige|Bisque|Black|BlanchedAlmond|Blue|BlueViolet|Brown|BurlyWood|CadetBlue|Chartreuse|Chocolate|Coral|CornflowerBlue|Cornsilk|Crimson|Cyan|DarkBlue|DarkCyan|DarkGoldenRod|DarkGray|DarkGreen|DarkKhaki|DarkMagenta|DarkOliveGreen|DarkOrange|DarkOrchid|DarkRed|DarkSalmon|DarkSeaGreen|DarkSlateBlue|DarkSlateGray|DarkTurquoise|DarkViolet|DeepPink|DeepSkyBlue|DimGray|DodgerBlue|FireBrick|FloralWhite|ForestGreen|Fuchsia|Gainsboro|GhostWhite|Gold|GoldenRod|Gray|Green|GreenYellow|HoneyDew|HotPink|IndianRed|Indigo|Ivory|Khaki|Lavender|LavenderBlush|LawnGreen|LemonChiffon|LightBlue|LightCoral|LightCyan|LightGoldenRodYellow|LightGray|LightGreen|LightPink|LightSalmon|LightSeaGreen|LightSkyBlue|LightSlateGray|LightSteelBlue|LightYellow|Lime|LimeGreen|Linen|Magenta|Maroon|MediumAquaMarine|MediumBlue|MediumOrchid|MediumPurple|MediumSeaGreen|MediumSlateBlue|MediumSpringGreen|MediumTurquoise|MediumVioletRed|MidnightBlue|MintCream|MistyRose|Moccasin|NavajoWhite|Navy|OldLace|Olive|OliveDrab|Orange|OrangeRed|Orchid|PaleGoldenRod|PaleGreen|PaleTurquoise|PaleVioletRed|PapayaWhip|PeachPuff|Peru|Pink|Plum|PowderBlue|Purple|Red|RosyBrown|RoyalBlue|SaddleBrown|Salmon|SandyBrown|SeaGreen|SeaShell|Sienna|Silver|SkyBlue|SlateBlue|SlateGray|Snow|SpringGreen|SteelBlue|Tan|Teal|Thistle|Tomato|Turquoise|Violet|Wheat|White|WhiteSmoke|Yellow|YellowGreen)\b/i
					}, root);
					env.grammar = Prism.languages[lang];

					languages[env.language] = {initialized: true};
				}
			});
		}
	});

	if (Prism.plugins.Previewer) {
		new Prism.plugins.Previewer('color', function(value) {
			this.style.backgroundColor = '';
			this.style.backgroundColor = value;
			return !!this.style.backgroundColor;
		});
	}

}());
(function() {

	if (
		typeof self !== 'undefined' && !self.Prism ||
		typeof global !== 'undefined' && !global.Prism
	) {
		return;
	}

	var languages = {
		'css': true,
		'less': true,
		'sass': [
			{
				lang: 'sass',
				before: 'punctuation',
				inside: 'inside',
				root: Prism.languages.sass && Prism.languages.sass['variable-line']
			},
			{
				lang: 'sass',
				before: 'punctuation',
				inside: 'inside',
				root: Prism.languages.sass && Prism.languages.sass['property-line']
			}
		],
		'scss': true,
		'stylus': [
			{
				lang: 'stylus',
				before: 'func',
				inside: 'rest',
				root: Prism.languages.stylus && Prism.languages.stylus['property-declaration'].inside
			},
			{
				lang: 'stylus',
				before: 'func',
				inside: 'rest',
				root: Prism.languages.stylus && Prism.languages.stylus['variable-declaration'].inside
			}
		]
	};

	Prism.hooks.add('before-highlight', function (env) {
		if (env.language && languages[env.language] && !languages[env.language].initialized) {
			var lang = languages[env.language];
			if (Prism.util.type(lang) !== 'Array') {
				lang = [lang];
			}
			lang.forEach(function(lang) {
				var before, inside, root, skip;
				if (lang === true) {
					// Insert before color previewer if it exists
					before = Prism.plugins.Previewer && Prism.plugins.Previewer.byType['color'] ? 'color' : 'important';
					inside = env.language;
					lang = env.language;
				} else {
					before = lang.before || 'important';
					inside = lang.inside || lang.lang;
					root = lang.root || Prism.languages;
					skip = lang.skip;
					lang = env.language;
				}

				if (!skip && Prism.languages[lang]) {
					Prism.languages.insertBefore(inside, before, {
						'gradient': {
							pattern: /(?:\b|\B-[a-z]{1,10}-)(?:repeating-)?(?:linear|radial)-gradient\((?:(?:rgb|hsl)a?\(.+?\)|[^\)])+\)/gi,
							inside: {
								'function': /[\w-]+(?=\()/,
								'punctuation': /[(),]/
							}
						}
					}, root);
					env.grammar = Prism.languages[lang];

					languages[env.language] = {initialized: true};
				}
			});
		}
	});

	// Stores already processed gradients so that we don't
	// make the conversion every time the previewer is shown
	var cache = {};

	/**
	 * Returns a W3C-valid linear gradient
	 * @param {string} prefix Vendor prefix if any ("-moz-", "-webkit-", etc.)
	 * @param {string} func Gradient function name ("linear-gradient")
	 * @param {string[]} values Array of the gradient function parameters (["0deg", "red 0%", "blue 100%"])
	 */
	var convertToW3CLinearGradient = function(prefix, func, values) {
		// Default value for angle
		var angle = '180deg';

		if (/^(?:-?\d*\.?\d+(?:deg|rad)|to\b|top|right|bottom|left)/.test(values[0])) {
			angle = values.shift();
			if (angle.indexOf('to ') < 0) {
				// Angle uses old keywords
				// W3C syntax uses "to" + opposite keywords
				if (angle.indexOf('top') >= 0) {
					if (angle.indexOf('left') >= 0) {
						angle = 'to bottom right';
					} else if (angle.indexOf('right') >= 0) {
						angle = 'to bottom left';
					} else {
						angle = 'to bottom';
					}
				} else if (angle.indexOf('bottom') >= 0) {
					if (angle.indexOf('left') >= 0) {
						angle = 'to top right';
					} else if (angle.indexOf('right') >= 0) {
						angle = 'to top left';
					} else {
						angle = 'to top';
					}
				} else if (angle.indexOf('left') >= 0) {
					angle = 'to right';
				} else if (angle.indexOf('right') >= 0) {
					angle = 'to left';
				} else if (prefix) {
					// Angle is shifted by 90deg in prefixed gradients
					if (angle.indexOf('deg') >= 0) {
						angle = (90 - parseFloat(angle)) + 'deg';
					} else if (angle.indexOf('rad') >= 0) {
						angle = (Math.PI / 2 - parseFloat(angle)) + 'rad';
					}
				}
			}
		}

		return func + '(' + angle + ',' + values.join(',') + ')';
	};

	/**
	 * Returns a W3C-valid radial gradient
	 * @param {string} prefix Vendor prefix if any ("-moz-", "-webkit-", etc.)
	 * @param {string} func Gradient function name ("linear-gradient")
	 * @param {string[]} values Array of the gradient function parameters (["0deg", "red 0%", "blue 100%"])
	 */
	var convertToW3CRadialGradient = function(prefix, func, values) {
		if (values[0].indexOf('at') < 0) {
			// Looks like old syntax

			// Default values
			var position = 'center';
			var shape = 'ellipse';
			var size = 'farthest-corner';

			if (/\bcenter|top|right|bottom|left\b|^\d+/.test(values[0])) {
				// Found a position
				// Remove angle value, if any
				position = values.shift().replace(/\s*-?\d+(?:rad|deg)\s*/, '');
			}
			if (/\bcircle|ellipse|closest|farthest|contain|cover\b/.test(values[0])) {
				// Found a shape and/or size
				var shapeSizeParts = values.shift().split(/\s+/);
				if (shapeSizeParts[0] && (shapeSizeParts[0] === 'circle' || shapeSizeParts[0] === 'ellipse')) {
					shape = shapeSizeParts.shift();
				}
				if (shapeSizeParts[0]) {
					size = shapeSizeParts.shift();
				}

				// Old keywords are converted to their synonyms
				if (size === 'cover') {
					size = 'farthest-corner';
				} else if (size === 'contain') {
					size = 'clothest-side';
				}
			}

			return func + '(' + shape + ' ' + size + ' at ' + position + ',' + values.join(',') + ')';
		}
		return func + '(' + values.join(',') + ')';
	};

	/**
	 * Converts a gradient to a W3C-valid one
	 * Does not support old webkit syntax (-webkit-gradient(linear...) and -webkit-gradient(radial...))
	 * @param {string} gradient The CSS gradient
	 */
	var convertToW3CGradient = function(gradient) {
		if (cache[gradient]) {
			return cache[gradient];
		}
		var parts = gradient.match(/^(\b|\B-[a-z]{1,10}-)((?:repeating-)?(?:linear|radial)-gradient)/);
		// "", "-moz-", etc.
		var prefix = parts && parts[1];
		// "linear-gradient", "radial-gradient", etc.
		var func = parts && parts[2];

		var values = gradient.replace(/^(?:\b|\B-[a-z]{1,10}-)(?:repeating-)?(?:linear|radial)-gradient\(|\)$/g, '').split(/\s*,\s*/);

		if (func.indexOf('linear') >= 0) {
			return cache[gradient] = convertToW3CLinearGradient(prefix, func, values);
		} else if (func.indexOf('radial') >= 0) {
			return cache[gradient] = convertToW3CRadialGradient(prefix, func, values);
		}
		return cache[gradient] = func + '(' + values.join(',') + ')';
	};



	if (Prism.plugins.Previewer) {
		new Prism.plugins.Previewer('gradient', function(value) {
			this.firstChild.style.backgroundImage = '';
			this.firstChild.style.backgroundImage = convertToW3CGradient(value);
			return !!this.firstChild.style.backgroundImage;
		}, '*', function () {
			this._elt.innerHTML = '<div></div>';
		});
	}

}());
(function() {

	if (
		typeof self !== 'undefined' && !self.Prism ||
		typeof global !== 'undefined' && !global.Prism
	) {
		return;
	}

	var languages = {
		'css': true,
		'less': true,
		'sass': [
			{
				lang: 'sass',
				inside: 'inside',
				before: 'punctuation',
				root: Prism.languages.sass && Prism.languages.sass['variable-line']
			},
			{
				lang: 'sass',
				inside: 'inside',
				root: Prism.languages.sass && Prism.languages.sass['property-line']
			}
		],
		'scss': true,
		'stylus': [
			{
				lang: 'stylus',
				before: 'hexcode',
				inside: 'rest',
				root: Prism.languages.stylus && Prism.languages.stylus['property-declaration'].inside
			},
			{
				lang: 'stylus',
				before: 'hexcode',
				inside: 'rest',
				root: Prism.languages.stylus && Prism.languages.stylus['variable-declaration'].inside
			}
		]
	};

	Prism.hooks.add('before-highlight', function (env) {
		if (env.language && languages[env.language] && !languages[env.language].initialized) {
			var lang = languages[env.language];
			if (Prism.util.type(lang) !== 'Array') {
				lang = [lang];
			}
			lang.forEach(function(lang) {
				var before, inside, root, skip;
				if (lang === true) {
					before = 'important';
					inside = env.language;
					lang = env.language;
				} else {
					before = lang.before || 'important';
					inside = lang.inside || lang.lang;
					root = lang.root || Prism.languages;
					skip = lang.skip;
					lang = env.language;
				}

				if (!skip && Prism.languages[lang]) {
					Prism.languages.insertBefore(inside, before, {
						'easing': /\bcubic-bezier\((?:-?\d*\.?\d+,\s*){3}-?\d*\.?\d+\)\B|\b(?:linear|ease(?:-in)?(?:-out)?)(?=\s|[;}]|$)/i
					}, root);
					env.grammar = Prism.languages[lang];

					languages[env.language] = {initialized: true};
				}
			});
		}
	});

	if (Prism.plugins.Previewer) {
		new Prism.plugins.Previewer('easing', function (value) {

			value = {
				'linear': '0,0,1,1',
				'ease': '.25,.1,.25,1',
				'ease-in': '.42,0,1,1',
				'ease-out': '0,0,.58,1',
				'ease-in-out':'.42,0,.58,1'
			}[value] || value;

			var p = value.match(/-?\d*\.?\d+/g);

			if(p.length === 4) {
				p = p.map(function(p, i) { return (i % 2? 1 - p : p) * 100; });

				this.querySelector('path').setAttribute('d', 'M0,100 C' + p[0] + ',' + p[1] + ', ' + p[2] + ',' + p[3] + ', 100,0');

				var lines = this.querySelectorAll('line');
				lines[0].setAttribute('x2', p[0]);
				lines[0].setAttribute('y2', p[1]);
				lines[1].setAttribute('x2', p[2]);
				lines[1].setAttribute('y2', p[3]);

				return true;
			}

			return false;
		}, '*', function () {
			this._elt.innerHTML = '<svg viewBox="-20 -20 140 140" width="100" height="100">' +
				'<defs>' +
					'<marker id="prism-previewer-easing-marker" viewBox="0 0 4 4" refX="2" refY="2" markerUnits="strokeWidth">' +
						'<circle cx="2" cy="2" r="1.5" />' +
					'</marker>' +
				'</defs>' +
				'<path d="M0,100 C20,50, 40,30, 100,0" />' +
				'<line x1="0" y1="100" x2="20" y2="50" marker-start="url(' + location.href + '#prism-previewer-easing-marker)" marker-end="url(' + location.href + '#prism-previewer-easing-marker)" />' +
				'<line x1="100" y1="0" x2="40" y2="30" marker-start="url(' + location.href + '#prism-previewer-easing-marker)" marker-end="url(' + location.href + '#prism-previewer-easing-marker)" />' +
			'</svg>';
		});
	}

}());
(function() {

	if (
		typeof self !== 'undefined' && !self.Prism ||
		typeof global !== 'undefined' && !global.Prism
	) {
		return;
	}

	var languages = {
		'css': true,
		'less': true,
		'markup': {
			lang: 'markup',
			before: 'punctuation',
			inside: 'inside',
			root: Prism.languages.markup && Prism.languages.markup['tag'].inside['attr-value']
		},
		'sass': [
			{
				lang: 'sass',
				inside: 'inside',
				root: Prism.languages.sass && Prism.languages.sass['property-line']
			},
			{
				lang: 'sass',
				before: 'operator',
				inside: 'inside',
				root: Prism.languages.sass && Prism.languages.sass['variable-line']
			}
		],
		'scss': true,
		'stylus': [
			{
				lang: 'stylus',
				before: 'hexcode',
				inside: 'rest',
				root: Prism.languages.stylus && Prism.languages.stylus['property-declaration'].inside
			},
			{
				lang: 'stylus',
				before: 'hexcode',
				inside: 'rest',
				root: Prism.languages.stylus && Prism.languages.stylus['variable-declaration'].inside
			}
		]
	};

	Prism.hooks.add('before-highlight', function (env) {
		if (env.language && languages[env.language] && !languages[env.language].initialized) {
			var lang = languages[env.language];
			if (Prism.util.type(lang) !== 'Array') {
				lang = [lang];
			}
			lang.forEach(function(lang) {
				var before, inside, root, skip;
				if (lang === true) {
					before = 'important';
					inside = env.language;
					lang = env.language;
				} else {
					before = lang.before || 'important';
					inside = lang.inside || lang.lang;
					root = lang.root || Prism.languages;
					skip = lang.skip;
					lang = env.language;
				}

				if (!skip && Prism.languages[lang]) {
					Prism.languages.insertBefore(inside, before, {
						'time': /(?:\b|\B-|(?=\B\.))\d*\.?\d+m?s\b/i
					}, root);
					env.grammar = Prism.languages[lang];

					languages[env.language] = {initialized: true};
				}
			});
		}
	});

	if (Prism.plugins.Previewer) {
		new Prism.plugins.Previewer('time', function(value) {
			var num = parseFloat(value);
			var unit = value.match(/[a-z]+$/i);
			if (!num || !unit) {
				return false;
			}
			unit = unit[0];
			this.querySelector('circle').style.animationDuration = 2 * num + unit;
			return true;
		}, '*', function () {
			this._elt.innerHTML = '<svg viewBox="0 0 64 64">' +
				'<circle r="16" cy="32" cx="32"></circle>' +
			'</svg>';
		});
	}

}());
(function() {

	if (
		typeof self !== 'undefined' && !self.Prism ||
		typeof global !== 'undefined' && !global.Prism
	) {
		return;
	}

	var languages = {
		'css': true,
		'less': true,
		'markup': {
			lang: 'markup',
			before: 'punctuation',
			inside: 'inside',
			root: Prism.languages.markup && Prism.languages.markup['tag'].inside['attr-value']
		},
		'sass': [
			{
				lang: 'sass',
				inside: 'inside',
				root: Prism.languages.sass && Prism.languages.sass['property-line']
			},
			{
				lang: 'sass',
				before: 'operator',
				inside: 'inside',
				root: Prism.languages.sass && Prism.languages.sass['variable-line']
			}
		],
		'scss': true,
		'stylus': [
			{
				lang: 'stylus',
				before: 'func',
				inside: 'rest',
				root: Prism.languages.stylus && Prism.languages.stylus['property-declaration'].inside
			},
			{
				lang: 'stylus',
				before: 'func',
				inside: 'rest',
				root: Prism.languages.stylus && Prism.languages.stylus['variable-declaration'].inside
			}
		]
	};

	Prism.hooks.add('before-highlight', function (env) {
		if (env.language && languages[env.language] && !languages[env.language].initialized) {
			var lang = languages[env.language];
			if (Prism.util.type(lang) !== 'Array') {
				lang = [lang];
			}
			lang.forEach(function(lang) {
				var before, inside, root, skip;
				if (lang === true) {
					before = 'important';
					inside = env.language;
					lang = env.language;
				} else {
					before = lang.before || 'important';
					inside = lang.inside || lang.lang;
					root = lang.root || Prism.languages;
					skip = lang.skip;
					lang = env.language;
				}

				if (!skip && Prism.languages[lang]) {
					Prism.languages.insertBefore(inside, before, {
						'angle': /(?:\b|\B-|(?=\B\.))\d*\.?\d+(?:deg|g?rad|turn)\b/i
					}, root);
					env.grammar = Prism.languages[lang];

					languages[env.language] = {initialized: true};
				}
			});
		}
	});

	if (Prism.plugins.Previewer) {
		new Prism.plugins.Previewer('angle', function(value) {
			var num = parseFloat(value);
			var unit = value.match(/[a-z]+$/i);
			var max, percentage;
			if (!num || !unit) {
				return false;
			}
			unit = unit[0];

			switch(unit) {
				case 'deg':
					max = 360;
					break;
				case 'grad':
					max = 400;
					break;
				case 'rad':
					max = 2 * Math.PI;
					break;
				case 'turn':
					max = 1;
			}

			percentage = 100 * num/max;
			percentage %= 100;

			this[(num < 0? 'set' : 'remove') + 'Attribute']('data-negative', '');
			this.querySelector('circle').style.strokeDasharray = Math.abs(percentage) + ',500';
			return true;
		}, '*', function () {
			this._elt.innerHTML = '<svg viewBox="0 0 64 64">' +
				'<circle r="16" cy="32" cx="32"></circle>' +
			'</svg>';
		});
	}

}());
(function () {
	if (typeof self === 'undefined' || !self.Prism || !self.document || !document.createElement) {
		return;
	}

	// The dependencies map is built automatically with gulp
	var lang_dependencies = /*languages_placeholder[*/{"javascript":"clike","actionscript":"javascript","aspnet":"markup","bison":"c","c":"clike","csharp":"clike","cpp":"c","coffeescript":"javascript","crystal":"ruby","css-extras":"css","d":"clike","dart":"clike","fsharp":"clike","glsl":"clike","go":"clike","groovy":"clike","haml":"ruby","handlebars":"markup","haxe":"clike","jade":"javascript","java":"clike","kotlin":"clike","less":"css","markdown":"markup","nginx":"clike","objectivec":"c","parser":"markup","php":"clike","php-extras":"php","processing":"clike","qore":"clike","jsx":["markup","javascript"],"ruby":"clike","sass":"css","scss":"css","scala":"java","smarty":"markup","swift":"clike","textile":"markup","twig":"markup","typescript":"javascript","wiki":"markup"}/*]*/;

	var lang_data = {};

	var config = Prism.plugins.autoloader = {
		languages_path: 'components/',
		use_minified: true
	};

	/**
	 * Lazy loads an external script
	 * @param {string} src
	 * @param {function=} success
	 * @param {function=} error
	 */
	var script = function (src, success, error) {
		var s = document.createElement('script');
		s.src = src;
		s.async = true;
		s.onload = function() {
			document.body.removeChild(s);
			success && success();
		};
		s.onerror = function() {
			document.body.removeChild(s);
			error && error();
		};
		document.body.appendChild(s);
	};

	/**
	 * Returns the path to a grammar, using the language_path and use_minified config keys.
	 * @param {string} lang
	 * @returns {string}
	 */
	var getLanguagePath = function (lang) {
		return config.languages_path +
			'prism-' + lang
			+ (config.use_minified ? '.min' : '') + '.js'
	};

	/**
	 * Tries to load a grammar and
	 * highlight again the given element once loaded.
	 * @param {string} lang
	 * @param {HTMLElement} elt
	 */
	var registerElement = function (lang, elt) {
		var data = lang_data[lang];
		if (!data) {
			data = lang_data[lang] = {};
		}

		// Look for additional dependencies defined on the <code> or <pre> tags
		var deps = elt.getAttribute('data-dependencies');
		if (!deps && elt.parentNode && elt.parentNode.tagName.toLowerCase() === 'pre') {
			deps = elt.parentNode.getAttribute('data-dependencies');
		}

		if (deps) {
			deps = deps.split(/\s*,\s*/g);
		} else {
			deps = [];
		}

		loadLanguages(deps, function () {
			loadLanguage(lang, function () {
				Prism.highlightElement(elt);
			});
		});
	};

	/**
	 * Sequentially loads an array of grammars.
	 * @param {string[]|string} langs
	 * @param {function=} success
	 * @param {function=} error
	 */
	var loadLanguages = function (langs, success, error) {
		if (typeof langs === 'string') {
			langs = [langs];
		}
		var i = 0;
		var l = langs.length;
		var f = function () {
			if (i < l) {
				loadLanguage(langs[i], function () {
					i++;
					f();
				}, function () {
					error && error(langs[i]);
				});
			} else if (i === l) {
				success && success(langs);
			}
		};
		f();
	};

	/**
	 * Load a grammar with its dependencies
	 * @param {string} lang
	 * @param {function=} success
	 * @param {function=} error
	 */
	var loadLanguage = function (lang, success, error) {
		var load = function () {
			var force = false;
			// Do we want to force reload the grammar?
			if (lang.indexOf('!') >= 0) {
				force = true;
				lang = lang.replace('!', '');
			}

			var data = lang_data[lang];
			if (!data) {
				data = lang_data[lang] = {};
			}
			if (success) {
				if (!data.success_callbacks) {
					data.success_callbacks = [];
				}
				data.success_callbacks.push(success);
			}
			if (error) {
				if (!data.error_callbacks) {
					data.error_callbacks = [];
				}
				data.error_callbacks.push(error);
			}

			if (!force && Prism.languages[lang]) {
				languageSuccess(lang);
			} else if (!force && data.error) {
				languageError(lang);
			} else if (force || !data.loading) {
				data.loading = true;
				var src = getLanguagePath(lang);
				script(src, function () {
					data.loading = false;
					languageSuccess(lang);

				}, function () {
					data.loading = false;
					data.error = true;
					languageError(lang);
				});
			}
		};
		var dependencies = lang_dependencies[lang];
		if(dependencies && dependencies.length) {
			loadLanguages(dependencies, load);
		} else {
			load();
		}
	};

	/**
	 * Runs all success callbacks for this language.
	 * @param {string} lang
	 */
	var languageSuccess = function (lang) {
		if (lang_data[lang] && lang_data[lang].success_callbacks && lang_data[lang].success_callbacks.length) {
			lang_data[lang].success_callbacks.forEach(function (f) {
				f(lang);
			});
		}
	};

	/**
	 * Runs all error callbacks for this language.
	 * @param {string} lang
	 */
	var languageError = function (lang) {
		if (lang_data[lang] && lang_data[lang].error_callbacks && lang_data[lang].error_callbacks.length) {
			lang_data[lang].error_callbacks.forEach(function (f) {
				f(lang);
			});
		}
	};

	Prism.hooks.add('complete', function (env) {
		if (env.element && env.language && !env.grammar) {
			registerElement(env.language, env.element);
		}
	});

}());
(function () {

	if (typeof self === 'undefined' || !self.Prism || !self.document || !document.createRange) {
		return;
	}

	Prism.hooks.add('before-highlight', function (env) {
		var firstWhiteSpaces = false;
		var pos = 0;
		var data = [];
		var f = function (elt, baseNode) {
			var o = {};
			if (!baseNode) {
				// Clone the original tag to keep all attributes
				o.clone = elt.cloneNode(false);
				o.posOpen = pos;
				data.push(o);
			}
			for (var i = 0, l = elt.childNodes.length; i < l; i++) {
				var child = elt.childNodes[i];
				if (child.nodeType === 1) { // element
					f(child);
				} else if(child.nodeType === 3) { // text
					if(!firstWhiteSpaces) {
						// We need to ignore the first white spaces in the code block
						child.data = child.data.replace(/^(?:\r?\n|\r)/, '');
						firstWhiteSpaces = true;
					}
					pos += child.data.length;
				}
			}
			if (!baseNode) {
				o.posClose = pos;
			}
		};
		f(env.element, true);

		if (data && data.length) {
			// data is an array of all existing tags
			env.keepMarkup = data;
		}
	});

	Prism.hooks.add('after-highlight', function (env) {
		if(env.keepMarkup && env.keepMarkup.length) {

			var walk = function (elt, nodeState) {
				for (var i = 0, l = elt.childNodes.length; i < l; i++) {

					var child = elt.childNodes[i];

					if (child.nodeType === 1) { // element
						if (!walk(child, nodeState)) {
							return false;
						}

					} else if (child.nodeType === 3) { // text
						if(!nodeState.nodeStart && nodeState.pos + child.data.length > nodeState.node.posOpen) {
							// We found the start position
							nodeState.nodeStart = child;
							nodeState.nodeStartPos = nodeState.node.posOpen - nodeState.pos;
						}
						if(nodeState.nodeStart && nodeState.pos + child.data.length >= nodeState.node.posClose) {
							// We found the end position
							nodeState.nodeEnd = child;
							nodeState.nodeEndPos = nodeState.node.posClose - nodeState.pos;
						}

						nodeState.pos += child.data.length;
					}

					if (nodeState.nodeStart && nodeState.nodeEnd) {
						// Select the range and wrap it with the clone
						var range = document.createRange();
						range.setStart(nodeState.nodeStart, nodeState.nodeStartPos);
						range.setEnd(nodeState.nodeEnd, nodeState.nodeEndPos);
						nodeState.node.clone.appendChild(range.extractContents());
						range.insertNode(nodeState.node.clone);
						range.detach();

						// Process is over
						return false;
					}
				}
				return true;
			};

			// For each tag, we walk the DOM to reinsert it
			env.keepMarkup.forEach(function (node) {
				walk(env.element, {
					node: node,
					pos: 0
				});
			});
		}
	});
}());
(function() {

if (typeof self === 'undefined' || !self.Prism || !self.document) {
	return;
}

Prism.hooks.add('complete', function (env) {
	if (!env.code) {
		return;
	}

	// Works only for <code> wrapped inside <pre> (not inline).
	var pre = env.element.parentNode;
	var clsReg = /\s*\bcommand-line\b\s*/;
	if (
		!pre || !/pre/i.test(pre.nodeName) ||
			// Abort only if neither the <pre> nor the <code> have the class
		(!clsReg.test(pre.className) && !clsReg.test(env.element.className))
	) {
		return;
	}

	if (env.element.querySelector('.command-line-prompt')) {
		// Abort if prompt already exists.
		return;
	}

	if (clsReg.test(env.element.className)) {
		// Remove the class "command-line" from the <code>
		env.element.className = env.element.className.replace(clsReg, '');
	}
	if (!clsReg.test(pre.className)) {
		// Add the class "command-line" to the <pre>
		pre.className += ' command-line';
	}

	// Create the "rows" that will become the command-line prompts. -- cwells
	var lines = new Array(1 + env.code.split('\n').length);
	var promptText = pre.getAttribute('data-prompt') || '';
	if (promptText !== '') {
		lines = lines.join('<span data-prompt="' + promptText + '"></span>');
	} else {
		var user = pre.getAttribute('data-user') || 'user';
		var host = pre.getAttribute('data-host') || 'localhost';
		lines = lines.join('<span data-user="' + user + '" data-host="' + host + '"></span>');
	}

	// Create the wrapper element. -- cwells
	var prompt = document.createElement('span');
	prompt.className = 'command-line-prompt';
	prompt.innerHTML = lines;

	// Mark the output lines so they can be styled differently (no prompt). -- cwells
	var outputSections = pre.getAttribute('data-output') || '';
	outputSections = outputSections.split(',');
	for (var i = 0; i < outputSections.length; i++) {
		var outputRange = outputSections[i].split('-');
		var outputStart = parseInt(outputRange[0]);
		var outputEnd = outputStart; // Default: end at the first line when it's not an actual range. -- cwells
		if (outputRange.length === 2) {
			outputEnd = parseInt(outputRange[1]);
		}

		if (!isNaN(outputStart) && !isNaN(outputEnd)) {
			for (var j = outputStart; j <= outputEnd && j <= prompt.children.length; j++) {
				var node = prompt.children[j - 1];
				node.removeAttribute('data-user');
				node.removeAttribute('data-host');
				node.removeAttribute('data-prompt');
			}
		}
	}

	env.element.innerHTML = prompt.outerHTML + env.element.innerHTML;
});

}());

