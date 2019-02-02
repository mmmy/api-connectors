remote_ip="202.182.125.82"
remote_path="/data/www/human-strategy"
# sftp -b ../app/web/build/index.html -r root@$remote_ip:$remote_path
scp -r ../web/build/* root@$remote_ip:$remote_path
