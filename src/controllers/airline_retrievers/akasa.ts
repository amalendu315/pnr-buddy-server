
import { Request, Response } from "express";
import https from "https";
import axios, { AxiosResponse } from "axios";

import { akasaPnrRetrieveUrl, akasaTokenUrl } from "../../constants";

const AkasaTokenConfig = {
  method: "post",
  url: akasaTokenUrl,
  headers: {
    "Content-Type": "application/json",
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
  },
  data: JSON.stringify({ clientType: "WEB" }),
  httpsAgent: new https.Agent({ rejectUnauthorized: false }), // Bypass SSL verification
};

async function makeApiCall(maxAttempts:number, currentAttempt = 1):Promise<AxiosResponse> {
  return axios(AkasaTokenConfig)
    .then((response) => {
      if (response.data.data.token && response.data.data.token.length > 0) {
        return response.data; // Return the response if a token is found
      } else if (currentAttempt < maxAttempts) {
        console.log(`Attempt ${currentAttempt} failed. Retrying...`);
        return makeApiCall(maxAttempts, currentAttempt + 1);
      } else {
        throw new Error("Maximum number of attempts reached");
      }
    })
    .catch((error) => {
      console.error(
        "Error fetching the token:",
        error.response ? error.response.data : error.message
      );
      if (currentAttempt < maxAttempts) {
        console.log(`Attempt ${currentAttempt} failed. Retrying...`);
        return makeApiCall(maxAttempts, currentAttempt + 1);
      } else {
        throw new Error("Maximum number of attempts reached after error");
      }
    });
}

const checkTimeFormat = (text: string): string => {
  if (
    text.charAt(0) === "0" ||
    text.slice(0, 2) === "11" ||
    text.slice(0, 2) === "10"
  ) {
    return text.concat(" ", "AM");
  } else {
    return text.concat(" ", "PM");
  }
};

export const getAkasaData = async (req: Request, res: Response) => {
   try {
     const pnrs: string[] = req.body;
     const data = await makeApiCall(10); // Fetch token once
     const myToken = data.data.token;
     const header = `Bearer ${myToken}`;

     const results: string[] = [];
     const errors: string[] = [];
     await Promise.all(
       pnrs.map(async (pnr) => {
         try {
           const config1 = {
             method: "get",
             url: `${akasaPnrRetrieveUrl}?recordLocator=${pnr}&emailAddress=Airlines@Airiq.In`,
             headers: {
               Authorization: header,
               "Content-Type": "application/json",
               "User-Agent":
                 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
             },
             httpsAgent: new https.Agent({ rejectUnauthorized: false }),
           };

           const config2 = {
             method: "get",
             url: `${akasaPnrRetrieveUrl}?recordLocator=${pnr}&emailAddress=INFO.AIRIQ1@GMAIL.COM`,
             headers: {
               Authorization: header,
               "Content-Type": "application/json",
               "User-Agent":
                 "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
             },
             httpsAgent: new https.Agent({ rejectUnauthorized: false }),
           };

           let response: AxiosResponse<any>;
           try {
            response = await axios(config1);
           } catch (error) {
            response = await axios(config2);
           }

           const bookingData = response?.data.data;

           if (bookingData?.journeys.length > 0) {
             const Destination = bookingData.journeys[0].designator.destination;
             const Origin = bookingData.journeys[0].designator.origin;
             const depDate = bookingData.journeys[0].designator.departure.slice(
               0,
               10
             );
             const arrTime = checkTimeFormat(
               bookingData.journeys[0].designator.arrival.slice(11, 16)
             );
             const depTime = checkTimeFormat(
               bookingData.journeys[0].designator.departure.slice(11, 16)
             );
             const pax =
               "PAX " + Object.keys(bookingData.breakdown.passengers).length;
             const cost = bookingData.breakdown.totalAmount;
             const PNR = bookingData.recordLocator;

             const flightReference =
               bookingData.journeys[0].segments[0].flightReference;
             const qpCodeRegex = /QP(\d+)/;
             const match = flightReference.match(qpCodeRegex);
             const FlightNo = match ? match[1] : null;

            //  return `${PNR}|${Origin}${Destination}|${FlightNo}|${depDate}|${depTime}|${arrTime}| ${pax}|${cost}`;
              const result = `${PNR}|${Origin}|${Destination}|${FlightNo}|${depDate}|${depTime}|${arrTime}|${pax}|${cost}|Airlines@Airiq.In`;
              results.push(result);
              return result;
           } else {
             const PNR = bookingData.recordLocator;
             const result = `${PNR} is Cancelled`;
             results.push(result);
             return result;
           }
         } catch (error: any) {
           if (error?.response?.status === 404) {
             errors.push(`PNR ${pnr} not found`); // Add 404 errors to the array
           } else {
             errors.push(`Error processing PNR ${pnr}: ${error?.message}`);
           }
         }
       })
     );

     res.status(200).send({ results: results.join("\n"), errors });
   } catch (error) {
     console.error("Error fetching Akasa data:", error);
     res.status(500).send(error);
   }
};
