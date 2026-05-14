function rDS(n) {
  if (n <= 0) return 0;
  let res = n;
  while (res > 9) {
    let sum = 0;
    const str = res.toString();
    for (let i = 0; i < str.length; i++) {
      sum += parseInt(str[i], 10);
    }
    res = sum;
  }
  return res === 0 ? 9 : res;
}

const year = 1974, month = 5, day = 21;
let x = rDS(year);
let monthDaySum = month + day;
let y = rDS(monthDaySum);
let z = rDS(x + y);

console.log(`X: ${x}, Y: ${y}, Z: ${z}`);
console.log(`X+Z: ${rDS(x+z)}`);
console.log(`Y: ${y}`);
