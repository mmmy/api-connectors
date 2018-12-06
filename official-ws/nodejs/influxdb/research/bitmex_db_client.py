
from influxdb import InfluxDBClient

db_client = InfluxDBClient('localhost', 8086, database='bitmex')

raw_data_client = InfluxDBClient('localhost', 8086, database='raw_data')
