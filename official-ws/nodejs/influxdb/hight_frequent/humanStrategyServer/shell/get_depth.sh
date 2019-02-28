
base_url="http://139.180.203.107:3004"
path="/api/coin/xbtusd_depth?level=1"

if [ "$ORDER_ENV" == "production" ]; then
res=`curl $base_url$path`
else
res='{"result":true,"data":[{"symbol":"XBTUSD","id":15599663700,"side":"Buy","size":6540,"price":3363},{"symbol":"XBTUSD","id":15599663650,"side":"Sell","size":2823,"price":3363.5}]}'
fi
echo $res
