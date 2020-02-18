

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
      supportIntervals: ['1h'],
      autoOrderProfit: true,
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
      supportIntervals: ['1h'],
      autoOrderProfit: true,
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
      autoOrderProfit: true, // reduceOnly limit
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
      autoOrderProfit: true, // reduceOnly limit
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
