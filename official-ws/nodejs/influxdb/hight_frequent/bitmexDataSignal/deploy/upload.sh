remote_ip="207.148.65.114"
remote_path="/data/www/bitmex_data_signal"
# sftp -b ../app/web/build/index.html -r root@$remote_ip:$remote_path
scp -r ../web/build/* root@$remote_ip:$remote_path
