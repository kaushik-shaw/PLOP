import { useState, useMemo, useEffect } from "react";
import { Download, Search, Filter } from "lucide-react";
import * as XLSX from "xlsx";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

import axios from "axios";

export default function HomePage() {
  const [codeFilter, setCodeFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");

  const [data, setData] = useState([]);

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    axios
      .get(`${backendURL}/`)
      .then((res) => {
        console.log("Backend response:", res.data);
        setData(res.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, [backendURL]);

  const uniqueDates = useMemo(() => {
    const dates = [...new Set(data.map((item) => item.date))];
    return dates.sort();
  }, [data]);

  const codes = useMemo(() => {
    const uniqueCodes = [...new Set(data.map((item) => item.code))];
    return uniqueCodes.sort((a, b) => a - b);
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const codeMatch = codeFilter === "all" || String(item.code) === codeFilter;
      const dateMatch = dateFilter === "all" || item.date === dateFilter;
      return codeMatch && dateMatch;
    });
  }, [data, codeFilter, dateFilter]);

  // Export to Excel function
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Employees");

    // Generate filename with current date
    const date = new Date().toISOString().split("T")[0];
    const filename = `parameter_data_${date}.xlsx`;

    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">
           Data Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            View and analyze data with advanced filtering and export
            capabilities.
          </p>
        </div>

        {/* Filters and Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Actions
            </CardTitle>
            <CardDescription>
              Filter parameter data and export filtered results to Excel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date</label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Dates" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    {uniqueDates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {date}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Parameter ID</label>
                <Select value={codeFilter} onValueChange={setCodeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Parameters" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Parameters</SelectItem>
                    {codes.map((code) => (
                      <SelectItem key={code} value={code.toString()}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={exportToExcel} className="gap-2">
                <Download className="h-4 w-4" />
                Download Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Summary */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredData.length} of {data.length} records
          </p>
          {codeFilter !== "all" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setCodeFilter("all");
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* Data Table */}
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created on</TableHead>
                    <TableHead>Parameter ID</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((item, index) => (
                      <TableRow key={`${item.date}-${item.code}-${index}`}>
                        <TableCell className="font-medium">
                          {item.date}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.code}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {item.value}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No records found matching your criteria.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
                                                  