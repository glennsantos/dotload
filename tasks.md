# Tasks for Frontend Redesign

reference repo: /home/aryeh/dev/alacart.store

## Create Product Page Redesign

1. **Implement Product Type Selection UI** ✅
   - Task ID: 6.1
   - Description: Update the product type selection UI with Digital Product and Physical Product options as shown in the design.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify the product type selection UI matches the design and correctly updates the product type.

2. **Implement Product Information Form** ✅
   - Task ID: 6.2
   - Description: Update the product information form with name, description, custom URL, and price fields as shown in the design.
   - Dependencies: 6.1
   - Priority: High
   - Test Strategy: Verify all form fields work correctly and validate input.

3. **Implement Thumbnail & Previews Section** ✅
   - Task ID: 6.3
   - Description: Create the thumbnail upload section with preview functionality.
   - Dependencies: 6.2
   - Priority: High
   - Test Strategy: Test image upload and preview functionality.

4. **Implement Digital Files Upload Section** ✅
   - Task ID: 6.4
   - Description: Create the digital files upload section with file selection and preview.
   - Dependencies: 6.3
   - Priority: High
   - Test Strategy: Test file upload functionality and verify file size limits.

5. **Implement Advanced Options Tab** ✅
   - Task ID: 6.5
   - Description: Create the Advanced Options tab with download settings, what's included section, course curriculum, product badges, and trust indicators.
   - Dependencies: 6.4
   - Priority: High
   - Test Strategy: Verify all advanced options work correctly and save to the database.

6. **Implement Product Preview Panel** ✅
   - Task ID: 6.6
   - Description: Create the product preview panel that updates in real-time as the user enters information.
   - Dependencies: 6.2, 6.3
   - Priority: High
   - Test Strategy: Verify the preview updates correctly as user enters information.

7. **Update API to Handle New Product Fields** ✅
   - Task ID: 6.7
   - Description: Update the product creation API to handle the new fields from the form (download limits, badges, trust indicators, etc.).
   - Dependencies: 6.5
   - Priority: High
   - Test Strategy: Test API with various product configurations and verify data is saved correctly.

8. **Update Database Schema for New Product Fields** ✅
   - Task ID: 6.8
   - Description: Add new columns to the Product table for download settings, badges, and trust indicators.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify the database schema changes and test with sample data.

9. **Implement Form Validation** ✅
   - Task ID: 6.9
   - Description: Add client-side validation for all form fields with appropriate error messages.
   - Dependencies: 6.2, 6.5
   - Priority: Medium
   - Test Strategy: Test form validation with various input scenarios.

10. **Integrate Existing Digital Files Upload Component** ✅
    - Task ID: 6.14
    - Description: Use the existing ContentUpload.tsx component from /app/products/new/ for the Digital Files section.
    - Dependencies: 6.4
    - Priority: High
    - Test Strategy: Test file upload functionality with various file types and sizes.

11. **Update Product Badges Display in Preview** ✅
    - Task ID: 6.15
    - Description: Move product badges to appear below the image in the product preview as shown in the design.
    - Dependencies: 6.6
    - Priority: Medium
    - Test Strategy: Verify badges appear correctly in the preview and match the design.

12. **Convert Badges and Trust Indicators to Toggles** ✅
    - Task ID: 6.16
    - Description: Update the badges and trust indicators in Advanced Options to use toggle switches instead of checkboxes.
    - Dependencies: 6.5
    - Priority: Medium
    - Test Strategy: Test toggle functionality and verify state is saved correctly.

13. **Format HTML in Product Description Preview** ✅
    - Task ID: 6.17
    - Description: Ensure the product description in the preview panel renders formatted HTML from the rich text editor.
    - Dependencies: 6.2, 6.6
    - Priority: Medium
    - Test Strategy: Verify HTML formatting is preserved in the preview.

14. **Add Stock & Pricing for Physical Products** ✅
    - Task ID: 6.18
    - Description: Implement stock quantity management for physical products with unlimited toggle option.
    - Dependencies: 6.1, 6.2
    - Priority: High
    - Test Strategy: Test stock quantity input and unlimited toggle functionality.

15. **Add Custom Trust Indicators with Thumbs Up Icon** ✅
    - Task ID: 6.19
    - Description: Update custom trust indicators to use thumbs up icon instead of lock icon.
    - Dependencies: 6.5, 6.16
    - Priority: Medium
    - Test Strategy: Verify custom trust indicators display correctly with thumbs up icon.

