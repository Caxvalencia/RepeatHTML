import { RepeatHTML } from './repeat-html';

declare let console;
declare let setTimeout;

let repeat = new RepeatHTML({
    compile: false
});

console.log(repeat);

function refreshEventsUsers(users) {
    // console.log( users )
    // document.getElementById( users[ 0 ].name ).onclick = function() {
    // 	console.log( 'click: ' + users[ 0 ].name, this );
    // };
}

function refreshEventsUserItem(user, element) {
    element.querySelector('#' + user.name).onclick = function() {
        console.log(user.name, this);
    };
}

repeat
    // .filter( 'users', 'name like user' )
    .scope(
        'users',
        [
            { name: 'user-1', lastName: 'ape1' },
            { name: 'user-2', lastName: 'ape2' },
            { name: 'user-3', lastName: 'ape3' }
        ],
        {
            after: refreshEventsUsers,
            funcBack: refreshEventsUserItem
        }
    );

// console.log( repeat )

repeat.scope('repeatMe', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);

setTimeout(() => {
    repeat.scope('users', [
        { name: 'user-4', lastName: 'ape4' },
        { name: 'user-5', lastName: 'ape5' },
        { name: 'user-6', lastName: 'ape6' },
        { name: 'user-7', lastName: 'ape7' }
    ]);

    repeat.scope('repeatMe', [1, 2, 3, 4, 5]);
}, 1500);
