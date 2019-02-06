confirm() {
  # read -r -p "${1:-Are you sure? [y/N]} " response
  read -r -p "$1 Are you sure? [y/N]: " response
  case "$response" in
    [yY][eE][sS]|[yY])
      res=1
      ;;
    *)
      res=0
      ;;
  esac
  return "$res"
}

select side in "Buy" "Sell";
do
if [ ! -z "$side" ]; then
  break
else
  echo 'error! choose 1 or 2'
fi
done
read -p "qty: " qty

printf "\n"
echo '-----confirm------'
confirm "$side $qty"
[ $? == '0' ] && echo 'canceled and exit' && exit

curl www.baidu.com

read -p "Press [Enter] key to close..."
