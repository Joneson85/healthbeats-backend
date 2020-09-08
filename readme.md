# HealthBeats Backend
Created for testing of Simplified HealthBeats 2FA functionality

# Pre-requisites
You should already have bash, mongoDB, nvm and npm set up on your machine.

# Running the app

Within the directory of the project, run:

`node index.js your_email.com createusers`

Replace 'your_email.com' with the email you want the OTP to be sent to.

#### *** Important - only pass the 'createusers' param for the first time you are running the app

'createusers' tells the app to pre-load users in the DB and should only be passed in for the first time, or the run will fail


For example you run

`node index.js your_email.com createusers`

But you realise that your email is wrong and you want to change it, you can rerun the app as:

`node index.js your_new_email.com`

#### **If all else fails and the app throws an error related to creating users, go to Mongo and drop the DB named 'JonesonDB'


The app will run in development mode.<br />
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

# Mongo DB related
The app will create the following named DB instance that the app reads and writes to.<br />

Do not change the DB name as the app is tied to it.

To view the Data store via mongo shell - run the following in bash

### `mongo`
Runs mongo shell

### `use JonesonDB`
Selects the DB the app reads and writes to

### `db.userInfo.find()`
Shows all the stored values of the users


# Dummy users created for testing
The following users are created as part of the app for testing </br>
For example to use 'Paul', you would enter 'Paul' as Username and 'paul' as password on the login page. </br>

username: Paul password: paul </br>
username: Jay password: jay </br>
username: Roy password: roy </br>
username: Test password: test </br>
username: Test2 password: test2 </br>
username: Test3 password: test3 </br>

After a user is locked, you can use another user for testing.

Please allow a few seconds for the OTP to be sent to your designated email after you log in as a user.