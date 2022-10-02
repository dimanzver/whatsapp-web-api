const { Client, LocalAuth} = require('whatsapp-web.js');
const express = require('express');
const app = express();
let port = 3001;
let clientId = '1';
let headless = false;

process.argv.forEach(arg => {
  const match = arg.match(/^--(.+)=(.+)$/);
  if (!match)
    return;

  switch (match[1] || '') {
    case 'port':
      port = match[2];
      break;
    case 'clientId':
      clientId = match[2];
      break;
    case 'headless':
      headless = match[2] === 'true';
      break;
  }
});

const client = new Client({
  authStrategy: new LocalAuth({clientId}),
  puppeteer: { headless },
});

client.initialize();
let ready = false;

client.on('ready', () => {
  console.log('Client is ready!');
  ready = true;
});

client.on('loading_screen', (percent, message) => {
  console.log('LOADING SCREEN', percent, message);
});

client.on('qr', (qr) => {
  // NOTE: This event will not be fired if a session is specified.
  console.log('QR RECEIVED', qr);
});

client.on('authenticated', () => {
  console.log('AUTHENTICATED');
});

client.on('auth_failure', msg => {
  // Fired if session restore was unsuccessful
  console.error('AUTHENTICATION FAILURE', msg);
});

client.on('message_revoke_everyone', async (after, before) => {
  // Fired whenever a message is deleted by anyone (including you)
  console.log(after); // message after it was deleted.
  if (before) {
    console.log(before); // message before it was deleted.
  }
});

client.on('change_state', state => {
  console.log('CHANGE STATE', state );
});

client.on('disconnected', (reason) => {
  console.log('Client was logged out', reason);
});


app.use(express.json());
app.post('/send', (req, res) => {
  if (!ready) {
    res.status(425).send('Client not ready');
    return;
  }
  const body = req.body;
  client.sendMessage(`${body.phone}@c.us`, body.content, body.options || {});
  res.send('Sent')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
