export type PricingType = "PER_PERSON" | "PER_TRIP" | "CUSTOM";

export type TourCategory =
  | "PENINSULA"
  | "WINELANDS"
  | "CITY"
  | "CULTURE"
  | "GARDEN_ROUTE"
  | "TRANSFER"
  | "SAFARI"
  | "PRIVATE"
  | "NATURE";

export interface TourSummary {
  slug: string;
  title: string;
  shortDescription: string;
  duration: string;
  basePriceCents: number;
  pricingType: PricingType;
  category: TourCategory;
  featured: boolean;
  heroImage: string;
  cardNote: string | null;
  tags: string[];
}

export interface TourDetail extends TourSummary {
  fullDescription: string;
  minimumGuests: number;
  maximumGuests: number;
  locations: string[];
  highlights: string[];
  included: string[];
  excluded: string[];
  itinerary: string[];
  faqs: string[];
  pickupAvailable: boolean;
  bannerImage: string | null;
  seoTitle: string;
  seoDescription: string;
}

export interface BookingResponse {
  reference: string;
  status: string;
  tourTitle: string;
  travelDate: string;
  guests: number;
  totalAmountCents: number;
  amountPaidCents: number;
  message: string;
}

export interface TripPlanningResponse {
  reference: string;
  status: string;
  message: string;
}

export interface CustomerTrip {
  greeting: string;
  title: string;
  dateRange: string;
  paymentStatus: string;
  pickupDetails: string;
  guide: string;
  driver: string;
  vehicle: string;
  itinerary: Array<{
    date: string;
    items: Array<{ time: string; title: string; detail: string }>;
  }>;
  documents: string[];
  support: string;
}

export interface OperationsDashboard {
  bookingsToday: number;
  awaitingPayment: number;
  confirmedBookings: number;
  enquiries: number;
  revenueCents: number;
  activeGuides: number;
  activeVehicles: number;
  newEnquiries: number;
  privateTripRequests: number;
  inspectionsAwaitingReview: number;
  openVehicleRestrictions: number;
}

export interface OperationsBooking {
  reference: string;
  guest: string;
  tour: string;
  travelDate: string;
  guests: number;
  totalAmountCents: number;
  amountPaidCents: number;
  status: string;
  guide: string;
  vehicle: string;
  email: string;
  phone: string | null;
  country: string | null;
  pickupLocation: string | null;
  notes: string | null;
  registeredCustomer: boolean;
  createdAt: string;
  version: number;
  bookingType: "TOUR" | "PRIVATE_TRIP";
  driver: string;
  assignmentStatus: AssignmentStatus | null;
}

export interface PageResult<T> { content: T[]; number: number; totalPages: number; totalElements: number; }
export interface Session { authenticated: boolean; email: string | null; name: string | null; role: "ADMIN" | "STAFF" | "CUSTOMER" | "DRIVER" | null; }
export type TourStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export interface AdminTour { id: string; version: number; status: TourStatus; displayOrder: number; cardNote: string | null; detail: TourDetail; }
export interface SaveTour extends Omit<TourDetail, "cardNote"> { version: number; status: TourStatus; displayOrder: number; cardNote: string | null; }
export interface AdminCustomer { name: string; email: string; phone: string | null; registered: boolean; bookingCount: number; totalAmountCents: number; lastLoginAt: string | null; activeSessions: number; }
export type EnquiryStatus = "NEW" | "IN_PROGRESS" | "AWAITING_CUSTOMER" | "CONVERTED" | "CLOSED";
export type EnquirySource = "CONTACT_FORM" | "TRIP_PLANNER" | "PRIVATE_TRIP_QUOTE";
export type EnquiryType = "GENERAL" | "TOUR" | "PRIVATE_TRIP";
export interface EnquiryReceipt { reference: string; status: EnquiryStatus; message: string; duplicate: boolean; }
export interface EnquirySummary {
  reference: string; source: EnquirySource; type: EnquiryType; status: EnquiryStatus; customerName: string; customerEmail: string;
  customerPhone: string | null; messagePreview: string; tourTitle: string | null; requestedDate: string | null; passengers: number | null; createdAt: string;
}
export interface EnquiryDetail {
  reference: string; version: number; source: EnquirySource; type: EnquiryType; status: EnquiryStatus; customerName: string; customerEmail: string;
  customerPhone: string | null; message: string; tourSlug: string | null; tourTitle: string | null; requestedDate: string | null; requestedTime: string | null;
  durationMinutes: number | null; pickupLocation: string | null; destination: string | null; passengers: number | null;
  convertedBookingReference: string | null; allowedStatuses: EnquiryStatus[]; notes: Array<{ author: string; body: string; createdAt: string }>;
  createdAt: string; updatedAt: string;
}

