// 任务队列
// 控制并发数，频率

// const RATE = 5000;
// const MAXIMUM = 5;
//
// class Queue {
//   constructor() {
//     this.task_queue = [];
//     this.wait_queue = [];
//     this.task_timer = null;
//   }
//
//   task(fn) {
//     this.wait_queue.push(fn);
//   }
//
//   start(rate = RATE) {
//     this.run();
//     this.task_timer = setInterval(() => {
//       this.run();
//     }, rate);
//   }
//
//   stop() {
//     clearInterval(this.task_timer);
//   }
//
//   run(maximum = MAXIMUM) {
//     this.task_queue = [];
//     this.task_queue = this.wait_queue.splice(0, maximum);
//     this.task_queue.forEach(fn => typeof fn === 'function' && fn());
//   }
// }
//
// module.exports = {
//   Queue
// };
