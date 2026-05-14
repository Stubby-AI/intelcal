import { GoogleGenAI, Type } from "@google/genai";
import { ExtractedData } from "../types";

declare var XLSX: any;
declare var mammoth: any;

type ExtractedDataResult = Omit<
  ExtractedData,
  "source" | "recurring"
> & {
  originalSource?: string;
};

// ==============================
// ✅ FALLBACK DATE
// ==============================
const getDeadlineFallback = (): string => {
  const now = new Date();

  now.setHours(23, 59, 59, 999);

  const year = now.getFullYear();

  const month = String(
    now.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    now.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}T23:59:59`;
};

// ==============================
// ✅ API KEY
// ==============================
const API_KEY =
  import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error(
    "VITE_GEMINI_API_KEY is missing."
  );
}

// ==============================
// ✅ GEMINI INIT
// ==============================
const ai = new GoogleGenAI({
  apiKey: API_KEY,
});

// ==============================
// ✅ STABLE LOW-QUOTA MODELS
// ==============================
const FLASH_MODEL = "gemini-2.5-flash";
const PRO_MODEL = "gemini-2.5-flash";

// ==============================
// ✅ DELAY
// ==============================
const sleep = (ms: number) =>
  new Promise((res) => setTimeout(res, ms));

// ==============================
// ✅ RETRY WRAPPER
// ==============================
const withRetry = async <T>(
  fn: () => Promise<T>,
  retries = 5,
  delay = 10000
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {

      // ✅ Delay before every request
      await sleep(3000);

      return await fn();

    } catch (error: any) {

      const message =
        error?.message || "";

      const retryable =
        message.includes("429") ||
        message.includes("503") ||
        message.includes(
          "RESOURCE_EXHAUSTED"
        ) ||
        message.includes(
          "UNAVAILABLE"
        ) ||
        message.includes(
          "high demand"
        );

      console.warn(
        `Gemini Error Attempt ${i + 1}:`,
        message
      );

      if (
        retryable &&
        i < retries - 1
      ) {

        const waitTime =
          delay * (i + 1);

        console.warn(
          `Retrying after ${
            waitTime / 1000
          } seconds...`
        );

        await sleep(waitTime);

      } else {

        throw new Error(
          "Gemini quota exceeded. Please wait and retry."
        );
      }
    }
  }

  throw new Error(
    "Max retries reached."
  );
};

// ==============================
// ✅ FILE TO GENERATIVE PART
// ==============================
export const fileToGenerativePart =
  async (file: File) => {

    const base64Data =
      await new Promise<string>(
        (resolve) => {

          const reader =
            new FileReader();

          reader.onloadend = () =>
            resolve(
              (
                reader.result as string
              ).split(",")[1]
            );

          reader.readAsDataURL(
            file
          );
        }
      );

    return {
      inlineData: {
        data: base64Data,
        mimeType: file.type,
      },
    };
  };

// ==============================
// ✅ DOCX TEXT EXTRACT
// ==============================
const extractFromDocx = async (
  file: File
): Promise<string> => {

  const arrayBuffer =
    await file.arrayBuffer();

  const result =
    await mammoth.extractRawText({
      arrayBuffer,
    });

  return result.value;
};

// ==============================
// ✅ SHEET EXTRACT
// ==============================
const extractFromSheet = async (
  file: File
): Promise<
  ExtractedDataResult[]
> => {

  const data =
    await file.arrayBuffer();

  const workbook =
    XLSX.read(data);

  const worksheet =
    workbook.Sheets[
      workbook.SheetNames[0]
    ];

  const csvData =
    XLSX.utils.sheet_to_csv(
      worksheet
    );

  // ✅ Reduce tokens
  const trimmedCSV =
    csvData.substring(0, 12000);

  const prompt = `
Analyze this spreadsheet CSV.

Return ONLY valid JSON array.

CSV:
${trimmedCSV}

Fields:
- title
- summary
- eligibility
- location
- start
- end
- category

Rules:
- JSON only
- Dates format:
  YYYY-MM-DDTHH:MM:SS
- If no end date:
  use today 23:59:59
`;

  const response =
    await withRetry(() =>
      ai.models.generateContent({
        model: FLASH_MODEL,

        contents: prompt,

        config: {
          responseMimeType:
            "application/json",

          temperature: 0.2,

          maxOutputTokens: 1500,

          responseSchema: {
            type: Type.ARRAY,

            items: {
              type: Type.OBJECT,

              properties: {
                title: {
                  type: Type.STRING,
                },

                summary: {
                  type: Type.STRING,
                },

                eligibility: {
                  type: Type.STRING,
                },

                location: {
                  type: Type.STRING,
                },

                start: {
                  type: Type.STRING,
                },

                end: {
                  type: Type.STRING,
                },

                category: {
                  type: Type.ARRAY,

                  items: {
                    type: Type.STRING,
                  },
                },
              },
            },
          },
        },
      })
    );

  try {

    const parsed =
      JSON.parse(
        response.text.trim()
      );

    if (
      !Array.isArray(parsed)
    ) {
      return [];
    }

    return parsed.map(
      (item: any) => ({
        ...item,

        end:
          item.end ||
          getDeadlineFallback(),

        originalSource:
          file.name,
      })
    );

  } catch (error) {

    console.error(
      "JSON Parse Error:",
      response.text
    );

    throw new Error(
      "Invalid Gemini JSON response."
    );
  }
};

// ==============================
// ✅ FILE CONVERTER
// ==============================
const convertFileToTextOrGenerativePart =
  async (file: File) => {

    const mimeType =
      file.type || "";

    // Spreadsheet
    if (
      mimeType.includes(
        "spreadsheet"
      ) ||
      file.name.endsWith(
        ".xlsx"
      ) ||
      file.name.endsWith(
        ".xls"
      ) ||
      file.name.endsWith(
        ".csv"
      )
    ) {

      const data =
        await file.arrayBuffer();

      const workbook =
        XLSX.read(data);

      const worksheet =
        workbook.Sheets[
          workbook.SheetNames[0]
        ];

      const csvData =
        XLSX.utils.sheet_to_csv(
          worksheet
        );

      return {
        text:
          csvData.substring(
            0,
            12000
          ),
      };
    }

    // DOCX
    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(
        ".docx"
      )
    ) {

      const docText =
        await extractFromDocx(
          file
        );

      return {
        text:
          docText.substring(
            0,
            12000
          ),
      };
    }

    return fileToGenerativePart(
      file
    );
  };

// ==============================
// ✅ MAIN EXTRACT FUNCTION
// ==============================
export const extractInfo =
  async (
    file: File | null,
    text: string
  ): Promise<
    ExtractedDataResult[]
  > => {

    const sourceName =
      file?.name ||
      `Text Input`;

    // Spreadsheet
    if (
      file &&
      (
        file.type.includes(
          "spreadsheet"
        ) ||
        file.type.includes(
          "csv"
        ) ||
        file.name.endsWith(
          ".xlsx"
        ) ||
        file.name.endsWith(
          ".xls"
        ) ||
        file.name.endsWith(
          ".csv"
        )
      )
    ) {

      return extractFromSheet(
        file
      );
    }

    // DOCX
    if (
      file &&
      (
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        file.name.endsWith(
          ".docx"
        )
      )
    ) {

      text =
        await extractFromDocx(
          file
        );

      file = null;
    }

    // Reduce token usage
    text =
      text.substring(
        0,
        12000
      );

    const prompt = `
Analyze content and return ONLY JSON.

Fields:
- title
- summary
- eligibility
- location
- start
- end
- category

Rules:
- JSON only
- If no category:
  use ["General"]
- Date format:
  YYYY-MM-DDTHH:MM:SS
`;

    const parts: any[] = [
      {
        text: prompt,
      },
    ];

    if (file) {

      parts.push(
        await fileToGenerativePart(
          file
        )
      );
    }

    if (text) {

      parts.push({
        text,
      });
    }

    const response =
      await withRetry(() =>
        ai.models.generateContent({
          model: FLASH_MODEL,

          contents: [
            {
              parts,
            },
          ],

          config: {
            responseMimeType:
              "application/json",

            temperature: 0.2,

            maxOutputTokens: 1200,

            responseSchema: {
              type: Type.OBJECT,

              properties: {
                title: {
                  type: Type.STRING,
                },

                summary: {
                  type: Type.STRING,
                },

                eligibility: {
                  type: Type.STRING,
                },

                location: {
                  type: Type.STRING,
                },

                start: {
                  type: Type.STRING,
                },

                end: {
                  type: Type.STRING,
                },

                category: {
                  type: Type.ARRAY,

                  items: {
                    type: Type.STRING,
                  },
                },
              },
            },
          },
        })
      );

    try {

      const parsed =
        JSON.parse(
          response.text.trim()
        );

      if (!parsed.end) {

        parsed.end =
          getDeadlineFallback();
      }

      return [
        {
          ...parsed,

          originalSource:
            sourceName,
        },
      ];

    } catch (error) {

      console.error(
        "Gemini Parse Error:",
        response.text
      );

      throw new Error(
        "Could not parse Gemini response."
      );
    }
  };

// ==============================
// ✅ TEMPLATE STRUCTURE
// ==============================
export const structureDataFromTemplate =
  async (
    templateFile: File,
    dataFile: File
  ): Promise<string> => {

    const templatePart =
      await convertFileToTextOrGenerativePart(
        templateFile
      );

    const dataPart =
      await convertFileToTextOrGenerativePart(
        dataFile
      );

    const prompt = `
Use TEMPLATE structure.

Fill using DATA.

If data missing:
[DATA NOT FOUND]

Return formatted output only.
`;

    const response =
      await withRetry(() =>
        ai.models.generateContent({
          model: PRO_MODEL,

          contents: [
            {
              parts: [
                {
                  text: prompt,
                },

                {
                  text:
                    "\n--- TEMPLATE ---\n",
                },

                templatePart,

                {
                  text:
                    "\n--- DATA ---\n",
                },

                dataPart,
              ],
            },
          ],

          config: {
            temperature: 0.2,

            maxOutputTokens: 2000,
          },
        })
      );

    return response.text;
  };