// Fleet, drivers, assignments and inspections
export type VehicleCategory = "SEDAN" | "SUV" | "VAN" | "LUXURY_VAN" | "MINIBUS" | "COACH";
export type OperationalStatus = "ACTIVE" | "OUT_OF_SERVICE" | "RETIRED";
export type ListingStatus = "LISTED" | "HIDDEN";
export type RestrictionType = "SAFETY" | "MAINTENANCE";
export interface VehicleRestriction {
  id: string; version: number; type: RestrictionType; reason: string; sourceInspectionId: string | null; openedBy: string; openedAt: string;
  clearedBy: string | null; clearedAt: string | null; clearanceNote: string | null;
}
export interface VehicleImage { id: string; mediaId: string; url: string; altText: string; sortOrder: number; }
export interface VehicleSummary {
  id: string; registration: string; displayName: string; category: VehicleCategory; capacity: number; luggageCapacity: number | null;
  operationalStatus: OperationalStatus; listingStatus: ListingStatus; openRestrictions: VehicleRestriction[]; imageUrl: string | null; hourlyRateCents: number | null;
}
export interface VehicleDetail extends Omit<VehicleSummary, "openRestrictions" | "imageUrl"> {
  version: number; publicDescription: string | null; operatingNotes: string | null; notes: string | null; minimumMinutes: number | null;
  amenities: string[]; images: VehicleImage[]; restrictions: VehicleRestriction[];
}
export type SaveVehicle = Omit<VehicleDetail, "id" | "images" | "restrictions">;
export type DriverVerification = "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
export type DriverDocumentType = "DRIVING_LICENCE" | "PRDP" | "IDENTITY_DOCUMENT" | "OTHER";
export interface DriverSummary {
  id: string; name: string; contact: string | null; email: string | null; accountEnabled: boolean; status: "ACTIVE" | "INACTIVE";
  verificationStatus: DriverVerification; licenceExpiresOn: string | null; prdpExpiresOn: string | null; eligibilityProblems: string[]; documentsAwaitingReview: number;
}
export interface DriverDocument {
  id: string; version: number; type: DriverDocumentType; mediaId: string; contentType: string; expiresOn: string | null;
  status: "PENDING_REVIEW" | "ACCEPTED" | "REJECTED"; reviewNotes: string | null; reviewedBy: string | null; reviewedAt: string | null; createdAt: string;
}
export interface DriverDetail {
  id: string; version: number; name: string; contact: string | null; email: string | null; accountEnabled: boolean; status: "ACTIVE" | "INACTIVE";
  notes: string | null; verificationStatus: DriverVerification; verificationNotes: string | null; verifiedBy: string | null; verifiedAt: string | null;
  licenceNumber: string | null; licenceExpiresOn: string | null; prdpExpiresOn: string | null; eligibilityProblems: string[]; documents: DriverDocument[];
}
export type AssignmentStatus = "SCHEDULED" | "AWAITING_RELEASE" | "RELEASED" | "RETURNED" | "CLOSED" | "CANCELLED";
export interface AdminAssignment {
  id: string; version: number; status: AssignmentStatus; bookingReference: string; bookingType: string; title: string; startsAt: string; endsAt: string;
  blockedUntil: string; passengers: number; vehicleId: string | null; vehicleName: string | null; registration: string | null; driverId: string | null;
  driverName: string | null; collectionState: string; returnState: string;
}
export interface ResourceOption { id: string; name: string; detail: string | null; available: boolean; reasons: string[]; }
export interface ResourceOptions { vehicles: ResourceOption[]; drivers: ResourceOption[]; turnaroundMinutes: number; }
export type ChecklistItem = string;
export type FuelLevel = "EMPTY" | "QUARTER" | "HALF" | "THREE_QUARTERS" | "FULL";
export interface ChecklistDefinition { item: ChecklistItem; label: string; safetyCritical: boolean; }
export interface ChecklistLine { item: ChecklistItem; label: string; result: "OK" | "DEFECT"; severity: "MINOR" | "SAFETY" | null; note: string | null; }
export interface InspectionView {
  id: string; version: number; type: "COLLECTION" | "RETURN"; assignmentId: string; driverId: string; driverName: string; vehicleId: string; vehicleName: string;
  registration: string; submittedBy: string; submittedAt: string; odometerKm: number; fuelLevel: FuelLevel; notes: string | null; checklist: ChecklistLine[];
  hasDefect: boolean; hasSafetyDefect: boolean; selfieUrl: string | null; photos: Array<{ mediaId: string; url: string; kind: "VEHICLE" | "DEFECT"; checklistItem: string | null }>;
  reviewStatus: "PENDING_REVIEW" | "APPROVED" | "REJECTED"; reviewedBy: string | null; reviewedAt: string | null; reviewNotes: string | null;
}
export interface InspectionComparison {
  assignmentId: string; assignmentStatus: AssignmentStatus; collection: InspectionView | null; returned: InspectionView | null; distanceKm: number | null;
  fuelChangePercent: number | null; newlyReportedDefects: ChecklistLine[]; persistingDefects: ChecklistLine[];
}
export interface PendingReview {
  inspectionId: string; type: "COLLECTION" | "RETURN"; assignmentId: string; bookingReference: string; driverName: string; vehicleName: string;
  submittedAt: string; hasDefect: boolean; hasSafetyDefect: boolean;
}

