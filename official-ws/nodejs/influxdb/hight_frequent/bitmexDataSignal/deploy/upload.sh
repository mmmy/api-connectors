remote_ip="139.180.203.107"
remote_path="/data/www/bitmex_data_signal"
# sftp -b ../app/web/build/index.html -r root@$remote_ip:$remote_path
scp -r ../web/build/* root@$remote_ip:$remote_path
