import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

type BnfResult = {
  title: string;
  subtitle: string;
  author: string;
  isbn: string;
  coverUrl: string | null;
  publisher: string;
  publishedDate: string;
  description: string;
  language: string;
  type: string;
  volumeNumber: number | null;
  series: string;
  ark: string | null;
};

function toArray(value: any): any[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

function text(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number") {
    return String(value);
  }

  if (typeof value === "object") {
    if (typeof value["#text"] === "string") {
      return value["#text"].trim();
    }

    if (typeof value["#text"] === "number") {
      return String(value["#text"]);
    }
  }

  return "";
}

function getMarcRecord(record: any): any | null {
  return record?.recordData?.record ?? null;
}

function getField(record: any, tag: string): any[] {
  const marcRecord = getMarcRecord(record);

  if (!marcRecord) {
    return [];
  }

  const fields = toArray(marcRecord.datafield);

  return fields.filter(
    (field) => String(field?.["@_tag"] ?? "") === tag
  );
}

function getSubfields(field: any, code: string): string[] {
  return toArray(field?.subfield)
    .filter(
      (subfield) =>
        String(subfield?.["@_code"] ?? "") === code
    )
    .map((subfield) => text(subfield))
    .filter(Boolean);
}

function getFirstSubfield(
  fields: any[],
  code: string
): string {
  for (const field of fields) {
    const values = getSubfields(field, code);

    if (values.length > 0) {
      return values[0];
    }
  }

  return "";
}

function getAllSubfields(
  fields: any[],
  code: string
): string[] {
  return fields.flatMap((field) =>
    getSubfields(field, code)
  );
}

function cleanIsbn(value: string): string {
  return value.replace(/[^0-9Xx]/g, "").toUpperCase();
}

function detectType(
  title: string,
  series: string,
  format: string
): string {
  const value =
    `${title} ${series} ${format}`.toLowerCase();

  if (
    value.includes("manga") ||
    value.includes("mangá")
  ) {
    return "MANGA";
  }

  if (
    value.includes("bande dessinée") ||
    value.includes("bd")
  ) {
    return "BD";
  }

  if (value.includes("comic")) {
    return "COMIC";
  }

  if (
    value.includes("roman graphique") ||
    value.includes("graphic novel")
  ) {
    return "GRAPHIC_NOVEL";
  }

  return "BOOK";
}

function buildCoverUrl(
  isbn: string
): string | null {
  if (!isbn) {
    return null;
  }

  // Open Library peut fournir une couverture
  // même lorsque la notice vient de la BnF.
  return `https://covers.openlibrary.org/b/isbn/${isbn}-M.jpg`;
}

