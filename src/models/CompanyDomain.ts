import mongoose from 'mongoose';

const companyDomainSchema = new mongoose.Schema({
  domain: {
    type: String,
    required: true,
    unique: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  addedBy: {
    type: String,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.CompanyDomain || mongoose.model('CompanyDomain', companyDomainSchema);
