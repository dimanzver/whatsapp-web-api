const { Client, LocalAuth} = require('whatsapp-web.js');
const express = require('express');
const app = express();
const port = 3001;

const client = new Client({
  authStrategy: new LocalAuth({clientId: '1'}),
  puppeteer: { headless: false }
});

client.initialize();

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
/*
client.on('ready', () => {
  client.sendMessage('79774884810@c.us', 'test test');
});
*/
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
  const body = req.body;
  client.sendMessage(`${body.phone}@c.us`, body.content, body.options || {});
  res.send('Sent')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})