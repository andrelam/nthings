# nThings
nThings is an inventory system for your things: books, blu-rays, toys, you name it. Basically, *any*thing.

# Installation
Before running, you need to install all Node.js dependencies by running:

`npm install`

After all dependencies are installed, you need to create a `.env` file with the following content:

`MONGODB_HOST = <database host - default is localhost>`
`MONGODB_PORT = <database port - default is 27017>`
`MONGODB_NAME = <database name - default is nthings>`
`MONGODB_USER = <database user - default is unauthenticated access>`
`MONGODB_PASS = <database password - default is unauthenticated access>`
`SERVER_DOMAIN = <server host - default is localhost`
`SERVER_PORT = <server port - default is 10000>`
`SESSION_SECRET = <somesupersecretsessionsecret>`
`COOKIE_EXPIRES = <in milliseconds. suggested: 2400000>`
`CSRF_TOKEN_COOKIE_EXPIRES = <in milliseconds. suggested: 2400000>`
`LOG_LEVEL = <low level. default is warning>`
`MAIL_CONFIG = <a JSON option as per nodemailer documentation>`

*Optional:*
`LOG_FILE = <path for the log file. If not informed, log will be output to the console>`

It's also required to create the database on MongoDB, as well as assigning the user with correct roles to manage the database.

