import { useState, useMemo, useEffect } from "react"
import { Download, Filter, Search } from "lucide-react"
import * as XLSX from "xlsx"

import { Button } from "../components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Badge } from "../components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table"
import { Input } from "../components/ui/input"
import axios from "axios"

export default function ParameterDashboard() {
  // filters
  const [idFilter, setIdFilter] = useState("all")
  const [descSearch, setDescSearch] = useState("")

  const [data, setData] = useState([]);

  const backendURL = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    axios
      .get(`${backendURL}/api/parameters`)
      .then((res) => {
        setData(res.data);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, [backendURL]);

  // create list of unique Parameter IDs for the drop-down
  const parameterIds = useMemo(() => [...new Set(data.map((p) => p.code))].sort(), [data])

  // apply filters
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchesId = idFilter === "all" || String(item.code) === idFilter
      const matchesDesc = descSearch.trim() === "" || (item.param_desc && item.param_desc.toLowerCase().includes(descSearch.toLowerCase()))
      return matchesId && matchesDesc
    })
  }, [idFilter, descSearch, data])

  // download helper
  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Parameters")

    const today = new Date().toISOString().split("T")[0]
    XLSX.writeFile(workbook, `parameter_dashboard_${today}.xlsx`)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* ── HEADER ────────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Parameter Dashboard</h1>
          <p className="text-muted-foreground text-lg">Filter by Parameter ID or Description and export to Excel.</p>
        </div>

        {/* ── FILTERS / ACTIONS ────────────────────────────────────────────── */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Actions
            </CardTitle>
            <CardDescription>Narrow the list and export the current view.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              {/* Parameter ID drop-down */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Parameter ID</label>
                <Select value={idFilter} onValueChange={setIdFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All IDs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All IDs</SelectItem>
                    {parameterIds.map((id) => (
                      <SelectItem key={id} value={id}>
                        {id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description text search */}
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Description</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search description…"
                    value={descSearch}
                    onChange={(e) => setDescSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Export button */}
              <Button onClick={exportToExcel} className="gap-2">
                <Download className="h-4 w-4" />
                Export Excel
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ── RESULTS SUMMARY ─────────────────────────────────────────────── */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {filteredData.length} of {data.length} parameters
          </p>
          {(idFilter !== "all" || descSearch.trim() !== "") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIdFilter("all")
                setDescSearch("")
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>

        {/* ── DATA TABLE ───────────────────────────────────────────────────── */}
        <Card>
          <CardContent className="p-0">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parameter ID</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>UOM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length ? (
                    filteredData.map((row, idx) => (
                      <TableRow key={row._id || idx}>
                        <TableCell className="font-medium">
                          <Badge variant="outline">{row.PARAMETER_ID || "-"}</Badge>
                        </TableCell>
                        <TableCell>{row.PARAMETER_DESC || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{row.UOM || "-"}</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No parameters match your criteria.
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
  )
}
