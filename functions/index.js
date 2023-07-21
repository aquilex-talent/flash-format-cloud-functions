/**
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 * Create and deploy your first functions at https://firebase.google.com/docs/functions/get-started
 */

const { onRequest } = require("firebase-functions/v2/https");
const axios = require("axios");
const sharp = require("sharp");
const busboy = require("busboy");

const decodeRequestFormData = (request) =>
  new Promise((resolve, reject) => {
    const bus = busboy({ headers: request.headers });
    let fileBuffer = null;
    let fromFormat = null;
    let toFormat = null;

    bus.on("file", (fieldname, file, filename, encoding, mimetype) => {
      const chunks = [];
      file.on("data", (data) => {
        chunks.push(data);
      });
      file.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    bus.on("field", (fieldname, value) => {
      switch (fieldname) {
        case "fromFormat":
          fromFormat = value;
          break;
        case "toFormat":
          toFormat = value;
          break;
      }
    });

    bus.on("finish", () => {
      fileBuffer && fromFormat && toFormat
        ? resolve({ fileBuffer, fromFormat, toFormat })
        : reject(new Error("Missing file or format fields in the request."));
    });

    bus.end(request.rawBody);
  });

exports.format = onRequest(async (request, response) => {
  decodeRequestFormData(request)
    .then(async ({ fileBuffer, fromFormat, toFormat }) => {
      console.log(fromFormat, "-->", toFormat);
      const output = await sharp(fileBuffer).toFormat(toFormat).toBuffer();
      response.setHeader("Content-Type", `image/${toFormat}`);
      response.setHeader(
        "Content-Disposition",
        `attachment; filename="converted-image.${toFormat}"`
      );
      response.send(output);
    })
    .catch((err) => {
      console.log(err);
      response.status(500).send("Something went wrong");
    });
});
