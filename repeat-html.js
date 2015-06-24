( function( window, undefined ) {
	"user strict";

	var patterns = {
		keyTypeArray: /\[\s*(\d+)\s*\]+/g,
		params: /\{\s*(\d+)\s*\}+/g,
		splitQuery: /\s+in\s+/,
		findTemplateVars: /\{\{\s*([\[\]\$\.\_0-9a-zA-Z]+)\s*\}\}/g,
		splitQueryVars: /\s*,\s*/,
		isArraySintax: {
			ini: /(?=^\s*\[)/,
			end: /(?=\]\s*$)/
		},
		filters: {
			'like': /\s+like\s+/,
			'as': /\s+as\s+/
		},
		hasSelectorCss: /^(#|\.)\S/
	};

	/**
	 * @constructor RepeatHTML
	 * @param {Object} config - Configuracion inicial para la instancia
	 */
	function RepeatHTML( config ) {
		config = config || {};

		this.REPEAT_ATTR_NAME = config.attrName || 'repeat';
		this._filters = {};
		this._scope = config.scope || {};
		this._originalElements = null;

		searchFilters.call( this );
		if( config.compile || config.compile === undefined ) {
			init.call( this, false, false );
		}
	}

	/**
	 * Metodo de entrada o salida de datos del _scope
	 * @public
	 * @method
	 *
	 * @param {string} varName - Nombre del dato a almacenar dentro del scope
	 * @param {Object[]} data - Informacion o datos a almacenar
	 * @param {Object|Function|Array} funcBacks - Funciones que se ejecutaran al actualizar el modelo de datos
	 */
	RepeatHTML.prototype.scope = function( varName, data, funcBacks ) {
		if( typeof varName !== 'string' ) return this;

		var self = this;

		if( data === undefined )
			return self._scope[ varName ];

		self._scope[ varName ] = self._scope[ varName ] || {};
		self._scope[ varName ].data = data;
		self._scope[ varName ].originalData = data;
		
		if( typeof funcBacks === 'function' )
			self._scope[ varName ].funcBackAfter = funcBacks;
		else if( isOfType( funcBacks, 'array' ) ) {
			self._scope[ varName ].funcBackAfter = funcBacks[ 0 ];
			self._scope[ varName ].funcBack = funcBacks[ 1 ];
		} else if( typeof funcBacks === 'object' ) {
			self._scope[ varName ].funcBackAfter = funcBacks.after;
			self._scope[ varName ].funcBack = funcBacks.funcBack;
		}

		self.refresh( varName );

		if( self._scope[ varName ].funcBackAfter )
			self._scope[ varName ].funcBackAfter.call( self, data );

		return self;
	};

	/**
	 * Filtrar la lista de datos dependiendo del parametro dado
	 * @public
	 * @method
	 */
	RepeatHTML.prototype.filter = function( varName, filtro, element ) {
		if( varName === undefined ) return false;

		var self = this,
			_filter = null;

		filtro = filtro.trim();

		if( patterns.filters.as.test( filtro ) || patterns.hasSelectorCss.test( filtro.replace( /^%|%$/g, '' ) ) ) {
			_filter = filtro.split( patterns.filters.as );

			var prop = _filter[ 0 ],
				selector = _filter[ 1 ];

			if( !selector ) {
				selector = prop;
				prop = null;
			}
			
			var elem = document.getElementById( selector.replace( /#|^%|%$/g, '' ) );

			if( !elem ) return self;

			var hasPercentIni = /^%/g.test( selector ) ? '^' : '',
				hasPercentFin = /%$/g.test( selector ) ? '$' : '';

			filtro = elem.value; //para llamarlo una primera vez
			
			elem.addEventListener( 'keyup', function() {
				var _this = this;

				self._scope[ varName ].data = self._scope[ varName ].originalData.filter( function( data ) {
					var patron = new RegExp( hasPercentIni + _this.value + hasPercentFin, 'gi' );

					if( prop )
						return patron.test( data[ prop ] );
					else
						for( var _prop in data )
							if( patron.test( data[ _prop ] ) )
								return true;
				});

				self.refresh( varName, element );
			});

			return self;
		
		} else if( patterns.filters.like.test( filtro ) ) {
			return; //Ignoremos el resto por el momento
			_filter = filtro.split( patterns.filters.like );
			filtro = _filter[ 1 ];
		}
		return;

		if( _filter ) var prop = _filter[ 0 ];

		if( filtro ) {
			filtro = filtro.replace( /^%/g, '\^' );

			this._filters[ varName ] = function( data ) {
				var patron = new RegExp( filtro, 'gi' );
				//Despues puede convertirse en array para multiple filtros
				if( prop )
					return patron.test( data[ prop ] );
				else
					for( var prop in data )
						if( patron.test( data[ prop ] ) )
							return true;
			};
		}
		
		return this;
	};

	/**
	 * Filtrar la lista de datos dependiendo del parametro dado
	 * @public
	 * @method
	 */
	RepeatHTML.prototype.applyFilter = function( varName ) {
		if( !varName || !this._filters[ varName ] )
			return this._scope[ varName ].data;

		return this._scope[ varName ].data.filter( this._filters[ varName ] );
	};

	/**
	 * Aplicar accion de repetir
	 * @public
	 * @method
	 */
	RepeatHTML.prototype.refresh = function( varName, element ) {
		if( document.querySelectorAll( '[data-' + this.REPEAT_ATTR_NAME + ']' ).length > 0 )
			init.call( this, false, false );
	
		reRender.call( this, varName, element );

		//clear();
		return this;
	};

	function searchFilters() {
		var self = this;
		var queryFilters = document.querySelectorAll( "[data-filter]" ),
			queryRepeat = "";
			len = queryFilters.length;
		
		if( len <= 0 ) return;

		var i, filters, element = null;

		for( i = 0; element = queryFilters[ i ]; i++ ) {
			queryRepeat = element.dataset[ self.REPEAT_ATTR_NAME ].split( patterns.splitQuery );
			filters = element.dataset.filter.split( patterns.splitQueryVars );

			filters.forEach( function( filter ) {
				self.filter( queryRepeat[ 1 ], filter, element );
			});
		}
	}

	/**
	 * Repitado de los datos
	 * @private
	 * @method
	 */
	function reRender( varName, element ) {
		var self = this,
			elements = self._originalElements,
			elementHTML = '',
			repeatData = null,

			i, len = elements.length,
			elementData,

			elementsRepeatContent = document.createDocumentFragment();

		var funcBackArgs = [],
			modelData = self._scope[ varName ];

		for( i = 0; i < len; i++ ) {
			elementData = elements[ i ];
			
			if( element )
				if( element.dataset.filter !== elementData.element.dataset.filter )
					continue;

			repeatData = resolveQuery.call( self, elementData.element.dataset[ self.REPEAT_ATTR_NAME ] );

			if( !repeatData.datas || varName !== repeatData.varName )
				continue;

			elementHTML = elementData.element.innerHTML;

			elementData.childs.forEach( function( child, index ) {
				if( index === 0 ) return;
				elementData.parentElement.removeChild( child );
			});
			elementData.childs.splice( 1, elementData.childs.length );

			repeatData.datas.forEach( function( data ) {
				var objData = {},
					//No se necesita clonar el contenido ya que este sera reescrito
					elementCloned = elementData.elementClone.cloneNode( false );
				
				objData[ repeatData.varsIterate ] = data;
				elementCloned.innerHTML = renderTemplate( elementHTML, objData );

				elementsRepeatContent.appendChild( elementCloned );
				elementData.childs.push( elementCloned );

				if( modelData.funcBack )
					funcBackArgs.push([ data, elementCloned ]);
			});

			insertAfter( elementsRepeatContent, elementData.childs[ 0 ] );
			elementsRepeatContent = document.createDocumentFragment();			
		}

		if( !!varName && modelData.funcBack ) {
			funcBackArgs.forEach( function( args ) {
				modelData.funcBack.apply( self, args );
			});
		}
	}
	
	/**
	 * Metodo de entrada o salida del scope
	 * @private
	 * @method
	 */
	function init( isRefresh, findParents ) {
		var selector = '[data-' + this.REPEAT_ATTR_NAME + ']';

		var self = this,
			elements = document.querySelectorAll( selector + ( findParents ? '' : ' ' + selector ) ),
			element = null,
			elementHTML = '',
			repeatData = null,

			i, len,
			lenElements = 0,

			elementsRepeatContent = document.createDocumentFragment();

		if( !self._originalElements )
			self._originalElements = [];

		for( i = 0, len = elements.length; i < len; i++ ) {
			element = elements[ i ].element || elements[ i ];
			repeatData = resolveQuery.call( self, element.dataset[ self.REPEAT_ATTR_NAME ] );
			
			if( repeatData.datas ) {
				elementHTML = element.innerHTML;
				var elementCopy = element.cloneNode( true ),
					commentStart = document.createComment( 'RepeatHTML: start( ' + element.dataset[ self.REPEAT_ATTR_NAME ] + ' )' );

				elementCopy.removeAttribute( 'data-' + self.REPEAT_ATTR_NAME );
				elementCopy.removeAttribute( 'data-filter' );

				if( !isRefresh ) {
					//Almacenar cada elemento original en una arreglo
					self._originalElements.push({
						'element': element.cloneNode( true ),
						'elementClone': elementCopy,
						'parentElement': element.parentElement,
						'childs': [ commentStart ]
					});

					lenElements = self._originalElements.length;
				}

				elementsRepeatContent.appendChild( commentStart );

				//Comentario delimitador de inicio
				repeatData.datas.forEach( function( data ) {
					var objData = {},
						elementCloned = elementCopy.cloneNode( false );
					
					objData[ repeatData.varsIterate ] = data;
					elementCloned.innerHTML = renderTemplate( elementHTML, objData );
					elementsRepeatContent.appendChild( elementCloned );

					if( !isRefresh )
						self._originalElements[ lenElements-1 ].childs.push( elementCloned );
				});

				element.parentElement.replaceChild( elementsRepeatContent, element );
				elementsRepeatContent = document.createDocumentFragment();
			}
		}

		if( document.querySelectorAll( selector ).length > 0 && !findParents )
			return init.call( self, isRefresh, true );
	}
	
	/**
	 * Resuelve la cadena de texto del repeat a dos propiedades
	 * @private
	 * @method
	 */
	function resolveQuery( query ) {
		query = query.split( patterns.splitQuery );

		if( query[ 0 ].trim() === '' && !query[ 1 ] ) {
			return {
				'varsIterate': null,
				'datas': null,
				'varName': null
			};
		}
		
		return {
			'varsIterate': query[ 0 ].split( patterns.splitQueryVars ),
			'datas': parseData.call( this, query[ 1 ].trim() ),
			'varName': query[ 1 ].trim()
		};
	}

	/**
	 * Injector de datos dentro de un template(cadena de texto)
	 * @private
	 * @method
	 */
	function renderTemplate( template, datas ) {
		return template.replace( patterns.keyTypeArray, ".$1" )
		.replace( patterns.findTemplateVars, function( find, key ) {
			var partsKey = key.split( "." ),
				finder = datas[ partsKey[ 0 ] ],
				idx;

			for( idx = 1; idx < partsKey.length; idx++ ) {
				finder = finder[ partsKey[ idx ] ];
			}

			if( finder ) return finder;
			else return find;
		});
	}
	
	/**
	 * Codifica los datos de entrada dependiendo del tipo, array o string
	 * @private
	 * @method
	 */
	function parseData( strData ) {
		if( this._scope[ strData ] )
			return this.applyFilter( strData );
		
		if( patterns.isArraySintax.ini.test( strData ) && patterns.isArraySintax.end.test( strData ) )
			return eval( strData );

		return null;
	}

	/**
	 * Utils
	 */
	function insertAfter( insertElement, element ){ 
		if( element.nextSibling ) { 
			element.parentNode.insertBefore( insertElement, element.nextSibling ); 
		} else {
			element.parentNode.appendChild( insertElement ); 
		}
	}

	function isOfType( data, compare ) {
		return ({}).toString.call( data ).match( /\s(.+)\]$/ )[ 1 ].toLowerCase() === compare;
	}

	/**
	 * @global
	 */
	window.RepeatHTML = RepeatHTML;
})( window );