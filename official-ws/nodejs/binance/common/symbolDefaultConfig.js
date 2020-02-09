

exports.symbolConfigDefault = {
  'BTCUSDT': {
    orderConfig: {
      profitPx: 0,
      price: 0,
      side: 'BUY',
      stopPx: 0,
      openMethod: '',
      autoOrderProfit: true, // reduceOnly limit
    },
    tvAlertConfig: {
      minStop: 40,
      maxStop: 150,
      risk: 100, // $
      maxAmount: 30000,
      profitRate: 2,
      enableLong: false,
      enableShort: false,
    },
    uiConfig: {
      risk: 100, //$100
      openMethod: 'limit',   // limit or stop
      defaultProfitRate: 2,
      side: 'BUY',
      price: 0,
      stopPx: 0,
      profitPx: 0,
    }
  },
  'ETHUSDT': {
    orderConfig: {
      profitPx: 0,
      price: 0,
      side: 'BUY',
      stopPx: 0,
      openMethod: '',
      autoOrderProfit: true, // reduceOnly limit
    },
    tvAlertConfig: {
      minStop: 1,
      maxStop: 3,
      risk: 100, // $
      maxAmount: 30000,
      profitRate: 2,
      enableLong: false,
      enableShort: false,
    },
    uiConfig: {
      risk: 100, //$100
      openMethod: 'limit',   // limit or stop
      defaultProfitRate: 2,
      side: 'BUY',
      price: 0,
      stopPx: 0,
      profitPx: 0,
    }
  },
}
