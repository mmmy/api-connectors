
var Account = require('../Account')
var assert = require('assert')
var should = require('should')

var account1 = new Account()
var account2 = new Account({ loss: '-0.2%', profit: '2' })
var account3 = new Account({ loss: '-5', profit: 7 })

account1.orderLimit(5000, false, 10000)
account2.orderLimit(5000, true, 10000)
account3.orderLimit(5000, false, 10000)

setTimeout(()=> {
  console.log(account2.getLossLimitPrices())
  console.log(account2.getProfitLimitPrices())
  account2.shouldLiquidation(4995)
  account2.shouldLiquidation(4990)
  console.log(account2.getLastTrade())
  // account2.shouldLiquidation()
}, 1000)
/*
describe('Account', function() {
  describe('isReadyToOrder', function() {
    it('should false when inited', function() {
      assert.equal(account.isReadyToOrder(), true)
    })
  })

  describe('do trade long and then stop loss', function(){
    it('trade', (done) => {
      account.trade(6400, true).then(() => {
        var err = account._price !== 6400 ? new Error('price not ok') : null
        done(err)
      })
      assert.equal(account.isReadyToOrder(), false)
    })
    it('stop l', function() {
      account.shouldLiquidation(6390).should.be.false()
      account.shouldLiquidation(6387).should.deepEqual({win: false})
      // account.isReadyToOrder().should.be.true()
    })
  })
  
  describe('do trade long and then stop profit', function() {
    var aa = new Account(false)
    it('trade', function(done){
      aa.isReadyToOrder().should.be.true()
      aa.trade(6400, true).then(done)
      aa.isReadyToOrder().should.be.false()
    })
    it('stop p', function() {
      aa.shouldLiquidation(6416).should.be.false()
      aa.shouldLiquidation(6419.5).should.deepEqual({win: true})
    })
  })
})
*/
