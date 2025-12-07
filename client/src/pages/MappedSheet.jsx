import { useState, useEffect, useMemo } from "react";
import {
  Download,
  FileSpreadsheet,
  Eye,
  Filter,
  Plus,
  RefreshCw,
} from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { Link } from "react-router-dom";

import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import axios from "axios";

// 1. Define the base rows first (without the total row)
const baseSolutionCenter = [
  {
    label: "HRC",
    values: [
      "HRC_ROH",
      "HRC_ROH",
      "HRC_STL_CL",
      "Tinned Coils",
      "718",
      "EFG Sheet",
      "DESP_PROD",
      "DESP_PROD",
      "0",
      "ETP_SM",
    ],
  },
  {
    label: "FHCR",
    values: [
      "0",
      "0",
      "0",
      "Slit VIP",
      "718",
      "EFG Coils",
      "DESP_PROD",
      "DESP_PROD",
      "0",
      "ETP_SM",
    ],
  },
  {
    label: "HRC Rej",
    values: [
      "HRC_REJ",
      "HRC_REJ",
      "REJ_STK_CL",
      "CSP",
      "715-J6",
      "CRM",
      "DESP_PROD",
      "DESP_PROD",
      "0",
      "CRM_ST",
    ],
  },
  {
    label: "TMBP",
    values: [
      "0",
      "0",
      "0",
      "CRM VIP",
      "717",
      "PacketScrap",
      "DESP_PROD",
      "DESP_PROD",
      "0",
      "PSCRAP",
    ],
  },
];

// 2. Calculate the total for index 4
const totalAtIndex4 = baseSolutionCenter
  .slice(0, -1) // Exclude the last row
  .reduce((sum, row) => {
    // Extract leading number from the string (handles "715-J6" as 715)
    const match = String(row.values[4]).match(/^\d+/);
    const val = match ? Number(match[0]) : 0;
    return sum + val;
  }, 0);

// Calculate the YTD total for index 8, including every row
const totalAtIndex8 = baseSolutionCenter.reduce((sum, row) => {
  const val = Number(row.values[8]);
  return sum + (isNaN(val) ? 0 : val);
}, 0);

// 3. Add the total row
const solutionCenter = [
  ...baseSolutionCenter,
  {
    values: [
      "",
      "",
      "",
      "Total",
      totalAtIndex4.toString(),
      "Total",
      "0",
      "0",
      totalAtIndex8.toString(),
      "0",
    ],
  },
];

// 4. Use this in your excelSections object
const excelSections = {
  solutionCenter,
  lineProduction: [
    {
      line: "Shivdutta Das",
      onDt: "On Dt",
      mtd: "MTD",
      ytd: "YTD",
      stock: "On Dt",
      values: ["MTD", "YTD", "On Dt", "MTD", "YTD"],
    },
    {
      line: "Line Production(MT)",
      onDt: "841",
      mtd: "841",
      ytd: "841",
      stock: "812+813",
      values: [
        "842+843",
        "862+863",
        "804+805+806",
        "834+835+836",
        "864+865+866",
      ],
    },
    {
      line: "Pack Production(MT)",
      onDt: "841",
      mtd: "841",
      ytd: "871",
      stock: "812+813",
      values: ["842+843", "862+863", "812+813", "862+863", "864+865+866"],
    },
    {
      line: "Line Delay (Hrs)",
      onDt: "821",
      mtd: "851",
      ytd: "881",
      stock: "822+823",
      values: ["852+853", "882+883", "824+825", "854+855", "834+835+836"],
    },
  ],
  etlData: [
    {
      section: "ETL-1 ( Mihir Kumar)",
      onDt: "0",
      mtd: "0",
      ytd: "0",
      buffer: "ETL-2 Buffer/Coil Form",
      sh1: "ETL-2 SH-1",
      etl2: "ETL-2 SH-2",
    },
    {
      section: "On Dt",
      onDt: "304",
      mtd: "404",
      ytd: "505",
      buffer: "On Dt",
      sh1: "304",
      etl2: "On Dt",
    },
    {
      section: "Pack Production(5M)",
      onDt: "305",
      mtd: "405",
      ytd: "505",
      buffer: "305",
      sh1: "405",
      etl2: "305",
    },
    {
      section: "Pack Production(NM)",
      onDt: "309",
      mtd: "409",
      ytd: "509",
      buffer: "310",
      sh1: "410",
      etl2: "310",
    },
  ],
  crmData: [
    {
      item: "Pick-1&2",
      onDt: "101",
      mtd: "201",
      ytd: "601",
      wip: "113",
      throughput: "213",
      factor: "125",
      availability: "137",
    },
    {
      item: "M K Dube",
      onDt: "102",
      mtd: "202",
      ytd: "602",
      vip: "114",
      throughput: "214",
      factor: "126",
      availability: "138",
    },
    {
      item: "Shift Show",
      onDt: "103",
      mtd: "203",
      ytd: "603",
      vip: "115",
      throughput: "215",
      factor: "127",
      availability: "139",
    },
    {
      item: "Reject",
      onDt: "104",
      mtd: "204",
      ytd: "604",
      vip: "116",
      throughput: "216",
      factor: "128",
      availability: "140",
    },
  ],
};

