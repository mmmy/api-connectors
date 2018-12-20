
local_latest_json=`curl -G 'http://127.0.0.1:8086/query?db=raw_data' --data-urlencode 'q=SELECT * FROM json ORDER BY time DESC LIMIT 1'`
lastest_time=`echo $local_latest_json | grep -o -P '\d{4}-.*?Z(?=")'`
echo $lastest_time

remote_ip="202.182.125.82"
backup_path="/root/workspace/backup_raw_data"
echo $backup_path
echo "执行备份raw_data start at $lastest_time"
remote_cmd="ssh root@$remote_ip rm $backup_path/* & influxd backup -portable -db raw_data -since $lastest_time $backup_path"
echo $remote_cmd
response=`$remote_cmd`
echo $?
echo $response

echo '下载文件'

rm -rf ./restore_temp/*
sftp -r root@$remote_ip:$backup_path ./restore_temp

influxd restore -portable -db raw_data -newdb raw_data_bak ./restore_temp/backup_raw_data

echo '下载文件结束 请手动执行'
echo 'USE raw_data_bak'
echo 'SELECT * INTO raw_data..:MEASUREMENT FROM /.*/ GROUP BY *'
echo 'DROP DATABASE raw_data_bak'
