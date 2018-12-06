import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from bitmex_db_client import raw_data_client

start_time = '2018-12-05T01:18:00.000Z'

time_long = '1d'

total_json = list(raw_data_client.query("select count(*) from json \
                              where time > '{}' and time <= '{}' + {}\
                              ".format(start_time, start_time, time_long))['json'])[0]['count_json_str']

print('total json', total_json, 'json/hour', total_json / 24)

total_orderbook = list(raw_data_client.query("select count(*) from json \
                              where time > '{}' and time <= '{}' + {} and table='orderBookL2_25'\
                              ".format(start_time, start_time, time_long))['json'])[0]['count_json_str']

print('total_orderbook', total_orderbook, '/hour', total_orderbook / 24)

total_trade = list(raw_data_client.query("select count(*) from json \
                              where time > '{}' and time <= '{}' + {} and table='trade'\
                              ".format(start_time, start_time, time_long))['json'])[0]['count_json_str']

print('total_trade', total_trade, '/hour', total_trade / 24)

total_instrument = list(raw_data_client.query("select count(*) from json \
                              where time > '{}' and time <= '{}' + {} and table='instrument'\
                              ".format(start_time, start_time, time_long))['json'])[0]['count_json_str']

print('total_instrument', total_instrument, '/hour', total_instrument / 24)

print(total_orderbook + total_trade + total_instrument)