16. **Add Product Variants for Physical Products** ✅
    - Task ID: 6.20
    - Description: Implement product variants feature for physical products to allow options like size, color, or material.
    - Dependencies: 6.18
    - Priority: High
    - Test Strategy: Test adding, editing, and removing variants and options.

17. **Add Advanced Inventory Management** ✅
    - Task ID: 6.21
    - Description: Implement advanced inventory options including pre-orders for physical products.
    - Dependencies: 6.18
    - Priority: Medium
    - Test Strategy: Test pre-order toggle functionality and verify state is saved correctly.

18. **Add Shipping & Fulfillment Section** ✅
    - Task ID: 6.22
    - Description: Add shipping and fulfillment section for physical products with coming soon features.
    - Dependencies: 6.18
    - Priority: Medium
    - Test Strategy: Verify section displays correctly for physical products only.

16. **Set Default Currency to PHP** ✅
    - Task ID: 6.10
    - Description: Ensure the default currency is set to PHP in the currency dropdown.
    - Dependencies: 6.2
    - Priority: Low
    - Test Strategy: Verify PHP is selected by default in the currency dropdown.

17. **Implement Responsive Design** 
    - Task ID: 6.11
    - Description: Ensure the create product page is responsive across all device sizes.
    - Dependencies: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
    - Priority: Medium
    - Test Strategy: Test the page on various device sizes and verify UI adapts correctly.

18. **Implement New Product Page Design** ✅
    - Task ID: 6.23
    - Description: Update the public product page to match the new design with Live Preview header, product badges, bonus materials, perfect for section, user feedback, and trust indicators.
    - Dependencies: None
    - Priority: High
    - Test Strategy: Verify the product page matches the design and displays all product information correctly.

19. **Improve Product Page with Dynamic Content** ✅
    - Task ID: 6.24
    - Description: Enhance the product page to display the seller's brand name and logo, align description to the left, load custom badges and trust indicators, and use the product's whatsIncluded data.
    - Dependencies: 6.23
    - Priority: High
    - Test Strategy: Verify the product page correctly displays dynamic content from the database.

16. **Implement Create Product Button Functionality** ✅
    - Task ID: 6.12
    - Description: Update the create product button to submit the form and handle loading states.
    - Dependencies: 6.7, 6.9
    - Priority: High
    - Test Strategy: Test product creation flow end-to-end.

17. **Implement Cancel Button Functionality** ✅
    - Task ID: 6.13
    - Description: Update the cancel button to discard changes and return to products page.
    - Dependencies: None
    - Priority: Low
    - Test Strategy: Verify cancel functionality works correctly.


## Auth Pages

1. **Redesign Login Form** ✅
   - Task ID: 1.1
   - Description: Update the login form to match the new design language.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify the login form UI matches design specifications.

2. **Redesign Registration Form** ✅
   - Task ID: 1.2
   - Description: Update the registration form to match the new design language.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify the registration form UI matches design specifications.

3. **Redesign Forgot Password Form** ✅
   - Task ID: 1.2.1
   - Description: Update the forgot password form to match the new design language.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify the forgot password form UI matches design specifications.

4. **Ensure Typography Consistency - Auth Pages** ✅
   - Task ID: 1.3
   - Description: Ensure consistent typography on auth pages.
   - Dependencies: 1.1, 1.2, 1.2.1
   - Priority: Medium
   - Test Strategy: Check typography consistency on all auth pages.

5. **Ensure Color Scheme Consistency - Auth Pages** ✅
   - Task ID: 1.4
   - Description: Ensure consistent color schemes on auth pages.
   - Dependencies: 1.3
   - Priority: Medium
   - Test Strategy: Check color consistency on all auth pages.

6. **Update Buttons - Auth Pages** ✅
   - Task ID: 1.5
   - Description: Update buttons on auth pages to align with design specs.
   - Dependencies: 1.4
   - Priority: Medium
   - Test Strategy: Verify all buttons are updated and functional.

7. **Update Input Fields - Auth Pages** ✅
   - Task ID: 1.6
   - Description: Update input fields on auth pages to align with design specs.
   - Dependencies: 1.5
   - Priority: Medium
   - Test Strategy: Verify all input fields are updated and functional.

8. **Implement Responsive Design - Login Form** ✅
   - Task ID: 1.7
   - Description: Ensure the login form is responsive across devices.
   - Dependencies: 1.1
   - Priority: High
   - Test Strategy: Test login form on multiple devices and screen sizes.

