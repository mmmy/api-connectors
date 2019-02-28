. ./common.sh

base_url="http://139.180.203.107:3004"
path="/api/coin/delete_order_all"

user="yq"

data="{\"user\":\"$user\"}"

confirm "$user: Delete Order All ?"
[ $? == '0' ] && echo 'Canceled and Exit' && exit

res=`curl -H "Content-Type:Application/json" -X POST --data $data $base_url$path`
echo $res

printf "\n"
print_result $res
printf "\n"

read -p "Press [Enter] key to close..."
