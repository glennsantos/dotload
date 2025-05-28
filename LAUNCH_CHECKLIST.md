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
- [ ] Allow saving of branding elements in the database (logo, header image)
- [ ] add seller plans placeholder : see setting > billings

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
- [ ] add stock and pricing for physical products (see image)
- [ ] in advanced options, add product variants, advanced inventory, etc (see image)
- [x] product description should be formatted html

## Checkout
- [ ] add support for other currencies 


## Site Setup
- [x] Attach domain to dev server
- [x] Create SSL cert for dev server via Letsencrypt.
- [x] Convert SES to prod setup
- [ ] check SES if connected
- [x] check domain if connected
- [x] Change from email for alacart in .env files
- [x] Change other emails as needed
- [ ] clean up front end console.logs

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

## Craft GTM

- [ ] Determine marketing activities to execute
- [ ] Get funds for those activities
- [ ] Execute those activities with a marketing person

## Calculate Financials
- [x] Create napkin computation to determine revenue targets
- [ ] Assess costs for the service
- [ ] Get initial funding for costs

# POST LAUNCH ITEMS

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