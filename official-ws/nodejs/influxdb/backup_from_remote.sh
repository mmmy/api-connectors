
local_latest_json=`curl -G 'http://127.0.0.1:8086/query?db=raw_data' --data-urlencode 'q=SELECT * FROM json ORDER BY time DESC LIMIT 1'`
lastest_time=`echo $local_latest_json | grep -o -P '\d{4}-.*?Z'`
echo $lastest_time

remote_ip="202.182.125.82"
backup_path="/root/workspace/backup_raw_data"
echo $backup_path
echo "执行备份raw_data start at $lastest_time"
remote_cmd="ssh root@$remote_ip rm $backup_path/* & influxd backup -portable -db raw_data -since $lastest_time $backup_path"
echo $remote_cmd
response=`$remote_cmd`
echo $response

# echo '下载文件'
# sftp -r root@$remote_ip:$backup_path ./backup
