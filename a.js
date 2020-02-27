const promise1 = Promise.resolve(3);
const promise2 = 42;
const promise3 = new Promise(function(resolve, reject) {
    setTimeout(resolve, 100, 'foo');
});

function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

async function hi() {
    await sleep(1000);
    console.log(3);
    return 'asdsad';
}

const a = hi();
console.log(a);
hi();
hi();

Promise.all([promise1, promise2, promise3]).then(function(values) {
    console.log(values);
});
