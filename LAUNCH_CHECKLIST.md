# alaCarte Launch Checklist

## Resolve Issues
- [x] fix Request Payout button
- [ ] See issues in Github for more
- [x] Fix user being auto logged out

## UI Redesign v0.1
- [x] Understand the styling of /home/aryeh/dev/alacart.store
- [x] Update the fonts to match the fonts used there
- [x] Update the button styling to match
- [x] Update the card styling to match
- [x] Update the input styling to match
- [x] Update the modal styling to match

## User setup
- [x] Allow saving of branding elements in the database (logo, header image)
- [x] fix user settings page to be same as the one in lovable
  - [x] also needs a back to dashboard button
- [x] add seller plans placeholder : see setting > billings

## Create product
- [X] follow the create product page of /home/aryeh/dev/alacart.store
  - [x] follow the design
  - [x] update the product preview
  - [x] update the advanced options
  - [x] consolidate the inputs into one screen
  - [x] update product types: digital and physical product
- [X] add support for other currencies 
- [x] add part for product content
- [x] add download settings for digital products
- [x] product badges need to appear below the image
- [x] For product badges and trust indicators, turn them into toggles.
- [x] add stock and pricing for physical products (see image)
- [x] in advanced options, add product variants, advanced inventory, etc (see image)
- [x] product description should be formatted html
- [x] replace your store with store name and logo
- [ ] edit product page should just use the create-product form

## Product Page
- [x] Match the design of the product page with the one in the preview

## Checkout
- [ ] add support for other currencies 


## Site Setup
- [x] Attach domain to dev server
- [x] Convert SES to prod setup
- [x] check domain if connected
- [x] Change from email for alacart in .env files
- [x] Change other emails as needed
- [x] Create SSL cert for dev server via Letsencrypt.
- [?] update SES to prod
- [ ] clean up front end console.logs for prod

## Deploy to Dev
- [x] Update code
- [x] Update database
- [x] Update environment variables

## Perform QA Testing
- [ ] Get QA assistance for the rest of the testing
- [ ] Document happy path 
  - [ ] Execute happy path and note any issues
  - [ ] For showstoppers, list and address
  - [ ] For rest, note and address in the future
- [ ] Create tests for other edge cases and unhappy paths
  - [ ] Perform QA for those tests  
- [ ] Assess performance tests for app vs other similar local apps, especially as a buyer
  - [ ] Determine which performance items we will need to address immediately.
- [ ] Execute final smoke testing
- [ ] Get agreement when to launch

## Calculate Financials
- [x] Create napkin computation to determine revenue targets
- [ ] Assess costs for the service
- [ ] Get initial funding for costs

# POST SALE ITEMS

## Craft GTM

- [ ] Determine marketing activities to execute
- [ ] Get funds for those activities
- [ ] Execute those activities with a marketing person

## Support
- [ ] Determine who will handle support issues 
- [ ] Make rough support strategy that is lightweight but also addresses the highest priority issues
- [ ] Create user documentation/FAQs for buyers and sellers
- [ ] Document operational procedures for maintenance
- [ ] Ensure you have proper Terms of Service and Privacy Policy pages

## Analytics and Monitoring
- [ ] Set up analytics to track user behavior and sales
- [ ] Configure error monitoring and alerting
- [ ] Implement uptime monitoring

## Security
- [x] Ensure all environment variables are properly set in production
- [x] Confirm security groups are properly configured
- [x] Review permissions for S3 buckets and other AWS resources
- [ ] Set up automated database backups