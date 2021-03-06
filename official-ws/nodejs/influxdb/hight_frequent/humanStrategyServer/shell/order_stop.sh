. ./common.sh

base_url="http://139.180.203.107:3004"
path="/api/coin/order_stop"
printf 'Order Stop\n'
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

read -p "stop price: " stopPx

printf "\n"
echo '-----confirm------'
confirm "Order Stop $symbol $side $qty @ $stopPx to $path"
[ $? == '0' ] && echo 'canceled and exit' && exit

user="yq"
json="{\"user\":\"$user\",\"symbol\":\"$symbol\",\"side\":\"$side\",\"qty\":$qty,\"stopPx\":$stopPx}"

echo $json

res=`curl -H "Content-Type:application/json" -X POST --data $json $base_url$path`
echo $res

printf "\n"
print_result $res
printf "\n"

read -p "Press [Enter] key to close..."
