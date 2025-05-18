# alaCarte Launch Checklist

## Resolve Payment Issues
- [ ] Get assistance from other people who have integrated with Xendit before
- [ ] Troubleshoot Xendit production issues with card payments
- [ ] Troubleshoot Xendit production issues with ewallet payments
- [ ] Confirm that production payments are working

## Calculate Financials
- [ ] Create napkin computation to determine revenue targets
- [ ] Assess costs for the service
- [ ] Get initial funding for costs
 
## Site Setup
- [ ] Attach domain to dev server
- [ ] Create SSL cert for dev server via Letsencrypt.

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
- [ ] Confirm security groups are properly configured
- [ ] Review permissions for S3 buckets and other AWS resources
- [ ] Set up automated database backups