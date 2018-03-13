# RepeatHTML.js

Librería Javascript que ayuda con la gestión de contenido dinámico y repetitivo para HTML

```html
<table border>
    <tr data-repeat='row in [1,2,3]'>
        <td data-repeat='col in [1,2,3]'>
            {{ row }} - {{ col }}
        </td>
    </tr>
</table>
```

Resultado

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
