import DataModel from '../models/model.js';
import ParameterMaster from '../models/parameterMaster.model.js';

export const getAllData = async (req, res) => {
  try {
    const { date } = req.query;
    let query = {};
    if (date) {
      query.date = date;
    }
    const data = await DataModel.find(query);
    res.status(200).json(data);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }
};

export const getAllParameters = async (req, res) => {
  try {
    const parameters = await ParameterMaster.find({});
    res.status(200).json(parameters);
  } catch (error) {
    console.error('Error fetching parameters:', error);
    res.status(500).json({ message: 'Failed to fetch parameters', error: error.message });
  }
};