9. **Implement Responsive Design - Registration Form** ✅
   - Task ID: 1.8
   - Description: Ensure the registration form is responsive across devices.
   - Dependencies: 1.2
   - Priority: High
   - Test Strategy: Test registration form on multiple devices and screen sizes.

10. **Implement Responsive Design - Forgot Password Form** ✅
    - Task ID: 1.9
    - Description: Ensure the forgot password form is responsive across devices.
    - Dependencies: 1.2.1
    - Priority: High
    - Test Strategy: Test forgot password form on multiple devices and screen sizes.

11. **Remove Top Navigation from Auth Pages** ✅
    - Task ID: 1.10
    - Description: Remove the top navigation from all auth pages (login, register, forgot password).
    - Dependencies: 1.1, 1.2, 1.2.1
    - Priority: High
    - Test Strategy: Verify top navigation is removed from all auth pages.

## Products Dashboard

1. **Revamp Dashboard Header** ✅
   - Task ID: 2.1
   - Description: Update the dashboard header to enhance visual appeal with welcome message and action buttons (Create Product, Settings, Logout).
   - Dependencies: None
   - Priority: High
   - Test Strategy: Validate header changes with design specifications.

2. **Implement Horizontal Tab Menu** ✅
   - Task ID: 2.2
   - Description: Replace sidebar with horizontal tab menu (Overview, Sales, Products, Promos, Customers).
   - Dependencies: 2.1
   - Priority: High
   - Test Strategy: Verify menu functionality and responsive behavior.

3. **Update Dashboard Stats Cards** ✅
   - Task ID: 2.3
   - Description: Create new stats cards with icons for Total Products, Total Sales, and Total Revenue.
   - Dependencies: 2.2
   - Priority: Medium
   - Test Strategy: Verify stats cards display correct data with appropriate styling.

4. **Implement Recent Sales Section** ✅
   - Task ID: 2.4
   - Description: Add Recent Sales section with empty state message when no sales exist.
   - Dependencies: 2.3
   - Priority: Medium
   - Test Strategy: Test with both empty state and with sales data.

5. **Move User Menu Items to Main Header** ✅
   - Task ID: 2.5
   - Description: Move Settings and Logout from user dropdown to main header as buttons.
   - Dependencies: 2.1
   - Priority: Medium
   - Test Strategy: Verify functionality of relocated buttons.

6. **Update Product Cards** ✅
   - Task ID: 2.6
   - Description: Integrate new card components for product display.
   - Dependencies: 2.2
   - Priority: Medium
   - Test Strategy: Ensure product cards are styled correctly.

7. **Update Navigation Elements** ✅
   - Task ID: 2.7
   - Description: Update navigation elements to reflect new design.
   - Dependencies: 2.3
   - Priority: Medium
   - Test Strategy: Verify navigation is intuitive and matches design.

8. **Ensure Consistent Styling for Interactive Elements** ✅
   - Task ID: 2.5
   - Description: Style all interactive elements consistently with new design.
   - Dependencies: 2.4
   - Priority: Medium
   - Test Strategy: Check consistency across the dashboard.

6. **Cross-Browser Testing - Dashboard** ✅
   - Task ID: 2.6
   - Description: Test dashboard across different browsers for design fidelity.
   - Dependencies: 2.5
   - Priority: High
   - Test Strategy: Perform cross-browser testing to ensure compatibility.

7. **Cross-Device Testing - Dashboard** ✅
   - Task ID: 2.7
   - Description: Test dashboard on multiple devices for design fidelity.
   - Dependencies: 2.6
   - Priority: High
   - Test Strategy: Perform cross-device testing to ensure compatibility.

## Dashboard Pages Implementation

1. **Implement Sales Page** ✅
   - Task ID: 3.1
   - Description: Create a sales page that displays transaction data from /transactions.
   - Dependencies: 2.2
   - Priority: High
   - Test Strategy: Verify transaction data is displayed correctly and the page is responsive.

2. **Implement Promos Page** ✅
   - Task ID: 3.2
   - Description: Create a promos page that lists all discount codes made by the user across all products.
   - Dependencies: 2.2
   - Priority: High
   - Test Strategy: Verify discount codes are displayed correctly and the page is responsive.

3. **Implement Customers Page** ✅
   - Task ID: 3.3
   - Description: Create a customers page that lists customer names, number of purchases, total spend, and latest purchase date.
   - Dependencies: 2.2
   - Priority: High
   - Test Strategy: Verify customer data is displayed correctly and the page is responsive.

