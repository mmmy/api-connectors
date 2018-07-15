
## 注意
5分钟内不要重复执行

## order Market
#### ok response
```
{ orderID: '28811df6-9d87-4e55-8972-d3670f66aa75',
  clOrdID: '',
  clOrdLinkID: '',
  account: 82422,
  symbol: 'XBTUSD',
  side: 'Sell',         // Buy
  simpleOrderQty: null,
  orderQty: 1000,       //
  price: 6442.5,         //
  displayQty: null,
  stopPx: null,
  pegOffsetValue: null,
  pegPriceType: '',
  currency: 'USD',
  settlCurrency: 'XBt',
  ordType: 'Market',      //
  timeInForce: 'ImmediateOrCancel',
  execInst: '',
  contingencyType: '',
  exDestination: 'XBME',
  ordStatus: 'Filled',    // 'New'
  triggered: '',
  workingIndicator: false,
  ordRejReason: '',
  simpleLeavesQty: 0,
  leavesQty: 0,
  simpleCumQty: 0.15522,
  cumQty: 1000,
  avgPx: 6442.5,          // null
  multiLegReportingType: 'SingleSecurity',
  text: 'Submitted via API.',
  transactTime: '2018-07-10T15:51:18.099Z',
  timestamp: '2018-07-10T15:51:18.099Z' }
  
```

#### fail error
```
{"error":{"message":"Executing at order price would lead to immediate liquidation","name":"ValidationError"}}
```

## order stop
#### ok
```
{ orderID: '00cd9b5e-1c51-0a64-0e39-78dda7bea68e',
  clOrdID: '',
  clOrdLinkID: '',
  account: 82422,
  symbol: 'XBTUSD',
  side: 'Buy',
  simpleOrderQty: null,
  orderQty: 1000,
  price: null,
  displayQty: null,
  stopPx: 6475.5,
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
  simpleLeavesQty: 0.1553,
  leavesQty: 1000,
  simpleCumQty: 0,
  cumQty: 0,
  avgPx: null,
  multiLegReportingType: 'SingleSecurity',
  text: 'Submitted via API.',
  transactTime: '2018-07-10T16:26:39.894Z',
  timestamp: '2018-07-10T16:26:39.894Z' }
```

## orderMarketTouched
#### ok
```
{ orderID: '0842da8c-0ae2-1cc6-4271-f050b5ae31a2',
  clOrdID: '',
  clOrdLinkID: '',
  account: 82422,
  symbol: 'XBTUSD',
  side: 'Buy',
  simpleOrderQty: null,
  orderQty: 1000,
  price: null,
  displayQty: null,
  stopPx: 6400,
  pegOffsetValue: null,
  pegPriceType: '',
  currency: 'USD',
  settlCurrency: 'XBt',
  ordType: 'MarketIfTouched',
  timeInForce: 'ImmediateOrCancel',
  execInst: 'Close,LastPrice',
  contingencyType: '',
  exDestination: 'XBME',
  ordStatus: 'New',
  triggered: '',
  workingIndicator: false,
  ordRejReason: '',
  simpleLeavesQty: 0.1553,
  leavesQty: 1000,
  simpleCumQty: 0,
  cumQty: 0,
  avgPx: null,
  multiLegReportingType: 'SingleSecurity',
  text: 'Submitted via API.',
  transactTime: '2018-07-10T16:26:40.844Z',
  timestamp: '2018-07-10T16:26:40.844Z' }
```

## "LimitIfTouched"
stopPx price
```
{ orderID: 'abb6656e-9ed8-a32f-8b17-2178ef9868f0',
        clOrdID: '',
        clOrdLinkID: '',
        account: 82422,
        symbol: 'XBTUSD',
        side: 'Sell',
        simpleOrderQty: null,
        orderQty: 10000,
        price: 6251.5,
        displayQty: null,
        stopPx: 6251,
        pegOffsetValue: null,
        pegPriceType: '',
        currency: 'USD',
        settlCurrency: 'XBt',
        ordType: 'LimitIfTouched',
        timeInForce: 'GoodTillCancel',
        execInst: 'Close,LastPrice',
        contingencyType: '',
        exDestination: 'XBME',
        ordStatus: 'New',
        triggered: '',
        workingIndicator: false,
        ordRejReason: '',
        simpleLeavesQty: 1.6042,
        leavesQty: 10000,
        simpleCumQty: 0,
        cumQty: 0,
        avgPx: null,
        multiLegReportingType: 'SingleSecurity',
        text: 'Submitted via API.',
        transactTime: '2018-07-15T02:30:34.948Z',
        timestamp: '2018-07-15T02:30:34.948Z' } }
```

## OrderLimit
```
{ orderID: '3b744973-b97a-3893-bc0f-002375740cae',
        clOrdID: '',
        clOrdLinkID: '',
        account: 82422,
        symbol: 'XBTUSD',
        side: 'Buy',
        simpleOrderQty: null,
        orderQty: 10000,
        price: 6234,
        displayQty: null,
        stopPx: null,
        pegOffsetValue: null,
        pegPriceType: '',
        currency: 'USD',
        settlCurrency: 'XBt',
        ordType: 'Limit',
        timeInForce: 'GoodTillCancel',
        execInst: '',
        contingencyType: '',
        exDestination: 'XBME',
        ordStatus: 'New',
        triggered: '',
        workingIndicator: true,
        ordRejReason: '',
        simpleLeavesQty: 1.6041,
        leavesQty: 10000,
        simpleCumQty: 0,
        cumQty: 0,
        avgPx: null,
        multiLegReportingType: 'SingleSecurity',
        text: 'Submitted via API.',
        transactTime: '2018-07-15T02:30:31.580Z',
        timestamp: '2018-07-15T02:30:31.580Z' } },
  _deleteUselessOrderTimes: 0 }
```
