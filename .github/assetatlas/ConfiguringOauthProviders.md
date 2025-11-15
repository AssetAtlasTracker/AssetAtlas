## Configuring Oauth for Asset Atlas

One of the app’s features is the ability to have users create and login to their own accounts, which can be done with Google and Github accounts. Unfortunately this must be manually configured for every instance of Asset Atlas, but is not too difficult of a task.

The rough outline of this process is:

1. Configure Oauth logins for Google and Github  
2. Create “secrets.env” in the app directory  
3. Insert needed data into “secrets.env”

### 1. Configuring Oauth logins for Google and Github

   Oauth is a process that allows users to login to the app using external accounts, namely Github and Google in this case. In order to have these function properly, you will need to register an app with these providers, which will let them know where the user is trying to log in to.  

1) Google OAuth Registration (read fully before starting)  
   1) The official google documentation is [here](https://support.google.com/cloud/answer/15549257?sjid=2068013545075202076-NC) for the actual process of creating the cloud client  
   2) When you are registering, you will be prompted for “Authorized redirect URIs”. This will be what brings us back to the application once google has logged the user in, and you will need to provide this link. The actual link you give may differ, but it will take the form of “**(home page)**/api/oauth/callbackGoogle”. So if you are hosting the app locally at “<http://localhost:3000”>, the URI should be “[http://localhost:3000/api/oauth/callbackGoogle](http://localhost:3000/api/oauth/callbackGoogle)”.  
   3) The end result of the registration process will be a client ID and a client secret. Hold onto these and save them for later, particularly the secret, as you can only look at it once.

2) Github OAuth Registration (read fully before starting)  
   1) The official github documentation is [here](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) for the process of registering an OAuth app with github  
   2) When you are registering, you will be prompted for “Homepage URL”. This is just the link where your main page lies. For example if locally hosted at “<http://localhost:3000”>, this is where the main page would lie.
   3) You will also be prompted for an “Authorization callback URL”. This will be the home page url \+ “/api/oauth/callbackGithub”, so “<http://localhost:3000/api/oauth/callbackGithub”> if following the previous example.  
   4) The end result of the registration process will be a client ID and a client secret. Hold onto these and save them for later, particularly the secret, as you can only look at it once.

### 2. Creating “secrets.env” in the app folder

 Now that you have the data needed, you will need to have somewhere to store it so that the app can use it.

1) Navigate to the folder where you downloaded your app. This should be the same folder that holds “docker-compose-ghcr.yml”  
2) Create a new file in this folder, and name it “secrets.env”

### 3. Adding data to “secrets.env”

   Now that we have the file,we need to add the data to it. Open “secrets.env” with a text editor, such as notepad.  

   Now copy/paste the following inside  

   GOOGLE\_CLIENT\_ID= \<insert google client id\>  
   GOOGLE\_CLIENT\_SECRET=\<insert google client secret\>  
   GOOGLE\_REDIRECT\_URI=\<homepage\>/api/oauth/callbackGoogle  
   GITHUB\_CLIENT\_ID=\<insert github client id\>  
   GITHUB\_CLIENT\_SECRET=\<insert github client secret\>  
   GITHUB\_REDIRECT\_URI=\<homepage\>/api/oauth/callbackGithub

   All fields in arrow brackets \<\> will need to be replaced with the relevant information.  

   Once this is complete, users should be able to login with OAuth with no issue\!  