4. **Fix Customer Data API** ✅
   - Task ID: 3.4
   - Description: Fix the customers API to properly display customer data when there are sales but no customers.
   - Dependencies: 3.3
   - Priority: High
   - Test Strategy: Verify customer data is displayed correctly when there are sales.

5. **Fix Logout Handling** ✅
   - Task ID: 3.5
   - Description: Ensure logout functionality works correctly across all dashboard pages.
   - Dependencies: 3.1, 3.2, 3.3
   - Priority: High
   - Test Strategy: Test logout functionality from each dashboard page.

## Design Refinements

1. **Update Toolbar Design** ✅
   - Task ID: 4.1
   - Description: Match the design of the toolbar in the reference image.
   - Dependencies: 2.2
   - Priority: Medium
   - Test Strategy: Compare with reference design for visual consistency.

## Styling Updates

1. **Update Font Styling** ✅
   - Task ID: 5.1
   - Description: Update the font family, weights, and sizes to match the reference design.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify font consistency across the application.

2. **Update Button Styling** ✅
   - Task ID: 5.2
   - Description: Update button styling to match the reference design with emerald accents, proper rounding, and hover states.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify buttons match the reference design across all states (default, hover, focus, disabled).

3. **Update Card Styling** ✅
   - Task ID: 5.3
   - Description: Update card styling to match the reference design with proper shadows, borders, and rounded corners.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify cards match the reference design in all contexts.

4. **Update Input Styling** ✅
   - Task ID: 5.4
   - Description: Update input field styling to match the reference design with proper borders, focus states, and placeholders.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify input fields match the reference design across all states.

5. **Update Modal Styling** ✅
   - Task ID: 5.5
   - Description: Update modal styling to match the reference design with proper shadows, borders, and animations.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify modals match the reference design in all contexts.

6. **Ensure Consistent Color Palette**✅
   - Task ID: 5.6
   - Description: Update the color palette in globals.css and tailwind.config.ts to match the reference design.
   - Dependencies: 5.1, 5.2, 5.3, 5.4, 5.5
   - Priority: High
   - Test Strategy: Verify color consistency across the application.

7. **Test Styling Across All Pages** ✅
   - Task ID: 5.7
   - Description: Test the updated styling across all pages to ensure consistency.
   - Dependencies: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
   - Priority: High
   - Test Strategy: Verify styling consistency across all pages and components.

2. **Refine Card Styling** ✅
   - Task ID: 4.2
   - Description: Update cards to have lighter outlines with a slight shadow at the bottom.
   - Dependencies: 2.3
   - Priority: Medium
   - Test Strategy: Verify card styling across all dashboard pages.

3. **Update Background Color** ✅
   - Task ID: 4.3
   - Description: Change background to be slightly gray for better contrast.
   - Dependencies: None
   - Priority: Low
   - Test Strategy: Check background color across all pages for consistency.

4. **Standardize Button Styling** ✅
   - Task ID: 4.4
   - Description: Ensure all buttons match the design in the reference image.
   - Dependencies: None
   - Priority: Medium
   - Test Strategy: Verify button styling consistency across all pages.

## Final UI Refinements

1. **Redirect to Login After Logout** ✅
   - Task ID: 5.1
   - Description: After logout, redirect users to the login page instead of the home page.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Test logout functionality from different pages.

2. **Remove Top Navigation Bar** ✅
   - Task ID: 5.2
   - Description: Remove the top navigation bar from the layout to match the design.
   - Dependencies: None
   - Priority: Medium
   - Test Strategy: Verify the top navigation is removed across all pages.

3. **Standardize Button Styling** ✅
   - Task ID: 5.3
   - Description: Ensure ALL buttons follow the styling of the buttons in the login page.
   - Dependencies: None
   - Priority: Medium
   - Test Strategy: Check button styling consistency across all pages.

4. **Add Purchases Menu and Page** ✅
   - Task ID: 5.4
   - Description: Add a Purchases menu item to the dashboard tabs and create a purchases page to display the user's purchases.
   - Dependencies: None
   - Priority: Medium
   - Test Strategy: Verify the purchases page displays user purchases correctly with pagination.

5. **Improve Products Page UI** ✅
   - Task ID: 5.5
   - Description: Remove search bar from products page and move create product button to same row as Your Products heading.
   - Dependencies: None
   - Priority: Medium
   - Test Strategy: Verify the products page layout is improved and more intuitive.

