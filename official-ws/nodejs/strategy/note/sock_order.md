{ table: 'order',
  action: 'insert',
  data:
   [ { orderID: '13dd8aea-3863-d5de-388e-aab9c0dc6d44',
       clOrdID: '',
       clOrdLinkID: '',
       account: 82422,
       symbol: 'XBTUSD',
       side: 'Buy',
       simpleOrderQty: null,
       orderQty: 3000,
       price: 3692,
       displayQty: null,
       stopPx: null,
       pegOffsetValue: null,
       pegPriceType: '',
       currency: 'USD',
       settlCurrency: 'XBt',
       ordType: 'Limit',
       timeInForce: 'GoodTillCancel',
       execInst: 'ParticipateDoNotInitiate',
       contingencyType: '',
       exDestination: 'XBME',
       ordStatus: 'New',
       triggered: '',
       workingIndicator: false,
       ordRejReason: '',
       simpleLeavesQty: null,
       leavesQty: 3000,
       simpleCumQty: null,
       cumQty: 0,
       avgPx: null,
       multiLegReportingType: 'SingleSecurity',
       text: 'Submission from testnet.bitmex.com',
       transactTime: '2018-12-26T13:54:36.460Z',
       timestamp: '2018-12-26T13:54:36.460Z' } ] }

{ table: 'order',
  action: 'update',
  data:
   [ { orderID: '13dd8aea-3863-d5de-388e-aab9c0dc6d44',
       workingIndicator: true,
       clOrdID: '',
       account: 82422,
       symbol: 'XBTUSD',
       timestamp: '2018-12-26T13:54:36.460Z' } ] }


{ table: 'order',
  action: 'insert',
  data:
   [ { orderID: '77c8f81c-015d-79ea-5f8d-f84b3b41fc2c',
       clOrdID: '',
       clOrdLinkID: '',
       account: 82422,
       symbol: 'XBTUSD',
       side: 'Sell',
       simpleOrderQty: null,
       orderQty: 4000,
       price: 3692,
       displayQty: null,
       stopPx: null,
       pegOffsetValue: null,
       pegPriceType: '',
       currency: 'USD',
       settlCurrency: 'XBt',
       ordType: 'Limit',
       timeInForce: 'GoodTillCancel',
       execInst: 'ParticipateDoNotInitiate',
       contingencyType: '',
       exDestination: 'XBME',
       ordStatus: 'New',
       triggered: '',
       workingIndicator: false,
       ordRejReason: '',
       simpleLeavesQty: null,
       leavesQty: 4000,
       simpleCumQty: null,
       cumQty: 0,
       avgPx: null,
       multiLegReportingType: 'SingleSecurity',
       text: 'Submission from testnet.bitmex.com',
       transactTime: '2018-12-26T14:01:02.308Z',
       timestamp: '2018-12-26T14:01:02.308Z' } ] }

// 取消一个委托后
{ table: 'order',
  action: 'update',
  data:
   [ { orderID: '13dd8aea-3863-d5de-388e-aab9c0dc6d44',
       ordStatus: 'Canceled',
       workingIndicator: false,
       leavesQty: 0,
       text: 'Canceled: Cancel from testnet.bitmex.com\nSubmission from testnet.bitmex.com',
       timestamp: '2018-12-26T14:11:14.660Z',
       clOrdID: '',
       account: 82422,
       symbol: 'XBTUSD' } ] }

// 增加一个 市价止损的委托后
{ table: 'order',
  action: 'insert',
  data:
   [ { orderID: 'cebbfe87-c622-afe7-7535-7dc31dbcf600',
       clOrdID: '',
       clOrdLinkID: '',
       account: 82422,
       symbol: 'XBTUSD',
       side: 'Sell',
       simpleOrderQty: null,
       orderQty: 4000,
       price: null,
       displayQty: null,
       stopPx: 3500,
       pegOffsetValue: null,
       pegPriceType: '',
       currency: 'USD',
       settlCurrency: 'XBt',
       ordType: 'Stop',
       timeInForce: 'ImmediateOrCancel',
       execInst: 'Close,LastPrice',
       contingencyType: '',
       exDestination: 'XBME',
       ordStatus: 'New',
       triggered: '',
       workingIndicator: false,
       ordRejReason: '',
       simpleLeavesQty: null,
       leavesQty: 4000,
       simpleCumQty: null,
       cumQty: 0,
       avgPx: null,
       multiLegReportingType: 'SingleSecurity',
       text: 'Submission from testnet.bitmex.com',
       transactTime: '2018-12-26T14:09:21.912Z',
       timestamp: '2018-12-26T14:09:21.912Z' } ] }