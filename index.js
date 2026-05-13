const express = require('express');
const axios = require('axios');

const app = express();

app.use(express.json());

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;
const STAFF_GROUP_ID = process.env.STAFF_GROUP_ID;

const FLASH_GROUP_ID = process.env.FLASH_GROUP_ID;
const JT_GROUP_ID = process.env.JT_GROUP_ID;
const SPX_GROUP_ID = process.env.SPX_GROUP_ID;

if (!ACCESS_TOKEN) {
  throw new Error("ACCESS_TOKEN missing");
}

app.get('/', (req, res) => {
  res.send('LINE Webhook Online');
});

app.post('/webhook', async (req, res) => {

  try {

    const events = req.body.events || [];

    for (const event of events) {

      if (
        event.type === 'message' &&
        event.message.type === 'text' &&
        event.source.groupId === STAFF_GROUP_ID
      ) {

        processLogistics(event.message.text);
      }
    }

    res.status(200).send('OK');

  } catch (err) {

    console.log(err);

    res.status(500).send(err.message);
  }
});

function processLogistics(msg) {

  const parts = msg.split(/รอบบ่าย/i);

  const morningPart = parts[0];
  const afternoonPart = parts[1] || "";

  const getNum = (text, brand) => {

    const regex = new RegExp(brand + ".*?(\\d+)", "i");

    const match = regex.exec(text);

    return match ? parseInt(match[1]) : 0;
  };

  const logistics = [
    { search: "Flash", display: "Flash Express", id: FLASH_GROUP_ID },
    { search: "J&T", display: "J&T Express", id: JT_GROUP_ID },
    { search: "SPX", display: "SPX Express", id: SPX_GROUP_ID }
  ];

  logistics.forEach(item => {

    const morning = getNum(morningPart, item.search);

    const afternoon = getNum(afternoonPart, item.search);

    const total = morning + afternoon;

    if (total > 0) {

      const report =
`📊 สรุปยอดพัสดุ ${item.display}
☀️ รอบเช้า: ${morning} ชิ้น
☁️ รอบบ่าย: ${afternoon} ชิ้น
✅ รวมทั้งหมด: ${total} ชิ้น`;

      sendPush(item.id, report);
    }
  });
}

async function sendPush(targetId, text) {

  await axios.post(
    'https://api.line.me/v2/bot/message/push',
    {
      to: targetId,
      messages: [
        {
          type: 'text',
          text: text
        }
      ]
    },
    {
      headers: {
        Authorization: `Bearer ${ACCESS_TOKEN}`
      }
    }
  );
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Server running');
});