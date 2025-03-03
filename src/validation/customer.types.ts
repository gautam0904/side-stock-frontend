import { z } from 'zod';

const prizefixSchema = z.object({
  productName: z.string().min(1, 'Product name is required'),
  size: z.string().min(1, 'Size is required'),
  rate: z.number().min(0, 'Rate must be positive')
});

const siteSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  siteAddress: z.string().min(1, 'Site address is required'),
  challanNumber: z.string(),
  siteSuperwiserName: z.string().optional(),
  siteSuperwiserNumber: z.string()
    .regex(/^[6-9]\d{9}$/, 'Invalid mobile number')
    .optional(),
  prizefix: z.array(prizefixSchema)
});

export const customerSchema = z.object({
  _id: z.string().optional(),
  customerName: z.string().min(1, 'Customer name is required'),
  mobileNumber: z.string()
    .min(10, 'Mobile number must be 10 digits')
    .max(10, 'Mobile number must be 10 digits')
    .regex(/^[6-9]\d{9}$/, 'Invalid mobile number'),
  partnerName: z.string().optional(),
  partnerMobileNumber: z.string()
    .regex(/^[6-9]\d{9}$/, 'Invalid mobile number')
    .optional(),
  reference: z.string().optional(),
  referenceMobileNumber: z.string()
    .regex(/^[6-9]\d{9}$/, 'Invalid mobile number')
    .optional(),
  residentAddress: z.string().min(1, 'Address is required'),
  aadharNo: z.string()
    .regex(/^\d{12}$/, 'Aadhar number must be 12 digits'),
  pancardNo: z.string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN card number'),
  GSTnumber: z.string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GST number')
    .optional(),
  aadharPhoto: z.any().optional(),
  panCardPhoto: z.any().optional(), 
  customerPhoto: z.any().optional(),
  sites: z.array(siteSchema)
});

export type CustomerFormData = z.infer<typeof customerSchema>;
export type PrizefixData = z.infer<typeof prizefixSchema>;
export type SiteData = z.infer<typeof siteSchema>;
