# POPIA Notes

This is an engineering overview, not legal advice.

## Principles

- Purpose limitation: collect only booking, quotation, trip, and support information needed by SL Tours.
- Data minimisation: avoid collecting passport, ID, medical, or license data unless a specific operational requirement exists.
- Security safeguards: protect staff endpoints, database credentials, backups, logs, and exports.
- Openness: privacy notices should explain what data is collected and why.
- Retention: define how long enquiries, bookings, quotes, payment records, and support messages are kept.
- Data subject rights: plan processes for access, correction, and deletion where legally appropriate.

## Implementation Notes

- Current seed data uses demo identities only.
- Future audit logs should record staff access to customer records.
- Logs must not include passwords, tokens, raw card data, or unnecessary personal details.
- WhatsApp/email integrations should have provider agreements and retention review.

## Operations data (drivers and inspections)

- Driver licence, PrDP and identity documents are collected because South African passenger transport requires a valid licence and PrDP. They are visible to administrators only.
- Collection selfies are an accountability record for vehicle handovers. No biometric processing or facial recognition is performed. Drivers are told this in the portal.
- Inspection photos may show bystanders or number plates; drivers photograph the vehicle only.
- Drivers see a customer's name and phone number only for their own assignments, and no customer email or booking history.
- Retention periods for selfies, inspection photos and driver documents must be decided by SL Tours; see `docs/operations/MEDIA_STORAGE.md`.
