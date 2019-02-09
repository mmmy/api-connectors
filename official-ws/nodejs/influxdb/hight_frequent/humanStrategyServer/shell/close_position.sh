. ./common.sh

base_url="http://202.182.125.82:3004"
path="/api/coin/close_position"

user="yq"

data="{\"user\":\"$user\"}"

confirm "Close Position ?"
[ $? == '0' ] && echo 'Canceled and Exit' && exit

res=`curl -H "Content-Type:Application/json" -X POST --data $data $base_url$path`
echo $res

printf "\n"
print_result $res
printf "\n"

read -p "Press [Enter] key to close..."
