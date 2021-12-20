


const ages = [1,1,2,2,3,4,5,5,6];
const uniqueAges = ages.filter((x, i, a) => a.indexOf(x) == i)
console.log(uniqueAges);

const a = [{id:1},{id:1},{id:2},{id:2},{id:5},{id:5},{id:6}]
const unique = a.filter((val,i,arr)=> arr.indexOf(val.id)==i);
console.log(unique);