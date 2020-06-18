# qserv_web

The application is expected to be run from the current directory as:
```
docker run --rm --network=host \
    --name qserv-replica-nginx \
    -v $PWD/www:/usr/share/nginx/html:ro \
    -v $PWD/default.conf:/etc/nginx/conf.d/default.conf:ro \
    -d \
    nginx
```
A simlar command for the `int` cluster at *NCSA* would look like:
```
docker run --rm --network=host \
    --name qserv-replica-nginx \
    -v $PWD/www:/usr/share/nginx/html:ro \
    -v $PWD/ncsa_int.conf:/etc/nginx/conf.d/default.conf:ro \
    -d \
    nginx
```
