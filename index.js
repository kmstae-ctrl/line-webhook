const express = require('express');
const axios = require('axios');

const app = express();

app.use(express.json());

const ACCESS_TOKEN = 'bsgxEsFHPdYVMaZEEDS/AZIaebtOo1GQDYjC/zsFpsrSoujiZOxkbicAkC9wbJz4s6b74aI4NrpxFpG6Z0bdOr+y5AT2qIefV789+CLX26OY+i0e8+u2ueY8BHTVQgibhyHkYsqTIyqN/jCg1vgxgQdB04t89/1O/w1cDnyilFU=';

const STAFF_GROUP_ID = 'Ca9a104c9738e5bf3397cbb8a86faab93';

const FLASH_GROUP_ID = 'C01b5ae649b0dec9f7c98866e13b7ecd3';
const JT_GROUP_ID = 'Cd6fd2578e00d52d4622919c2843fc1cd';
const SPX_GROUP_ID = 'C5d144d4d9187852cf4eaf12abaa6402a';

// if (!ACCESS_TOKEN) {
//   throw new Error("ACCESS_TOKEN missing");
// }

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