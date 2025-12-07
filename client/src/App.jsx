import  Home  from "./pages/Home.jsx"
import { Route, Routes } from "react-router-dom"
import PlantDataDashboard from "./pages/MappedSheet.jsx"
import HREntryPage from "./pages/HrEntry.jsx"
import ParamDash from "./pages/ParamDash.jsx"


function App() {

  return (
    <div>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/mapped-sheet" element={<PlantDataDashboard/>} />
        <Route path="/hr-entry" element={<HREntryPage/>} />
        <Route path="/params" element={<ParamDash/>} />
      </Routes>
    </div>
  )
}

export default App
