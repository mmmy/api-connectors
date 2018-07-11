
var Account = require('../Account')
var assert = require('assert')
var should = require('should')

var account = new Account(false, true)
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
