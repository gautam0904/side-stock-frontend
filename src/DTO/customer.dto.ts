export interface ICustomer {
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
    GSTnumber?: string;
    panCardNumber?: string;
    date?: string;
    billTo?: string;
    billingAddress?: string;
    sites?: ISite[];
}

export interface ISite {
    siteName?: string;
    siteAddress?: string;
    siteSuperwiserName?: string;
    siteSuperwiserNumber?: string;
    challanNumber: string;
    prizefix?: IPrizefix[];
}

export interface IPrizefix {
    productName?: string;
    size?: string;
    rate: number;
}
