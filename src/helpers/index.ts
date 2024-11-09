import * as xlsx from "xlsx";
import * as fs from "fs";

interface ExcelRecord {
  [key: string]: any;
}

function readExcelData(filePath: string, sheetName: string): ExcelRecord[] {
  const wb = xlsx.readFile(filePath, { cellDates: true });
  const ws = wb.Sheets[sheetName];
  ws["!ref"] = "A2:K100";
  const jsonData: ExcelRecord[] = xlsx.utils.sheet_to_json(ws);
  jsonData.pop();
  return jsonData;
}

function transformData(
  jsonData: ExcelRecord[],
  airlineCode: string
): ExcelRecord[] {
  switch (airlineCode.toLowerCase()) {
    case "i.xlsx":
      return jsonData.map((record: ExcelRecord) => {
        delete Object.assign(record, { ["Pax Type"]: record["SL"] })["SL"];
        record["Pax Type"] = "Adult";
        delete Object.assign(record, { ["TITLE"]: record["Title"] })["Title"];
        delete Object.assign(record, { ["Title"]: record["TITLE"] })["TITLE"];

        const dot = record.Title.indexOf(".");
        if (dot > 0) {
          record.Title = record.Title.replace(".", "");
        }
        if (record.Title === "Mr") {
          record.Gender = "Male";
        }
        if (record.Title === "Mrs") {
          record.Gender = "Female";
        }
        if (record.Title === "Ms") {
          record.Gender = "Female";
        }
        if (record.Title === "Miss") {
          record.Title = "Ms";
          record.Gender = "Female";
        }
        if (record.Title === "Mstr") {
          record.Title = "Mr";
          record.Gender = "Male";
        }

        delete Object.assign(record, {
          ["FIRST NAME"]: record["First Name"],
        })["First Name"];
        delete Object.assign(record, {
          ["First Name"]: record["FIRST NAME"],
        })["FIRST NAME"];
        delete Object.assign(record, {
          ["LAST NAME"]: record["Last Name"],
        })["Last Name"];
        delete Object.assign(record, {
          ["Last Name"]: record["LAST NAME"],
        })["LAST NAME"];

        record["Date of Birth (DD-MMM-YYYY)"] = "28-OCT-1989";
        record["Contact"] = "9932861111";
        record["Email"] = "info.airiq@gmail.com";

        delete record["Billing A/C"];
        delete record["Login ID"];
        delete record["Price"];
        delete record["Entry Date"];
        delete record["AQ ID"];
        delete record["Display Pnr "];
        delete record["Supplier"];

        return record;
      });
    case "g.xlsx":
      return jsonData.map((record: ExcelRecord) => {
        delete Object.assign(record, { ["TYPE"]: record["SL"] })["SL"];
        record.TYPE = "Adult";
        delete Object.assign(record, { ["TITLE"]: record["Title"] })["Title"];
        delete Object.assign(record, {
          ["FIRST NAME"]: record["First Name"],
        })["First Name"];
        delete Object.assign(record, {
          ["LAST NAME"]: record["Last Name"],
        })["Last Name"];
        record["DOB"] = "28/10/1989";
        const dot = record.TITLE.indexOf(".");
        if (dot > 0) {
          record.TITLE = record.TITLE.replace(".", "");
        }
        if (record.TITLE === "Mr") {
          record.GENDER = "Male";
        }
        if (record.TITLE === "Mrs") {
          record.GENDER = "Female";
        }
        if (record.TITLE === "Ms") {
          record.GENDER = "Female";
        }
        if (record.TITLE === "Miss") {
          record.TITLE = "Ms";
          record.GENDER = "Female";
        }
        if (record.TITLE === "Mstr") {
          record.TITLE = "Mr";
          record.GENDER = "Male";
        }
        record["MOBILE NUMBER"] = "9932861111";
        delete record["Billing A/C"];
        delete record["Login ID"];
        delete record["Price"];
        delete record["Entry Date"];
        delete record["AQ ID"];
        delete record["Display Pnr "];
        delete record["Supplier"];

        return record;
      });
    case 'a.xlsx':
        return jsonData.map((record:ExcelRecord)=>{
            delete Object.assign(record, { ["TYPE"]: record["SL"] })["SL"];

            record.TYPE = "Adult";

            delete Object.assign(record, { ["TITLE"]: record["Title"] })[
              "Title"
            ];

            delete Object.assign(record, {
              ["FIRST NAME"]: record["First Name"],
            })["First Name"];

            delete Object.assign(record, {
              ["LAST NAME"]: record["Last Name"],
            })["Last Name"];

            record["DOB (DD/MM/YYYY)"] = "28/10/1989";

            const dot = record.TITLE.indexOf(".");
            if (dot > 0) {
              record.TITLE = record.TITLE.replace(".", "");
            }

            if (record.TITLE === "Mr") {
              record.GENDER = "Male";
            } else if (
              record.TITLE === "Mrs" ||
              record.TITLE === "Ms" ||
              record.TITLE === "Miss"
            ) {
              record.GENDER = "Female";
              if (record.TITLE === "Miss") {
                record.TITLE = "Ms";
              }
            } else if (record.TITLE === "Mstr") {
              record.TITLE = "Mr";
              record.GENDER = "Male";
            }

            record["MOBILE NUMBER"] = "9932861111";

            delete record["Billing A/C"];
            delete record["Login ID"];
            delete record["Price"];
            delete record["Entry Date"];
            delete record["AQ ID"];
            delete record["Display Pnr "];
            delete record["Supplier"];

            return record;
        });
    case 'q.xlsx':
        return jsonData.map((record:ExcelRecord)=>{
            delete Object.assign(record, { ["S No"]: record["SL"] })["SL"];

            delete Object.assign(record, {
              ["TYPE"]: record["SL"],
            })["SL"];

            record.TYPE = "Adult";

            delete Object.assign(record, { ["TITLE"]: record["Title"] })[
              "Title"
            ];
            delete Object.assign(record, {
              ["FIRST NAME"]: record["First Name"],
            })["First Name"];
            delete Object.assign(record, {
              ["LAST NAME"]: record["Last Name"],
            })["Last Name"];

            record["DOB (DD/MM/YYYY)"] = "28/10/1989";

            const dot = record.TITLE.indexOf(".");
            if (dot > 0) {
              record.TITLE = record.TITLE.replace(".", "");
            }
            if (record.TITLE === "Mr") {
              record.GENDER = "Male";
            }
            if (record.TITLE === "Mrs") {
              record.GENDER = "Female";
            }
            if (record.TITLE === "Ms") {
              record.GENDER = "Female";
            }
            if (record.TITLE === "Miss") {
              record.TITLE = "Ms";
              record.GENDER = "Female";
            }
            if (record.TITLE === "Mstr") {
              record.TITLE = "Mr";
              record.GENDER = "Male";
            }

            record["MOBILE NUMBER"] = "9932861111";

            delete record["Billing A/C"];
            delete record["Login ID"];
            delete record["Price"];
            delete record["Entry Date"];
            delete record["AQ ID"];
            delete record["Display Pnr "];
            delete record["Supplier"];

            return record;
        });
    case 't.xlsx':
        return jsonData.map((record:ExcelRecord)=>{
            record.TYPE = "Adult";

            delete Object.assign(record, { ["TITLE"]: record["Title"] })[
              "Title"
            ];
            delete Object.assign(record, {
              ["FIRST NAME"]: record["First Name"],
            })["First Name"];
            delete Object.assign(record, {
              ["LAST NAME"]: record["Last Name"],
            })["Last Name"];

            record["DOB (DD/MM/YYYY)"] = " ";

            const dot = record.TITLE.indexOf(".");
            if (dot > 0) {
              record.TITLE = record.TITLE.replace(".", "");
            }
            if (record.TITLE === "Mr") {
              record.GENDER = "Male";
            }
            if (record.TITLE === "Mrs") {
              record.GENDER = "Female";
            }
            if (record.TITLE === "Ms") {
              record.GENDER = "Female";
            }
            if (record.TITLE === "Miss") {
              record.TITLE = "Ms";
              record.GENDER = "Female";
            }
            if (record.TITLE === "Mstr") {
              record.TITLE = "Mr";
              record.GENDER = "Male";
            }

            record["CITIZENSHIP"] = "INDIA";
            record["PASSPORT NO"] = " ";
            record["EXPIRY DATE(DD/MM/YYYY)"] = " ";

            delete record["SL"];
            delete record["Billing A/C"];
            delete record["Login ID"];
            delete record["Price"];
            delete record["Entry Date"];
            delete record["AQ ID"];
            delete record["Display Pnr "];
            delete record["Supplier"];

            return record;
        });
    case 'd.xlsx':
        return jsonData.map((record:ExcelRecord)=>{
            delete Object.assign(record, {
              ["TYPE"]: record["PASSENGER TYPE*"],
            })["PASSENGER TYPE*"];

            record["PASSENGER TYPE*"] = "Adult(s)";

            record["CIVILITY*"] = record["Title"]; // Copy the value
            delete record["Title"]; // Delete the original property

            delete Object.assign(record, {
              ["FIRST NAME*"]: record["First Name"],
            })["First Name"];
            delete Object.assign(record, {
              ["MIDDLE NAME"]: record["Middle Name"],
            })["Middle Name"];
            delete Object.assign(record, {
              ["LAST NAME*"]: record["Last Name"],
            })["Last Name"];

            record["Date of birth (DD/MM/YYYY)*"] = " ";

            const dot = record.CIVILITY?.indexOf(".");
            let gender = "";
            if (dot > 0) {
              record.CIVILITY = record.CIVILITY?.replace(".", "");
            }
            if (record.CIVILITY === "Mr" || record.CIVILITY === "Mr.") {
              gender = "Male";
            }
            if (record.CIVILITY === "Mrs" || record.CIVILITY === "Mrs.") {
              gender = "Female";
            }
            if (record.CIVILITY === "Ms" || record.CIVILITY === "Ms.") {
              gender = "Female";
            }
            if (record.CIVILITY === "Miss" || record.CIVILITY === "Miss.") {
              record.CIVILITY = "Ms";
              gender = "Female";
            }
            if (record.CIVILITY === "Mstr" || record.CIVILITY === "Mstr.") {
              record.CIVILITY = "Mr";
              gender = "Male";
            }

            record["GENDER*"] = gender;
            record["NATIONALITY*"] = "IN";
            record["DOCUMENT 1 TYPE*"] = "PASSPORT";
            record["DOCUMENT 1 NUMBER*"] = " ";
            record["DOCUMENT 1 EXPIRY DATE(DD/MM/YYYY)*"] = " ";
            record["DOCUMENT 1 ISSUANCE COMPANY*"] = "IN";

            delete record["SL"];
            delete record["TYPE"];
            delete record["Billing A/C"];
            delete record["Login ID"];
            delete record["Price"];
            delete record["Entry Date"];
            delete record["AQ ID"];
            delete record["Display Pnr "];
            delete record["Supplier"];

            return record;
        });
    default:
      throw new Error(`Unsupported airline code: ${airlineCode}`);
  }
}

