/**
 * 分页条
 * @author qijun.weiqj
 */
define('ui.Paging', ['jQuery', 'Class'], function($, Class) {


return Class({

	/**
	 * @ctor
	 * @param {jQuery} div 节点
	 * @param {object} options
	 *	- render {boolean|number}	是否由js渲染分页条，默认为false
	 *	- listSize: {number}	分页条中页码数量, 默认为7
	 *	- showForm {boolean}	是否显示分页表单, 默认为false
	 *	- pageIndex {number}	当前页>=1，默认从节点推导
	 *	- pageCount {number}	页面数量 -1 表示未知页数
	 *							
	 *	- linkTo (function(page))
	 *	- formTo (function(page)) 
	 *	- goTo {function(page)}
	 */
	init: function(div, options) {
		this.element = $(div).eq(0);
		if (!this.element.length) {
			throw 'empty node for paging';
			return;
		}

		this.options = options || {};
		
		this._init();
		this._render();
		this._handle();
	},

	_init: function() {
		var opts = this.options,
			page = opts.pageIndex;	
		
		// 初始pageIndex如果没有配置，在非渲染状态下可由节点推导 
		// 否则默认为1 
		page = !page && !opts.render ?  
				$('a.current', this.element).data('page') : page;

		this.pageIndex = page || 1;
		this.pageCount = opts.pageCount;
	},

	_render: function(page) {
		if (!this.options.render) {
			return;
		}

		this.pageIndex = page || this.pageIndex;
		
		if (!this._rendered) {
			this.element.html(this._tpl);
			this._rendered = true;
		}

		$('em.pagenum', this.element).html(this.pageCount);
		this._renderList();
	},

	_renderList: function() {
		var html = [],
			tpl = '<li><a href="{link}" data-page="{page}" class="{class}">${text}</a></li>',
			pageIndex = this.pageIndex,
			pageCount = this.pageCount || 1,
		
			size = parseInt(this.options.listSize, 10) || 7,
			from = pageIndex - Math.floor((size - 4) / 2),
			to,
			now;

		// 产生除去头尾4个页码的中间页码
		if (from + size - 2 > pageCount) {
			from = pageCount - size + 3;
		} 

		from < 3 && (from = 3);	// 最少从第3页开始
		to = from;
		for (var i = 0; i < size - 4; i++) {
			if (pageCount !== -1 && to > pageCount - 2) {
				break;
			}
			html.push(this._createItem(to, to, '', true));
			to++;
		}
		to--;

		// 产生页码2
		if (pageCount === -1 || pageCount > 1) {
			now = Math.floor((from + 1) / 2);
			var item = from > now + 1 ? this._createItem('...', now, 'omit') :
					this._createItem(now, now, '', true);
			html.unshift(item); 
		}

		// 产生页码1
		if (pageCount !== 0) {
			html.unshift(this._createItem(1, 1, '', true));
		}

		// 上一页
		html.unshift(this._createItem('上一页', 1, pageIndex === 1 ? 'pre pre-disabled' : 'pre'));

		// 产生最后第2个页码
		if (pageCount === -1 || pageCount > 2) {
			now = Math.floor((pageCount + to + 1) / 2);
			var item = to < now - 1 ? this._createItem('...', now, 'omit') :
					this._createItem(now, now, '', true);
			html.push(item);
		}

		// 产生最后1个页码
		if (pageCount > 3) {
			html.push(this._createItem(pageCount, pageCount, '', true));
		}

		// 产生最后一页
		html.push(this._createItem('下一页', pageCount, pageIndex === pageCount ? 'next next-disabled' : 'next'));
		
		$('ul.paging-list', this.element).html(html.join(''));
	},

	_createItem: function(text, page, className, current) {
		var tpl = '<li><a href="{link}" data-page="{page}" class="{className}">{text}</a></li>';
		if (current && page === this.pageIndex) {
			className += ' current';
		}

		return $.util.substitute(tpl, {
			link: 'page/' + page,
			page: page,
			className: className,
			text: text
		});
	},

	_handle: function() {
		this._handlePaging();
		this._handlePnum();
	},

	/**
	 * 处理分页事件
	 */
	_handlePaging: function() {
		var self = this;

		this.element.on('click', 'ul.paging-list a', function(e) {
			var page = $(this).data('page');
			if (self._linkTo(page) !== false) {
				e.preventDefault();
				self._render(page);
			}
		});

		this.element.on('click', 'a.paging-btn', function(e) {
			e.preventDefault();	
			var page = $('input.pnum', self.element).val();
			if (page && self._validate(page)) {
				self._formTo(page);
				self._render(page);
			}
		});
	},

	_linkTo: function(page) {
		var opts = this.options;
		return opts.linkTo ? opts.linkTo(page) :
			opts.goTo ? opts.goTo(page) : false;
	},

	_formTo: function(page) {
		var opts = this.options;
		opts.formTo ? opts.formTo(page) :
			opts.goTo ? opts.goTo(page) : this._goTo(page);
	},

	_goTo: function(page) {
		var url = this.element.data('url');
		if (url) {
			window.location = url.replace('{page}', page);
		}
	},

	goTo: function(page) {
		if (!this._validate(page)) {
			return;
		}

		var opts = this.options;
		opts.formTo ? opts.formTo(page) :
			opts.linkTo ? opts.linkTo(page) :
			opts.goTo ? opts.goTo(page) :
			this._goTo(page);

		this._render(page);
	},

	_validate: function(page) {
		var pageCount = this.options.pageCount;
		page = parseInt(page, 10);
		return pageCount === -1 || page > 0 && page <= pageCount;
	},

	_handlePnum: function() {
		var input = $('input.pnum', this.element);
		if (!input.length) {
			return;
		}

		input.on('input propertychange blur', function() {
			var last = input.data('lastValue'),
				value = input.val();
			if (!value || /^[1-9]\d*$/.test(value)) {
				input.data('lastValue', value);
			} else {
				setTimeout(function() {
					input.val(last);
				}, 50);
			}
		});

	},

	_tpl: [
		'<div class="paging">',
			'<ul class="paging-list fd-clr"></ul>',
			'<div class="paging-form fd-clr">',
				'<span>共<em class="pagenum"></em>页</span>',
				'<span>到<input type="text" class="ui-txt ui-txt-small pnum" autocomplete="off" maxlength="4">页</span>',
				'<a title="确定" href="#" class="paging-btn">确 定</a>',
			'</div>',
		'</div>'
		].join('')

});
//~
	
		
});
