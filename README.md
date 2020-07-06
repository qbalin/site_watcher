# site_watcher

This utility works best as a cron job. On a given website, it checks the presence of an element using an [XPath selector](https://www.w3schools.com/xml/xpath_intro.asp). If the element is present, the program exits, if not, it sends an email.

## Installation

```bash
cd site_watcher
yarn install
```

## Config file

To specify which sites to watch, and which element to look for, create a file named `config.json` in the `site_watcher` folder:

```bash
touch config.json
```

Open it, and paste something like:

```
[
  {
    "page": "https://www.lego.com/en-us/product/pirate-ship-31109",
    "selector": "//*[@data-test='product-overview-availability']//descendant::*[text()='Coming Soon']",
    "name": "Lego"
  }
]
```

You can add a many entries as you like, just make sure their `name`s are unique. This examples looks at the presence of the text "Coming Soon" on the Lego product page https://www.lego.com/en-us/product/pirate-ship-31109. As long as "Coming Soon" is present, I won't receive an email. Once it is absent, I will receive an email with a link to the site. 

A file with a screenshot of the site will be created locally, with the name `Lego.png`, and the HTML will also be captured in a file named `Lego.html`. The presence of these files makes the watcher stop looking at this site, so that I do not get flooded with emails.

## .env

To properly receive an email, you will need to configure an account that the script can connect to by username and password, and an email address to send notifications of changes. 

```bash
touch .env
```

In the `.env` file, add something like:

```
GMAIL_PASSWORD=passwordToSendingAccount
GMAIL_ACCOUNT=sendingAccount
SEND_TO=emailAddressToNotify
```
Nodemailer is used to send emails. To configure a GMail account from which the notifications can be sent, checkout [this page](https://nodemailer.com/usage/using-gmail/).

## Raspberry Pi vs Dev machine
This script should run natively under Rapsberry Pi, provided Chromium is installed. To run it in debug mode on your development machine, replace the line

```javascript
const browser = await puppeteer.launch({ executablePath: "/usr/bin/chromium-browser", args: ['--no-sandbox', '--disable-setuid-sandbox'] });
```

by 

```javascript
const browser = await puppeteer.launch({ headless: false });
```

## Scrape responsibly!
Do not spam the websites you are watching! Watch them once a day, or less. Remember that every connection is energy spent :)

## References
Under a raspberry pi, [launch chrome](https://github.com/puppeteer/puppeteer/issues/4249) with:

```
const browser = await puppeteer.launch({ executablePath: 'chromium-browser' });
OR 
executablePath: "/usr/bin/chromium-browser"
```

