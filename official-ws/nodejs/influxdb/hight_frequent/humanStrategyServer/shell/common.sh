confirm() {
  # read -r -p "${1:-Are you sure? [y/N]} " response
  printf "$1"
  printf "\n"
  read -r -p "Are you sure? [y/N]: " response
  case "$response" in
    [yY][eE][sS]|[yY])
      _res=1
      ;;
    *)
      _res=0
      ;;
  esac
  return "$_res"
}

print_result() {
    if [[ $1 == *"\"result\":true"* ]]; then
        printf "\e[92mOK\e[0m\n"
    else
        printf "\e[91mFALURE \!\!\e[0m\n"
    fi
}

read_symbol() {
    echo "select a symbol";
    select symbol in "XBTUSD" "ETHUSD" "XRPH19";
    do
    if [ ! -z "$symbol" ]; then
    break
    else
    echo 'error! choose one'
    fi
    done
    # $1="$symbol"
}
