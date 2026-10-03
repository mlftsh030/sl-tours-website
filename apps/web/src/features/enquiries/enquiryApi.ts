import { request } from "../../lib/api";
import { withReferral } from "../../lib/referral";
import type { EnquiryReceipt } from "../../types/api";

export interface EnquiryPayload {
  idempotencyKey: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  message: string;
  enquiryType: "GENERAL" | "TOUR" | "PRIVATE_TRIP";
  tourSlug?: string;
  requestedDate?: string;
  pickupLocation?: string;
  passengers?: number;
}

export const submitEnquiry = (payload: EnquiryPayload) =>
  request<EnquiryReceipt>("/api/v1/enquiries", { method: "POST", body: JSON.stringify(withReferral(payload)) });
