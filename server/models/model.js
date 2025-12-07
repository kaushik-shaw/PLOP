import mongoose from "mongoose";

const dataSchema = new mongoose.Schema({
    date: {type: String, required: true},
    code: {type: Number, required: true},
    value: {type: Number, required: true},
})

const DataModel = mongoose.models.PLOP || mongoose.model("PLOP", dataSchema, "PLOP");

export default DataModel;