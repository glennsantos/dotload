# alaCarte Launch Checklist

## Resolve Issues
*Note: more issues listed in Github*
- [ ] review mobile responsive version
- [ ] Add Actions to products https://private-user-images.githubusercontent.com/1162329/449143984-c1956446-3c39-43e7-ab12-6368091aced2.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDg1OTExMzEsIm5iZiI6MTc0ODU5MDgzMSwicGF0aCI6Ii8xMTYyMzI5LzQ0OTE0Mzk4NC1jMTk1NjQ0Ni0zYzM5LTQzZTctYWIxMi02MzY4MDkxYWNlZDIucG5nP1gtQW16LUFsZ29yaXRobT1BV1M0LUhNQUMtU0hBMjU2JlgtQW16LUNyZWRlbnRpYWw9QUtJQVZDT0RZTFNBNTNQUUs0WkElMkYyMDI1MDUzMCUyRnVzLWVhc3QtMSUyRnMzJTJGYXdzNF9yZXF1ZXN0JlgtQW16LURhdGU9MjAyNTA1MzBUMDc0MDMxWiZYLUFtei1FeHBpcmVzPTMwMCZYLUFtei1TaWduYXR1cmU9YjJmM2Y0MGE5NjQ1MzM0NTMxMTM4ODUwNjFmNWJlNTdmZDdkYmNjNmU1YTViMWIzNmExMTY0NWZkZmE0MzliZCZYLUFtei1TaWduZWRIZWFkZXJzPWhvc3QifQ.VArIgio53RFtd7AJUOxYK6Z70lVQjj_e_zCy6vaZUQs
- [ ] Remove purchases tab
  - [ ] reinstate the hidden download settings. whenever there is a download, that should tick down. the purchase should only be downloadable a fixed number of times
  - [ ] also track link expiration in the purchase
  - [ ] remove the need for the buyer to register 

## Site Setup
- [x] Attach domain to dev server
- [x] Convert SES to prod setup
- [x] check domain if connected
- [x] Change from email for alacart in .env files
- [x] Change other emails as needed
- [x] Create SSL cert for dev server via Letsencrypt.
- [ ] fix SES DKIM
  - [ ] https://repost.aws/knowledge-center/ses-dkim-failing-verification
  - [ ] https://docs.aws.amazon.com/ses/latest/dg/send-email-authentication-dkim.html
- [ ] clean up front end console.logs for prod

## Deploy to Dev
- [x] Update code
- [x] Update database
- [x] Update environment variables

## Perform QA Testing
- [ ] Get QA assistance for the rest of the testing
- [ ] Check marco's alacart github for the tests
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