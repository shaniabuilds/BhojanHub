export interface Bill {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  taxAmount: number;
  serviceCharge: number;
  grandTotal: number;
}
