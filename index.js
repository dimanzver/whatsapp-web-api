const { Client, LocalAuth, MessageMedia} = require('whatsapp-web.js');
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


let ready = false;
let client;

const init = () => {
  client = new Client({
    authStrategy: new LocalAuth({clientId}),
    puppeteer: { headless },
  });

  client.initialize();

  client.on('ready', () => {
    console.log('Client is ready!');
    ready = true;
    client.pupPage.on('framenavigated', function () {
      console.log("page reloaded!");
      ready = false;
      client.destroy();
      init();
    });
  });

  client.on('qr', (qr) => {
    console.log('QR RECEIVED', qr);
  });


  const waitInitFunction = () => {
    if (client.pupPage) {
      client.pupPage.on('error', function(err) {
        console.log(err);
        ready = false;
        client.destroy();
        init();
      });
    } else {
      setTimeout(waitInitFunction, 1000);
    }
  };
  waitInitFunction();
};
init();


app.use(express.json());
app.post('/send', async (req, res) => {
  try {
    if (!ready) {
      res.status(425).send('Client not ready');
      return;
    }
    const body = req.body;

    const sendMessage = async (content) => {
      if (content instanceof Array) {
        for(contentItem of content) {
          await sendMessage(contentItem);
        }
      } else {
        if (content instanceof Object && content.url){
          content = await MessageMedia.fromUrl(content.url);
        }

        await client.sendMessage(`${body.phone}@c.us`, content, body.options || {});
      }
    };

    sendMessage(body.content);

    res.send('Sent');
  } catch (e) {
    console.error(e);
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
