import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from bitmex_db_client import db_client

data = db_client.query('select * from indicativeSettlePrice order by time desc limit 5000')
# print(data)
delta_list = [item['delta'] for item in data['indicativeSettlePrice'] if item['delta'] is not None and abs(item['delta'] - 0) > 0.01]
print(delta_list)
plt.hist(delta_list, 30)
plt.show()
