# Todo List

- [x] **Database Schema Update**
  - [x] Update `prisma/schema.prisma` to include structured fields for `square_meters`, `floor`, `has_elevator`, `box_count`.
  - [ ] **ACTION REQUIRED:** Run `npx prisma migrate dev --name add_lead_details` manually.

- [x] **Admin Dashboard Enhancements**
  - [x] **Lead Detail View (`/hallinta/liidit/[id]`)**
    - [x] Display the new structured fields (sqm, floor, elevator, boxes) in the "Move Details" card.
    - [x] Implement "Edit" functionality to update lead details directly from the admin view.
    - [x] Add ability to change status directly from the detail view.
  - [x] **Leads List (`/hallinta/liidit`)**
    - [ ] Add filtering (by status, date range).
    - [x] Add pagination to the `UniversalTable` (basic implementation done, needs logic).

- [x] **Public Quote Form Improvements**
  - [x] **Step 2 (Move Details)**
    - [x] Ensure Step 2 captures any remaining details or moves strictly to contact info/summary.
    - [x] Review `Step2.tsx` for consistency with new Step 1 fields.
  - [x] **Validation**
    - [x] Strengthen client-side validation for the new fields in `Step1.tsx`.

- [x] **Backend Logic**
  - [x] Update `src/app/api/submit/route.ts` to map the new form fields to the new database columns.
  - [x] Ensure email notifications/Discord alerts include these new details.

- [ ] **UI/UX Polish**
  - [ ] Verify responsive behavior of the new Admin Sidebar on mobile.
  - [ ] Test the "UniversalTable" with larger datasets.
