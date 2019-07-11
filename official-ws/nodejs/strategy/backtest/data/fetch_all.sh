node xbt_fetch_data.js -s XBTUSD -b 1d
node check_data.js XBTUSD_1d_2017-04-01.csv

node xbt_fetch_data.js -s XBTUSD -b 1h
node check_data.js XBTUSD_1h_2017-06-01.csv

node xbt_fetch_data.js -s XBTUSD -b 5m
node check_data.js XBTUSD_5m_2017-09-01.csv

node xbt_fetch_data.js -s XBTUSD -b 1m
node check_data.js XBTUSD_1m_2017-09-01.csv
