remote_ip="139.180.203.107"
remote_path="/data/www/human-strategy"
# sftp -b ../app/web/build/index.html -r root@$remote_ip:$remote_path
scp -r -P 2222 ../web/build/* root@$remote_ip:$remote_path