6. **Show All Menu Items** ✅
   - Task ID: 5.6
   - Description: Show all navigation tabs regardless of whether the user has products.
   - Dependencies: None
   - Priority: Medium
   - Test Strategy: Verify that all tabs are visible for all users.

## Product Editing Functionality

1. **Implement Edit Product Functionality**
   - Task ID: 8.1
   - Description: When a product is clicked on /products, it should open the /edit-product/[id] page, loading the details of that product so it can be edited.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify that clicking on a product in the products list redirects to the edit page with all product details loaded correctly.

2. **Enhance Product Editing Experience** ✅
   - Task ID: 8.2
   - Description: Improve the product editing functionality by restoring the original menu design, loading product photos and files, displaying badges and trust indicators correctly, and ensuring all product data is properly loaded in both the form and preview.
   - Dependencies: 8.1
   - Priority: High
   - Test Strategy: Test editing various product types and verify all data is correctly loaded and displayed.
   - Implementation:
     - Restored original menu design with green background for active tab
     - Ensured product photos are displayed in the form
     - Added support for displaying existing files in the form
     - Fixed infinite loop in useEffect dependencies
     - Ensured badges (including custom ones) load correctly in both form and preview

## Settings Pages Redesign

1. **Create Settings Layout with Tabs** ✅
   - Task ID: 7.1
   - Description: Create a settings layout with tabs for Account, Brand Settings, and Billing.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify the tabs navigation works correctly and matches the design.

2. **Add Back to Dashboard Link** ✅
   - Task ID: 7.2
   - Description: Add a back to dashboard link at the top of the settings pages.
   - Dependencies: 7.1
   - Priority: Medium
   - Test Strategy: Verify the back link works correctly and navigates to the dashboard.

3. **Implement Account Settings Page** ✅
   - Task ID: 7.3
   - Description: Create the account settings page with user information and password change functionality.
   - Dependencies: 7.1
   - Priority: High
   - Test Strategy: Test updating user information and changing password.

4. **Implement Brand Settings Page** ✅
   - Task ID: 7.4
   - Description: Create the brand settings page with brand name, description, logo, and header image upload.
   - Dependencies: 7.1
   - Priority: High
   - Test Strategy: Test updating brand information and uploading images.

5. **Implement Billing Page** ✅
   - Task ID: 7.5
   - Description: Create the billing page with current plan, payment method, and billing history sections.
   - Dependencies: 7.1
   - Priority: High
   - Test Strategy: Verify the billing page UI matches the design (frontend only).

6. **Update Settings Menu Design** ✅
   - Task ID: 7.6
   - Description: Update the settings menu to use a rounded pill design with active tab highlighted in green.
   - Dependencies: 7.1
   - Priority: Medium
   - Test Strategy: Verify the menu matches the design in the provided image.

7. **Standardize Brand Terminology** ✅
   - Task ID: 7.7
   - Description: Update the registration page and settings pages to consistently use "brand" instead of "store".
   - Dependencies: None
   - Priority: Medium
   - Test Strategy: Verify consistent terminology across the application.

8. **Ensure Brand Assets Load Correctly** ✅
   - Task ID: 7.8
   - Description: Update the API to ensure brand assets (logo, header) saved during registration are correctly loaded in settings.
   - Dependencies: 7.7
   - Priority: High
   - Test Strategy: Test that brand assets are correctly displayed in the settings pages.

9. **Merge Account Settings Forms** ✅
   - Task ID: 7.9
   - Description: Merge the account information and password change forms into a single unified form according to the design.
   - Dependencies: 7.3
   - Priority: Medium
   - Test Strategy: Verify that the form matches the design and both account updates and password changes work correctly.

10. **Ensure User Data Loads in Settings** ✅
    - Task ID: 7.10
    - Description: Update the settings page to ensure user name and email load correctly from the API.
    - Dependencies: 7.9
    - Priority: High
    - Test Strategy: Test that user data is correctly displayed when the settings page loads.

11. **Simplify Account Settings Form** ✅
    - Task ID: 7.11
    - Description: Simplify the account settings form to use a single button that handles both account updates and password changes.
    - Dependencies: 7.9
    - Priority: Medium
    - Test Strategy: Test that account updates and password changes work correctly with a single button.

12. **Clear Password Fields on Load** ✅
    - Task ID: 7.12
    - Description: Ensure password fields are cleared when the settings page loads.
    - Dependencies: 7.11
    - Priority: Low
    - Test Strategy: Verify that password fields are empty when the page loads.
