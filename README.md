# qserv_web

The application is expected to be run from the current directory as:
```
docker run --rm --network=host \
    --name qserv-replication-nginx \
    -v $PWD/www:/usr/share/nginx/html:ro \
    -v $PWD/default.conf:/etc/nginx/conf.d/default.conf:ro \
    -d \
    nginx
```
