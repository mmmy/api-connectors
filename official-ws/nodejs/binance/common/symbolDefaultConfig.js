
exports.symbolConfigDefault = {
  'BTCUSDT': {
    orderConfig: {
      profitPx: 0,
      price: 0,
      side: 'BUY',
      stopPx: 0,
      openMethod: '',
      lastUpdateCostStop: 0,  // 记录上次设置保本止损单的时间，不能频繁
    },
    tvAlertConfig: {
      minStop: 40,
      maxStop: 150,
      risk: 100, // $
      maxAmount: 30000,
      profitRate: 2,
      enableLong: false,
      enableShort: false,
      supportIntervals: ['1h'],
      autoOrderProfit: true, // 自动检测设置止盈单
      autoUpdateStop: true,       // 当盈利达到1：1.5后将止损移动到成本位
      profitRateForUpdateStop: 1.5,
    },
    uiConfig: {
      risk: 100, //$100
      defaultProfitRate: 2,
      BUY: {
        price: 0,
        stopPx: 0,
        profitPx: 0,
      },
      SELL: {
        price: 0,
        stopPx: 0,
        profitPx: 0,
      }
    }
  },
  'ETHUSDT': {
    orderConfig: {
      profitPx: 0,
      price: 0,
      side: 'BUY',
      stopPx: 0,
      openMethod: '',
      lastUpdateCostStop: 0
    },
    tvAlertConfig: {
      minStop: 1,
      maxStop: 3,
      risk: 100, // $
      maxAmount: 30000,
      profitRate: 2,
      enableLong: false,
      enableShort: false,
      supportIntervals: ['1h'],
      autoOrderProfit: true,
      autoUpdateStop: true,       // 当盈利达到1：1.5后将止损移动到成本位
      profitRateForUpdateStop: 1.5,
    },
    uiConfig: {
      risk: 100, //$100
      defaultProfitRate: 2,
      BUY: {
        price: 0,
        stopPx: 0,
        profitPx: 0,
      },
      SELL: {
        price: 0,
        stopPx: 0,
        profitPx: 0,
      }
    }
  },
  'EOSUSDT': {
    orderConfig: {
      profitPx: 0,
      price: 0,
      side: 'BUY',
      stopPx: 0,
      openMethod: '',
      lastUpdateCostStop: 0
    },
    tvAlertConfig: {
      minStop: 0.04,
      maxStop: 0.1,
      risk: 100, // $
      maxAmount: 1000,
      profitRate: 2,
      enableLong: false,
      enableShort: false,
      supportIntervals: ['1h'],
      autoOrderProfit: true,
      autoUpdateStop: true,       // 当盈利达到1：1.5后将止损移动到成本位
      profitRateForUpdateStop: 1.5,
    },
    uiConfig: {
      risk: 100, //$100
      defaultProfitRate: 2,
      BUY: {
        price: 0,
        stopPx: 0,
        profitPx: 0,
      },
      SELL: {
        price: 0,
        stopPx: 0,
        profitPx: 0,
      }
    }
  },
  'LTCUSDT': {
    orderConfig: {
      profitPx: 0,
      price: 0,
      side: 'BUY',
      stopPx: 0,
      openMethod: '',
      lastUpdateCostStop: 0
    },
    tvAlertConfig: {
      minStop: 0.4,
      maxStop: 1,
      risk: 100, // $
      maxAmount: 1000,
      profitRate: 2,
      enableLong: false,
      enableShort: false,
      supportIntervals: ['1h'],
      autoOrderProfit: true,
      autoUpdateStop: true,       // 当盈利达到1：1.5后将止损移动到成本位
      profitRateForUpdateStop: 1.5,
    },
    uiConfig: {
      risk: 100, //$100
      defaultProfitRate: 2,
      BUY: {
        price: 0,
        stopPx: 0,
        profitPx: 0,
      },
      SELL: {
        price: 0,
        stopPx: 0,
        profitPx: 0,
      }
    }
  },
}