export default function MappedSheet() {
  const [isDownloading, setIsDownloading] = useState(false);
  const [dateFilter, setDateFilter] = useState("");
  const [filteredSections, setFilteredSections] = useState(excelSections);
  const [hrEntries, setHrEntries] = useState([]);

  const [data, setData] = useState([]);

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    // If no dateFilter, fetch all; otherwise, fetch for the selected date
    const url = dateFilter
      ? `${backendURL}/?date=${formatDateForBackend(dateFilter)}`
      : `${backendURL}/`;

    axios
      .get(url)
      .then((res) => {
        console.log("Backend response:", res.data);
        setData(res.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, [backendURL, dateFilter]);

  const codeValueMap = useMemo(() => {
    const map = {};
    data.forEach((item) => {
      map[item.code] = item.value;
    });
    return map;
  }, [data]);

  // Load HR entries from localStorage and update the display
  useEffect(() => {
    const loadHREntries = () => {
      const savedEntries = localStorage.getItem("hrEntries");
      let entries = [];
      if (savedEntries) {
        entries = JSON.parse(savedEntries);
        setHrEntries(entries);
      }

      // Filter entries by date if date filter is applied
      if (dateFilter) {
        entries = entries.filter((entry) => entry.date === dateFilter);
      }

      // Update the solution center data with filtered HR entries
      const updatedSolutionCenter = excelSections.solutionCenter.map((row) => {
        const hrEntry = entries.find(
          (entry) => entry.productName === row.label
        );
        if (hrEntry) {
          return {
            ...row,
            values: [
              hrEntry.onDt || row.values[0],
              hrEntry.mtd || row.values[1],
              hrEntry.ytd || row.values[2],
              hrEntry.stock || row.values[8],
              row.values[9], // Keep the last value as is
            ],
          };
        }
        return row;
      });

      setFilteredSections({
        ...excelSections,
        solutionCenter: updatedSolutionCenter,
      });
    };

    loadHREntries();

    // Listen for storage changes (when data is updated from HR entry page)
    const handleStorageChange = () => {
      loadHREntries();
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [dateFilter]);

  const refreshData = () => {
    const savedEntries = localStorage.getItem("hrEntries");
    let entries = [];
    if (savedEntries) {
      entries = JSON.parse(savedEntries);
      setHrEntries(entries);
    }

    // Filter entries by date if date filter is applied
    if (dateFilter) {
      entries = entries.filter((entry) => entry.date === dateFilter);
    }

    // Update the solution center data with filtered HR entries
    const updatedSolutionCenter = excelSections.solutionCenter.map((row) => {
      const hrEntry = entries.find((entry) => entry.productName === row.label);
      if (hrEntry) {
        return {
          ...row,
          values: [
            hrEntry.onDt || row.values[0],
            hrEntry.mtd || row.values[1],
            hrEntry.ytd || row.values[2],
            hrEntry.stock || row.values[8],
            row.values[9], // Keep the last value as is
          ],
        };
      }
      return row;
    });

    setFilteredSections({
      ...excelSections,
      solutionCenter: updatedSolutionCenter,
    });
  };

  const downloadExcel = async () => {
    setIsDownloading(true);
    try {
      const workbook = XLSX.utils.book_new();

      // Prepare worksheet data as before
      const solutionCenterHeader = [
        "Solution Center",
        {
          v: "Lacquering Line",
          s: { fill: { fgColor: { rgb: "DBEAFE" } }, font: { bold: true } },
        },
        "",
        "",
        {
          v: "Printing Line-1",
          s: { fill: { fgColor: { rgb: "DBEAFE" } }, font: { bold: true } },
        },
        "",
        "",
        {
          v: "Printing Line-2",
          s: { fill: { fgColor: { rgb: "DBEAFE" } }, font: { bold: true } },
        },
        "",
        "",
        {
          v: "Total",
          s: { fill: { fgColor: { rgb: "DBEAFE" } }, font: { bold: true } },
        },
        "",
        "",
        {
          v: "Major Delays",
          s: { fill: { fgColor: { rgb: "DBEAFE" } }, font: { bold: true } },
        },
      ];

      const solutionCenterSubHeader = [
        "",
        "On Dt",
        "MTD",
        "YTD",
        "On Dt",
        "MTD",
        "YTD",
        "On Dt",
        "MTD",
        "YTD",
        "On Dt",
        "MTD",
        "YTD",
        "",
      ];

      // Example data rows (replace with your dynamic data)
      const solutionCenterRows = [
        [
          "Line Production(MT)",
          801,
          831,
          861,
          "802+803",
          "832+833",
          "862+863",
          "804+806",
          "834+835",
          "864+865+866",
          "=C13+G13+L13",
          "=D13+H13+L13",
          "=E13+I13+L13",
          "Laq.line (A-2:10 - S/D, B-1:49 - Mech. Delay)",
        ],
        [
          "Pack Production(MT)",
          811,
          841,
          871,
          "812+813",
          "842+843",
          "872+873",
          "814+818",
          "844+845",
          "874+875+876",
          "=C14+G14+L14",
          "=D14+H14+L14",
          "=E14+I14+L14",
          "",
        ],
        [
          "Line Delay (Hrs)",
          821,
          851,
          881,
          "822+823",
          "852+853",
          "882+883",
          "824+826",
          "854+855",
          "884+885+886",
          "=C15+G15+L15",
          "=D15+H15+L15",
          "=E15+I15+L15",
          "Print Line - 1 (A-2:00 - Elect. Delay, B-1:43 - Mech. Delay, 2:30 - R/M Delay, C-8:00 - do -)\nLine - 2 (No Major Delay)",
        ],
      ];

      const wsData = [
        [
          "SCM -",
          "Rspt MT",
          "",
          "Stock",
          "WIP On dt MT",
          "",
          "TSBM STK CLD",
          "Despatch",
          "On dt",
          "MTD",
          "YTD",
          "Stock",
        ],
        [
          "Product Name",
          "On Dt",
          "MTD",
          "YTD",
          "SRM",
          "SRM STK CLD",
          "",
          "",
          "On Dt",
          "MTD",
          "YTD",
          "On Dt",
        ],
        // Solution Center rows with code replacement
        ...filteredSections.solutionCenter.map((row) => [
          row.label,
          ...row.values.map((val) => resolveValue(val, codeValueMap)),
        ]),
        [""],
        solutionCenterHeader,
        solutionCenterSubHeader,
        // Line Production rows with code replacement
        ...excelSections.lineProduction.map((row) => [
          row.line,
          resolveValue(row.onDt, codeValueMap),
          resolveValue(row.mtd, codeValueMap),
          resolveValue(row.ytd, codeValueMap),
          resolveValue(row.stock, codeValueMap),
          ...row.values.slice(0, 7).map((val) => resolveValue(val, codeValueMap)),
        ]),
        [""],
        [
          "ETL",
          "ETL-1 ( Mihir Kumar)",
          "",
          "",
          "ETL-2 Buffer/Coil Form",
          "ETL-2 SH-1",
          "",
          "ETL-2 SH-2",
          "",
          "Test ETL-2",
        ],
        // ETL rows with code replacement
        ...filteredSections.etlData.map((row) => [
          row.section,
          resolveValue(row.onDt, codeValueMap),
          resolveValue(row.mtd, codeValueMap),
          resolveValue(row.ytd, codeValueMap),
          resolveValue(row.buffer, codeValueMap),
          resolveValue(row.sh1, codeValueMap),
          "",
          resolveValue(row.etl2, codeValueMap),
          "",
          "",
        ]),
        [""],
        [
          "CRM",
          "Line Production (MT)",
          "",
          "VIP",
          "Throughput (MT/Hr)",
          "",
          "Thput Factor",
          "Mill Availability (%)",
          "",
          "CRM Mat. Yield",
        ],
        [
          "Universe",
          "On Dt",
          "MTD",
          "YTD",
          "Nos.",
          "On Dt",
          "MTD",
          "YTD",
          "On Dt",
          "MTD",
          "YTD",
          "Major Delays",
        ],
        // CRM rows with code replacement
        ...filteredSections.crmData.map((row) => [
          row.item,
          resolveValue(row.onDt, codeValueMap),
          resolveValue(row.mtd, codeValueMap),
          resolveValue(row.ytd, codeValueMap),
          "",
          resolveValue(row.vip, codeValueMap),
          resolveValue(row.throughput, codeValueMap),
          "",
          resolveValue(row.factor, codeValueMap),
          "",
          resolveValue(row.availability, codeValueMap),
          "",
        ]),
      ];

      // Create worksheet
      const worksheet = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      worksheet["!cols"] = Array(12).fill({ wch: 12 });

      // Apply styles
      // Example: Color the first row (headers) with blue background and white bold text
      const headerStyle = {
        fill: { fgColor: { rgb: "2563EB" } }, // Tailwind blue-600
        font: { color: { rgb: "FFFFFF" }, bold: true },
        alignment: { horizontal: "center", vertical: "center" },
      };
      // Example: Color the second row (sub-headers) with green background and black bold text
      const subHeaderStyle = {
        fill: { fgColor: { rgb: "BBF7D0" } }, // Tailwind green-200
        font: { color: { rgb: "000000" }, bold: true },
        alignment: { horizontal: "center", vertical: "center" },
      };
      // Example: Color the first column (Product/Section names) with blue-100
      const firstColStyle = {
        fill: { fgColor: { rgb: "DBEAFE" } }, // Tailwind blue-100
        font: { bold: true },
      };

      // Apply header style to first row
      for (let c = 0; c < 12; c++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: 0, c })];
        if (cell) cell.s = headerStyle;
      }
      // Apply sub-header style to second row
      for (let c = 0; c < 12; c++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r: 1, c })];
        if (cell) cell.s = subHeaderStyle;
      }
      // Apply first column style to all rows except empty ones
      for (let r = 2; r < wsData.length; r++) {
        const cell = worksheet[XLSX.utils.encode_cell({ r, c: 0 })];
        if (cell && wsData[r][0] !== "") cell.s = firstColStyle;
      }

      // You can add more styling as needed for other rows/columns

      XLSX.utils.book_append_sheet(workbook, worksheet, "Production Report");

      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, "-")
        .slice(0, -5);
      const filename = `production_report_${timestamp}.xlsx`;

      XLSX.writeFile(workbook, filename);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Error downloading Excel file:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  function resolveValue(val, codeValueMap) {
    // If it's a sum (e.g. "842+843")
    if (typeof val === "string" && val.includes("+")) {
      const parts = val.split("+");
      // Only sum if all parts are codes in codeValueMap
      if (parts.every((p) => codeValueMap[p] !== undefined)) {
        return parts.reduce((sum, p) => sum + Number(codeValueMap[p]), 0);
      }
      return val; // leave as-is if not all are codes
    }
    // If it's a single code
    if (codeValueMap[val] !== undefined) {
      return codeValueMap[val];
    }
    // Otherwise, return as-is (for "On Dt", "MTD", etc.)
    return val;
  }

  function formatDateForBackend(dateStr) {
    if (!dateStr) return "";
    const [yyyy, mm, dd] = dateStr.split("-");
    return `${dd}-${mm}-${yyyy}`;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileSpreadsheet className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight">
                  Production Report Preview
                </h1>
                <p className="text-muted-foreground text-lg mt-1">
                  Complex Excel spreadsheet with live HR data integration
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Report Date</div>
              <div className="text-lg font-semibold">
                {new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </div>
            </div>
          </div>
        </div>

        {/* File Info and Download Section */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Excel File Preview
                </CardTitle>
                <CardDescription>
                  Production Report • Live HR Data • {hrEntries.length} HR
                  entries loaded
                </CardDescription>
              </div>
              <Button
                onClick={downloadExcel}
                disabled={isDownloading}
                className="gap-2"
                size="lg"
              >
                <Download className="h-4 w-4" />
                {isDownloading ? "Downloading..." : "Download Excel"}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Date Filter Section */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Date Filter & Actions
            </CardTitle>
            <CardDescription>
              Filter data by specific date and manage HR entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Date</label>
                <Input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-[200px]"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setDateFilter("")}
                disabled={!dateFilter}
              >
                Clear Filter
              </Button>
              <Button
                variant="outline"
                onClick={refreshData}
                className="gap-2 bg-transparent"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Data
              </Button>
              <Button asChild className="gap-2">
                <Link to="/hr-entry">
                  <Plus className="h-4 w-4" />
                  HR Data Entry
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Excel Preview - Complex Layout */}
        <Card>
          <CardHeader>
            <CardTitle>Spreadsheet Preview</CardTitle>
            <CardDescription>
              Preview showing live HR data integration - values update
              automatically when HR saves entries
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              {/* Main Headers */}
              <div className="border-b">
                <div className="grid grid-cols-12 text-xs font-semibold">
                  <div className="p-2 bg-blue-600 text-white border-r border-white">
                    SCM -
                  </div>
                  <div className="p-2 bg-blue-600 text-white border-r border-white">
                    Rcpt MT
                  </div>
                  <div className="p-2 bg-blue-600 text-white border-r border-white"></div>
                  <div className="p-2 bg-blue-600 text-white border-r border-white">
                    Stock
                  </div>
                  <div className="p-2 bg-blue-600 text-white border-r border-white">
                    WIP On dt MT
                  </div>
                  <div className="p-2 bg-blue-600 text-white border-r border-white"></div>
                  <div className="p-2 bg-blue-600 text-white border-r border-white">
                    Despatch
                  </div>
                  <div className="p-2 bg-blue-600 text-white border-r border-white">
                    On-dt
                  </div>
                  <div className="p-2 bg-blue-600 text-white border-r border-white">
                    MTD
                  </div>
                  <div className="p-2 bg-blue-600 text-white border-r border-white">
                    YTD
                  </div>
                  <div className="p-2 bg-blue-600 text-white border-r border-white">
                    Stock
                  </div>
                </div>
              </div>

              {/* Solution Center Section */}
              <div className="border-b">
                <div className="grid grid-cols-12 text-xs">
                  <div className="p-2 bg-blue-500 text-white font-semibold border-r">
                    Product Name
                  </div>
                  <div className="p-2 bg-green-200 border-r">On Dt</div>
                  <div className="p-2 bg-green-200 border-r">MTD</div>
                  <div className="p-2 bg-green-200 border-r">YTD</div>
                  <div className="p-2 bg-yellow-200 border-r">SRM</div>
                  <div className="p-2 bg-yellow-200 border-r">SRM_STK_CLO</div>
                  <div className="p-2 bg-green-200 border-r">SFG</div>
                  <div className="p-2 bg-green-200 border-r">
                    DESP_PROD_SC_ONDT
                  </div>
                  <div className="p-2 bg-green-200 border-r">
                    DESP_PROD_SC_MTD
                  </div>
                  <div className="p-2 bg-green-200 border-r">0</div>
                  <div className="p-2 bg-green-200 border-r">YTD</div>
                </div>

                {filteredSections.solutionCenter.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-xs border-t">
                    <div className="p-2 bg-blue-100 font-medium border-r">
                      {row.label}
                    </div>
                    {row.values.map((value, i) => (
                      <div
                        key={i}
                        className={`p-2 border-r ${
                          i < 3
                            ? "bg-green-100"
                            : i < 6
                            ? "bg-yellow-100"
                            : "bg-green-100"
                        }`}
                      >
                        {codeValueMap[value] !== undefined ? codeValueMap[value] : value}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Line Production Section */}
              <div className="border-b mt-4">
                <div className="grid grid-cols-12 text-xs">
                  <div className="p-2 bg-blue-500 text-white font-semibold border-r">
                    Solution Center
                  </div>
                  <div className="p-2 bg-green-200 border-r">
                    Lacquering Line
                  </div>
                  <div className="p-2 bg-green-200 border-r"></div>
                  <div className="p-2 bg-green-200 border-r"></div>
                  <div className="p-2 bg-yellow-200 border-r">
                    Printing Line-1
                  </div>
                  <div className="p-2 bg-yellow-200 border-r"></div>
                  <div className="p-2 bg-yellow-200 border-r"></div>
                  <div className="p-2 bg-green-200 border-r">
                    Printing Line-2
                  </div>
                  <div className="p-2 bg-green-200 border-r"></div>
                  <div className="p-2 bg-green-200 border-r"></div>
                  <div className="p-2 bg-green-200 border-r">Total</div>
                  <div className="p-2 bg-blue-200">Major Delays</div>
                </div>

                {excelSections.lineProduction.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-xs border-t">
                    <div className="p-2 bg-blue-100 font-medium border-r">
                      {row.line}
                    </div>
                    <div className="p-2 bg-green-100 border-r">{resolveValue(row.onDt, codeValueMap)}</div>
                    <div className="p-2 bg-green-100 border-r">{resolveValue(row.mtd, codeValueMap)}</div>
                    <div className="p-2 bg-green-100 border-r">{resolveValue(row.ytd, codeValueMap)}</div>
                    <div className="p-2 bg-yellow-100 border-r">{resolveValue(row.stock, codeValueMap)}</div>
                    {row.values.map((value, i) => (
                      <div
                        key={i}
                        className={`p-2 border-r ${i < 2 ? "bg-yellow-100" : "bg-green-100"}`}
                      >
                        {resolveValue(value, codeValueMap)}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* ETL Section */}
              <div className="border-b mt-4">
                <div className="grid grid-cols-12 text-xs">
                  <div className="p-2 bg-blue-500 text-white font-semibold border-r">
                    ETL
                  </div>
                  <div className="p-2 bg-green-200 border-r">
                    ETL-1 ( Mihir Kumar)
                  </div>
                  <div className="p-2 bg-green-200 border-r"></div>
                  <div className="p-2 bg-green-200 border-r"></div>
                  <div className="p-2 bg-yellow-200 border-r">
                    ETL-2 Buffer/Coil Form
                  </div>
                  <div className="p-2 bg-yellow-200 border-r">ETL-2 SH-1</div>
                  <div className="p-2 bg-yellow-200 border-r"></div>
                  <div className="p-2 bg-green-200 border-r">ETL-2 SH-2</div>
                  <div className="p-2 bg-green-200 border-r"></div>
                  <div className="p-2 bg-green-200 border-r">Test ETL-2</div>
                  <div className="p-2 bg-green-200 border-r"></div>
                  <div className="p-2 bg-blue-200">Major Delays</div>
                </div>

                {filteredSections.etlData.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-xs border-t">
                    <div className="p-2 bg-blue-100 font-medium border-r">
                      {row.section}
                    </div>
                    <div className="p-2 bg-green-100 border-r">{resolveValue(row.onDt, codeValueMap)}</div>
                    <div className="p-2 bg-green-100 border-r">{resolveValue(row.mtd, codeValueMap)}</div>
                    <div className="p-2 bg-green-100 border-r">{resolveValue(row.ytd, codeValueMap)}</div>
                    <div className="p-2 bg-yellow-100 border-r">{resolveValue(row.buffer, codeValueMap)}</div>
                    <div className="p-2 bg-yellow-100 border-r">{resolveValue(row.sh1, codeValueMap)}</div>
                    <div className="p-2 bg-yellow-100 border-r"></div>
                    <div className="p-2 bg-green-100 border-r">{resolveValue(row.etl2, codeValueMap)}</div>
                    <div className="p-2 bg-green-100 border-r"></div>
                    <div className="p-2 bg-green-100 border-r"></div>
                    <div className="p-2 bg-green-100 border-r"></div>
                    <div className="p-2 bg-blue-100"></div>
                  </div>
                ))}
              </div>

              {/* CRM Section */}
              <div className="mt-4">
                <div className="grid grid-cols-12 text-xs">
                  <div className="p-2 bg-blue-500 text-white font-semibold border-r">
                    CRM
                  </div>
                  <div className="p-2 bg-green-200 border-r">
                    Line Production (MT)
                  </div>
                  <div className="p-2 bg-green-200 border-r"></div>
                  <div className="p-2 bg-green-200 border-r">VIP</div>
                  <div className="p-2 bg-yellow-200 border-r">
                    Throughput (MT/Hr)
                  </div>
                  <div className="p-2 bg-yellow-200 border-r"></div>
                  <div className="p-2 bg-yellow-200 border-r">Thput Factor</div>
                  <div className="p-2 bg-green-200 border-r">
                    Mill Availability (%)
                  </div>
                  <div className="p-2 bg-green-200 border-r"></div>
                  <div className="p-2 bg-green-200 border-r">
                    CRM Mat. Yield
                  </div>
                  <div className="p-2 bg-green-200 border-r"></div>
                  <div className="p-2 bg-blue-200">Major Delays</div>
                </div>

                {filteredSections.crmData.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-12 text-xs border-t">
                    <div className="p-2 bg-blue-100 font-medium border-r">
                      {row.item}
                    </div>
                    <div className="p-2 bg-green-100 border-r">{resolveValue(row.onDt, codeValueMap)}</div>
                    <div className="p-2 bg-green-100 border-r">{resolveValue(row.mtd, codeValueMap)}</div>
                    <div className="p-2 bg-green-100 border-r">{resolveValue(row.ytd, codeValueMap)}</div>
                    <div className="p-2 bg-yellow-100 border-r"></div>
                    <div className="p-2 bg-yellow-100 border-r">{resolveValue(row.vip, codeValueMap)}</div>
                    <div className="p-2 bg-yellow-100 border-r">{resolveValue(row.throughput, codeValueMap)}</div>
                    <div className="p-2 bg-green-100 border-r"></div>
                    <div className="p-2 bg-green-100 border-r">{resolveValue(row.factor, codeValueMap)}</div>
                    <div className="p-2 bg-green-100 border-r"></div>
                    <div className="p-2 bg-green-100 border-r">{resolveValue(row.availability, codeValueMap)}</div>
                    <div className="p-2 bg-blue-100"></div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* File Details */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Excel File Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">File Format:</span>
                  <span className="text-sm text-muted-foreground">
                    Microsoft Excel (.xlsx)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Worksheet:</span>
                  <span className="text-sm text-muted-foreground">
                    Production Report
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">HR Entries:</span>
                  <span className="text-sm text-muted-foreground">
                    {hrEntries.length} entries loaded
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Data Source:</span>
                  <span className="text-sm text-muted-foreground">
                    Live HR Entry Integration
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Last Updated:</span>
                  <span className="text-sm text-muted-foreground">
                    {new Date().toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Auto-Refresh:</span>
                  <span className="text-sm text-muted-foreground">Enabled</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
