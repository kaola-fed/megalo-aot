import Counter from './Counter'

const app = new Counter()

const a = {obj: 1}
const b = {obj: 2}

const c = { a, ...b }

console.log( c );

app.$inject()