// Driver portal
export interface DriverProfile { name: string; verificationStatus: DriverVerification; licenceExpiresOn: string | null; prdpExpiresOn: string | null; eligibilityProblemsToday: string[]; }
export interface DriverAssignmentSummary {
  id: string; status: AssignmentStatus; bookingReference: string; title: string; startsAt: string; endsAt: string; pickupLocation: string | null;
  passengers: number; vehicleName: string | null; registration: string | null; nextAction: string;
}
export interface DriverStep { state: string; submittedAt: string | null; odometerKm: number | null; fuelLevel: FuelLevel | null; photoUrls: string[]; }
export interface DriverAssignmentDetail {
  id: string; status: AssignmentStatus;
  trip: { bookingReference: string; type: string; title: string; startsAt: string; endsAt: string; pickupLocation: string | null; dropOff: string | null;
    itinerary: string[]; passengers: number; customerName: string; customerPhone: string | null; specialRequests: string | null };
  vehicle: { displayName: string; registration: string; category: VehicleCategory; capacity: number; luggageCapacity: number | null; amenities: string[];
    operatingNotes: string | null; imageUrl: string | null };
  collection: DriverStep; returned: DriverStep; blockers: string[]; nextAction: string; canCollect: boolean; canReturn: boolean; minimumVehiclePhotos: number;
}
export interface SubmissionResult { inspectionId: string; type: "COLLECTION" | "RETURN"; assignmentStatus: AssignmentStatus; outcome: string; }

// Private trips and pricing
export interface FeeLine { name: string; type: "FIXED" | "PER_BILLABLE_HOUR"; amountCents: number; totalCents: number; }
export interface PriceQuote {
  hourlyRateCents: number | null; rateSource: "VEHICLE" | "CATEGORY" | "MANUAL"; sampleRate: boolean; requestedMinutes: number; minimumMinutes: number;
  billableMinutes: number; incrementMinutes: number; minimumApplied: boolean; roundedUp: boolean; baseCents: number; fees: FeeLine[]; feesCents: number; totalCents: number;
}
export interface VehicleCard {
  id: string; name: string; category: VehicleCategory; capacity: number; luggageCapacity: number | null; amenities: string[]; description: string | null;
  imageUrl: string | null; imageAlt: string; hourlyRateCents: number | null; minimumMinutes: number | null; sampleRate: boolean; quote: PriceQuote | null;
  quoteOnlyReason: string | null;
}
export interface PricingDisclosures {
  billingIncrementMinutes: number; includedKmPerHour: number | null; excessKmRateCents: number | null; overtimeHourlyRateCents: number | null;
  fees: Array<{ name: string; type: "FIXED" | "PER_BILLABLE_HOUR"; amountCents: number }>; sampleRatesShown: boolean;
}
export interface PrivateTripSearch { startsAt: string; endsAt: string; durationMinutes: number; passengers: number; vehicles: VehicleCard[]; disclosures: PricingDisclosures; }
export interface PrivateTripReceipt { reference: string; status: string; message: string; quote: PriceQuote; startsAt: string; endsAt: string; vehicleName: string | null; duplicate: boolean; }
export interface AdminPrivateTrip {
  reference: string; bookingVersion: number; status: string; customerName: string; customerEmail: string; customerPhone: string | null; passengers: number;
  startsAt: string; endsAt: string; durationMinutes: number; pickupLocation: string | null; destination: string; specialRequests: string | null;
  requestedVehicleId: string | null; requestedVehicleName: string | null; requestedCategory: VehicleCategory; quote: PriceQuote; assignment: AdminAssignment | null;
}
export interface PricingView {
  settings: { version: number; turnaroundMinutes: number; billingIncrementMinutes: number; includedKmPerHour: number | null; excessKmRateCents: number | null;
    overtimeHourlyRateCents: number | null; updatedBy: string; updatedAt: string };
  rates: Array<{ category: VehicleCategory; version: number; hourlyRateCents: number | null; minimumMinutes: number; rateStatus: "SAMPLE" | "LIVE"; updatedBy: string; updatedAt: string }>;
  fees: Array<{ id: string; version: number; name: string; type: "FIXED" | "PER_BILLABLE_HOUR"; amountCents: number; active: boolean; sortOrder: number }>;
  sampleRatesShownPublicly: boolean;
}
export interface SiteImage { id: string; version: number; slot: "HOME_HERO" | "GALLERY"; url: string; altText: string; title: string | null; subtitle: string | null; body: string | null; sortOrder: number; active: boolean; }
