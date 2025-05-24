import fs from "fs/promises";
import { Request, Response } from "express";
import axios, { AxiosResponse } from "axios";

import { spicejetPnrRetrieveUrl, spicejetTokenUrl } from "../../constants";


const TokenConfig = {
  method: "post",
  url: spicejetTokenUrl,
  headers: { "Content-Type": "application/json" },
};

const makeApiCall = async (
  maxAttempts: number,
  currentAttempt = 1
): Promise<AxiosResponse<any>> => {
  return axios(TokenConfig)
    .then((response) => {
      if (response.data.data.token.length > 0) {
        return response;
      } else if (currentAttempt < maxAttempts) {
        return makeApiCall(maxAttempts, currentAttempt + 1);
      } else {
        throw new Error("Maximum number of attempts reached");
      }
    })
    .catch((error) => {
      console.log("Trying To Fetch Authorization Key");
      return makeApiCall(maxAttempts, currentAttempt + 1);
    });
};

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

export const getSpiceJetData = async (req: Request, res: Response) => {
  try {
    const pnrs: string[] = req.body;
    const data = await makeApiCall(10);
    const myToken = data.data.data.token;

    const results: string[] = [];
    const errors: string[] = [];

    const emailAddresses = [
      "airlines@airiq.in",
      "info.airiq@gmail.com",
      "accounts@airiq.in",
    ];

    await Promise.all(
      pnrs.map(async (pnr) => {
        let success = false;

        for (const email of emailAddresses) {
          const config = {
            method: "post",
            url: `${spicejetPnrRetrieveUrl}?recordLocator=${pnr}&emailAddress=${email}`,
            headers: {
              Authorization: myToken,
              "Content-Type": "application/json",
            },
          };

          try {
            const response = await axios(config);
            const bookingData = response?.data.bookingData;

            if (bookingData?.journeys?.length > 0) {
              const IdType = bookingData.contacts.P.sourceOrganization;
              const Email = bookingData.contacts.P.emailAddress;
              const designator = bookingData.journeys[0].designator;
              const flightNumber =
                bookingData.journeys[0].segments[0].identifier.identifier;
              const depSector = designator.origin;
              const arrSector = designator.destination;
              const depDetails = designator.departure.split("T");
              const depTime = checkTimeFormat(depDetails[1].substring(0, 5));
              const arrDetails = designator.arrival.split("T");
              const arrTime = checkTimeFormat(arrDetails[1].substring(0, 5));
              const depDate = depDetails[0];
              const paxCount =
                "PAX " + Object.keys(bookingData.passengers).length;
              const PNR = bookingData.recordLocator;
              const payment = bookingData.breakdown.totalCharged;

              const result = `${PNR}|${depSector}|${arrSector}|${flightNumber}|${depDate}|${depTime}|${arrTime}|${paxCount}|${payment}|${IdType}|${Email}`;
              results.push(result);

              await fs.appendFile(
                "downloads/data.txt",
                `${result.replace(/\|/g, " ")}\n`,
                "utf8"
              );              

              success = true;
              break; // Success, no need to try other emails
            } else {
              const PNR = bookingData?.recordLocator;
              const Email = bookingData?.contacts?.P?.emailAddress || email;
              const result = `${PNR}| is cancelled`;

              results.push(result);
              await fs.appendFile(
                "downloads/data.txt",
                `${PNR} is cancelled ${Email}\n`,
                "utf8"
              );

              success = true;
              break;
            }
          } catch (error: any) {
            if (error?.response?.status === 404) {
              continue; // Try next email
            }
            console.error(`Attempt with ${email} failed:`, error.message);
          }
        }

        if (!success) {
          errors.push(`All attempts failed for PNR ${pnr}`);
        }
      })
    );

    res.status(200).send({ results: results.join("\n"), errors });
  } catch (error) {
    console.error("Error fetching SpiceJet data:", error);
    res.status(500).send(error);
  }
};
