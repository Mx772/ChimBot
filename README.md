# ChimBot

This bot was created for 'Chim Trains'. A event within ConanExiles server 'Sanctum of Cthulhu'

Example in use:

![8BjG1oowCP](https://user-images.githubusercontent.com/9059161/127601071-44273120-4640-4adc-886f-096c2f6619c8.gif)

### Features Primitive role based mangement with Role Transfers:

![mCCEMQlSsr](https://user-images.githubusercontent.com/9059161/127601562-6fdff918-2e93-4a5d-bd7f-d79e135206c2.gif)

This is to prevent non-hosts or non-admin role users from changing behaviour of the train. 

# Installation:

NPM init should grab all dependencies. 

# Setup:

You will need your discord bot's Oauth2 token found here:

https://discord.com/developers/applications/

Click 'copy' to get your token:

![image](https://user-images.githubusercontent.com/9059161/127697584-03cc7d5b-5e77-4d3e-929d-65123fde28af.png)

Return config-example.json into config.json and fill out the required fields:

token: Discord Bot Oauth2 Token

Admin Roles: Role ID of anyone who can override the 'host'. Can have multiple roles.

Channel: The channel for the bot to listen in.

Prefix: The prefix for commands such as ?, >, ! - This is used before the command such as ?chimtrain

# Commands:

?chimhelp - Gets the help page

?chimstart - Starts the Chim Train

?chimtransfer (user)- Transfers the 'host' role to a new user to control the train.

# Issues:

Please open a git issue as issues or feature requests as needed.

