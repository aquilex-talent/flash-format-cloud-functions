/**
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 * Create and deploy your first functions at https://firebase.google.com/docs/functions/get-started
 */

const { onRequest } = require("firebase-functions/v2/https");
const axios = require("axios");
const sharp = require("sharp");

exports.helloWorld = onRequest(async (request, response) => {
  const imageUrl =
    "http://scriptshadow.net/wp-content/uploads/2019/08/Screen-Shot-2019-08-13-at-8.09.58-PM.png";
  const image = await axios.get(imageUrl, { responseType: "arraybuffer" });
  const buffer = Buffer.from(image.data);
  const output = await sharp(buffer).resize(100, 100).toBuffer();
  response.setHeader("Content-Type", "image/png");
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="picture.png"`
  );
  response.send(output);
});
