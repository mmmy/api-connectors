
base_url="http://139.180.203.107:3004"
path="/api/coin/all_quotes"

if [ "$ORDER_ENV" == "production" ]; then
res=`curl $base_url$path`
else
res='{"result":true,"data":[{"timestamp":"2019-02-17T06:10:02.920Z","symbol":"XBTUSD","bidSize":2568,"bidPrice":3591.5,"askPrice":3592,"askSize":25438},{"timestamp":"2019-02-17T06:10:04.593Z","symbol":"ETHUSD","bidSize":7367,"bidPrice":121.1,"askPrice":121.65,"askSize":2737},{"timestamp":"2019-02-17T06:09:50.060Z","symbol":"XRPH19","bidSize":23611,"bidPrice":0.00008464,"askPrice":0.00008477,"askSize":23610}]}'
fi
echo $res