function writeExcelFile(data: ExcelRecord[]): Buffer {
  const nb = xlsx.utils.book_new();
  const newsheet = xlsx.utils.json_to_sheet(data);
  xlsx.utils.book_append_sheet(nb, newsheet, "Sheet1");

  return xlsx.write(nb, { type: "buffer", bookType: "xlsx" });
}

function logFileAction(fileName: string, airlineName: string): void {
  const data = new Date();
  const date = data.getDate();
  const month = data.getMonth() + 1;
  const year = data.getFullYear();
  const fulldate = `${date}/${month}/${year}`;
  const appenddata = ` ${fulldate} ${fileName} ${airlineName} converted successfully \n`;
  fs.appendFileSync("data.log", appenddata);
}

function sendExcelFile(res: any, buffer: Buffer, fileName: string): void {
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename=${fileName}`);
  res.send(buffer);
};

function getAirlineName(airlineCode: string): string {
  switch (airlineCode) {
    case "i.xlsx":
      return "Indigo";
    case "g.xlsx":
      return "GoAir";
    case "a.xlsx":
      return "AirAsia";
    case "q.xlsx":
      return "Qatar"; 
    case "t.xlsx":
      return "ThaiAirAsia";
    case "d.xlsx":
      return "Druk Air"; 
    default:
      return "Unknown Airline";
  }
};

export {
  readExcelData,
  transformData,
  writeExcelFile,
  logFileAction,
  sendExcelFile,
  getAirlineName,
};