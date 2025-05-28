# Tasks for Frontend Redesign

reference repo: /home/aryeh/dev/alacart.store


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

1. **Update Font Styling**
   - Task ID: 5.1
   - Description: Update the font family, weights, and sizes to match the reference design.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify font consistency across the application.

2. **Update Button Styling**
   - Task ID: 5.2
   - Description: Update button styling to match the reference design with emerald accents, proper rounding, and hover states.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify buttons match the reference design across all states (default, hover, focus, disabled).

3. **Update Card Styling**
   - Task ID: 5.3
   - Description: Update card styling to match the reference design with proper shadows, borders, and rounded corners.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify cards match the reference design in all contexts.

4. **Update Input Styling**
   - Task ID: 5.4
   - Description: Update input field styling to match the reference design with proper borders, focus states, and placeholders.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify input fields match the reference design across all states.

5. **Update Modal Styling**
   - Task ID: 5.5
   - Description: Update modal styling to match the reference design with proper shadows, borders, and animations.
   - Dependencies: None
   - Priority: High
   - Test Strategy: Verify modals match the reference design in all contexts.

6. **Ensure Consistent Color Palette**
   - Task ID: 5.6
   - Description: Update the color palette in globals.css and tailwind.config.ts to match the reference design.
   - Dependencies: 5.1, 5.2, 5.3, 5.4, 5.5
   - Priority: High
   - Test Strategy: Verify color consistency across the application.

7. **Test Styling Across All Pages**
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

4. **Standardize Button Styling** 
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
