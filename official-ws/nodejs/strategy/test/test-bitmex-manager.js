
const BitmexManager = require('../researchStrategy/BitmexManager')
const SarMaStrategyManager = require('../researchStrategy/sar_ma/Manager')

const obManager = new SarMaStrategyManager()

obManager.addNewStrategy({
  id: 'test',
})

const bitmex = new BitmexManager()

bitmex.listenCandle({binSize: '5m'}, function(list) {
  obManager.setCandleHistory('5m', list)
}, function(data) {
  obManager.updateCandleLastHistory('5m', data.data[0])
})
