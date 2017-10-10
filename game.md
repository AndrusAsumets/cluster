cluster.game


NOW:
- gameplay:
* random resourced

- UI:
* kui palju mine raha teenib ja kuidas sellest aru saada? näita sell, upgrade menüüst paremal
* damage animations
* past trail for patterns

PHASE1:
* game balance & upgrades
* store game data to file/database & playback
* game rooms
* lobby
* deployment
* human testing

PHASE2:
* optimize engine
* emit only to host option
* menu & player switching for mobile
* game modes (2 player, 4 player)
* ranking
* ionic
* automated testing
* pricing model
* release strategy
* IP
* app store / play store
* operations

PEOPLE:
* scaling -> Kristo
* UI -> Kaarel
* sounds > Markku?
* illustrations -> Ingmar Järve (ingmarjarve.tumblr.com)
* story > who?
* moneying model > bootstrappig/funding?

bubble:
water (blue): speed
earth (green): strength
fire (red): demolish
wind (white): air

darts:
water (blue): slow
earth (green): damage
fire (red): splash
wind (white): range


element | slow      | speed     | range    | air       | splash   | horde    | damage    | strength  |
--------|-----------|-----------|----------|-----------|----------|----------|-----------|-----------|
earth   |  0        |  1        |  1       |  0        |  1       |  0       |  2        |  2        | 7
water   |  1        |  2        |  1       |  1        |  1       |  0       |  1        |  1        | 6
fire    |  0        |  1        |  1       |  0        |  2       |  1       |  1        |  1        | 5
wind    |  0        |  1        |  2       |  0        |  1       |  0       |  1        |  1        | 6


password auth:
https://www.digitalocean.com/community/tutorials/how-to-set-up-password-authentication-with-nginx-on-ubuntu-14-04
nginx config edit:
sudo nano /etc/nginx/sites-enabled/default
nginx config:
server {
    listen 80;

    auth_basic "Restricted Content";
    auth_basic_user_file /etc/nginx/.htpasswd;
    location / {
        proxy_pass http://localhost:1337;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 8080;

    auth_basic "Restricted Content";
    auth_basic_user_file /etc/nginx/.htpasswd;

	location ~ ^/timesync(.*)$ {
        proxy_pass http://localhost:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

restart nginx:
sudo service nginx restart

close ports:
iptables -A INPUT -p tcp --dport 3000 -s 192.168.0.0/24 -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -s 127.0.0.0/8 -j ACCEPT
iptables -A INPUT -p tcp --dport 3000 -j DROP

start server:
nodemon --ignore 'public/' .js

kill process by port:
fuser -n tcp -k 1337

// difference
var a = new JS.Set([1,2,3,4,5,6,7,8,9]);
var b = new JS.Set([2,4,6,8]);

a.difference(b)
// -> Set{1,3,5,7,9}

* fix crash when clicking to sides
* fix attacking
* fix walkables by creating a grid for each player
* close first and last rows
* redraw links when building new buildings
* disallow linking to the same building
* allow for building on first and last rows
* test icon from an image
* linking between the buildings
* avoid duplicate links
* save links to host
* sync time
