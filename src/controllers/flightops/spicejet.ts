import { Request, Response } from "express";
import { spicejetPnrRetrieveUrl, spicejetTokenUrl } from "../../constants";
import axios, { AxiosResponse } from "axios";
import * as xlsx from "xlsx";
import moment from "moment-timezone";

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

export const getSpicejetStatus = async (req: Request, res: Response) => {
  try {
    const data = await makeApiCall(10);
    const myToken = data?.data?.data.token;
    const fullName = req.file?.filename;
    if (!fullName) {
      throw new Error("No file uploaded");
    }

    const wb = xlsx.readFile("./uploads/" + fullName, { cellDates: true });
    const ws = wb.Sheets["Sheet1"];
    ws["!ref"] = "A1:K3000"; // Adjust the range if necessary
    const jsonSheet = xlsx.utils.sheet_to_json(ws);

    const emailAddresses = [
      "airlines@airiq.in",
      "info.airiq@gmail.com",
      "accounts@airiq.in",
    ];

    const allResults = await Promise.all(
      jsonSheet.map(async (record: any) => {
        try {
          const PNR = record?.PNR;
          if (!PNR) {
            throw new Error("Missing PNR in input file.");
          }

          let bookingData: any = null;

          for (const email of emailAddresses) {
            try {
              const config = {
                method: "post",
                url: `${spicejetPnrRetrieveUrl}?recordLocator=${PNR}&emailAddress=${email}`,
                headers: {
                  Authorization: myToken,
                  "Content-Type": "application/json",
                },
              };

              const response = await axios(config);
              bookingData = response.data.data || response.data.bookingData;

              if (bookingData?.journeys || bookingData?.recordLocator) {
                break; // Success, exit loop
              }
            } catch (error: any) {
              if (error.response?.status === 404) {
                continue; // Try next email
              } else {
                throw error; // Other errors - stop trying
              }
            }
          }

          if (!bookingData) {
            throw new Error("All email attempts failed or invalid response");
          }

          const journeys = bookingData.journeys;
          const length = journeys?.length || 0;

          if (length > 0) {
            const designator = journeys[0].designator;
            const flightNumber = journeys[0].segments[0].identifier.identifier;
            const depSector = designator.origin;
            const arrSector = designator.destination;

            const depDetails = designator.departure.split("T");
            const depDate = depDetails[0];
            const depTime = checkTimeFormat(depDetails[1].substring(0, 5));

            const arrDetails = designator.arrival.split("T");
            const arrTime = checkTimeFormat(arrDetails[1].substring(0, 5));

            const PAX = Object.keys(bookingData.passengers).length;
            const OldPur = JSON.stringify(record.Pur);

            const DepinputTime = record.Dep;
            const depMoment = moment.utc(DepinputTime).tz("Asia/Kolkata");
            const depRoundedMin = depMoment.minutes() % 10;
            depMoment.minutes(
              depRoundedMin === 0 || depRoundedMin === 5
                ? depMoment.minutes()
                : depMoment.minutes() + 1
            );
            const OldDep = depMoment.format("HH:mm A");

            const ArrinputTime = record.Arr;
            const arrMoment = moment.utc(ArrinputTime).tz("Asia/Kolkata");
            const arrRoundedMin = arrMoment.minutes() % 10;
            arrMoment.minutes(
              arrRoundedMin === 0 || arrRoundedMin === 5
                ? arrMoment.minutes()
                : arrMoment.minutes() + 1
            );
            const OldArr = arrMoment.format("HH:mm A");

            const OldDate = moment(record.TravelDate).format("YYYY-MM-DD");

            const CheckStatus = () => {
              if (
                record.Flight != flightNumber ||
                OldPur != JSON.stringify(PAX) ||
                OldDate != depDate ||
                OldDep != depTime ||
                OldArr != arrTime
              ) {
                return "BAD";
              } else {
                return "GOOD";
              }
            };

            const MyRemarks = CheckStatus();

            const result = `${PNR}|${depSector} ${arrSector}|${record.Flight}|${flightNumber}|${OldPur}|${PAX}|${OldDate}|${depDate}|${OldDep}|${depTime}|${OldArr}|${arrTime}|${MyRemarks}`;

            return {
              pnr: PNR,
              data: result,
            };
          } else {
            const result = `${PNR} is Cancelled`;
            return { pnr: PNR, data: result };
          }
        } catch (error: any) {
          if (!error?.response) {
            return {
              pnr: record.PNR,
              error: `Network or API Error for PNR ${record.PNR}`,
            };
          } else if (error?.response?.status === 404) {
            return { pnr: record.PNR, error: `PNR NOT FOUND ${record.PNR}` };
          } else {
            return {
              pnr: record.PNR,
              error: `Error processing PNR ${record.PNR}: ${error?.message}`,
            };
          }
        }
      })
    );

    const { results, errors } = allResults.reduce(
      (acc, result: any) => {
        if (result?.error) {
          acc.errors.push(result?.error);
        } else if (result.data) {
          acc.results.push(result.data);
        } else if (result.pnr) {
          acc.results.push(`${result.pnr} is Cancelled`);
        }
        return acc;
      },
      { results: [] as string[], errors: [] as string[] }
    );

    res.status(200).send({ results, errors });
  } catch (error) {
    console.error("Critical Error:", error);
    res.status(500).send({ error: "Internal Server Error", details: error });
  }
};
