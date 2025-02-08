export interface ICutomer {
    _id?: string;
    customerName?: string;
    mobileNumber?: string;
    partnerName?: string;
    partnerMobileNumber?: string;
    reference?: string;
    referenceMobileNumber?: string;
    residentAddress?: string;
    aadharNo?: string;
    pancardNo?: string;
    aadharPhoto?: string;
    panCardPhoto?: string;
    customerPhoto?: string;
    prizefix?: Iprizefix[];
    sites?: ISite[];
    GSTnumber?: string;
    billTo?: string;
    billingAddress?: string;
    date?: string;
}

export interface Iprizefix {
    _id?: string;
    productName?: string;
    size?: string;
    rate?: number;
}


export interface ISite {
    siteName: string;
    siteAddress: string;
    challanNumber: string;
  }