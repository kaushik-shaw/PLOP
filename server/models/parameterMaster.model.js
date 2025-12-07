import mongoose from 'mongoose';

const parameterMasterSchema = new mongoose.Schema({
  PARAMETER_ID: {
    type: Number,
    required: true,
    unique: true
  },
  PARAMETER_DESC: {
    type: String,
    required: true,
    trim: true
  },
  UOM: {
    type: String,
    required: true,
    enum: ['MT', '%'] // You can expand this as needed
  }
})

const ParameterMaster = mongoose.model('ParameterMaster', parameterMasterSchema, 'paramas');

export default ParameterMaster;
