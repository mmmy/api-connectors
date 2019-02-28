# 暂时弃用
base_url="http://139.180.203.107:3004"
path="/api/coin"

if [ "$ORDER_ENV" == "production" ]; then
res=`curl $base_url$path`
else
res='{"result":true,"items":[{"options":{"test":false,"database":true,"maxCache":200,"bookMaxSizeBuy":500000,"bookMaxSizeSell":500000,"balanceAmount":true,"maxAmountCount":1000,"stochRsi":{"rsiPeriod":14,"stochasticPeriod":14,"kPeriod":3,"dPeriod":3},"id":"human-strategy","user":"yq","testnet":true,"main":true},"orders":[],"position":{"account":82422,"symbol":"XBTUSD","currency":"XBt","underlying":"XBT","quoteCurrency":"USD","commission":0.00075,"initMarginReq":0.1,"maintMarginReq":0.005,"riskLimit":20000000000,"leverage":10,"crossMargin":false,"deleveragePercentile":1,"rebalancedPnl":-447,"prevRealisedPnl":-3755939,"prevUnrealisedPnl":0,"prevClosePrice":3608.75,"openingTimestamp":"2019-02-09T02:00:00.000Z","openingQty":-20,"openingCost":597100,"openingComm":1042,"openOrderBuyQty":0,"openOrderBuyCost":0,"openOrderBuyPremium":0,"openOrderSellQty":0,"openOrderSellCost":0,"openOrderSellPremium":0,"execBuyQty":0,"execBuyCost":0,"execSellQty":0,"execSellCost":0,"execQty":0,"execCost":0,"execComm":0,"currentTimestamp":"2019-02-09T02:40:41.058Z","currentQty":-20,"currentCost":597100,"currentComm":1042,"realisedCost":0,"unrealisedCost":597100,"grossOpenCost":0,"grossOpenPremium":0,"grossExecCost":0,"isOpen":true,"markPrice":3608.44,"markValue":554260,"riskValue":554260,"homeNotional":-0.0055426,"foreignNotional":20,"posState":"","posCost":597100,"posCost2":598142,"posCross":0,"posInit":59710,"posComm":493,"posLoss":1042,"posMargin":59161,"posMaint":5718,"posAllowance":0,"taxableMargin":0,"initMargin":0,"maintMargin":16321,"sessionMargin":0,"targetExcessMargin":0,"varMargin":0,"realisedGrossPnl":0,"realisedTax":0,"realisedPnl":-1042,"unrealisedGrossPnl":-42840,"longBankrupt":0,"shortBankrupt":0,"taxBase":0,"indicativeTaxRate":0,"indicativeTax":0,"unrealisedTax":0,"unrealisedPnl":-42840,"unrealisedPnlPcnt":-0.0717,"unrealisedRoePcnt":-0.7175,"simpleQty":null,"simpleCost":null,"simpleValue":null,"simplePnl":null,"simplePnlPcnt":null,"avgCostPrice":3349.5,"avgEntryPrice":3349.5,"breakEvenPrice":3341,"marginCallPrice":3678.5,"liquidationPrice":3678.5,"bankruptPrice":3714,"timestamp":"2019-02-09T02:40:41.058Z","lastPrice":3608.44,"lastValue":554260}}]}'
fi
# echo $res

print_key() {
    reg="\"$1\".*?,"
    # echo $reg
    echo $res | grep -oiE $reg
}

print_key "leverage"
print_key "currentQty"
print_key "avgCostPrice"
print_key "realisedGrossPnl"
print_key "realisedPnl"
print_key "unrealisedPnl"
print_key "unrealisedPnlPcnt"

# echo "Orders------------------------------------------"