export async function GET(
  request: NextRequest
) {
  try {
    const query =
      request.nextUrl.searchParams.get("q")?.trim() ?? "";

    if (!query) {
      return NextResponse.json(
        {
          error: "Paramètre q manquant.",
        },
        { status: 400 }
      );
    }

    const cleanQuery = cleanIsbn(query);

    const isIsbn13 =
      /^[0-9]{13}$/.test(cleanQuery);

    const isIsbn10 =
      /^[0-9]{9}[0-9X]$/i.test(cleanQuery);

    let bnfQuery: string;

    if (isIsbn13) {
      bnfQuery = `bib.ean any "${cleanQuery}"`;
    } else if (isIsbn10) {
      bnfQuery = `bib.isbn any "${cleanQuery}"`;
    } else {
      bnfQuery =
        `bib.anywhere all "${query.replace(/"/g, "")}"`;
    }

    const url =
      "https://catalogue.bnf.fr/api/SRU" +
      "?version=1.2" +
      "&operation=searchRetrieve" +
      `&query=${encodeURIComponent(bnfQuery)}` +
      "&recordSchema=unimarcXchange" +
      "&maximumRecords=10";

    console.log("BNF QUERY :", bnfQuery);
    console.log("BNF URL :", url);

    const response = await fetch(url, {
      headers: {
        Accept: "application/xml",
      },
      cache: "no-store",
    });

    const xml = await response.text();

    console.log("BNF STATUS :", response.status);
    console.log(
      "BNF XML LENGTH :",
      xml.length
    );

    if (!response.ok) {
      console.error(
        "BNF HTTP ERROR :",
        response.status,
        xml.slice(0, 1000)
      );

      return NextResponse.json(
        {
          error: "La BnF a retourné une erreur.",
          status: response.status,
        },
        { status: 502 }
      );
    }

    const parser = new XMLParser({
      ignoreAttributes: false,
      removeNSPrefix: true,
      trimValues: true,
    });

    const parsed = parser.parse(xml);
    console.log(
  "BNF STRUCTURE :",
  JSON.stringify(parsed, null, 2).slice(0, 10000)
);

const searchResponse =
  parsed?.searchRetrieveResponse;

console.log(
  "BNF SEARCH RESPONSE :",
  searchResponse ? "OK" : "ABSENT"
);

console.log(
  "BNF RECORDS RAW :",
  JSON.stringify(
    searchResponse?.records,
    null,
    2
  )
);

const records = toArray(
  searchResponse?.records?.record
);

console.log(
  "BNF RECORDS COUNT :",
  records.length
);

if (records.length === 0) {
  return NextResponse.json([]);
}

    const results: BnfResult[] = [];

    for (const record of records) {
      const field010 = getField(record, "010");
      const field073 = getField(record, "073");
      const field101 = getField(record, "101");
      const field200 = getField(record, "200");
      const field214 = getField(record, "214");
      const field215 = getField(record, "215");
      const field225 = getField(record, "225");
      const field300 = getField(record, "300");
      const field700 = getField(record, "700");
      const field701 = getField(record, "701");

      const isbn010 = getFirstSubfield(
        field010,
        "a"
      );

      const isbn073 = getFirstSubfield(
        field073,
        "a"
      );

      const isbn = cleanIsbn(
        isbn010 || isbn073 || cleanQuery
      );

      const editionTitle = getFirstSubfield(
        field200,
        "a"
      );

      const series = getFirstSubfield(
        field225,
        "a"
      );

     const volumeValue = getFirstSubfield(
  field225,
  "v"
);

// La BnF peut fournir le tome directement dans 225$v
let volumeNumber: number | null = null;

const structuredVolumeMatch =
  volumeValue?.match(/\d+/);

if (structuredVolumeMatch) {
  volumeNumber = Number(
    structuredVolumeMatch[0]
  );
}

// Fallback : certaines notices indiquent le tome
// directement dans le titre, par exemple :
// "ONE PIECE 1" avec série = "ONE PIECE"
if (
  volumeNumber === null &&
  series &&
  editionTitle
) {
  const escapedSeries = series.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );

  const titleAfterSeries =
    editionTitle
      .replace(
        new RegExp(
          `^${escapedSeries}\\s*`,
          "i"
        ),
        ""
      )
      .trim();

  const titleVolumeMatch =
    titleAfterSeries.match(
      /(?:tome|tom|volume|vol\.?|#)?\s*(\d+)\s*$/i
    );

  if (titleVolumeMatch) {
    volumeNumber = Number(
      titleVolumeMatch[1]
    );
  }
}

      /*
       * Pour cette notice BnF :
       *
       * 200$a = Septembre 59
       * 225$a = Les gorilles du général
       * 225$v = 1
       *
       * On utilise donc la série comme titre principal
       * dans Biblidex et 200$a comme sous-titre.
       */
      let title = editionTitle;
      let subtitle = "";

      if (
        series &&
        editionTitle &&
        series.toLowerCase() !==
          editionTitle.toLowerCase()
      ) {
        title = series;
        subtitle = editionTitle;
      }

      const authorValues = [
        ...getAllSubfields(field700, "a"),
        ...getAllSubfields(field701, "a"),
      ];

      const author = authorValues
        .filter(Boolean)
        .join(", ");

      const publisher = getFirstSubfield(
        field214,
        "c"
      );

      const publishedDate = getFirstSubfield(
        field214,
        "d"
      );

      const language = getFirstSubfield(
        field101,
        "a"
      );

      const description = getFirstSubfield(
        field300,
        "a"
      );

      const physicalDescription =
        getFirstSubfield(field215, "a");

      const type = detectType(
        title,
        series,
        physicalDescription
      );

      const ark =
        record?.recordIdentifier ?? null;

      results.push({
        title: title || "Titre inconnu",
        subtitle,
        author: author || "Auteur inconnu",
        isbn,
        coverUrl: buildCoverUrl(isbn),
        publisher,
        publishedDate,
        description,
        language,
        type,
        volumeNumber,
        series,
        ark,
      });
    }

    console.log(
      "BNF RESULTS :",
      JSON.stringify(results, null, 2)
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error(
      "ERREUR API BNF :",
      error
    );

    return NextResponse.json(
      {
        error:
          "Erreur lors de la recherche BnF.",
        details:
          error instanceof Error
            ? error.message
            : String(error),
      },
      { status: 500 }
    );
  }
}