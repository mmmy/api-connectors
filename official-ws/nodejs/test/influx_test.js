
const FlowDataManager = require('../influxdb/hight_frequent/FlowDataStrategy')
 
const manager = new FlowDataManager()
/*
manager._orderHistory = [
  {long: true, amount: 100, price: 10},
  {long: false, amount: 100, price: 15},
]
console.log(manager.stats())                 //last positions: profit: 50

manager._orderHistory = [
  {long: true, amount: 100, price: 10},
  {long: false, amount: 100, price: 5},
]

console.log(JSON.stringify(manager.stats()))                 //last positions: profit: -50
*/
manager._orderHistory = [
  {long: true, amount: 100, price: 10},
  {long: false, amount: 100, price: 15},
  {long: true, amount: 100, price: 15},
  {long: false, amount: 100, price: 10},
]

console.log(JSON.stringify(manager.stats()))
