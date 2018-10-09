# RepeatHtml.js

## JavaScript library that help you for manage dynamic content and repeat it for the HTML

```javascript
let repeat = new RepeatHtml({
    compile: false
});

repeat.scope(
    'users',
    [
        {
            name: 'user-1',
            lastName: 'ape1'
        },
        {
            name: 'user-2',
            lastName: 'ape2'
        },
        {
            name: 'user-3',
            lastName: 'ape3'
        }
    ],
    {
        after: <refreshEventsUsers>,
        funcBack: <refreshEventsUserItem>
    }
);
```

```html
<ul>
    <li data-repeat='user in users'>
        <button id='{{ user.name }}'>
            {{ user.name }} - {{ user.lastName }}
        </button>
    </li>
</ul>
```

```html
<!-- With inline data -->
<table border>
    <tr data-repeat='row in [1,2,3]'>
        <td data-repeat='col in [1,2,3]'>
            {{ row }} - {{ col }}
        </td>
    </tr>
</table>
```

## Output

```html
<table border>
    <tbody>
    <!--RepeatHTML: start( row in [1,2,3] )-->
    <tr>
        <!--RepeatHTML: start( col in [1,2,3] )-->
        <td>
            1 - 1
        </td><td>
            1 - 2
        </td><td>
            1 - 3
        </td>
    </tr>

    <tr>
        <!--RepeatHTML: start( col in [1,2,3] )-->
        <td>
            2 - 1
        </td><td>
            2 - 2
        </td><td>
            2 - 3
        </td>
    </tr>

    <tr>
        <!--RepeatHTML: start( col in [1,2,3] )-->
        <td>
            3 - 1
        </td><td>
            3 - 2
        </td><td>
            3 - 3
        </td>
    </tr>
    </tbody>
</table>
```
