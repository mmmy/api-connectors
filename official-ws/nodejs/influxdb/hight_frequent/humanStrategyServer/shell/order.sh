. ./common.sh

base_url="http://202.182.125.82:3004"
if [[ $ORDER_TYPE == "Limit" ]]; then
path="/api/coin/order_limit"
echo "Order Limit"
else
path="/api/coin/order_market"
echo "Order Market"
fi

read_symbol

select side in "Buy" "Sell";
do
if [ ! -z "$side" ]; then
  break
else
  echo 'error! choose 1 or 2'
fi
done
read -p "qty: " qty

if [ $ORDER_TYPE == "Limit" ]; then
read -p "price(-1 -> auto_price):" price
fi

auto_price='false'
if [ $price == '-1' ]; then
auto_price='true'
fi

user="yq"

printf "\n"
msg="$user: $symbol $side $qty $price to $path"
if [ $auto_price == 'true' ]; then
msg="$user: $symbol $side $qty auto_price to $path"
fi
echo '-----confirm------'
confirm "$msg"
[ $? == '0' ] && echo 'canceled and exit' && exit

if [ $ORDER_TYPE == "Limit" ]; then
json="{\"user\":\"$user\",\"symbol\":\"$symbol\",\"side\":\"$side\",\"qty\":$qty,\"price\":$price,\"auto_price\":$auto_price}"
else
json="{\"user\":\"$user\",\"symbol\":\"$symbol\",\"side\":\"$side\",\"qty\":$qty}"
fi
echo $json

res=`curl -H "Content-Type:application/json" -X POST --data $json $base_url$path`
echo $res

printf "\n"
print_result $res
printf "\n"

read -p "Press [Enter] key to close..."
