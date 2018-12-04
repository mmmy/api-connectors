
from influxdb import InfluxDBClient

db_client = InfluxDBClient('localhost', 8086, database='bitmex')
