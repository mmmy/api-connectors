# symbol="XBTUSD"
# if [ -n "$1" ]
# then
#   symbol=$1
# fi;
# echo $symbol
node xbt_fetch_data.js -s XBTUSD -b 1d
node check_data.js XBTUSD_1d_2017-04-01.csv

node xbt_fetch_data.js -s XBTUSD -b 1h
node check_data.js XBTUSD_1h_2017-06-01.csv

node xbt_fetch_data.js -s XBTUSD -b 5m
node check_data.js XBTUSD_5m_2017-09-01.csv

node xbt_fetch_data.js -s XBTUSD -b 1m
node check_data.js XBTUSD_1m_2017-09-01.csv

node xbt_fetch_data.js -s ETHUSD -b 1d
node check_data.js ETHUSD_1d_2018-08-03.csv

node xbt_fetch_data.js -s ETHUSD -b 1h
node check_data.js ETHUSD_1h_2018-08-03.csv

node xbt_fetch_data.js -s ETHUSD -b 5m
node check_data.js ETHUSD_5m_2018-08-03.csv

node xbt_fetch_data.js -s ETHUSD -b 1m
node check_data.js ETHUSD_1m_2018-08-03.csv