require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const nodemailer = require('nodemailer');
const TIMEOUT = 60000;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_ACCOUNT,
    pass: process.env.GMAIL_PASSWORD
  }
});

(async () => {
  const config = JSON.parse(fs.readFileSync('./config.json', { encoding: 'utf8' }));
  const browser = await puppeteer.launch({ executablePath: "/usr/bin/chromium-browser", args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  const files = fs.readdirSync('.');
  const validEntries = config.filter(entry =>
    !files.some(fileName => fileName.match(entry.name))
  )

  await Promise.all(validEntries.map(async (entry) => {
    const page = await browser.newPage();
    try {
      await page.goto(entry.page, { waitUntil: 'domcontentloaded' });
      await page.waitForXPath(entry.selector, { timeout: TIMEOUT });
      await page.close();
    } catch(error) {
      const mailOptions = {
        from: process.env.GMAIL_ACCOUNT,
        to: process.env.SEND_TO,
        subject: `Changes happened on the ${entry.name} page!`,
        text: `Go to ${entry.page}`
      };

      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

      await page.screenshot({path: `${entry.name}.png` });
    }
  }));

  await browser.close();
})();