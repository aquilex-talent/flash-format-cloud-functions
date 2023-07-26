/**
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 * Create and deploy your first functions at https://firebase.google.com/docs/functions/get-started
 */

const { onRequest } = require("firebase-functions/v2/https");
const sharp = require("sharp");
const busboy = require("busboy");

const decodeRequestFormData = (request) =>
  new Promise((resolve, reject) => {
    const bus = busboy({ headers: request.headers });
    let fileBuffer = null;
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
        case "toFormat":
          toFormat = value;
      }
    });

    bus.on("finish", () => {
      fileBuffer && toFormat
        ? resolve({ fileBuffer, toFormat })
        : reject(new Error("Missing file or format fields in the request."));
    });

    bus.end(request.rawBody);
  });

const convert = ({ fileBuffer, toFormat }) =>
  sharp(fileBuffer).toFormat(toFormat).toBuffer();

const respond = (response, toFormat) => (converted) =>
  response
    .setHeader("Content-Type", `image/${toFormat}`)
    .setHeader(
      "Content-Disposition",
      `attachment; filename="converted-image.${toFormat}"`
    )
    .send(converted);

exports.format = onRequest({ cors: "*" }, (request, response) =>
  decodeRequestFormData(request)
    .then((file) => convert(file).then(respond(response, file.toFormat)))
    .catch((error) => {
      console.log(error);
      response.status(500).send("SOMETHING WENT WRONG");
    })
);
