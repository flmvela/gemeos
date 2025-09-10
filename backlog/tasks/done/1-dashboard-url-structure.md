The admin dashboard has the following  URL: http://localhost:8081/admin/dashboard following the structure [user]/dashboard
The teacher dashboard has the same URL structure: http://localhost:8081/teacher/dashboard

Task 1: 
The tenant dashboard URL structure must be changed from the actual http://localhost:8081/admin/tenant-dashboard to http://localhost:8081/tenant/dashboard So that the structure is aligned across all users

Task 2: add the pages to the tab pages of the http://localhost:8081/admin/rbac-management

Acceptance criteria: 
As admin I click on http://localhost:8081/admin/dashboard  and can access the page
As admin I click on http://localhost:8081/teacher/dashboard and can access the page
As admin I click on localhost:8081/tenant/dashboard and can access the page 

As tenant I click on http://localhost:8081/admin/dashboard  and cannot access the page
As tenant I click on http://localhost:8081/teacher/dashboard and can access the page
As tenant I click on localhost:8081/tenant/dashboard and can access the page 

As teacher I click on http://localhost:8081/admin/dashboard  and cannot access the page
As teacher I click on http://localhost:8081/teacher/dashboard and can access the page
As teacher I click on localhost:8081/tenant/dashboard and cannot access the page 