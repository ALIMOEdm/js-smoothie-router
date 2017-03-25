# js-smoothie-router
simple javascript router

### HTML

```html
<div>
	<a href="" sup-ref="goUrl('test_1')">test 1</a>
</div>

<div>
	<a href="" sup-ref="goUrl('test_2', {'id': 2, 'title': 'title'})">test 2</a>
</div>

<div>
	<a href="" sup-ref="goUrl('test_3', {'title': 'title'})">test 3</a>
</div>

<div id="content">
	
</div>
```

### JS

```javascript
Router.add('test_1', {
	url: '/',
	action: function () {
		console.log('action test_1');
		document.querySelector("#content").innerHTML = "<h1>HELLO action 1</h1>";
	}
});

Router.add('test_2', {
	url: '/test-2/{id}',
	action: function () {
		console.log('action test_2')
		document.querySelector("#content").innerHTML = "<h1>HELLO action 2</h1>";
	},
	parent: 'test_3'
});

Router.add('test_3', {
	url: '/test-3/{title}',
	action: function () {
		console.log('action test_3')
		document.querySelector("#content").innerHTML = "<h1>HELLO action 3</h1>";
	},
	parent: 'test_1'
});

Router.init();
```
