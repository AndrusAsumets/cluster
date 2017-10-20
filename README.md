## CLUSTER  

For installation:  
```npm install```  

For development:  
```npm run server``` (Runs a Socket.io instance that also runs the game in a headless host mode)  
```npm run client``` (Runs a Webpack that runs a webserver that serves the game in a client mode)  
Browse: ```http://localhost:3000/?me=player1``` (Connects a player that controls left side of the screen)  
Browse: ```http://localhost:3000/?me=player2``` (Connects a player that controls right side of the screen)  

For production:  
```npm run env``` (Copies .env.default to .env file that dot.env module will read [Fill it relevantly, if need be])  
```npm run build``` (Bundles the client into /build)  
```npm run server```  
