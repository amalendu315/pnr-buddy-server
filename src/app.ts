import cors from "cors";
import express from "express";
import morgan from 'morgan'
import bodyParser from "body-parser";

//Local Imports
import { PORT } from "./constants";
import {
  akasaRoute,
  akasaStatusRoute,
  convertRoute,
  retreiveRoute,
  spicejetStatusRoute,
} from "./routes";

const app = express();


//Middleware usage
const allowedOrigins = [
  "http://localhost:3000",
  "https://pnrbuddy.netlify.app",
  "http://ec2-3-110-55-153.ap-south-1.compute.amazonaws.com",
  "http://ec2-35-154-145-73.ap-south-1.compute.amazonaws.com:3001",
  "http://3.110.55.153",
];
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not " +
          "allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
  })
);
app.use(morgan("tiny"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//Routes
app.use("/convert", convertRoute);
app.use("/akasa", akasaRoute);
app.use("/retrieve", retreiveRoute);
app.use("/flightops/spicejet", spicejetStatusRoute);
app.use("/flightops/akasa", akasaStatusRoute);

//app listening
app.listen(PORT, () => {
  return console.log(`PNR BUDDY is listening at http://localhost:${PORT}`);
});
