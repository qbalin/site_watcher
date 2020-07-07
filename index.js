require('dotenv').config();
const puppeteer = require('puppeteer');
const fs = require('fs');
const nodemailer = require('nodemailer');
const TIMEOUT = 3000;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_ACCOUNT,
    pass: process.env.EMAIL_ACCOUNT_PASSWORD
  }
});

const retryNTimes = async (times, callback) => {
  try {
    await callback();
  } catch(error) {
    if (times === 0) {
      throw error;
    } else {
      await retryNTimes(times - 1, callback);
    }
  }
};

(async () => {
  const config = JSON.parse(fs.readFileSync('./config.json', { encoding: 'utf8' }));

  const args = ['--no-sandbox', '--disable-setuid-sandbox'];
  const torPorts = (process.env.TOR_PORTS || '').split(',');
  if (torPorts.length > 0) {
    const port = torPorts[Math.floor(Math.random() * torPorts.length)];
    args.push(`--proxy-server=socks5://127.0.0.1:${port}`);
  }
  const browser = await puppeteer.launch({ executablePath: "/usr/bin/chromium-browser", args });

  const files = fs.readdirSync('.');
  const validEntries = config.filter(entry =>
    !files.some(fileName => fileName.match(entry.name))
  )

  await Promise.all(validEntries.map(async (entry) => {
    const page = await browser.newPage();
    try {
      await retryNTimes(5, async () => {
        await page.goto(entry.page, { waitUntil: 'domcontentloaded' });
        await page.waitForXPath(entry.selector, { timeout: TIMEOUT });
        await page.close();
      })
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

      fs.writeFileSync(`${entry.name}.html`, await page.evaluate(p => document.body.innerHTML));
      await page.screenshot({path: `${entry.name}.png` });
    }
  }));

  await browser.close();
})();