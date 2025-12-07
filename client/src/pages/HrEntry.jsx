import { useEffect, useState } from "react"
import { Save, ArrowLeft, Plus, Trash2 } from "lucide-react"
import { ToastContainer, toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Label } from "../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select"
import { Textarea } from "../components/ui/textarea"
import { Badge } from "../components/ui/badge"
import { Separator } from "../components/ui/separator"
import { Link } from "react-router-dom"

const productOptions = [
  { value: "HRC", label: "HRC", description: "Hot Rolled Coils" },
  { value: "FHCR", label: "FHCR", description: "Full Hard Cold Rolled" },
  { value: "HRC_Rej", label: "HRC Rej", description: "HRC Rejected Material" },
  { value: "TMBP", label: "TMBP", description: "Tin Mill Black Plate" },
]

export default function HREntryPage() {
  const [entries, setEntries] = useState([])
  const [currentEntry, setCurrentEntry] = useState({
    date: new Date().toISOString().split("T")[0],
    productName: "",
    onDt: "",
    mtd: "",
    ytd: "",
    stock: ""
  })

  // Load existing entries from localStorage on component mount
  useEffect(() => {
    const savedEntries = localStorage.getItem("hrEntries")
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries))
    }
  }, [])

  const handleInputChange = (field, value) => {
    setCurrentEntry((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleSaveEntry = () => {
    if (!currentEntry.productName || !currentEntry.date) {
      toast.error("Please fill in Product Name and Date fields.")
      return
    }

    const newEntry = {
      id: Date.now().toString(),
      date: currentEntry.date || "",
      productName: currentEntry.productName || "",
      onDt: currentEntry.onDt || "0",
      mtd: currentEntry.mtd || "0",
      ytd: currentEntry.ytd || "0",
      stock: currentEntry.stock || "0"
    }

    const updatedEntries = [...entries, newEntry]
    setEntries(updatedEntries)

    // Save to localStorage for Excel preview page
    localStorage.setItem("hrEntries", JSON.stringify(updatedEntries))

    setCurrentEntry({
      date: new Date().toISOString().split("T")[0],
      productName: "",
      onDt: "",
      mtd: "",
      ytd: "",
      stock: ""  
    })

    toast.info("HR data entry has been saved.")
  }

  const handleDeleteEntry = (id) => {
    const updatedEntries = entries.filter((entry) => entry.id !== id)
    setEntries(updatedEntries)

    // Update localStorage
    localStorage.setItem("hrEntries", JSON.stringify(updatedEntries))

    toast.info("HR data entry has been deleted.")
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link to="/mapped-sheet">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Preview
              </Link>
            </Button>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">HR Data Entry</h1>
              <p className="text-muted-foreground text-lg mt-1">
                Enter production data for HRC, FHCR, HRC Rej, and TMBP
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Entry Form */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  New Data Entry
                </CardTitle>
                <CardDescription>Enter production and despatch data for steel products</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date and Product Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={currentEntry.date}
                      onChange={(e) => handleInputChange("date", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product">Product Name</Label>
                    <Select
                      value={currentEntry.productName}
                      onValueChange={(value) => handleInputChange("productName", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select Product" />
                      </SelectTrigger>
                      <SelectContent>
                        {productOptions.map((product) => (
                          <SelectItem key={product.value} value={product.value}>
                            <div>
                              <div className="font-medium">{product.label}</div>
                              <div className="text-xs text-muted-foreground">{product.description}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Production Data */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Production Data (MT)</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="onDt">On Dt</Label>
                      <Input
                        id="onDt"
                        type="number"
                        placeholder="0"
                        value={currentEntry.onDt}
                        onChange={(e) => handleInputChange("onDt", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mtd">MTD</Label>
                      <Input
                        id="mtd"
                        type="number"
                        placeholder="0"
                        value={currentEntry.mtd}
                        onChange={(e) => handleInputChange("mtd", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ytd">YTD</Label>
                      <Input
                        id="ytd"
                        type="number"
                        placeholder="0"
                        value={currentEntry.ytd}
                        onChange={(e) => handleInputChange("ytd", e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Button onClick={handleSaveEntry} className="w-full gap-2">
                  <Save className="h-4 w-4" />
                  Save Entry
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Saved Entries */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Saved Entries ({entries.length})</CardTitle>
                <CardDescription>Recently entered HR data - these will appear in Excel preview</CardDescription>
              </CardHeader>
              <CardContent>
                {entries.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No entries saved yet.</p>
                    <p className="text-sm">Fill out the form to add your first entry.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entries.map((entry) => (
                      <Card key={entry.id} className="border-l-4 border-l-blue-500">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline">{entry.productName}</Badge>
                                <span className="text-sm text-muted-foreground">{formatDate(entry.date)}</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEntry(entry.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="font-medium text-muted-foreground">Production</p>
                              <p>
                                On Dt: {entry.onDt} | MTD: {entry.mtd} | YTD: {entry.ytd}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}